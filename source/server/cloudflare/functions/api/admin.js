const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const authorized = (request, env) => {
  if (!env.ADMIN_DASHBOARD_KEY) return "unconfigured";
  return request.headers.get("x-woafy-admin-key") === env.ADMIN_DASHBOARD_KEY;
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, OPTIONS" } });
}

export async function onRequestGet(context) {
  const access = authorized(context.request, context.env);
  if (access === "unconfigured") return json({ error: "The private dashboard has not been configured yet." }, 503);
  if (!access) return json({ error: "That workspace key is not valid." }, 401);

  try {
    const db = context.env.WAITLIST_DB;
    const [enrollmentCount, newsletterCount, webinarCount, sessionCount, providerCount, researchCount, memorialCount, chatCount, memoryCount, contactCount, enrollments, newsletter, webinar, sessions, providers, research, memorial, chats, memories, contacts] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count FROM dog_profiles").first(),
      db.prepare("SELECT COUNT(*) AS count FROM newsletter_signups").first(),
      db.prepare("SELECT COUNT(*) AS count FROM webinar_waitlist").first(),
      db.prepare("SELECT COUNT(*) AS count FROM care_session_registrations").first(),
      db.prepare("SELECT COUNT(*) AS count FROM provider_inquiries").first(),
      db.prepare("SELECT COUNT(*) AS count FROM community_research_queries").first(),
      db.prepare("SELECT COUNT(*) AS count FROM memorial_collection_interest").first(),
      db.prepare("SELECT COUNT(*) AS count FROM care_chat_conversations").first(),
      db.prepare("SELECT COUNT(*) AS count FROM pet_memories").first(),
      db.prepare("SELECT COUNT(*) AS count FROM contact_messages").first(),
      db.prepare("SELECT d.dog_name AS petName, d.species, d.focus, m.first_name AS ownerName, m.email, d.created_at AS createdAt FROM dog_profiles d JOIN care_circle_members m ON m.id = d.member_id ORDER BY d.created_at DESC LIMIT 24").all(),
      db.prepare("SELECT email, created_at AS createdAt FROM newsletter_signups ORDER BY created_at DESC LIMIT 24").all(),
      db.prepare("SELECT email, concern, created_at AS createdAt FROM webinar_waitlist ORDER BY created_at DESC LIMIT 24").all(),
      db.prepare("SELECT session_title AS sessionTitle, first_name AS firstName, email, species, focus, question, created_at AS createdAt FROM care_session_registrations ORDER BY created_at DESC LIMIT 24").all(),
      db.prepare("SELECT organization, contact_name AS contactName, email, request_type AS requestType, service_type AS serviceType, coverage, status, created_at AS createdAt FROM provider_inquiries ORDER BY created_at DESC LIMIT 24").all(),
      db.prepare("SELECT q.query, q.species, q.status, q.created_at AS createdAt, m.email, d.dog_name AS petName FROM community_research_queries q JOIN care_circle_members m ON m.id = q.member_id JOIN dog_profiles d ON d.id = q.dog_profile_id ORDER BY q.created_at DESC LIMIT 24").all(),
      db.prepare("SELECT first_name AS firstName, email, collection_slug AS collection, pet_species AS species, timing, page_context AS pageContext, note, created_at AS createdAt FROM memorial_collection_interest ORDER BY created_at DESC LIMIT 24").all(),
      db.prepare("SELECT c.title, c.topic, c.privacy, c.status, c.created_at AS createdAt, m.email, d.dog_name AS petName FROM care_chat_conversations c JOIN care_circle_members m ON m.id = c.member_id JOIN dog_profiles d ON d.id = c.pet_profile_id ORDER BY c.created_at DESC LIMIT 24").all(),
      db.prepare("SELECT pm.title, pm.created_at AS createdAt, m.email, d.dog_name AS petName FROM pet_memories pm JOIN care_circle_members m ON m.id = pm.member_id JOIN dog_profiles d ON d.id = pm.pet_profile_id ORDER BY pm.created_at DESC LIMIT 24").all(),
      db.prepare("SELECT name, email, topic, message, status, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 24").all(),
    ]);
    return json({
      totals: {
        pets: Number(enrollmentCount?.count || 0),
        newsletter: Number(newsletterCount?.count || 0),
        webinar: Number(webinarCount?.count || 0),
        sessions: Number(sessionCount?.count || 0),
        providers: Number(providerCount?.count || 0),
        research: Number(researchCount?.count || 0),
        memorial: Number(memorialCount?.count || 0),
        chats: Number(chatCount?.count || 0),
        memories: Number(memoryCount?.count || 0),
        contacts: Number(contactCount?.count || 0),
      },
      enrollments: enrollments.results || [],
      newsletter: newsletter.results || [],
      webinar: webinar.results || [],
      sessions: sessions.results || [],
      providers: providers.results || [],
      research: research.results || [],
      memorial: memorial.results || [],
      chats: chats.results || [],
      memories: memories.results || [],
      contacts: contacts.results || [],
    });
  } catch {
    return json({ error: "The private dashboard could not load the latest records." }, 503);
  }
}
