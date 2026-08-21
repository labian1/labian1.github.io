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

  const navGroups = [...document.querySelectorAll(".nav-group")];
  navGroups.forEach((group) => {
    group.addEventListener("toggle", () => {
      if (!group.open) return;
      navGroups.forEach((other) => {
        if (other !== group) other.open = false;
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".nav-group")) return;
    navGroups.forEach((group) => { group.open = false; });
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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector("[data-form-note]");
      if (!note) return;
      const stored = Object.fromEntries(new FormData(form).entries());
      const endpoint = form.dataset.submitApi;
      if (endpoint) {
        const isGuideDelivery = form.hasAttribute("data-guide-delivery");
        const button = form.querySelector("button[type='submit']");
        if (button) button.disabled = true;
        note.textContent = "Sending…";
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            mode: isGuideDelivery ? "cors" : "no-cors",
            headers: { "Content-Type": isGuideDelivery ? "application/json" : "text/plain;charset=UTF-8" },
            body: JSON.stringify({ ...stored, consent: stored.consent === "true" || stored.consent === "on", pageContext: window.location.href }),
          });
          if (isGuideDelivery && !response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Guide delivery failed.");
          }
          note.textContent = form.dataset.successMessage || "Thank you. Your request was sent.";
          note.classList.add("is-confirmed");
          form.reset();
        } catch (error) {
          note.textContent = isGuideDelivery
            ? "We could not email the guide right now. Please check the address and try again."
            : "We could not send this right now. Please try again.";
          note.classList.remove("is-confirmed");
        } finally {
          if (button) button.disabled = false;
        }
        return;
      }
      try {
        localStorage.setItem(`woafmeow-form-${form.id || form.dataset.formTitle || "request"}`, JSON.stringify(stored));
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
    const endpoint = form.dataset.providerApi;
    const note = form.querySelector("[data-provider-inquiry-note]");
    const button = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const values = Object.fromEntries(new FormData(form).entries());
      if (values.companyWebsite) {
        form.reset();
        if (note) note.textContent = "Thank you. Your practice was submitted for review.";
        return;
      }
      if (!endpoint) {
        if (note) note.textContent = "Submission is temporarily unavailable.";
        return;
      }

      const payload = {
        ...values,
        coverage: [values.city, values.region].filter(Boolean).join(", "),
        consent: values.consent === "on",
        pageContext: window.location.href,
      };
      if (button) button.disabled = true;
      if (note) note.textContent = "Submitting…";
      try {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload),
        });
        form.reset();
        if (note) {
          note.textContent = "Thank you. Your practice was submitted for review.";
          note.classList.add("is-confirmed");
        }
      } catch {
        if (note) {
          note.textContent = "We could not submit the practice right now. Please try again.";
          note.classList.remove("is-confirmed");
        }
      } finally {
        if (button) button.disabled = false;
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
        slug: "slower-after-rest",
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
        slug: "restless-at-night",
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
        slug: "changes-in-appetite",
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
        slug: "drinking-more-water",
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
        slug: "less-interest-in-life",
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
    document.querySelectorAll("[data-care-lesson-link]").forEach((link) => {
      link.setAttribute("href", `/learn/${selectedPath.slug}/?personalize=1`);
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
    const personalizer = intake.closest("[data-lesson-personalizer]");
    const wantsPersonalization = new URLSearchParams(window.location.search).get("personalize") === "1";
    let hasSeenPersonalizer = false;
    try {
      hasSeenPersonalizer = localStorage.getItem("woafmeow-lesson-personalizer-seen") === "1";
    } catch {
      hasSeenPersonalizer = false;
    }
    if (personalizer && wantsPersonalization && !hasSeenPersonalizer) {
      personalizer.hidden = false;
      try {
        localStorage.setItem("woafmeow-lesson-personalizer-seen", "1");
      } catch {
        // The public course remains available even when storage is disabled.
      }
    }

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
      if (personalizer) personalizer.hidden = true;
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

  document.querySelectorAll("[data-community-interaction]").forEach((interaction) => {
    const key = interaction.dataset.communityInteraction || "lesson";
    const likeButton = interaction.querySelector("[data-local-like]");
    const likeCount = likeButton?.querySelector("[data-like-count]");
    const baseLikes = Number(likeButton?.dataset.baseCount || likeCount?.textContent || 0);
    const commentsButton = interaction.querySelector("[data-local-comments-toggle]");
    const commentsPanel = interaction.querySelector("[data-local-comments]");
    const commentForm = interaction.querySelector("[data-local-comment-form]");
    const commentList = interaction.querySelector("[data-local-comment-list]");
    const commentCount = interaction.querySelector("[data-comment-count]");
    const storageKey = `woafmeow-community-${key}`;
    let saved = { liked: false, comments: [] };
    try {
      saved = { ...saved, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      saved = { liked: false, comments: [] };
    }

    const render = () => {
      if (likeButton) likeButton.setAttribute("aria-pressed", String(Boolean(saved.liked)));
      if (likeCount) likeCount.textContent = String(baseLikes + (saved.liked ? 1 : 0));
      const existingLocal = commentList?.querySelectorAll("[data-local-comment]").length || 0;
      if (commentList && existingLocal === 0) {
        saved.comments.forEach((copy) => {
          const article = document.createElement("article");
          article.dataset.localComment = "true";
          const name = document.createElement("strong");
          name.textContent = "You";
          const paragraph = document.createElement("p");
          paragraph.textContent = copy;
          article.append(name, paragraph);
          commentList.append(article);
        });
      }
      if (commentCount) {
        commentCount.textContent = String((commentList?.querySelectorAll("article").length || 0));
      }
    };

    const save = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        // Interaction still works for the current page view.
      }
    };

    likeButton?.addEventListener("click", () => {
      saved.liked = !saved.liked;
      save();
      render();
    });
    commentsButton?.addEventListener("click", () => {
      if (!commentsPanel) return;
      const open = commentsPanel.hidden;
      commentsPanel.hidden = !open;
      commentsButton.setAttribute("aria-expanded", String(open));
      if (open) commentForm?.querySelector("textarea")?.focus({ preventScroll: true });
    });
    commentForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const field = commentForm.querySelector("textarea");
      const copy = field?.value.trim() || "";
      if (!copy) return;
      saved.comments.push(copy.slice(0, 600));
      save();
      if (field) field.value = "";
      const status = commentForm.querySelector("[data-local-comment-status]");
      if (status) status.textContent = "Comment added.";
      const article = document.createElement("article");
      article.dataset.localComment = "true";
      const name = document.createElement("strong");
      name.textContent = "You";
      const paragraph = document.createElement("p");
      paragraph.textContent = copy.slice(0, 600);
      article.append(name, paragraph);
      commentList?.append(article);
      if (commentCount) commentCount.textContent = String(commentList?.querySelectorAll("article").length || 0);
    });
    render();
  });

  const treeDialog = document.querySelector("[data-tree-purchase]");
  document.querySelectorAll("[data-tree-purchase-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (treeDialog?.showModal) treeDialog.showModal();
    });
  });
  document.querySelector("[data-tree-purchase-close]")?.addEventListener("click", () => treeDialog?.close());
  treeDialog?.addEventListener("click", (event) => {
    if (event.target === treeDialog) treeDialog.close();
  });

  const accountStorageKey = "woafmeow-account-v1";
  const publicQuestionStorageKey = "woafmeow-public-question-v1";
  const readStoredJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const writeStoredJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const getAccount = () => readStoredJson(accountStorageKey);
  const getPublicQuestion = () => readStoredJson(publicQuestionStorageKey);
  const selectLessonSlug = (question) => {
    const value = question.toLocaleLowerCase();
    if (/\b(stiff|rise|rising|limp|stairs?|mobility|slip|walk|walking|joint)\b/.test(value)) return "slower-after-rest";
    if (/\b(night|sleep|pacing|wake|waking|restless|confus)\b/.test(value)) return "restless-at-night";
    if (/\b(food|eat|eating|appetite|chew|nausea|meal|weight loss)\b/.test(value)) return "changes-in-appetite";
    if (/\b(water|drink|drinking|thirst|urine|urinating|pee)\b/.test(value)) return "drinking-more-water";
    if (/\b(accident|bathroom|toilet|stool|poop|strain)\b/.test(value)) return "bathroom-accidents";
    return "less-interest-in-life";
  };
  const updateAccountLinks = () => {
    const account = getAccount();
    document.querySelectorAll("[data-account-link]").forEach((link) => {
      link.textContent = account?.petName ? account.petName : "Log in";
      link.setAttribute("aria-label", account?.petName ? `Open ${account.petName}'s profile` : "Log in or create a dog profile");
    });
  };

  const accountForm = document.querySelector("[data-account-form]");
  const accountCurrent = document.querySelector("[data-account-current]");
  const accountSummary = document.querySelector("[data-account-profile-summary]");
  const accountNote = document.querySelector("[data-account-note]");
  const renderAccount = () => {
    const account = getAccount();
    updateAccountLinks();
    if (!accountForm || !accountCurrent || !accountSummary) return;
    accountCurrent.hidden = !account;
    accountForm.hidden = Boolean(account);
    accountSummary.replaceChildren();
    if (!account) return;
    [
      ["Owner", account.ownerName || "Not shared"],
      ["Email", account.email],
      ["Dog", `${account.petName} · ${account.petAge} · ${account.breed}`],
      ["Owner-shared conditions", account.conditions],
      ["Medicines or recent changes", account.medications || "None shared"],
    ].forEach(([term, description]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = description;
      row.append(dt, dd);
      accountSummary.append(row);
    });
  };
  accountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!accountForm.reportValidity()) return;
    const values = Object.fromEntries(new FormData(accountForm).entries());
    const account = {
      ownerName: String(values.ownerName || "").trim().slice(0, 100),
      email: String(values.email || "").trim().slice(0, 254),
      petName: String(values.petName || "").trim().slice(0, 80),
      petAge: String(values.petAge || "").trim().slice(0, 40),
      breed: String(values.breed || "").trim().slice(0, 120),
      conditions: String(values.conditions || "").trim().slice(0, 240),
      medications: String(values.medications || "").trim().slice(0, 360),
      publicProfileConsent: values.publicProfileConsent === "on",
    };
    if (!writeStoredJson(accountStorageKey, account)) {
      if (accountNote) accountNote.textContent = "This browser blocked profile storage. Please allow site storage and try again.";
      return;
    }
    const ageYears = {
      "Under 1 year": 0.5,
      "1–3 years": 2,
      "4–6 years": 5,
      "7–9 years": 8,
      "10–12 years": 11,
      "13–15 years": 14,
      "16+ years": 16,
    }[account.petAge] || 1;
    const accountEndpoint = accountForm.dataset.accountApi;
    if (accountEndpoint) {
      try {
        await fetch(accountEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({
            ownerName: account.ownerName,
            email: account.email,
            city: "",
            region: "",
            dogName: account.petName,
            species: "dog",
            breed: account.breed,
            ageYears,
            focus: "not-sure",
            healthConditions: account.conditions,
            medications: account.medications,
            routineNotes: "Created from the WoafMeow Care Circle profile.",
            consent: account.publicProfileConsent,
            pageContext: window.location.href,
          }),
        });
      } catch {
        if (accountNote) accountNote.textContent = "Your profile is saved in this browser, but we could not sync it right now.";
      }
    }
    renderAccount();
    if (accountForm.matches("[data-home-account-form]")) {
      window.location.assign("/care-circle/?ask=1#ask");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const question = (params.get("q") || "").trim().slice(0, 500);
    if (params.get("next") === "ask") {
      const target = new URL("/care-circle/", window.location.origin);
      target.searchParams.set("ask", "1");
      if (question) target.searchParams.set("q", question);
      target.hash = "ask";
      window.location.assign(target.href);
      return;
    }
    if (accountNote) accountNote.textContent = "Profile saved.";
  });
  document.querySelector("[data-account-signout]")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(accountStorageKey);
      localStorage.removeItem(publicQuestionStorageKey);
    } catch {
      // The current screen still resets even if storage access changes.
    }
    accountForm?.reset();
    renderAccount();
  });
  renderAccount();

  const accountGate = document.querySelector("[data-account-gate]");
  const askForm = document.querySelector("[data-account-ask-form]");
  if (accountGate && askForm) {
    const account = getAccount();
    const existingQuestion = getPublicQuestion();
    const questionField = askForm.querySelector('[name="question"]');
    const askNote = askForm.querySelector("[data-account-ask-note]");
    const requestedQuestion = (new URLSearchParams(window.location.search).get("q") || "").trim().slice(0, 500);
    if (questionField && requestedQuestion) questionField.value = requestedQuestion;
    if (!account) {
      accountGate.hidden = false;
      askForm.hidden = true;
    } else if (existingQuestion) {
      accountGate.hidden = false;
      askForm.hidden = true;
      accountGate.replaceChildren();
      const copy = document.createElement("div");
      const heading = document.createElement("h2");
      const paragraph = document.createElement("p");
      const link = document.createElement("a");
      heading.textContent = `${account.petName}'s public lesson is ready.`;
      paragraph.textContent = existingQuestion.question;
      link.className = "button primary";
      link.href = `/care-circle/${existingQuestion.slug}/?mine=1`;
      link.textContent = "Open the tailored lesson →";
      copy.append(heading, paragraph);
      accountGate.append(copy, link);
    } else {
      accountGate.hidden = true;
      askForm.hidden = false;
      const summary = askForm.querySelector("[data-active-pet-summary]");
      if (summary) summary.textContent = `${account.petName} · ${account.petAge} · ${account.breed} · ${account.conditions}`;
    }
    askForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!askForm.reportValidity() || !account) return;
      const values = Object.fromEntries(new FormData(askForm).entries());
      const question = String(values.question || "").trim().slice(0, 500);
      const slug = selectLessonSlug(question);
      const publicQuestion = { ...account, question, slug, createdAt: new Date().toISOString() };
      if (!writeStoredJson(publicQuestionStorageKey, publicQuestion)) {
        if (askNote) askNote.textContent = "This browser could not save the question. Please allow site storage and try again.";
        return;
      }
      window.location.assign(`/care-circle/${slug}/?mine=1`);
    });
  }

  const buildTailoredLesson = (profile, slug) => {
    const pet = profile.petName;
    const age = profile.petAge.toLocaleLowerCase();
    const breed = profile.breed;
    const conditions = profile.conditions || "no known condition shared";
    const medicines = profile.medications || "no medicine change shared";
    const question = profile.question;
    const clinicalContext = (() => {
      const value = `${conditions} ${medicines}`.toLocaleLowerCase();
      if (/arthritis|joint|hip|spine|mobility/.test(value)) return `Because ${conditions} is already part of ${pet}'s history, compare effort, surfaces and recovery without assuming every new change has the same cause.`;
      if (/kidney|renal/.test(value)) return `Because kidney disease is shared, keep water, urine, appetite and energy in the same record and contact the veterinary team about a sustained change.`;
      if (/dental|tooth|teeth|mouth/.test(value)) return `Because a mouth or dental problem is shared, record chewing, dropping food, swallowing and interest in softer versus familiar textures.`;
      if (/diabet|insulin/.test(value)) return `Because diabetes or insulin is shared, a change in eating, drinking, urine or energy deserves prompt advice from the prescribing team.`;
      if (/steroid|prednisone|medicin|dose|drug/.test(value)) return `Because a medicine change is shared, record the dose timing beside the new pattern and contact the prescribing team before changing it.`;
      if (/cognitive|confus|dementia/.test(value)) return `Because cognitive change is shared, record time of day, orientation, sleep, toileting and what helps ${pet} settle.`;
      return `No known diagnosis explains this by itself. Describe the new pattern clearly and let the veterinary team decide what needs evaluation.`;
    })();
    const shared = {
      mobility: [
        [`For ${pet}, a ${age} ${breed}, start with the exact first rise you described: “${question}” ${clinicalContext}`, [`Watch one ordinary rise after a familiar rest—do not repeat it for a test.`, `Note the surface, pause before standing, first 10–15 steps and time to loosen.`, `Record whether a foot slips, a limb is protected or the usual route is avoided.`]],
        [`Make ${pet}'s next route easier while keeping the observation useful.`, [`Add traction from the resting place to the first destination.`, `Shorten the route and block jumping or slippery turns.`, `Change one detail at a time and note whether effort or recovery changes.`]],
        [`Prepare a mobility call around ${pet}'s real pattern, ${conditions}, and ${medicines}.`, [`Bring a short natural video and the dates the change occurred.`, `List the surface, pause, steps, recovery and anything that helped.`, `Ask what should be examined now and which change should trigger faster care.`]],
      ],
      night: [
        [`For ${pet}, map the first nighttime event instead of treating every wake-up as the same problem. ${clinicalContext}`, [`Record bedtime and the first wake time.`, `Name what happens first: pacing, panting, vocalizing, drinking, toileting or repositioning.`, `Note breathing, orientation and what helps ${pet} settle again.`]],
        [`Make tonight calmer for ${pet} without hiding the sequence you need to understand.`, [`Keep water and a short, non-slip bathroom route available.`, `Use gentle light on the familiar path and keep the sleep area comfortable.`, `Change one environmental detail, then record whether wake-ups or settling change.`]],
        [`Bring the seven-night pattern, ${conditions}, and ${medicines} to ${pet}'s care team.`, [`List wake times and the first behavior at each wake.`, `Include breathing, urine, thirst, pain behavior and daytime sleep.`, `Ask which causes need examination and what should not wait.`]],
      ],
      appetite: [
        [`For ${pet}, separate eating less from trouble chewing, nausea or a changed food preference. ${clinicalContext}`, [`Measure what was offered and what remained.`, `Watch approach, sniffing, chewing, dropping food, swallowing and walking away.`, `Pair the meal note with weight, vomiting, stool, water and energy.`]],
        [`Protect ${pet}'s access to food while arranging the right next step.`, [`Keep familiar food unless the veterinary team has given another plan.`, `Use an easy-to-reach bowl and a calm feeding place.`, `Do not pressure-feed or make several diet changes at once.`]],
        [`Prepare the appetite call with quantities, timing, ${conditions}, and ${medicines}.`, [`Bring a two- or three-day meal record.`, `Include mouth signs, nausea signs, weight change and water intake.`, `Ask what needs examination before supplements or a major diet change.`]],
      ],
      water: [
        [`For ${pet}, measure drinking together with urine—not as an isolated bowl count. ${clinicalContext}`, [`Measure one ordinary 24-hour period if it is safe and practical.`, `Record refill amounts, shared bowls and unusual drinking locations.`, `Pair it with urine frequency, appetite, weight, energy and medicine timing.`]],
        [`Keep fresh water available while making bathroom access easier for ${pet}.`, [`Do not restrict water to reduce accidents.`, `Add a closer bowl and a shorter, well-lit bathroom route.`, `Record whether thirst is new, sustained or tied to a medicine change.`]],
        [`Bring the water-and-urine timeline, ${conditions}, and ${medicines} to the veterinary team.`, [`State the first day the pattern changed.`, `List estimated intake, urine frequency and accidents.`, `Ask how soon testing is needed and which signs require urgent care.`]],
      ],
      bathroom: [
        [`For ${pet}, identify whether the first change is urgency, increased volume, pain, posture or route difficulty. ${clinicalContext}`, [`Record time, location, amount and posture.`, `Note straining, blood, vocalizing, confusion or trouble reaching the door.`, `Pair accidents with water, stool, medicines, mobility and sleep.`]],
        [`Make the next bathroom trip easier and more dignified for ${pet}.`, [`Offer more frequent access on a short, non-slip route.`, `Use gentle lighting and keep the exit unobstructed.`, `Clean calmly and avoid punishment; the pattern is information.`]],
        [`Prepare the bathroom call around frequency, output, ${conditions}, and ${medicines}.`, [`Bring dates and a simple urine or stool log.`, `Include straining, blood, pain, thirst and mobility changes.`, `Ask which tests are appropriate and what means ${pet} should be seen sooner.`]],
      ],
      daily: [
        [`For ${pet}, name the exact routine that changed instead of calling it “slowing down.” ${clinicalContext}`, [`Choose one familiar routine: greeting, meal, walk, play or family time.`, `Record whether ${pet} starts, joins, finishes or avoids it.`, `Note pain behavior, confusion, hearing or vision clues and time of day.`]],
        [`Offer ${pet} a lower-effort version of the routine and watch the choice.`, [`Shorten the activity and improve traction or access.`, `Keep the invitation familiar and allow ${pet} to opt out.`, `Record whether connection, comfort or recovery improves.`]],
        [`Bring the whole daily-life pattern, ${conditions}, and ${medicines} to the care team.`, [`List which routines changed and when.`, `Include sleep, appetite, bathroom, pain and orientation changes.`, `Ask what may be treatable and what home support fits ${pet} now.`]],
      ],
    };
    const key = slug === "slower-after-rest" ? "mobility" : slug === "restless-at-night" ? "night" : slug === "changes-in-appetite" ? "appetite" : slug === "drinking-more-water" ? "water" : slug === "bathroom-accidents" ? "bathroom" : "daily";
    return shared[key];
  };

  const personalQuestion = getPublicQuestion();
  const lessonSlugMatch = currentPath.match(/^\/care-circle\/([^/]+)\/?$/);
  if (personalQuestion && lessonSlugMatch?.[1] === personalQuestion.slug && new URLSearchParams(window.location.search).get("mine") === "1") {
    const conditions = personalQuestion.conditions || "no known condition shared";
    const medicines = personalQuestion.medications || "no medicine change shared";
    document.querySelector("[data-public-dog]")?.replaceChildren(document.createTextNode(`${personalQuestion.petName} · ${personalQuestion.petAge} · ${personalQuestion.breed}`));
    document.querySelector("[data-public-conditions]")?.replaceChildren(document.createTextNode(conditions));
    document.querySelector("[data-public-change]")?.replaceChildren(document.createTextNode(personalQuestion.question));
    document.querySelector("[data-focused-pet]")?.replaceChildren(document.createTextNode(personalQuestion.petName));
    const focusedResult = document.querySelector("[data-focused-result]");
    if (focusedResult) focusedResult.textContent = `This public answer focuses on ${personalQuestion.petName}'s ${personalQuestion.petAge.toLocaleLowerCase()} profile, ${conditions}, and the change you described: ${personalQuestion.question}`;
    const tailored = buildTailoredLesson(personalQuestion, lessonSlugMatch[1]);
    document.querySelectorAll("[data-tailored-chapter-summary]").forEach((summary, index) => {
      if (tailored[index]) summary.textContent = tailored[index][0];
    });
    document.querySelectorAll("[data-tailored-chapter-steps]").forEach((list, index) => {
      const steps = tailored[index]?.[1] || [];
      list.replaceChildren(...steps.map((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        return item;
      }));
    });
  }

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
  let profileLimit = 9;
  let resourceLimit = 3;

  const requestedCare = new URLSearchParams(window.location.search).get("care");
  if (requestedCare && category && [...category.options].some((option) => option.value === requestedCare)) {
    category.value = requestedCare;
  }

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
    let matchingResources = 0;

    items.forEach((item) => {
      const matches = itemMatches(item, query, selectedCategory, selectedRegion);
      let visible = matches;
      if (matches && item.hasAttribute("data-directory-profile")) {
        matchingProfiles += 1;
        visible = matchingProfiles <= profileLimit;
      }
      if (matches && item.hasAttribute("data-directory-resource")) {
        matchingResources += 1;
        visible = matchingResources <= resourceLimit;
      }
      item.hidden = !visible;
    });

    if (profileCount) profileCount.textContent = resultLabel(matchingProfiles, "profile", "profiles");
    if (resourceCount) resourceCount.textContent = resultLabel(matchingResources, "resource", "resources");
    if (totalCount) totalCount.textContent = resultLabel(matchingProfiles + matchingResources, "result", "results");
    if (profileEmpty) profileEmpty.hidden = matchingProfiles !== 0;
    if (resourceEmpty) resourceEmpty.hidden = matchingResources !== 0;
    if (loadMore) {
      const remaining = Math.max(0, matchingProfiles - profileLimit) + Math.max(0, matchingResources - resourceLimit);
      loadMore.hidden = remaining === 0;
      loadMore.textContent = remaining > 12 ? `Show more options (${remaining} remaining) →` : `Show ${remaining} more options →`;
    }

    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.directoryFilter === selectedCategory));
    });
  };

  search?.addEventListener("input", updateDirectory);
  category?.addEventListener("change", () => {
    profileLimit = 9;
    resourceLimit = 3;
    updateDirectory();
  });
  region?.addEventListener("change", () => {
    profileLimit = 9;
    resourceLimit = 3;
    updateDirectory();
  });
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextCategory = button.dataset.directoryFilter || "all";
      if (category && [...category.options].some((option) => option.value === nextCategory)) {
        category.value = nextCategory;
      }
      profileLimit = 9;
      resourceLimit = 3;
      updateDirectory();
    });
  });
  loadMore?.addEventListener("click", () => {
    profileLimit += 9;
    resourceLimit += 3;
    updateDirectory();
  });

  updateDirectory();
})();
