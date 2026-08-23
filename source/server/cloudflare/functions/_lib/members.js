export async function hashToken(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function authenticatedMember(db, memberId, memberToken) {
  if (!memberId || !memberToken) return null;
  const tokenHash = await hashToken(memberToken);
  return db
    .prepare("SELECT id, email, first_name AS firstName, location, membership_plan AS membershipPlan, mobile_link_code AS mobileLinkCode FROM care_circle_members WHERE id = ?1 AND token_hash = ?2")
    .bind(memberId, tokenHash)
    .first();
}

export async function memberDog(db, dogId, memberId) {
  if (!dogId || !memberId) return null;
  return db
    .prepare("SELECT id, dog_name AS dogName, species, breed, age_years AS ageYears, weight_lbs AS weightLbs, focus, health_conditions AS healthConditions, medications, routine_notes AS routineNotes, profile_media_id AS profileMediaId FROM dog_profiles WHERE id = ?1 AND member_id = ?2")
    .bind(dogId, memberId)
    .first();
}
