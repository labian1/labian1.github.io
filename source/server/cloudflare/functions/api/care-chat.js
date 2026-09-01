import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, hashToken, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const publicTopic = (topic) => ({ mobility: "Mobility & movement", sleep: "Sleep & settling", appetite: "Daily routine", litter: "Daily routine", cognition: "Daily routine", quality: "Good days", vet: "Vet visits", products: "Daily routine" }[topic] || "Daily routine");

const topicRules = [
  ["urgent", /collapse|cannot breathe|can't breathe|trouble breathing|seizure|toxin|poison|cannot urinate|can't urinate|blue gums|unresponsive/i],
  ["appetite", /eat|food|appetite|weight|drink|water|vomit|nausea/i],
  ["litter", /litter|urine|pee|poop|box|strain/i],
  ["sleep", /sleep|night|pace|pacing|restless|settle|wake|whin/i],
  ["cognition", /confus|stare|lost|corner|anxious|cling|behavior|behaviour/i],
  ["quality", /good day|quality of life|goodbye|euth|hospice|dying|end of life/i],
  ["vet", /vet|appointment|visit|question|diagnos|test|medication/i],
  ["products", /bed|toy|bowl|ramp|food|supplement|product|recommend/i],
  ["mobility", /stand|rise|stiff|limp|walk|stairs|jump|slip|joint|mobility|pain/i],
];

const knowledge = {
  mobility: {
    title: "Start with the first movement after rest",
    summary: "A pet can look better after warming up, so the first rise, first turn, and first few steps often tell you more than the middle of a walk.",
    image: "/senior-care-platform/media/real/photo-36.jpg",
    notice: ["How long the pause lasts before standing", "Whether the first steps are short, uneven, or wide", "Which surface, stair, or jump is being avoided", "Whether movement improves or worsens after a few minutes"],
    tryNow: ["Film one ordinary rise without asking for a repeat", "Add traction on the route your pet already uses", "Reduce jumping until your veterinary team understands the change"],
    vet: "Call sooner for sudden inability to stand, dragging a limb, crying out, collapse, or rapidly worsening weakness.",
    questions: ["Could pain be present even without crying?", "What movement is safe until we know more?", "What should improve if the plan is working?"],
    links: [["Open pain and mobility guide", "/senior-care-platform/learn/pain-and-mobility/"], ["Find mobility care", "/senior-care-platform/find-care/pain-mobility-rehab/"]],
  },
  sleep: {
    title: "Map the night before changing the whole routine",
    summary: "Night pacing can be linked with pain, bathroom urgency, medication timing, temperature, anxiety, sensory loss, or cognitive change. The time and sequence matter.",
    image: "/senior-care-platform/media/real/photo-22.jpg",
    notice: ["The first wake-up time and what happened just before it", "Pacing, panting, vocalizing, staring, or asking to go out", "The room or surface your pet chooses instead", "What finally helps and how long it takes"],
    tryNow: ["Keep a low-light path to water and the bathroom route", "Record one night in a simple timeline", "Check whether symptoms cluster around medication or meals"],
    vet: "Seek prompt care for labored breathing, repeated distress, collapse, severe pain, or sudden disorientation.",
    questions: ["Could pain or bathroom urgency be waking my pet?", "Could medication timing be contributing?", "Which nighttime signs should trigger an urgent visit?"],
    links: [["Open sleep and rest guide", "/senior-care-platform/learn/sleep-and-rest/"], ["Find behavior support", "/senior-care-platform/find-care/behavior-anxiety/"]],
  },
  appetite: {
    title: "Track the pattern around the bowl",
    summary: "One unfinished meal is less informative than a change in amount, interest, chewing, swallowing, nausea, water intake, bathroom habits, or weight.",
    image: "/senior-care-platform/media/real/photo-32.jpg",
    notice: ["How much is eaten compared with the usual amount", "Interest in treats versus regular food", "Dropping food, chewing on one side, lip licking, or swallowing hard", "Water, urine, stool, vomiting, and weekly weight changes"],
    tryNow: ["Write down actual amounts instead of 'ate less'", "Keep the familiar food unless your vet recommends a change", "Bring a complete medication and supplement list"],
    vet: "A senior pet who stops eating, repeatedly vomits, becomes weak, seems painful, or drinks or urinates much more needs timely veterinary advice.",
    questions: ["Could dental pain, nausea, medication, or organ disease be involved?", "What amount of food and water should I track?", "When does this become same-day care?"],
    links: [["Read senior nutrition guidance", "/senior-care-platform/resources/nutrition-for-senior-dogs/"], ["Find nutrition and weight care", "/senior-care-platform/find-care/nutrition-weight/"]],
  },
  litter: {
    title: "Treat litter-box changes as health information",
    summary: "For an older cat, box frequency, effort, posture, vocalizing, accidents, and clump size can reveal a medical or mobility problem before other signs are obvious.",
    image: "/senior-care-platform/media/real/photo-58.jpg",
    notice: ["How often your cat enters and whether anything is produced", "Straining, vocalizing, frequent licking, or repeated small visits", "Whether the box edge, stairs, or location now creates effort", "Changes in clump size, stool, thirst, appetite, or hiding"],
    tryNow: ["Add a low-entry box on the floor your cat uses most", "Keep the old box while testing one new setup", "Photograph unusual output only if it can be done without stress"],
    vet: "A cat who is straining and cannot pass urine needs emergency veterinary care, especially a male cat.",
    questions: ["Could pain or urinary disease explain this?", "Would a urine test or exam be appropriate?", "What exact signs mean emergency care?"],
    links: [["Open senior cat care", "/senior-care-platform/learn/senior-cat-care/"], ["Find urgent care", "/senior-care-platform/find-care/emergency-vets/"]],
  },
  cognition: {
    title: "Describe the moment, not just the behavior",
    summary: "New confusion, staring, altered sleep, house-soiling, clinginess, or anxiety can overlap with pain, sensory loss, medication effects, and medical illness. A concrete example helps separate them.",
    image: "/senior-care-platform/media/real/photo-39.jpg",
    notice: ["Time of day and exact behavior", "Whether vision, hearing, pain, appetite, or bathroom habits also changed", "How long the episode lasts and how your pet recovers", "Which familiar cue or route no longer works"],
    tryNow: ["Keep furniture and nighttime routes predictable", "Use gentle light and familiar cues", "Save a short video of an ordinary episode"],
    vet: "Sudden severe disorientation, collapse, circling, seizure, head tilt, or inability to walk needs prompt care.",
    questions: ["What medical causes should be ruled out first?", "Could pain or sensory loss be contributing?", "How should we measure whether treatment helps?"],
    links: [["Read behavior and anxiety guidance", "/senior-care-platform/find-care/behavior-anxiety/"], ["Prepare for a vet visit", "/senior-care-platform/resources/checklists/vet-visit-questions/"]],
  },
  quality: {
    title: "Look at comfort, function, and joy together",
    summary: "Quality of life is not one score. Appetite, hydration, breathing, pain, hygiene, sleep, mobility, anxiety, connection, and recovery after hard moments all belong in the picture.",
    image: "/senior-care-platform/media/real/photo-10.jpg",
    notice: ["One reliable sign of comfort", "One activity that still brings clear interest", "How often distress appears and whether relief still works", "Whether basic needs can be met without fear or exhaustion"],
    tryNow: ["Choose one personal good-day marker", "Record hard moments with duration and recovery", "Ask your vet to define comfort goals and crisis signs"],
    vet: "You do not need to wait for a crisis to request a quality-of-life or hospice conversation.",
    questions: ["What comfort goals are realistic now?", "Which symptoms can still be relieved?", "What would make waiting unkind?"],
    links: [["Open quality-of-life guide", "/senior-care-platform/learn/quality-of-life/"], ["Find hospice support", "/senior-care-platform/find-care/hospice-palliative-care/"]],
  },
  vet: {
    title: "Bring one change, one example, and one question",
    summary: "A focused visit starts with when the change began, how often it happens, what was normal before, and one short video or dated example.",
    image: "/senior-care-platform/media/real/photo-52.jpg",
    notice: ["The first date you noticed the change", "Frequency, duration, and triggers", "Food, water, bathroom, sleep, movement, and medication context", "What improved, worsened, or stayed normal"],
    tryNow: ["Put medications and supplements in one list", "Save a 10-second ordinary video", "Write the question you need answered before leaving"],
    vet: "Ask what should improve, how quickly, and which signs mean calling or returning sooner.",
    questions: ["What do we need to rule out first?", "What is the plan measuring?", "When should I update you?"],
    links: [["Use the visit conversation guide", "/senior-care-platform/resources/checklists/vet-visit-questions/"], ["Find senior veterinary care", "/senior-care-platform/find-care/senior-veterinarians/"]],
  },
  products: {
    title: "Choose for the care moment, not the label",
    summary: "A useful product should solve a specific problem in your pet's actual routine: slipping, bending, reaching, temperature, chewing, toileting, or safe access.",
    image: "/senior-care-platform/media/real/photo-05.jpg",
    notice: ["The exact moment that creates effort", "Your pet's size, stability, sensory needs, and chewing habits", "Whether the item can be cleaned and returned", "Any material, medication, or diet safety concern"],
    tryNow: ["Test one low-cost environment change first", "Measure the space and your pet's natural posture", "Ask your veterinarian before diet, supplement, or medical-support purchases"],
    vet: "Products do not replace assessment when pain, weight loss, weakness, breathing, appetite, or bathroom habits change.",
    questions: ["What problem are we solving?", "How will we know it helped?", "Could it create a fall, chewing, or diet risk?"],
    links: [["Open comfort-at-home guidance", "/senior-care-platform/learn/comfort-at-home/"], ["Ask Care Circle owners", "/senior-care-platform/community/#conversations"]],
  },
  general: {
    title: "Turn the worry into an observable pattern",
    summary: "Start with what changed from your pet's own normal day. Timing, frequency, triggers, recovery, and what still feels normal create a clearer next step.",
    image: "/senior-care-platform/media/real/photo-17.jpg",
    notice: ["When it started", "How often it happens", "What comes before and after", "What helps and what remains normal"],
    tryNow: ["Write one dated example", "Save a short ordinary video", "Choose the guide that matches the changed routine"],
    vet: "Contact a veterinarian promptly for sudden, severe, rapidly worsening, or distressing changes.",
    questions: ["What should I track next?", "What could make this urgent?", "Which part of the routine matters most?"],
    links: [["Start with what you notice", "/senior-care-platform/start-here/"], ["Find care", "/senior-care-platform/find-care/"]],
  },
};

const chapterMedia = {
  mobility: ["/senior-care-platform/media/real/photo-36.jpg", "/senior-care-platform/media/real/photo-41.jpg", "/senior-care-platform/media/real/photo-47.jpg", "/senior-care-platform/media/real/photo-45.jpg", "/senior-care-platform/media/real/photo-52.jpg"],
  sleep: ["/senior-care-platform/media/real/photo-22.jpg", "/senior-care-platform/media/real/photo-23.jpg", "/senior-care-platform/media/real/photo-28.jpg", "/senior-care-platform/media/real/photo-31.jpg", "/senior-care-platform/media/real/photo-44.jpg"],
  appetite: ["/senior-care-platform/media/real/photo-32.jpg", "/senior-care-platform/media/real/photo-33.jpg", "/senior-care-platform/media/real/photo-34.jpg", "/senior-care-platform/media/real/photo-35.jpg", "/senior-care-platform/media/real/photo-46.jpg"],
  litter: ["/senior-care-platform/media/real/photo-58.jpg", "/senior-care-platform/media/real/photo-59.jpg", "/senior-care-platform/media/real/photo-60.jpg", "/senior-care-platform/media/real/photo-67.jpg", "/senior-care-platform/media/real/photo-69.jpg"],
  cognition: ["/senior-care-platform/media/real/photo-39.jpg", "/senior-care-platform/media/real/photo-40.jpg", "/senior-care-platform/media/real/photo-42.jpg", "/senior-care-platform/media/real/photo-43.jpg", "/senior-care-platform/media/real/photo-49.jpg"],
  quality: ["/senior-care-platform/media/real/photo-10.jpg", "/senior-care-platform/media/real/photo-11.jpg", "/senior-care-platform/media/real/photo-12.jpg", "/senior-care-platform/media/real/photo-15.jpg", "/senior-care-platform/media/real/photo-19.jpg"],
  vet: ["/senior-care-platform/media/real/photo-52.jpg", "/senior-care-platform/media/real/photo-53.jpg", "/senior-care-platform/media/real/photo-57.jpg", "/senior-care-platform/media/real/photo-51.jpg", "/senior-care-platform/media/real/photo-54.jpg"],
  products: ["/senior-care-platform/media/real/photo-05.jpg", "/senior-care-platform/media/real/photo-06.jpg", "/senior-care-platform/media/real/photo-07.jpg", "/senior-care-platform/media/real/photo-08.jpg", "/senior-care-platform/media/real/photo-16.jpg"],
  general: ["/senior-care-platform/media/real/photo-17.jpg", "/senior-care-platform/media/real/photo-18.jpg", "/senior-care-platform/media/real/photo-19.jpg", "/senior-care-platform/media/real/photo-20.jpg", "/senior-care-platform/media/real/photo-21.jpg"],
  urgent: ["/senior-care-platform/media/real/photo-54.jpg", "/senior-care-platform/media/real/photo-56.jpg", "/senior-care-platform/media/real/photo-61.jpg"],
};

const catChapterMedia = {
  mobility: ["/senior-care-platform/media/real/photo-58.jpg", "/senior-care-platform/media/real/photo-59.jpg", "/senior-care-platform/media/real/photo-60.jpg", "/senior-care-platform/media/real/photo-67.jpg", "/senior-care-platform/media/real/photo-69.jpg"],
  sleep: ["/senior-care-platform/media/real/photo-61.jpg", "/senior-care-platform/media/real/photo-62.jpg", "/senior-care-platform/media/real/photo-63.jpg", "/senior-care-platform/media/real/photo-69.jpg", "/senior-care-platform/media/real/photo-71.jpg"],
  appetite: ["/senior-care-platform/media/real/photo-64.jpg", "/senior-care-platform/media/real/photo-65.jpg", "/senior-care-platform/media/real/photo-66.jpg", "/senior-care-platform/media/real/photo-71.jpg", "/senior-care-platform/media/real/photo-73.jpg"],
  litter: ["/senior-care-platform/media/real/photo-67.jpg", "/senior-care-platform/media/real/photo-69.jpg", "/senior-care-platform/media/real/photo-71.jpg", "/senior-care-platform/media/real/photo-73.jpg", "/senior-care-platform/media/real/photo-74.jpg"],
  cognition: ["/senior-care-platform/media/real/photo-73.jpg", "/senior-care-platform/media/real/photo-74.jpg", "/senior-care-platform/media/real/photo-75.jpg", "/senior-care-platform/media/real/photo-76.jpg", "/senior-care-platform/media/real/photo-77.jpg"],
  quality: ["/senior-care-platform/media/real/photo-76.jpg", "/senior-care-platform/media/real/photo-77.jpg", "/senior-care-platform/media/real/photo-78.jpg", "/senior-care-platform/media/real/photo-79.jpg", "/senior-care-platform/media/real/photo-80.jpg"],
  vet: ["/senior-care-platform/media/real/photo-79.jpg", "/senior-care-platform/media/real/photo-80.jpg", "/senior-care-platform/media/real/photo-81.jpg", "/senior-care-platform/media/real/photo-82.jpg", "/senior-care-platform/media/real/photo-55.jpg"],
  products: ["/senior-care-platform/media/real/photo-82.jpg", "/senior-care-platform/media/real/photo-55.jpg", "/senior-care-platform/media/real/photo-56.jpg", "/senior-care-platform/media/real/photo-57.jpg", "/senior-care-platform/media/real/photo-58.jpg"],
  general: ["/senior-care-platform/media/real/photo-57.jpg", "/senior-care-platform/media/real/photo-58.jpg", "/senior-care-platform/media/real/photo-59.jpg", "/senior-care-platform/media/real/photo-60.jpg", "/senior-care-platform/media/real/photo-61.jpg"],
};

const topicIntakePrompts = {
  mobility: "Which movement shows the change most clearly: rising, walking, stairs, jumping, turning, or toileting?",
  sleep: "What happens during the wake-up: pacing, panting, vocalizing, staring, asking to go out, or changing rooms?",
  appetite: "What changed around food: interest, amount, chewing, swallowing, nausea, water, stool, urine, or weight?",
  litter: "What happens at the box: repeated visits, effort, vocalizing, accidents, small output, or avoiding the entrance?",
  cognition: "Describe one exact episode from beginning to end. What did your pet do, and how did the episode resolve?",
  quality: "Name one reliable good-day moment and one hard moment that now affects comfort or function.",
  vet: "What is the one change you most need the veterinary team to understand before the appointment ends?",
  products: "Which exact care moment should the product make safer or easier for your pet?",
  general: "Describe the clearest moment when you realized this was different from your pet's normal routine.",
};

const sourceMap = {
  litter: [
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
    ["Cornell Feline Health Center: The Special Needs of the Senior Cat", "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/special-needs-senior-cat"],
  ],
  appetite: [
    ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
    ["Cornell Feline Health Center: Chronic Kidney Disease", "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/chronic-kidney-disease"],
  ],
  cognition: [
    ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
    ["Cornell Feline Health Center: The Special Needs of the Senior Cat", "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/special-needs-senior-cat"],
  ],
  mobility: [
    ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
    ["Cornell Feline Health Center: Is Your Cat Slowing Down?", "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/your-cat-slowing-down"],
  ],
  sleep: [
    ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
  ],
  quality: [
    ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
    ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
    ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
  ],
};

const defaultSources = [
  ["Merck Veterinary Manual: Dog Owners", "https://www.merckvetmanual.com/dog-owners"],
  ["Merck Veterinary Manual: Cat Owners", "https://www.merckvetmanual.com/cat-owners"],
  ["2023 AAHA Senior Care Guidelines for Dogs and Cats", "https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/"],
];

const detectTopic = (question) => topicRules.find(([, pattern]) => pattern.test(question))?.[0] || "general";

const intakeDefinitions = {
  started: { name: "started", label: "When did you first notice this change?", type: "select", options: [["today", "Today"], ["days", "Within the last week"], ["weeks", "Within the last month"], ["months", "More than a month ago"]] },
  frequency: { name: "frequency", label: "How often does it happen now?", type: "select", options: [["once", "Only once so far"], ["occasional", "A few times a week"], ["daily", "At least once a day"], ["repeated", "Several times a day or night"]] },
  trend: { name: "trend", label: "How is the pattern changing?", type: "select", options: [["stable", "About the same"], ["gradual", "Gradually more noticeable"], ["sudden", "Sudden or rapidly worse"], ["variable", "Good and hard periods alternate"]] },
  impact: { name: "impact", label: "What can your pet no longer do as comfortably?", type: "select", options: [["mild", "Normal routines still continue"], ["moderate", "Some routines are avoided or need help"], ["high", "A core routine is clearly disrupted"]] },
  changedMoment: { name: "changedMoment", label: topicIntakePrompts.general, type: "textarea" },
  otherSigns: { name: "otherSigns", label: "What else changed at the same time?", type: "textarea", optional: true },
  healthContext: { name: "healthContext", label: "Is there a diagnosis, medicine, procedure, or recent veterinary advice that matters here?", type: "textarea", optional: true },
};

const fallbackIntakeNames = {
  mobility: ["changedMoment", "started", "impact", "otherSigns"],
  sleep: ["changedMoment", "frequency", "otherSigns", "impact"],
  appetite: ["changedMoment", "started", "otherSigns", "impact"],
  litter: ["changedMoment", "frequency", "otherSigns"],
  cognition: ["changedMoment", "started", "otherSigns", "impact"],
  quality: ["changedMoment", "impact", "frequency"],
  vet: ["changedMoment", "started", "otherSigns"],
  products: ["changedMoment", "impact"],
  general: ["changedMoment", "started", "frequency", "otherSigns"],
};

const questionAlreadyAnswers = (name, question) => {
  if (name === "started") return /\b(today|yesterday|week|month|year|since|ago|for\s+\w+\s+(days?|weeks?|months?|years?))\b/i.test(question);
  if (name === "frequency") return /\b(once|twice|daily|nightly|every day|every night|always|constantly|times? a (day|week|night))\b/i.test(question);
  return false;
};

const intakeQuestion = (name, topic, pet, customLabel = "") => {
  const definition = intakeDefinitions[name];
  if (!definition) return null;
  const labels = {
    changedMoment: topicIntakePrompts[topic] || topicIntakePrompts.general,
    otherSigns: `Besides this, what changed in ${pet.dogName}'s eating, drinking, bathroom routine, breathing, sleep, movement, or mood?`,
    impact: `Which part of ${pet.dogName}'s day is harder now?`,
  };
  return { ...definition, label: cleanText(customLabel, 220) || labels[name] || definition.label };
};

const buildFallbackIntake = (topic, pet, question, entries = []) => {
  let names = [...(fallbackIntakeNames[topic] || fallbackIntakeNames.general)];
  names = names.filter((name) => !questionAlreadyAnswers(name, question));
  if ((pet.healthConditions || pet.medications || pet.recentProcedures) && names.includes("otherSigns")) {
    names = names.filter((name) => name !== "otherSigns");
    names.push("healthContext");
  }
  names = ["changedMoment", ...names.filter((name) => name !== "changedMoment")].slice(0, 4);
  if (names.length < 2) names.push("impact");
  const saved = observationSummary(entries);
  const profileParts = [
    pet.ageYears ? `${pet.ageYears} years old` : "",
    pet.breed || "",
    pet.healthConditions ? `health history: ${pet.healthConditions}` : "",
  ].filter(Boolean);
  return {
    title: `A quick follow-up about ${pet.dogName}`,
    intro: `${profileParts.join(" · ") || "Pet profile loaded"}. ${saved.sentence}`,
    topic,
    planner: "evidence-fallback",
    questions: names.map((name) => intakeQuestion(name, topic, pet)).filter(Boolean),
  };
};

const parseAiJson = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const raw = String(value || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  }
};

const runAiJson = async (ai, messages, maxTokens = 900) => {
  if (!ai?.run) return null;
  const request = ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  const result = await Promise.race([
    request,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 7000)),
  ]);
  return parseAiJson(result?.response ?? result?.result ?? result);
};

const buildIntake = async (ai, topic, pet, question, entries = []) => {
  const fallback = buildFallbackIntake(topic, pet, question, entries);
  if (!ai?.run) return fallback;
  const allowed = Object.keys(intakeDefinitions);
  const profile = {
    name: pet.dogName,
    species: pet.species || "pet",
    breed: pet.breed || "",
    ageYears: pet.ageYears || "",
    healthConditions: pet.healthConditions || "",
    medications: pet.medications || "",
    routineNotes: pet.routineNotes || "",
    savedObservationSummary: observationSummary(entries).sentence,
  };
  try {
    const planned = await runAiJson(ai, [
      {
        role: "system",
        content: `You plan a short follow-up conversation for an aging-pet education service. Select only the minimum 2 to 4 questions needed to answer the owner's exact question. Use only these field names: ${allowed.join(", ")}. Always include changedMoment. Do not diagnose, prescribe, repeat facts already provided, or ask a generic seven-question intake. Return JSON only: {"intro":"one factual sentence","questions":[{"name":"allowedName","label":"brief personalized question"}]}.`,
      },
      {
        role: "user",
        content: JSON.stringify({ topic, ownerQuestion: question, petProfile: profile, fallbackFields: fallback.questions.map((item) => item.name) }),
      },
    ], 520);
    const seen = new Set();
    const selected = [];
    (Array.isArray(planned?.questions) ? planned.questions : []).forEach((item) => {
      const name = cleanText(item?.name, 40);
      if (!allowed.includes(name) || seen.has(name) || selected.length >= 4 || questionAlreadyAnswers(name, question)) return;
      const questionItem = intakeQuestion(name, topic, pet, item?.label);
      if (!questionItem) return;
      seen.add(name);
      selected.push(questionItem);
    });
    if (!seen.has("changedMoment")) selected.unshift(intakeQuestion("changedMoment", topic, pet));
    if (selected.length < 2) {
      const extra = fallback.questions.find((item) => !selected.some((current) => current.name === item.name));
      if (extra) selected.push(extra);
    }
    return {
      ...fallback,
      intro: cleanText(planned?.intro, 300) || fallback.intro,
      planner: "ai",
      questions: selected.slice(0, 4),
    };
  } catch {
    return fallback;
  }
};

const contextLabel = (value, labels) => {
  if (labels[value]) return labels[value];
  if (value === "not-sure") return "not clear yet";
  return value || "not recorded";
};

const buildPattern = (context) => {
  const frequencyScores = { once: 20, occasional: 40, daily: 70, repeated: 92 };
  const impactScores = { mild: 30, moderate: 62, high: 92 };
  const trendScores = { stable: 30, variable: 55, gradual: 70, sudden: 94 };
  return [
    { label: "Frequency", value: frequencyScores[context.frequency] || 20, text: contextLabel(context.frequency, { once: "once", occasional: "a few times weekly", daily: "daily", repeated: "several times daily" }) },
    { label: "Daily impact", value: impactScores[context.impact] || 30, text: contextLabel(context.impact, { mild: "routines continue", moderate: "some routines need help", high: "core routines disrupted" }) },
    { label: "Change", value: trendScores[context.trend] || 30, text: contextLabel(context.trend, { stable: "stable", variable: "variable", gradual: "gradually increasing", sudden: "sudden or rapidly worse" }) },
  ];
};

const profileSignalsFor = (pet) => {
  const health = `${pet.healthConditions || ""} ${pet.medications || ""}`.toLowerCase();
  const signals = [];
  const add = (pattern, label, observation) => { if (pattern.test(health)) signals.push({ label, observation }); };
  add(/arthriti|joint|hip|knee|spine|mobility|dysplasia/, "Joint or mobility history", "Compare first steps after rest, traction, stairs, jumps, and recovery after activity.");
  add(/kidney|renal/, "Kidney history", "Track appetite, water, urine output, nausea, weight, and hydration changes together.");
  add(/heart|cardiac|murmur/, "Heart history", "Record breathing effort, resting breathing pattern, cough, weakness, and exercise tolerance; ask the veterinary team what threshold they want used.");
  add(/diabet/, "Diabetes history", "Keep food, medication timing, water intake, urine output, appetite, and unusual weakness in the same dated note.");
  add(/dental|tooth|teeth|oral/, "Dental history", "Notice chewing side, dropped food, mouth odor, pawing, swallowing, and interest in soft versus hard food.");
  add(/cognit|dement|confus|anxiety/, "Cognitive or anxiety history", "Record time of day, sleep-wake changes, house-soiling, disorientation, vocalizing, and what helps your pet settle.");
  add(/cancer|tumor|mass|oncolog/, "Cancer history", "Track comfort, appetite, breathing, mobility, elimination, treatment timing, and recovery after hard periods.");
  if (pet.medications) signals.push({ label: "Medication context", observation: `Keep dose and timing beside the event. Do not change ${pet.dogName}'s medicines without the prescribing veterinary team.` });
  return signals.slice(0, 3);
};

const observationSummary = (entries) => {
  const recent = entries.slice(0, 7);
  const counts = { sleep: 0, mobility: 0, appetite: 0, total: recent.length };
  recent.forEach((entry) => {
    if (entry.sleep === "different") counts.sleep += 1;
    if (entry.mobility === "different") counts.mobility += 1;
    if (entry.appetite === "different") counts.appetite += 1;
  });
  const changed = [["sleep", counts.sleep], ["movement", counts.mobility], ["appetite", counts.appetite]].filter(([, count]) => count > 0);
  return {
    counts,
    sentence: recent.length
      ? `${recent.length} saved ${recent.length === 1 ? "observation" : "observations"}; ${changed.length ? changed.map(([label, count]) => `${label} differed ${count} ${count === 1 ? "time" : "times"}`).join(", ") : "sleep, movement, and appetite were marked about the same"}.`
      : "No saved daily observations yet; this lesson starts the baseline.",
  };
};

const observationProtocol = (topic, pet) => {
  const speciesWord = pet.species === "cat" ? "cat" : "dog";
  const base = {
    mobility: ["Film the first rise after a normal rest period.", "Note surface, pause length, first five steps, and whether movement warms up.", `Do not make your ${speciesWord} repeat stairs, jumps, or a painful movement for the record.`],
    sleep: ["Mark the first wake-up time and what happened immediately before it.", "Record pacing, panting, vocalizing, bathroom requests, room changes, and time needed to settle.", "Keep meal, medication, and bedtime timing in the same note."],
    appetite: ["Record the offered amount and the amount left, not only 'ate less.'", "Note chewing, swallowing, dropped food, lip licking, vomiting, water, urine, stool, and treats.", "Weigh on the same scale and schedule when your veterinary team recommends it."],
    litter: ["Record visits, output, posture, effort, vocalizing, and accidents.", "Photograph unusual output only when it can be done without delaying care or stressing your cat.", "A cat straining without urine needs emergency care."],
    cognition: ["Write the start time, exact behavior, duration, and how the episode ended.", "Note lighting, noise, people, sleep, pain signs, vision, hearing, and bathroom context.", "Save one ordinary video without staging or repeating the episode."],
    quality: ["Choose one personal good-day marker that is specific to this pet.", "Record hard moments with duration, relief, and recovery.", "Track comfort, breathing, eating, drinking, hygiene, mobility, sleep, elimination, and connection together."],
    vet: ["Lead with the first date, frequency, and effect on daily function.", "Bring the current medication and supplement list with doses and timing.", "Choose the one question that must be answered before the visit ends."],
    products: ["Name the exact routine the item must make safer or easier.", "Measure your pet's body position and the home space before comparing options.", "Test fit, traction, cleanability, return terms, and chewing or ingestion risk."],
    general: ["Record the same ordinary moment for three to seven days.", "Write what happened before, during, and after the change.", "Keep one thing unchanged so you can tell whether a safe adjustment helped."],
  };
  return base[topic] || base.general;
};

const explanationGroups = (topic, pet) => {
  const cat = pet.species === "cat";
  const groups = {
    mobility: [
      ["Pain or joint limitation", "Look for a shorter first step, weight shifting, reluctance on stairs, grooming changes, or improvement after warming up."],
      ["Weakness or neurologic change", "Look for scuffing nails, crossing feet, knuckling, dragging, a new head tilt, or loss of balance."],
      ["Environment and access", "Compare slick versus grippy floors, step height, turning space, and the route to food, water, litter, or the bathroom."],
      ["Whole-body illness", "Pair movement notes with appetite, breathing, thirst, urine, stool, sleep, and recovery after mild activity."],
    ],
    sleep: [
      ["Pain or physical discomfort", "Note whether settling follows movement, position changes, panting, licking, trembling, or difficulty lying down."],
      ["Bathroom or thirst pattern", `Record requests to go out${cat ? " or litter-box visits" : ""}, urine volume, stool, water intake, and whether relief follows.`],
      ["Cognitive or sensory change", "Look for staring, getting stuck, altered day-night rhythm, new vocalizing, or difficulty using familiar cues."],
      ["Medication and routine timing", "Place meals, medicines, exercise, naps, and the first wake-up on one timeline."],
    ],
    appetite: [
      ["Mouth or dental discomfort", "Watch for approaching food then backing away, dropping pieces, chewing on one side, drooling, or preferring softer textures."],
      ["Nausea or digestive change", "Note lip licking, swallowing, grass eating, vomiting, stool change, posture, and whether treats are also refused."],
      ["Systemic or metabolic illness", "Pair appetite with weight, thirst, urine, energy, breathing, and temperature-seeking behavior."],
      ["Food access or medication effect", "Check bowl height and location, recent diet changes, medicine timing, and whether the pet can reach and remain at the bowl comfortably."],
    ],
    litter: [
      ["Urinary urgency or obstruction", "Repeated visits, straining, vocalizing, tiny clumps, blood, or no urine require prompt interpretation; inability to pass urine is an emergency."],
      ["Constipation or digestive change", "Record stool frequency, size, dryness, effort, appetite, vomiting, and abdominal discomfort."],
      ["Pain and box access", "Compare entry height, stairs, distance, footing, turning room, and whether a second low-entry box changes use."],
      ["Stress or cognitive change", "Note household changes, conflict, hiding, altered sleep, and whether accidents occur near the box or in unfamiliar places."],
    ],
    cognition: [
      ["Medical problem to rule out", "Sudden confusion can overlap with pain, organ disease, infection, blood-pressure change, or medication effects."],
      ["Vision or hearing loss", "Test familiar cues gently and note whether lighting, distance, or touch changes the response."],
      ["Sleep-wake or cognitive change", "Track night waking, staring, getting stuck, house-soiling, altered interaction, and recovery after an episode."],
      ["Environment and stress", "Record new people, sounds, routes, furniture, separation, and whether predictability reduces the episode."],
    ],
    quality: [
      ["Comfort", "Can distress be relieved, and for how long? Include pain, breathing, nausea, anxiety, temperature, and rest."],
      ["Function", "Can your pet eat, drink, eliminate, move, groom, and settle with an acceptable level of help?"],
      ["Joy and connection", "Name the pet-specific routines that still create interest, choice, recognition, or closeness."],
      ["Recovery after hard moments", "Record duration, what provides relief, and whether the pet returns to a comfortable baseline."],
    ],
  };
  return groups[topic] || [
    ["Timing", "Identify the first date, time of day, frequency, duration, and what happens immediately before and after."],
    ["Function", "Name the routine that became harder, was skipped, or now needs help."],
    ["Linked body systems", "Record appetite, water, elimination, breathing, sleep, movement, mood, and medicines together."],
    ["Recovery", "Note what helps, how completely it helps, and how long the effect lasts."],
  ];
};

const urgencyMatrix = (topic, petName) => {
  const topicSpecific = {
    mobility: "Sudden inability to stand, dragging a limb, collapse, severe pain, or rapidly worsening weakness",
    sleep: "Labored breathing, repeated distress, collapse, severe pain, or sudden disorientation",
    appetite: "Repeated vomiting, profound weakness, severe pain, a swollen abdomen, or inability to keep water down",
    litter: "Straining without urine, repeated unproductive box visits, severe pain, vomiting, or collapse",
    cognition: "Sudden severe disorientation, seizure, circling, collapse, head tilt, or inability to walk",
    quality: "Uncontrolled pain, breathing distress, collapse, repeated crisis, or loss of a basic function without relief",
  }[topic] || "A sudden severe change, breathing difficulty, collapse, seizure, toxin exposure, uncontrolled pain, or rapid worsening";
  return [
    ["Emergency now", topicSpecific],
    ["Contact today", "The change is sudden, happens repeatedly, disrupts a basic routine, or is paired with appetite, water, elimination, breathing, or behavior changes."],
    ["Book soon", `The pattern is recurring or gradually worsening even though ${petName} still has comfortable periods.`],
    ["Observe briefly", "The change is mild, isolated, and not worsening; record the same ordinary moment for three to seven days."],
  ];
};

const topicQuiz = (topic, petName) => [
  {
    chapter: 1,
    question: `Which note gives a veterinary team the clearest picture of ${petName}'s change?`,
    options: ["A dated example from an ordinary routine", "A guess about the diagnosis", "A description without timing"],
    answer: 0,
    explanation: "A dated, ordinary example shows timing, context, and function without asking a pet to repeat a difficult moment.",
  },
  {
    chapter: 2,
    question: "What does the observation map represent?",
    options: ["A diagnosis", "The owner-reported pattern", "A pain score"],
    answer: 1,
    explanation: "It only organizes what you reported. A veterinarian still needs to evaluate possible causes.",
  },
  {
    chapter: 3,
    question: topic === "products" ? "What should come before choosing a product?" : "What is the most useful next experiment at home?",
    options: topic === "products"
      ? ["The label on the package", "The exact care moment it must make easier", "The most expensive option"]
      : ["Change several routines at once", "Ask the pet to repeat the behavior", "Change one safe thing and record what happens"],
    answer: topic === "products" ? 1 : 2,
    explanation: topic === "products"
      ? "Start with the real care moment, fit, safety, and how you will know the item helped."
      : "One change at a time makes it easier to see whether the care moment improves.",
  },
  {
    chapter: 4,
    question: `What should you bring to ${petName}'s next veterinary conversation?`,
    options: ["One dated example, a short video, and the question that matters most", "Only a guess about the cause", "A long list without dates or examples"],
    answer: 0,
    explanation: "A focused example helps the veterinary team understand timing, function, and what changed from normal.",
  },
];

const nextStepsFor = (topic, petName) => {
  const lessonPrompt = topic === "quality"
    ? `Help me make a good-day and hard-day record for ${petName}.`
    : `What should I record for seven days so I can understand ${petName}'s pattern more clearly?`;
  const steps = [
    { type: "lesson", label: "Build the next lesson", prompt: lessonPrompt },
    { type: "link", label: "Find the right care", href: "/senior-care-platform/find-care/" },
    { type: "link", label: "Save today's pattern", href: "/senior-care-platform/my-pet/?panel=observe" },
  ];
  if (topic === "products" || ["mobility", "sleep", "appetite", "quality"].includes(topic)) {
    steps.push({ type: "link", label: "Open practical care lessons", href: "/senior-care-platform/community/#lessons" });
  }
  if (topic === "quality") {
    steps.push({ type: "link", label: "Plant a memorial tree", href: "/senior-care-platform/remember/living-tributes/" });
  }
  return steps;
};

const buildAnswer = (question, pet, entries, context = {}) => {
  const topic = detectTopic(question);
  if (topic === "urgent") {
    return {
      topic,
      title: "This may need urgent veterinary help",
      summary: "The sign you mentioned can be time-sensitive. Contact an emergency veterinary clinic or animal poison service now rather than waiting for an online answer.",
      image: "/senior-care-platform/media/real/photo-54.jpg",
      notice: ["Keep your pet quiet and safe", "Do not give human medication", "Bring medication, toxin, and symptom timing information", "Call while you are preparing to leave"],
      tryNow: ["Call the nearest emergency clinic", "Follow the clinic's transport instructions", "Use poison control for possible toxin exposure"],
      vet: "Trouble breathing, collapse, seizure, inability to urinate, blue or gray gums, severe uncontrolled pain, or toxin exposure should not wait.",
      questions: ["Where should I go now?", "What should I do during transport?", "What information should I bring?"],
      links: [["Find emergency care", "/senior-care-platform/find-care/emergency-vets/"], ["Open poison-control resources", "/senior-care-platform/find-care/poison-control/"]],
      chart: [],
      chapters: [],
      sources: defaultSources,
    };
  }
  const answer = knowledge[topic] || knowledge.general;
  const images = pet.species === "cat" ? (catChapterMedia[topic] || catChapterMedia.general) : (chapterMedia[topic] || chapterMedia.general);
  const recent = entries.slice(0, 7).reverse();
  const chart = recent.map((entry, index) => ({
    label: `Day ${entry.dayNumber || index + 1}`,
    changed: [entry.sleep, entry.mobility, entry.appetite].filter((state) => state === "different").length,
  }));
  const species = pet.species === "cat" ? "cat" : pet.species === "dog" ? "dog" : "pet";
  const ageDescription = pet.ageYears ? `${pet.ageYears} years old` : "a senior pet";
  const petContext = `${pet.dogName} is ${ageDescription}, a ${pet.breed ? `${pet.breed} ` : ""}${species}${pet.weightLbs ? ` who weighs about ${pet.weightLbs} lb` : ""}.`;
  const savedPattern = observationSummary(entries);
  const profileSignals = profileSignalsFor(pet);
  const explanationMap = explanationGroups(topic, pet);
  const decisionTable = urgencyMatrix(topic, pet.dogName);
  const profileFacts = [
    ["Pet", `${pet.dogName} · ${species}`],
    ["Age and type", `${ageDescription}${pet.breed ? ` · ${pet.breed}` : ""}`],
    ["Weight", pet.weightLbs ? `${pet.weightLbs} lb` : "Not recorded"],
    ["Care focus", pet.focus || "Not recorded"],
    ["Known conditions", pet.healthConditions || "None recorded"],
    ["Medicines", pet.medications || "None recorded"],
    ["Usual routine", pet.routineNotes || "Not recorded"],
    ["Recent record", savedPattern.sentence],
  ];
  const timing = contextLabel(context.started, { today: "today", days: "within the last week", weeks: "within the last month", months: "more than a month ago" });
  const frequency = contextLabel(context.frequency, { once: "once", occasional: "a few times a week", daily: "daily", repeated: "several times a day or night" });
  const impact = contextLabel(context.impact, { mild: "normal routines are continuing", moderate: "some routines are being avoided or need help", high: "a core routine is clearly disrupted" });
  const reportedPattern = [
    context.started ? `first noticed ${timing}` : "",
    context.frequency ? `now happening ${frequency}` : "",
    context.impact ? impact : "",
  ].filter(Boolean);
  const reportedPatternSentence = reportedPattern.length
    ? `You reported that the change was ${reportedPattern.join(", ")}.`
    : "The question identifies a change, but its timing and daily effect still need to be recorded.";
  let careWindow;
  switch (true) {
    case context.trend === "sudden" || context.impact === "high":
      careWindow = "Contact your veterinary team today. If distress is severe or rapidly worsening, use urgent care.";
      break;
    case context.frequency === "repeated" || context.impact === "moderate":
      careWindow = "Book a veterinary conversation soon and start a dated record now.";
      break;
    default:
      careWindow = "Record this for three to seven days. Contact your veterinary team sooner if the pattern worsens.";
  }
  const chapters = [
    {
      number: 1,
      title: `What changed from ${pet.dogName}'s normal`,
      image: images[0],
      paragraphs: [
        `${petContext} ${reportedPatternSentence}`,
        context.changedMoment ? `Your clearest example: ${context.changedMoment}` : "No concrete care moment was recorded.",
        context.otherSigns ? `Changes reported at the same time: ${context.otherSigns}` : "No other change was added to this question.",
      ],
      bullets: answer.notice,
      marginNote: `Baseline from the profile: ${pet.routineNotes || "usual routine not yet recorded"}`,
      table: [
        ["Started", timing],
        ["Frequency", frequency],
        ["Trend", contextLabel(context.trend, { stable: "about the same", variable: "good and hard periods alternate", gradual: "gradually more noticeable", sudden: "sudden or rapidly worse" })],
        ["Daily effect", impact],
      ],
    },
    {
      number: 2,
      title: "Four explanation groups to discuss",
      image: images[1],
      paragraphs: [
        answer.summary,
        savedPattern.sentence,
        "These groups prevent one symptom from being mistaken for one diagnosis. They organize observations; a veterinary exam and appropriate testing determine the cause.",
      ],
      bullets: explanationMap.map(([label, detail]) => `${label}: ${detail}`),
      table: profileSignals.length ? profileSignals.map((signal) => [signal.label, signal.observation]) : [["Health context", "No diagnosis, procedure, or medication context is stored yet."], ["Best next evidence", "Compare what happens before, during, and after the same ordinary care moment."]],
      marginNote: context.healthContext ? `Added for this question: ${context.healthContext}` : "No extra health context was added with this question.",
    },
    {
      number: 3,
      title: `A seven-day observation plan for ${pet.dogName}`,
      image: images[2],
      paragraphs: [
        careWindow,
        "Use the same care moment and roughly the same time each day. A comparable record is more useful than many unrelated notes.",
      ],
      bullets: observationProtocol(topic, pet),
      table: decisionTable,
      marginNote: "Record first. Change one safe variable second. That keeps cause and effect easier to discuss.",
    },
    {
      number: 4,
      title: "Safe changes to try while you observe",
      image: images[3],
      paragraphs: [
        "Choose only changes that do not delay care, force difficult movement, alter prescribed treatment, or hide a worsening sign.",
        `For ${pet.dogName}, start with the routine already used at home rather than introducing several new products or foods at once.`,
      ],
      bullets: answer.tryNow,
      marginNote: `Stop the home trial and contact a veterinarian sooner if ${pet.dogName} becomes distressed, weak, unable to perform a basic function, or rapidly worse.`,
    },
    {
      number: 5,
      title: "The exact veterinary conversation to have",
      image: images[4] || images[0],
      paragraphs: [
        `Open with: “${pet.dogName}'s ${topic === "general" ? "routine" : topic} has changed. ${reportedPatternSentence} The clearest example is ${context.changedMoment || "in my dated notes"}."`,
        "Bring one ordinary video, the saved observation record, current food, medicines and supplements with doses, and the question you most need answered.",
      ],
      bullets: answer.questions,
      marginNote: "Before leaving, ask what improvement should look like, when it should happen, and which signs mean calling or returning sooner.",
    },
  ];
  return {
    ...answer,
    title: `${pet.dogName}: ${answer.title}`,
    summary: `${answer.summary} This lesson applies it to ${pet.dogName}'s reported timing, daily effect, health history, medicines, routine, and saved observations.`,
    image: images[0],
    topic,
    chart,
    petContext,
    context,
    profileFacts,
    profileSignals,
    evidenceNote: "Built from the pet profile, this question's intake, and up to seven saved observations.",
    pattern: buildPattern(context),
    chapters,
    sources: species === "cat" ? (sourceMap[topic] || defaultSources) : defaultSources,
    bookTitle: `${pet.dogName}'s Care Knowledge Book`,
    quiz: [...topicQuiz(topic, pet.dogName), {
      chapter: 5,
      question: "Which visit opener is most useful?",
      options: ["A guess about the diagnosis", "When it started, how often it happens, the daily effect, and one example", "A list of everything that has ever happened"],
      answer: 1,
      explanation: "A short, dated pattern gives the veterinary team a clear place to begin while leaving diagnosis to the exam and appropriate testing.",
    }],
    nextSteps: nextStepsFor(topic, pet.dogName),
  };
};

const personalizeLessonWithAi = async (ai, answer, question, pet, entries, careContext) => {
  const fallback = { ...answer, generation: "evidence-template" };
  if (!ai?.run || answer.topic === "urgent" || !Array.isArray(answer.chapters) || !answer.chapters.length) return fallback;
  const facts = {
    ownerQuestion: question,
    topic: answer.topic,
    pet: {
      name: pet.dogName,
      species: pet.species || "pet",
      breed: pet.breed || "",
      ageYears: pet.ageYears || "",
      weightLbs: pet.weightLbs || "",
      healthConditions: pet.healthConditions || "",
      medications: pet.medications || "",
      routineNotes: pet.routineNotes || "",
    },
    followUpAnswers: careContext,
    savedObservations: observationSummary(entries).sentence,
    chapterPlan: answer.chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      evidenceBullets: chapter.bullets,
      safetyTable: chapter.table,
    })),
  };
  try {
    const result = await runAiJson(ai, [
      {
        role: "system",
        content: "You edit a practical senior-pet textbook. Rewrite the five supplied chapters using only the payload facts. Every paragraph must teach a different, concrete point tied to this pet's question, profile, timing, routine, or saved observations. Use short sentences and plain language. Name the exact care moment, what to compare, what to record, or what to ask. Never diagnose, prescribe, infer a condition, invent an owner detail, promise an outcome, or call an age-related change normal. Avoid generic phrases such as 'as pets age', 'it is important', 'consider', 'well-being', 'every pet is unique', and 'consult your veterinarian'. Do not repeat conclusions across chapters. Keep uncertainty explicit. Do not change evidence bullets, safety tables, sources, images, or quizzes. Return JSON only: {\"title\":\"specific lesson title\",\"summary\":\"2 concise sentences\",\"chapters\":[{\"number\":1,\"title\":\"short chapter title\",\"paragraphs\":[\"specific paragraph\",\"specific paragraph\"],\"marginNote\":\"one useful note for this pet\"}]}. Include all five chapter numbers.",
      },
      { role: "user", content: JSON.stringify(facts) },
    ], 1800);
    const chapterUpdates = new Map();
    (Array.isArray(result?.chapters) ? result.chapters : []).forEach((chapter) => {
      const number = Number(chapter?.number);
      const paragraphs = (Array.isArray(chapter?.paragraphs) ? chapter.paragraphs : [])
        .map((paragraph) => cleanText(paragraph, 650))
        .filter((paragraph) => paragraph.length >= 18)
        .slice(0, 3);
      if (!Number.isInteger(number) || number < 1 || number > 5 || paragraphs.length < 2) return;
      chapterUpdates.set(number, {
        title: cleanText(chapter?.title, 120),
        paragraphs,
        marginNote: cleanText(chapter?.marginNote, 320),
      });
    });
    if (chapterUpdates.size < 5) return fallback;
    const candidateCopy = [
      cleanText(result?.summary, 520),
      ...[...chapterUpdates.values()].flatMap((chapter) => chapter.paragraphs),
    ].join(" ");
    const genericSignals = [
      /\bas (?:pets|dogs|cats|animals|they) age\b/i,
      /\bit is (?:important|essential|helpful)\b/i,
      /\bevery (?:pet|dog|cat) is unique\b/i,
      /\boverall well-?being\b/i,
      /\bconsult your veterinarian\b/i,
      /\bnormal (?:for|as part of|with) ag(?:e|ing)\b/i,
    ];
    if (genericSignals.filter((pattern) => pattern.test(candidateCopy)).length > 0) return fallback;
    return {
      ...answer,
      title: cleanText(result?.title, 150) || answer.title,
      summary: cleanText(result?.summary, 520) || answer.summary,
      chapters: answer.chapters.map((chapter) => {
        const update = chapterUpdates.get(Number(chapter.number));
        return {
          ...chapter,
          title: update?.title || chapter.title,
          paragraphs: update?.paragraphs || chapter.paragraphs,
          marginNote: update?.marginNote || chapter.marginNote,
        };
      }),
      generation: "ai-assisted",
    };
  } catch {
    return fallback;
  }
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Create or reopen your pet account to see saved questions." }, 401);
    const conversationId = cleanText(new URL(context.request.url).searchParams.get("conversationId"), 80);
    if (conversationId) {
      const conversation = await db
        .prepare("SELECT id, title, topic, privacy, status, created_at AS createdAt FROM care_chat_conversations WHERE id = ?1 AND member_id = ?2 AND status != 'intake'")
        .bind(conversationId, memberId)
        .first();
      if (!conversation?.id) return json({ error: "We could not find that saved lesson." }, 404);
      const messages = await db
        .prepare("SELECT role, body, payload_json AS payloadJson FROM care_chat_messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .bind(conversationId)
        .all();
      const ownerMessage = (messages.results || []).find((message) => message.role === "user");
      const assistantMessage = (messages.results || []).find((message) => message.role === "assistant");
      let answer = null;
      try { answer = JSON.parse(assistantMessage?.payloadJson || "null"); } catch { answer = null; }
      if (!answer) return json({ error: "That lesson could not be reopened." }, 422);
      return json({ conversationId, question: ownerMessage?.body || conversation.title, privacy: conversation.privacy, published: conversation.status === "published", answer, saved: true });
    }
    const result = await db.prepare("SELECT id, title, topic, privacy, created_at AS createdAt FROM care_chat_conversations WHERE member_id = ?1 AND status != 'intake' ORDER BY created_at DESC LIMIT 12").bind(memberId).all();
    return json({ conversations: result.results || [] });
  } catch {
    return json({ error: "We could not load your saved questions right now." }, 503);
  }
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that question." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const question = cleanText(body.question, 900);
  const privacy = body.privacy === "private" ? "private" : "public";
  const stage = body.stage === "lesson" ? "lesson" : "context";
  if (question.length < 12) return json({ error: "Add when the change started and what looks different from normal." }, 400);
  if (privacy === "public" && (/@|\b\d{3}[-. )]+\d{3}[-. ]+\d{4}\b/.test(question))) {
    return json({ error: "Remove contact details or choose Private before sharing this question." }, 400);
  }
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Create or reopen your pet account before asking a question." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
    const topic = detectTopic(question);
    const today = new Date().toISOString().slice(0, 10);
    const dailyLessonLimit = 20;
    const usage = await db.prepare("SELECT COUNT(*) AS count FROM care_chat_conversations WHERE member_id = ?1 AND status != 'intake' AND substr(created_at, 1, 10) = ?2").bind(memberId, today).first();
    const used = Number(usage?.count || 0);
    if (used >= dailyLessonLimit) return json({ error: "You have reached today's care-lesson safety limit. Please continue tomorrow." }, 429);
    const intakeKey = `intake:${await hashToken(question)}`;
    let intake = await db.prepare("SELECT id FROM care_chat_conversations WHERE member_id = ?1 AND pet_profile_id = ?2 AND title = ?3 AND status = 'intake' ORDER BY created_at DESC LIMIT 1").bind(memberId, dogId, intakeKey).first();
    if (!intake?.id && stage === "context") {
      const intakeId = crypto.randomUUID();
      const intakeCreatedAt = new Date().toISOString();
      await db.prepare("INSERT INTO care_chat_conversations (id, member_id, pet_profile_id, title, topic, privacy, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'intake', ?7, ?7)")
        .bind(intakeId, memberId, dogId, intakeKey, topic, privacy, intakeCreatedAt)
        .run();
      intake = { id: intakeId };
      await syncBrevoContact({
        env: context.env,
        db,
        email: member.email,
        firstName: member.firstName,
        eventType: "care_question_started",
        eventProperties: { intake_id: intakeId, pet_id: dogId, topic, privacy },
        notificationProperties: { pet_name: pet.dogName, topic, privacy },
        listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
      });
    }
    const entriesResult = await db.prepare("SELECT day_number AS dayNumber, sleep_state AS sleep, mobility_state AS mobility, appetite_state AS appetite, note, prompt FROM dog_checkins WHERE dog_profile_id = ?1 ORDER BY created_at DESC LIMIT 7").bind(dogId).all();
    const entries = entriesResult.results || [];
    if (stage === "context" && topic !== "urgent") {
      return json({
        needsContext: true,
        question,
        privacy,
        intakeId: intake?.id || "",
        intake: await buildIntake(context.env.AI, topic, pet, question, entries),
        quota: { used, limit: dailyLessonLimit, remaining: Math.max(0, dailyLessonLimit - used) },
      });
    }
    const rawContext = body.context && typeof body.context === "object" ? body.context : {};
    const careContext = {
      started: cleanText(rawContext.started, 24),
      frequency: cleanText(rawContext.frequency, 24),
      trend: cleanText(rawContext.trend, 24),
      impact: cleanText(rawContext.impact, 24),
      changedMoment: cleanText(rawContext.changedMoment, 700),
      otherSigns: cleanText(rawContext.otherSigns, 700),
      healthContext: cleanText(rawContext.healthContext, 700),
    };
    if (topic !== "urgent" && !Object.values(careContext).some((value) => value.length > 0)) {
      careContext.changedMoment = question;
      careContext.started = "not-sure";
      careContext.frequency = "not-sure";
      careContext.trend = "not-sure";
      careContext.impact = "not-sure";
    }
    const evidenceAnswer = buildAnswer(question, pet, entries, careContext);
    const answer = await personalizeLessonWithAi(context.env.AI, evidenceAnswer, question, pet, entries, careContext);
    const now = new Date().toISOString();
    const conversationId = intake?.id || crypto.randomUUID();
    const title = question.length > 72 ? `${question.slice(0, 69)}...` : question;
    const operations = [
      intake?.id
        ? db.prepare("UPDATE care_chat_conversations SET title = ?1, topic = ?2, privacy = ?3, status = ?4, created_at = ?5, updated_at = ?5 WHERE id = ?6 AND member_id = ?7 AND pet_profile_id = ?8").bind(title, answer.topic, privacy, privacy === "public" ? "published" : "active", now, conversationId, memberId, dogId)
        : db.prepare("INSERT INTO care_chat_conversations (id, member_id, pet_profile_id, title, topic, privacy, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)").bind(conversationId, memberId, dogId, title, answer.topic, privacy, privacy === "public" ? "published" : "active", now),
      db.prepare("INSERT INTO care_chat_messages (id, conversation_id, role, body, payload_json, created_at) VALUES (?1, ?2, 'user', ?3, ?4, ?5)").bind(crypto.randomUUID(), conversationId, question, JSON.stringify({ context: careContext }), now),
      db.prepare("INSERT INTO care_chat_messages (id, conversation_id, role, body, payload_json, created_at) VALUES (?1, ?2, 'assistant', ?3, ?4, ?5)").bind(crypto.randomUUID(), conversationId, answer.summary, JSON.stringify(answer), now),
    ];
    if (privacy === "public") {
      operations.push(db.prepare("INSERT INTO care_circle_posts (id, member_id, dog_profile_id, dog_name, topic, body, group_id, care_chat_conversation_id, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, 'approved', ?8, ?8)").bind(crypto.randomUUID(), memberId, dogId, pet.dogName, publicTopic(answer.topic), cleanText(`${question} ${answer.summary}`, 800), conversationId, now));
    }
    await db.batch(operations);
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "care_lesson_created",
      notificationSubject: privacy === "public"
        ? `WoafMeow: Public Care Lesson created — ${pet.dogName}`
        : `WoafMeow: Private Care Lesson created — ${pet.dogName}`,
      eventProperties: { conversation_id: conversationId, pet_id: dogId, topic: answer.topic, privacy },
      notificationProperties: { pet_name: pet.dogName, topic: answer.topic, privacy },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
      sendOwnerNotification: privacy === "public" || !intake?.id,
    });
    return json({ conversationId, question, privacy, published: privacy === "public", answer, saved: true, quota: { used: used + 1, limit: dailyLessonLimit, remaining: Math.max(0, dailyLessonLimit - used - 1) } });
  } catch {
    return json({ error: "We could not build that care answer right now. Please try again." }, 503);
  }
}
