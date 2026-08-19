(() => {
  const toggle = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-site-nav]");

  const setMenu = (open) => {
    if (!toggle || !navigation) return;
    toggle.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    const label = toggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Close navigation" : "Open navigation";
  };

  toggle?.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
      toggle?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  document.querySelectorAll("[data-preview-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = form.querySelector("[data-form-note]");
      if (!note) return;
      const stored = Object.fromEntries(new FormData(form).entries());
      try {
        localStorage.setItem(`woafypet-form-${form.id || form.dataset.formTitle || "request"}`, JSON.stringify(stored));
        note.textContent = "Saved in this browser.";
      } catch {
        note.textContent = "Your details are ready on this screen.";
      }
      note.classList.add("is-confirmed");
      note.setAttribute("aria-live", "polite");
      note.focus?.({ preventScroll: true });
    });

    form.addEventListener("input", () => {
      const note = form.querySelector("[data-form-note]");
      if (note?.classList.contains("is-confirmed")) {
        note.textContent = "";
        note.classList.remove("is-confirmed");
      }
    });
  });

  document.querySelectorAll("[data-provider-inquiry-form]").forEach((form) => {
    const recipient = form.dataset.providerEmail;
    const note = form.querySelector("[data-provider-inquiry-note]");
    const button = form.querySelector("button[type='submit']");
    const coveragePreset = form.querySelector("[data-coverage-preset]");
    const coverageOtherLabel = form.querySelector("[data-coverage-other]");
    const coverageOther = coverageOtherLabel?.querySelector("input");
    const coverage = form.querySelector("[name='coverage']");

    const syncCoverage = () => {
      const needsOther = coveragePreset?.value === "other";
      if (coverageOtherLabel) coverageOtherLabel.hidden = !needsOther;
      if (coverageOther) {
        coverageOther.required = Boolean(needsOther);
        if (!needsOther) coverageOther.value = "";
      }
      if (coverage) coverage.value = needsOther ? coverageOther?.value.trim() || "" : coveragePreset?.value || "";
    };

    coveragePreset?.addEventListener("change", syncCoverage);
    coverageOther?.addEventListener("input", syncCoverage);
    syncCoverage();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      syncCoverage();
      if (!form.reportValidity()) return;

      const values = Object.fromEntries(new FormData(form).entries());
      if (values.companyWebsite) {
        form.reset();
        syncCoverage();
        if (note) note.textContent = "Thank you. Your practice was submitted for review.";
        return;
      }

      const subject = `WoafyPet practice listing — ${values.organization}`;
      const body = [
        "WoafyPet practice listing request",
        "",
        `Practice or service: ${values.organization}`,
        `Contact: ${values.contactName}`,
        `Work email: ${values.email}`,
        `City and region: ${values.coverage}`,
        `Service category: ${values.serviceType}`,
        `Credential and official website: ${values.website}`,
        "",
        "How this practice helps pet owners:",
        values.message,
        "",
        `Submitted from: ${window.location.href}`,
      ].join("\n");
      if (!recipient) {
        if (note) note.textContent = "Email delivery is temporarily unavailable.";
        return;
      }
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (note) {
        note.textContent = "Your email app is ready. Send the prepared message to complete your submission.";
        note.classList.add("is-confirmed");
      }
    });
  });

  document.querySelector("[data-print-guide]")?.addEventListener("click", () => window.print());

  const currentPath = window.location.pathname.replace(/index\.html$/, "");

  const carePathRoot = document.querySelector("[data-care-path]");
  if (carePathRoot && /^\/care-path\/?$/.test(currentPath)) {
    const query = (new URLSearchParams(window.location.search).get("q") || "")
      .slice(0, 300)
      .trim();
    const displayedQuery = query || "a change in your senior dog’s routine";

    const carePaths = {
      mobility: {
        title: "Start with mobility and stiffness",
        summary:
          "Learn what to notice after rest, what to make safer today, and what to record for your veterinarian.",
        chapters: {
          notice: {
            title: "Notice the mobility pattern",
            summary: "Compare first steps, turning, stairs, slipping, and recovery after rest.",
          },
          today: {
            title: "Make movement safer today",
            summary: "Use traction, easier access, shorter routes, and comfortable rest without forcing activity.",
          },
          discuss: {
            title: "Prepare the right veterinary conversation",
            summary: "Bring timing, frequency, short videos, and the activities that have become harder.",
          },
        },
      },
      night: {
        title: "Start with nighttime changes",
        summary:
          "Separate a one-off restless night from a pattern and prepare useful observations for your care team.",
        chapters: {
          notice: {
            title: "Notice the nighttime pattern",
            summary: "Track pacing, waking, confusion, vocalizing, and what happens before and after each episode.",
          },
          today: {
            title: "Create a calmer night tonight",
            summary: "Keep routes clear, lighting gentle, bathroom access easy, and the bedtime routine predictable.",
          },
          discuss: {
            title: "Know what to discuss with your veterinarian",
            summary: "Share onset, frequency, sleep disruption, pain signs, bathroom changes, and any new medication.",
          },
        },
      },
      appetite: {
        title: "Start with appetite and weight changes",
        summary:
          "Learn what details make an eating change meaningful and what deserves a prompt veterinary call.",
        chapters: {
          notice: {
            title: "Notice what changed around meals",
            summary: "Record interest in food, chewing, nausea signs, portions eaten, water intake, and weight trend.",
          },
          today: {
            title: "Support safer, easier meals today",
            summary: "Keep food familiar, make bowls easy to reach, and avoid unapproved supplements or abrupt diet changes.",
          },
          discuss: {
            title: "Prepare the right veterinary conversation",
            summary: "Bring the timeline, amounts eaten, weight changes, medications, vomiting, stool, and dental clues.",
          },
        },
      },
      water: {
        title: "Start with drinking and bathroom changes",
        summary:
          "Turn changes in thirst, urination, or accidents into clear observations your veterinarian can use.",
        chapters: {
          notice: {
            title: "Notice the drinking and bathroom pattern",
            summary: "Track frequency, approximate amount, urgency, accidents, urine appearance, and related behavior.",
          },
          today: {
            title: "Keep access safe and comfortable",
            summary: "Keep fresh water available, add easy bathroom opportunities, and do not restrict water unless a veterinarian directs it.",
          },
          discuss: {
            title: "Know when to call and what to share",
            summary: "Report the timeline and paired signs; inability to urinate, collapse, or severe distress needs urgent care.",
          },
        },
      },
      general: {
        title: "Start by turning the change into a clear pattern",
        summary:
          "Use a simple baseline, safe next steps, and focused notes to decide what to discuss with your veterinarian.",
        chapters: {
          notice: {
            title: "Notice what is different",
            summary: "Record when it began, how often it happens, what comes before it, and how it affects daily life.",
          },
          today: {
            title: "Choose a safer next step today",
            summary: "Reduce avoidable strain, keep routines predictable, and avoid treatments that have not been approved for your dog.",
          },
          discuss: {
            title: "Prepare a focused veterinary conversation",
            summary: "Bring a short timeline, photos or video when safe, medications, and the questions you most need answered.",
          },
        },
      },
    };

    const keywordGroups = [
      ["mobility", /\b(stiff|stiffness|rise|rising|limp|limping|stairs?|mobility|slip|slipping)\b/i],
      ["night", /\b(nights?|pacing|sleep|sleeping|restless|restlessness|confused|confusion)\b/i],
      ["appetite", /\b(appetite|food|eating|eat|nausea|nauseous|weight)\b/i],
      ["water", /\b(water|drink|drinking|pee|peeing|urine|urinating|bathroom|accident|accidents)\b/i],
    ];
    const selectedKey = keywordGroups.find(([, pattern]) => pattern.test(query))?.[0] || "general";
    const selectedPath = carePaths[selectedKey];

    carePathRoot.dataset.carePath = selectedKey;
    document.querySelectorAll("[data-care-query]").forEach((element) => {
      element.textContent = displayedQuery;
    });
    document.querySelectorAll("[data-care-lesson-title]").forEach((element) => {
      element.textContent = selectedPath.title;
    });
    document.querySelectorAll("[data-care-lesson-summary]").forEach((element) => {
      element.textContent = selectedPath.summary;
    });

    Object.entries(selectedPath.chapters).forEach(([chapterKey, chapter]) => {
      document.querySelectorAll(`[data-care-chapter-link="${chapterKey}"]`).forEach((link) => {
        link.setAttribute("href", `#chapter-${chapterKey}`);
        const shortLabels = {
          notice: "Notice",
          today: "Support today",
          discuss: "Prepare",
        };
        const label = link.querySelector("span");
        if (label) label.textContent = shortLabels[chapterKey];
      });
      document.querySelectorAll(`[data-care-chapter-title="${chapterKey}"]`).forEach((element) => {
        element.textContent = chapter.title;
      });
      document.querySelectorAll(`[data-care-chapter-summary="${chapterKey}"]`).forEach((element) => {
        element.textContent = chapter.summary;
      });
    });
  }

  const lessonTailoring = {
    "slower-after-rest": [
      (condition) => `Watch ${condition} once during an ordinary routine; record the pause, first steps, slipping, and recovery.`,
      (condition) => `Make the route around ${condition} easier with traction, shorter access, and one change at a time.`,
      (condition) => `Tell your veterinarian when ${condition} began, how often it occurs, what helps, and which activity is now harder.`,
    ],
    "restless-at-night": [
      (condition) => `Record when ${condition} begins, the exact sequence that follows, and what finally helps your dog settle.`,
      (condition) => `Make tonight easier around ${condition} with a clear route, water, bathroom access, and gentle light.`,
      (condition) => `Report the timing, breathing, toileting, pain clues, medicines, and how often ${condition} occurs.`,
    ],
    "changes-in-appetite": [
      (condition) => `Measure food offered and eaten when ${condition} occurs; add water, stool, vomiting, and energy.`,
      (condition) => `Watch chewing, swallowing, nausea clues, and mouth comfort around ${condition}.`,
      (condition) => `Report the duration, amounts, weight, medicines, and paired signs that come with ${condition}.`,
    ],
    "drinking-more-water": [
      (condition) => `Measure one ordinary day when you notice ${condition}, while keeping fresh water freely available.`,
      (condition) => `Pair ${condition} with urine, appetite, energy, medicines, temperature, and recent food changes.`,
      (condition) => `Report the measured change, timeline, and paired signs; ask how soon your dog should be examined.`,
    ],
    "less-interest-in-life": [
      (condition) => `Choose one familiar routine affected by ${condition}; record whether your dog starts, joins, finishes, or avoids it.`,
      () => "Offer a shorter, lower-effort version of that routine and let your dog choose whether to join.",
      (condition) => `Report onset, frequency, movement, sleep, appetite, senses, and medicines alongside ${condition}.`,
    ],
    "bathroom-accidents": [
      (condition) => `Record the time and sequence around ${condition}: last trip, route, urgency, posture, amount, and distress.`,
      () => "Make access easier with a shorter, well-lit, non-slip route and more frequent calm opportunities.",
      (condition) => `Report output, straining, pain, thirst, vomiting, medicines, and how often ${condition} occurs.`,
    ],
  };

  document.querySelectorAll("[data-lesson-intake]").forEach((intake) => {
    const buildButton = intake.querySelector("[data-build-lesson]");
    const error = intake.querySelector("[data-intake-error]");
    const course = document.querySelector("[data-tailored-course]");
    const urgentResult = document.querySelector("[data-urgent-intake-result]");
    const profile = document.querySelector("[data-tailored-profile]");
    const priority = document.querySelector("[data-tailored-priority]");
    const chapterSummaries = course
      ? [...course.querySelectorAll("[data-tailored-chapter-summary]")]
      : [];

    const selectValue = (name) => intake.querySelector(`[data-intake-field="${name}"]`)?.value.trim() || "";

    intake.addEventListener("change", () => {
      if (error) error.hidden = true;
    });

    buildButton?.addEventListener("click", () => {
      const requiredNames = ["age", "condition", "duration", "impact"];
      const missingField = requiredNames
        .map((name) => intake.querySelector(`[data-intake-field="${name}"]`))
        .find((element) => !element?.value);
      const urgentChoice = intake.querySelector('[data-intake-field="urgent"]:checked');

      if (missingField || !urgentChoice) {
        if (error) error.hidden = false;
        (missingField || intake.querySelector('[data-intake-field="urgent"]'))?.focus();
        return;
      }

      if (error) error.hidden = true;
      if (urgentChoice.value === "yes") {
        if (course) course.hidden = true;
        if (urgentResult) {
          urgentResult.hidden = false;
          urgentResult.focus({ preventScroll: true });
          urgentResult.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      if (urgentResult) urgentResult.hidden = true;
      const context = selectValue("context");
      const condition = selectValue("condition");
      const conditionPhrase = condition
        ? `${condition.charAt(0).toLocaleLowerCase()}${condition.slice(1)}`
        : "the selected change";
      const templates = lessonTailoring[intake.dataset.lessonSlug] || [
        (value) => `Observe ${value} once during an ordinary routine and record what happens before and after.`,
        (value) => `Choose one low-risk change that makes ${value} safer or easier today.`,
        (value) => `Bring the timeline for ${value}, what helps, and what daily activity has become harder to your veterinarian.`,
      ];
      const tailoredSummaries = templates.map((template) => template(conditionPhrase));
      if (profile) {
        profile.textContent = `${selectValue("age")} · ${condition} · ${selectValue("duration")} · ${selectValue("impact")}${context ? ` · Context: ${context}` : ""}`;
      }
      if (priority) priority.textContent = tailoredSummaries[0];
      chapterSummaries.forEach((summary, index) => {
        summary.textContent = tailoredSummaries[index] || summary.textContent;
      });
      if (course) {
        course.hidden = false;
        course.classList.add("is-ready");
        course.focus({ preventScroll: true });
        course.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll("[data-chapter-quiz]").forEach((quiz) => {
    const checkButton = quiz.querySelector("[data-check-quiz]");
    const feedback = quiz.querySelector("[data-quiz-feedback]");
    checkButton?.addEventListener("click", () => {
      const selected = quiz.querySelector('input[type="radio"]:checked');
      if (!selected) {
        if (feedback) feedback.textContent = "Choose one answer first.";
        quiz.classList.remove("is-correct");
        quiz.classList.add("needs-answer");
        return;
      }
      const correct = selected.value === quiz.dataset.answer;
      if (feedback) {
        feedback.textContent = correct
          ? quiz.dataset.correctMessage || "Correct."
          : quiz.dataset.retryMessage || "Try again.";
      }
      quiz.classList.toggle("is-correct", correct);
      quiz.classList.toggle("needs-answer", !correct);
    });
  });

  const circleFilters = [...document.querySelectorAll("[data-circle-filter]")];
  const circlePosts = [...document.querySelectorAll("[data-care-post]")];
  circleFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const selectedTopic = filter.dataset.circleFilter;
      circleFilters.forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === filter));
      });
      circlePosts.forEach((post) => {
        post.hidden = selectedTopic !== "all" && post.dataset.topic !== selectedTopic;
      });
    });
  });

  document.querySelectorAll("[data-preview-like]").forEach((button) => {
    const count = button.querySelector("[data-like-count]");
    const baseCount = Number(button.dataset.baseCount || count?.textContent || 0);
    button.addEventListener("click", () => {
      const liked = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(liked));
      if (count) count.textContent = String(baseCount + (liked ? 1 : 0));
    });
  });

  document.querySelectorAll("[data-comments-toggle]").forEach((button) => {
    const comments = button.closest("[data-care-post]")?.querySelector("[data-preview-comments]");
    button.addEventListener("click", () => {
      if (!comments) return;
      const willOpen = comments.hidden;
      comments.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) comments.querySelector("article")?.focus?.({ preventScroll: true });
    });
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname;
    if (linkPath !== "/" && currentPath.startsWith(linkPath)) {
      link.setAttribute("aria-current", "page");
    }
  });
})();

(() => {
  const directory = document.querySelector("[data-directory-controls]");
  if (!directory) return;

  const search = directory.querySelector("[data-directory-search]");
  const category = directory.querySelector("[data-directory-category]");
  const region = directory.querySelector("[data-directory-region]");
  const filterButtons = [...document.querySelectorAll("[data-directory-filter]")];
  const items = [...document.querySelectorAll("[data-directory-item]")];
  const totalCount = document.querySelector("[data-directory-results-count]");
  const profileCount = document.querySelector("[data-directory-profile-count]");
  const resourceCount = document.querySelector("[data-directory-resource-count]");
  const profileEmpty = document.querySelector("[data-directory-profile-empty]");
  const resourceEmpty = document.querySelector("[data-directory-resource-empty]");
  const loadMore = document.querySelector("[data-directory-load-more]");
  let profileLimit = 12;

  const itemMatches = (item, query, selectedCategory, selectedRegion) => {
    const searchable = (item.dataset.search || "").toLocaleLowerCase();
    const categories = (item.dataset.categories || "").split("|").filter(Boolean);
    const itemRegion = item.dataset.region || "all";
    return (!query || searchable.includes(query))
      && (selectedCategory === "all" || categories.includes(selectedCategory))
      && (selectedRegion === "all" || itemRegion === "all" || itemRegion === selectedRegion);
  };

  const resultLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

  const updateDirectory = () => {
    const query = (search?.value || "").trim().toLocaleLowerCase();
    const selectedCategory = category?.value || "all";
    const selectedRegion = region?.value || "all";
    let matchingProfiles = 0;
    let visibleResources = 0;

    items.forEach((item) => {
      const matches = itemMatches(item, query, selectedCategory, selectedRegion);
      let visible = matches;
      if (matches && item.hasAttribute("data-directory-profile")) {
        matchingProfiles += 1;
        visible = matchingProfiles <= profileLimit;
      }
      item.hidden = !visible;
      if (!matches) return;
      if (item.hasAttribute("data-directory-resource")) visibleResources += 1;
    });

    if (profileCount) profileCount.textContent = resultLabel(matchingProfiles, "profile", "profiles");
    if (resourceCount) resourceCount.textContent = resultLabel(visibleResources, "resource", "resources");
    if (totalCount) totalCount.textContent = resultLabel(matchingProfiles + visibleResources, "result", "results");
    if (profileEmpty) profileEmpty.hidden = matchingProfiles !== 0;
    if (resourceEmpty) resourceEmpty.hidden = visibleResources !== 0;
    if (loadMore) {
      const remaining = Math.max(0, matchingProfiles - profileLimit);
      loadMore.hidden = remaining === 0;
      loadMore.textContent = remaining > 12 ? `Show 12 more providers (${remaining} remaining) →` : `Show ${remaining} more providers →`;
    }

    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.directoryFilter === selectedCategory));
    });
  };

  search?.addEventListener("input", updateDirectory);
  category?.addEventListener("change", () => {
    profileLimit = 12;
    updateDirectory();
  });
  region?.addEventListener("change", () => {
    profileLimit = 12;
    updateDirectory();
  });
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextCategory = button.dataset.directoryFilter || "all";
      if (category && [...category.options].some((option) => option.value === nextCategory)) {
        category.value = nextCategory;
      }
      profileLimit = 12;
      updateDirectory();
    });
  });
  loadMore?.addEventListener("click", () => {
    profileLimit += 12;
    updateDirectory();
  });

  updateDirectory();
})();
