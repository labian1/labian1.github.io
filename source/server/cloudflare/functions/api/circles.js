import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const focuses = new Set(["mobility", "sleep", "appetite", "comfort", "recovery", "quality-of-life", "daily-routine", "vet-visit"]);
const cadences = new Set(["weekly", "twice-monthly", "as-needed"]);
const targetSpecies = new Set(["dog", "cat", "all"]);

const memberFromRequest = (request) => ({
  id: cleanText(request.headers.get("x-care-circle-member"), 80),
  token: cleanText(request.headers.get("x-care-circle-token"), 160),
});

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  try {
    const db = context.env.WAITLIST_DB;
    const credentials = memberFromRequest(context.request);
    const member = await authenticatedMember(db, credentials.id, credentials.token);
    const result = await db
      .prepare("SELECT g.id, g.title, g.description, g.focus, g.species, g.cadence, g.host_dog_name AS hostDogName, g.created_at AS createdAt, COUNT(gm.member_id) AS memberCount FROM care_circle_groups g LEFT JOIN care_circle_group_members gm ON gm.group_id = g.id WHERE g.status = 'approved' GROUP BY g.id ORDER BY g.created_at DESC LIMIT 36")
      .all();
    const groups = result.results || [];
    let membership = new Map();
    if (member?.id && groups.length) {
      const groupIds = groups.map((group) => group.id);
      const placeholders = groupIds.map((_, index) => `?${index + 1}`).join(", ");
      const joined = await db
        .prepare(`SELECT group_id AS groupId, role FROM care_circle_group_members WHERE member_id = ?${groupIds.length + 1} AND group_id IN (${placeholders})`)
        .bind(...groupIds, member.id)
        .all();
      membership = new Map((joined.results || []).map((row) => [row.groupId, row.role]));
    }
    let pendingGroups = [];
    if (member?.id) {
      const pendingResult = await db
        .prepare("SELECT id, title, focus, species, cadence, created_at AS createdAt FROM care_circle_groups WHERE host_member_id = ?1 AND status = 'pending' ORDER BY created_at DESC LIMIT 12")
        .bind(member.id)
        .all();
      pendingGroups = pendingResult.results || [];
    }
    return json({
      groups: groups.map((group) => ({
        ...group,
        isJoined: membership.has(group.id),
        isHost: membership.get(group.id) === "host",
      })),
      pendingGroups,
    });
  } catch {
    return json({ error: "We could not load Care Circles right now." }, 503);
  }
}

export async function onRequestPost(context) {
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return json({ error: "Use a JSON request." }, 415);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that circle." }, 400);
  }

  const kind = cleanText(body.kind, 12);
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  if (!memberId || !memberToken || !dogId) return json({ error: "Enroll your pet before starting or joining a circle." }, 401);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "This profile session has expired. Create the profile again to continue." }, 401);
    const dog = await memberDog(db, dogId, memberId);
    if (!dog?.dogName) return json({ error: "We could not find that pet profile." }, 404);
    const now = new Date().toISOString();

    switch (kind) {
      case "create": {
        const title = cleanText(body.title, 110);
        const description = cleanText(body.description, 560);
        const focus = cleanText(body.focus, 32);
        const species = cleanText(body.species, 12).toLowerCase();
        const cadence = cleanText(body.cadence, 20);
        if (title.length < 8) return json({ error: "Give your circle a clear, welcoming name." }, 400);
        if (description.length < 32) return json({ error: "Add a little context so the right owners know why this circle could help." }, 400);
        if (!focuses.has(focus)) return json({ error: "Choose the part of care this circle is centered on." }, 400);
        if (!targetSpecies.has(species)) return json({ error: "Choose whether this circle is for older dogs, cats, or both." }, 400);
        if (!cadences.has(cadence)) return json({ error: "Choose how often the group hopes to check in." }, 400);
        const groupId = crypto.randomUUID();
        await db
          .prepare("INSERT INTO care_circle_groups (id, host_member_id, host_dog_profile_id, host_dog_name, title, description, focus, species, cadence, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'pending', ?10, ?10)")
          .bind(groupId, memberId, dogId, dog.dogName, title, description, focus, species, cadence, now)
          .run();
        await db.prepare("INSERT INTO care_circle_group_members (group_id, member_id, role, created_at) VALUES (?1, ?2, 'host', ?3)").bind(groupId, memberId, now).run();
        await syncBrevoContact({ env: context.env, db, email: member.email, firstName: member.firstName, eventType: "care_circle_host_application", listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"] });
        return json({
          message: "Your Care Circle is saved. We will check the invitation for clarity and a welcoming purpose before opening it to other owners.",
          group: { id: groupId, title, status: "pending" },
        });
      }
      case "join": {
        const groupId = cleanText(body.groupId, 80);
        const group = await db.prepare("SELECT id, title FROM care_circle_groups WHERE id = ?1 AND status = 'approved'").bind(groupId).first();
        if (!group?.id) return json({ error: "That Care Circle is no longer available." }, 404);
        await db.prepare("INSERT OR IGNORE INTO care_circle_group_members (group_id, member_id, role, created_at) VALUES (?1, ?2, 'member', ?3)").bind(groupId, memberId, now).run();
        await syncBrevoContact({ env: context.env, db, email: member.email, firstName: member.firstName, eventType: "care_circle_joined", listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"] });
        return json({ message: `You are part of ${group.title}. You can now share an update with this circle.` });
      }
      default:
        return json({ error: "We could not understand that Care Circle action." }, 400);
    }
  } catch {
    return json({ error: "We could not save that Care Circle action right now. Please try again." }, 503);
  }
}
