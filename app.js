// Programming Studio
// This starter app keeps the code straightforward and organized so beginners can follow the logic.
// We store the project in the browser using localStorage and update the dashboard as data changes.

const STORAGE_KEY = "programmingStudioProject";
const PROJECTS_STORAGE_KEY = "programmingStudioProjects";
const ACTIVE_PROJECT_KEY = "programmingStudioActiveProject";
const SIDEBAR_COLLAPSED_KEY = "programmingStudioSidebarCollapsed";

const interviewQuestionLibrary = {
  "Routine & Activities": [
    "What time do you usually begin your day?",
    "Which daily tasks feel most stressful?",
    "What activity happens most often in your current space?"
  ],
  "Space Usage": [
    "Which room is used most often for work or study?",
    "Where do you usually store personal belongings?",
    "When do you feel the space is most crowded?"
  ],
  "Communication": [
    "How do you usually communicate with family or friends at home?",
    "Does your environment support quiet or private calls?",
    "What type of communication devices are most needed?"
  ],
  "Technology": [
    "Which devices are used daily in your space?",
    "How often do you need internet access while using the room?",
    "What technology causes the most inconvenience?"
  ],
  "Lighting": [
    "When is natural light most useful in your routine?",
    "What lighting conditions make tasks difficult?",
    "Which activities need brighter or softer light?"
  ],
  "Ventilation": [
    "How comfortable is the airflow in the space?",
    "Are there times when the room feels stuffy?",
    "Which activities need better air movement?"
  ],
  "Storage": [
    "What items are hard to store in your current setup?",
    "Where do you usually keep hobby materials?",
    "What storage solution would make the room easier to use?"
  ],
  "Furniture": [
    "Which furniture piece do you use most often?",
    "Which item feels uncomfortable or outdated?",
    "What furniture is missing from the space?"
  ],
  "Equipment": [
    "Which equipment is essential to your routine?",
    "Are there tasks limited by equipment placement?",
    "What equipment needs to be more accessible?"
  ],
  "Problems & Limitations": [
    "What is the biggest limitation in your current space?",
    "Which problem happens repeatedly?",
    "What would you change first if you could improve the room?"
  ],
  "Hobbies & Interests": [
    "What hobbies or interests need dedicated space?",
    "When do you feel most engaged in your hobby?",
    "What equipment supports your interest most?"
  ],
  "Ideal Space": [
    "What would make your ideal space more comfortable?",
    "Which features are most important in your ideal room?",
    "What atmosphere do you want for focused work or hobby time?"
  ]
};

const mandatoryQuestions = [
  "In three words, describe your current workspace.",
  "In three words, describe your ideal space for your interest or passion."
];

const legacyExampleSpaceNames = new Set([
  "Reception",
  "Lobby",
  "Therapy",
  "Gym",
  "Wellness",
  "Office"
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const defaultState = {
  profile: {
    name: "",
    age: "",
    sex: "",
    civilStatus: "",
    occupation: "",
    education: "",
    householdSize: "",
    yearsInHome: "",
    monthlyIncome: "",
    interests: "",
    devices: "",
    hoursOnline: "",
    workspaceDedicated: "",
    hobbySpaceDedicated: "",
    workspaceDoubles: "",
    existingFurniture: [],
    existingFurnitureCustom: ""
  },
  observations: [],
  interview: {
    questions: mandatoryQuestions.map((question, index) => ({
      id: `mandatory-${index + 1}`,
      text: question,
      locked: true
    })),
    answers: {},
    log: []
  },
  inventory: [],
  siteSurvey: [],
  photos: [],
  floorPlan: [],
  floorPlanSettings: {
    showDimensions: true,
    furnitureSymbolsOnly: true,
    textSize: "medium"
  },
  analysis: {
    bubbleTitle: "",
    spaces: [],
    bubbleNodes: [],
    bubbleLinks: [],
    proximityMatrix: {},
    findings: {
      keyFindings: "",
      constraints: "",
      opportunities: "",
      recommendations: ""
    },
    conclusion: {
      summary: "",
      recommendation: ""
    }
  },
  meta: {
    lastSaved: "",
    projectStarted: false
  }
};

let activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY) || null;
let state = loadProject();

let floorPlanDragState = null;
let activeFurnitureTool = "bed";
let selectedFloorPlanItemId = null;
let selectedBubbleId = null;
let editingSiteSurveyId = null;
let bubbleConnectMode = false;
let pendingConnectFromId = null;

const form = document.getElementById("user-profile-form");
const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");
const progressDetail = document.getElementById("progress-detail");
const saveStatus = document.getElementById("save-status");
const lastSaved = document.getElementById("last-saved");
const manualSaveButton = document.getElementById("manual-save");
const resetButton = document.getElementById("reset-project");
const sidebarToggle = document.getElementById("sidebar-toggle");

function getProjectStorageKey(projectId) {
  return `programmingStudioProject_${projectId}`;
}

function loadProjectList() {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistProjectList(projects) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function ensureActiveProject(projectId) {
  if (!projectId) {
    const currentProjects = loadProjectList();
    if (!currentProjects.length) {
      const newProject = { id: `project-${Date.now()}`, name: "Project 1" };
      currentProjects.push(newProject);
      persistProjectList(currentProjects);
      activeProjectId = newProject.id;
      localStorage.setItem(ACTIVE_PROJECT_KEY, newProject.id);
      return newProject.id;
    }

    activeProjectId = currentProjects[0].id;
    localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    return activeProjectId;
  }

  activeProjectId = projectId;
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  return projectId;
}

function createProject(name) {
  const projectName = (name || "Project").trim() || `Project ${loadProjectList().length + 1}`;
  const projectId = `project-${Date.now()}`;
  const list = loadProjectList();
  list.push({ id: projectId, name: projectName });
  persistProjectList(list);
  const projectData = structuredClone(defaultState);
  projectData.meta = { ...projectData.meta, projectStarted: true };
  localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(projectData));
  activeProjectId = projectId;
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  state = structuredClone(projectData);
  return projectId;
}

function renderProjectList() {
  const picker = document.getElementById("project-list");
  if (!picker) return;

  const projects = loadProjectList();

  if (!projects.length) {
    picker.innerHTML = '<p class="empty-state">No projects yet.</p>';
    return;
  }

  picker.innerHTML = projects.map((project) => `
    <button type="button" class="project-card ${activeProjectId === project.id ? "active" : ""}" data-project-id="${project.id}">
      <strong>${project.name}</strong>
      <span>Open project</span>
    </button>
  `).join("");

  picker.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openProject(button.dataset.projectId);
    });
  });
}

function openProject(projectId) {
  const supportedId = ensureActiveProject(projectId);
  state = loadProject();
  localStorage.setItem(ACTIVE_PROJECT_KEY, supportedId);
  renderProjectList();
  renderAllProjectViews();
  toggleProjectPicker(false);
}

function showProjectPicker() {
  renderProjectList();
  toggleProjectPicker(true);
}

function toggleProjectPicker(show) {
  const picker = document.getElementById("project-picker");
  const app = document.getElementById("app-shell");
  if (!picker || !app) return;

  picker.classList.toggle("hidden", !show);
  app.classList.toggle("hidden", show);
}

function renderAllProjectViews() {
  populateForm();
  renderObservationTable();
  renderInterviewCategories();
  renderInterviewQuestions();
  renderProjectSummary();
  renderInventoryTable();
  renderSiteSurveyTable();
  renderPhotoGallery();
  renderBubbleDiagram();
  renderProximityMatrix();
  renderDataVisualization();
  renderFindingsSummary();
  renderConclusionSummary();
  renderReportPreview();
  renderFloorPlan();
  updateDashboardProgress();
  updateSaveMessage();
}

// 1) Load from localStorage. If nothing exists yet, start with the default state.
function loadProject() {
  try {
    activeProjectId = ensureActiveProject(activeProjectId);
    const projectKey = getProjectStorageKey(activeProjectId);
    const stored = localStorage.getItem(projectKey);
    if (!stored) {
      const seed = structuredClone(defaultState);
      localStorage.setItem(projectKey, JSON.stringify(seed));
      return seed;
    }

    return mergeWithDefaultState(JSON.parse(stored));
  } catch (error) {
    console.warn("Could not load project. Using default values.", error);
    return structuredClone(defaultState);
  }
}

// Fills in any fields missing from an older/imported save so the app never breaks on partial data.
function mergeWithDefaultState(parsed) {
  parsed = parsed && typeof parsed === "object" ? parsed : {};

  return {
    ...structuredClone(defaultState),
    ...parsed,
    profile: {
      ...structuredClone(defaultState.profile),
      ...parsed.profile
    },
    interview: {
      ...structuredClone(defaultState.interview),
      ...parsed.interview,
      questions: Array.isArray(parsed.interview && parsed.interview.questions) ? parsed.interview.questions : structuredClone(defaultState.interview.questions),
      answers: parsed.interview && parsed.interview.answers ? parsed.interview.answers : {},
      log: Array.isArray(parsed.interview && parsed.interview.log) ? parsed.interview.log : []
    },
    floorPlanSettings: {
      ...structuredClone(defaultState.floorPlanSettings),
      ...parsed.floorPlanSettings
    },
    analysis: {
      ...structuredClone(defaultState.analysis),
      ...parsed.analysis,
      spaces: Array.isArray((parsed.analysis || {}).spaces) ? parsed.analysis.spaces : [],
      findings: {
        ...structuredClone(defaultState.analysis.findings),
        ...(parsed.analysis || {}).findings
      },
      conclusion: {
        ...structuredClone(defaultState.analysis.conclusion),
        ...(parsed.analysis || {}).conclusion
      }
    },
    meta: {
      ...structuredClone(defaultState.meta),
      ...parsed.meta
    }
  };
}


// 2) Save the current state to localStorage.
function saveProject() {
  if (!activeProjectId) {
    activeProjectId = ensureActiveProject(null);
  }

  state.meta.lastSaved = new Date().toLocaleString();
  state.meta.projectStarted = true;

  const list = loadProjectList();
  const matchedProject = list.find((project) => project.id === activeProjectId);
  if (!matchedProject) {
    list.push({ id: activeProjectId, name: state.profile.name || "Project" });
    persistProjectList(list);
  } else {
    matchedProject.name = state.profile.name || matchedProject.name || "Project";
    persistProjectList(list);
  }

  localStorage.setItem(getProjectStorageKey(activeProjectId), JSON.stringify(state));
  updateSaveMessage();
  updateDashboardProgress();
  renderProjectList();
  renderProjectSummary();
}

// 3) Update the little “saved” label in the header.
function updateSaveMessage() {
  const savedText = state.meta.lastSaved ? `Saved ${state.meta.lastSaved}` : "Auto-save ready";
  saveStatus.textContent = savedText;
  lastSaved.textContent = state.meta.lastSaved || "Not yet";
}

// 4) Fill the form fields with saved values so the user can continue where they left off.
function populateForm() {
  const fields = document.querySelectorAll("[data-field]");

  fields.forEach((element) => {
    const path = element.dataset.field;
    const value = getNestedValue(path, state);

    if (element.type === "checkbox") {
      const current = Array.isArray(value) ? value : [];
      element.checked = current.includes(element.value);
      return;
    }

    if (element.type === "radio") {
      element.checked = String(value) === String(element.value);
      return;
    }

    element.value = value ?? "";
  });
}

// 5) Read the value from nested objects like "profile.name".
function getNestedValue(path, source) {
  return path.split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, source);
}

// 6) Write a value into a nested object.
function setNestedValue(path, source, newValue) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let current = source;

  keys.forEach((key) => {
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  });

  current[lastKey] = newValue;
}

// 7) Track each input change and save automatically.
function attachInputListeners() {
  const fields = document.querySelectorAll("[data-field]");

  fields.forEach((element) => {
    const updateValue = () => {
      const fieldPath = element.dataset.field;

      if (element.type === "checkbox") {
        const selectedValues = Array.from(
          document.querySelectorAll('[data-field="profile.existingFurniture"]:checked')
        ).map((checkbox) => checkbox.value);

        setNestedValue(fieldPath, state, selectedValues);
      } else if (element.type === "radio") {
        if (element.checked) {
          setNestedValue(fieldPath, state, element.value);
        }
      } else {
        setNestedValue(fieldPath, state, element.value);
      }

      saveProject();
    };

    element.addEventListener("input", updateValue);
    element.addEventListener("change", updateValue);
  });
}

// 8) Simple progress calculation for the current section.
function calculateProgress() {
  const requiredFields = [
    state.profile.name,
    state.profile.age,
    state.profile.sex,
    state.profile.civilStatus,
    state.profile.occupation,
    state.profile.education,
    state.profile.householdSize,
    state.profile.yearsInHome,
    state.profile.interests,
    state.profile.devices,
    state.profile.hoursOnline,
    state.profile.workspaceDedicated,
    state.profile.hobbySpaceDedicated,
    state.profile.workspaceDoubles,
    state.profile.existingFurniture.length > 0 || state.profile.existingFurnitureCustom
  ];

  const completed = requiredFields.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return !Number.isNaN(value);
    return Boolean(value);
  }).length;

  return Math.round((completed / requiredFields.length) * 100);
}

function updateDashboardProgress() {
  const percent = calculateProgress();
  progressFill.style.width = percent + "%";
  progressPercent.textContent = percent + "%";

  if (percent === 0) {
    progressDetail.textContent = "Profile information started";
  } else if (percent < 50) {
    progressDetail.textContent = "Basic details are being collected";
  } else if (percent < 100) {
    progressDetail.textContent = "Most of the profile is complete";
  } else {
    progressDetail.textContent = "User profile is complete";
  }
}

function createQuestionRecord(text, locked = false) {
  return {
    id: `question-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text,
    locked
  };
}

function ensureMandatoryQuestions() {
  const mandatorySet = new Set(mandatoryQuestions);
  const existingTexts = new Set();

  state.interview.questions = state.interview.questions.filter((question) => {
    if (mandatorySet.has(question.text)) {
      existingTexts.add(question.text);
      return true;
    }
    return true;
  });

  mandatoryQuestions.forEach((question) => {
    if (!existingTexts.has(question)) {
      state.interview.questions.push(createQuestionRecord(question, true));
    }
  });

  const nonMandatory = state.interview.questions.filter((question) => !mandatorySet.has(question.text));
  const mandatory = state.interview.questions.filter((question) => mandatorySet.has(question.text));
  state.interview.questions = [...nonMandatory, ...mandatory];
}

function renderObservationTable() {
  const tableBody = document.getElementById("observation-table-body");
  if (!tableBody) return;

  if (!state.observations.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No observations have been added yet. Use the form above to record activity patterns.</td>
      </tr>
    `;
    return;
  }

  const sortedEntries = [...state.observations].sort((a, b) => {
    const first = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`);
    const second = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`);
    return second - first;
  });

  tableBody.innerHTML = sortedEntries
    .map(
      (entry) => `
        <tr>
          <td>${entry.date || "-"}</td>
          <td>${entry.time || "-"}</td>
          <td>${entry.activity || "-"}</td>
          <td>${entry.room || "-"}</td>
          <td>${entry.duration || "-"}</td>
          <td>${entry.finding || "-"}</td>
          <td>${entry.photo ? `<a href="${entry.photo}" target="_blank" rel="noreferrer">Open</a>` : "-"}</td>
        </tr>
      `
    )
    .join("");
}

function renderInterviewCategories() {
  const container = document.getElementById("interview-categories");
  if (!container) return;

  container.innerHTML = Object.entries(interviewQuestionLibrary)
    .map(
      ([category, questions]) => `
        <div class="category-block">
          <h5>${category}</h5>
          <div class="category-options">
            ${questions
              .map(
                (question) => `
                  <div class="suggested-question-row">
                    <span>${escapeHtml(question)}</span>
                    <button type="button" class="secondary-btn small-btn add-question-button" data-question="${escapeHtml(question)}">Add question</button>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".add-question-button").forEach((button) => {
    button.addEventListener("click", () => {
      addInterviewQuestion(button.dataset.question);
    });
  });
}

function renderInterviewLog() {
  const container = document.getElementById("interview-log");
  if (!container) return;

  const entries = Array.isArray(state.interview.log) ? state.interview.log : [];

  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">No interview answers logged yet.</p>';
    return;
  }

  container.innerHTML = entries
    .map(
      (entry) => `
        <div class="interview-log-item">
          <strong>${escapeHtml(entry.question)}</strong>
          <span>${escapeHtml(entry.answer)}</span>
          <small>${escapeHtml(entry.date)}</small>
        </div>
      `
    )
    .join("");
}

function logInterviewAnswer(questionId, value) {
  const question = state.interview.questions.find((item) => item.id === questionId);
  const trimmed = String(value || "").trim();
  if (!question || !trimmed) return;

  const entry = {
    questionId,
    id: Date.now(),
    question: question.text,
    answer: trimmed,
    date: new Date().toLocaleString()
  };

  const existingIndex = (state.interview.log || []).findIndex((item) => item.questionId === questionId);
  if (existingIndex >= 0) {
    state.interview.log[existingIndex] = entry;
  } else {
    state.interview.log = [entry, ...(state.interview.log || [])];
  }
}

function renderInterviewQuestions() {
  const container = document.getElementById("interview-question-list");
  if (!container) return;

  ensureMandatoryQuestions();

  if (!state.interview.questions.length) {
    container.innerHTML = '<p class="empty-state">No interview questions selected yet.</p>';
    renderInterviewLog();
    return;
  }

  container.innerHTML = state.interview.questions
    .map((question, index) => {
      const answer = state.interview.answers[question.id] || "";
      return `
        <div class="question-item ${question.locked ? "locked" : ""}">
          <div class="question-header">
            <strong>${index + 1}. ${question.text}</strong>
            ${
              question.locked
                ? '<span class="mandatory-tag">Mandatory</span>'
                : `
                  <div class="question-actions">
                    <button type="button" class="mini-btn" data-action="move-up" data-question-id="${question.id}">↑</button>
                    <button type="button" class="mini-btn" data-action="move-down" data-question-id="${question.id}">↓</button>
                    <button type="button" class="mini-btn danger" data-action="delete-question" data-question-id="${question.id}">Delete</button>
                  </div>
                `
            }
          </div>
          <textarea data-question-id="${question.id}" class="question-answer" rows="3" placeholder="Write the participant's answer here...">${answer}</textarea>
          <button type="button" class="primary-btn small-btn save-answer" data-question-id="${question.id}">Save answer</button>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-action='move-up']").forEach((button) => {
    button.addEventListener("click", () => moveInterviewQuestion(button.dataset.questionId, -1));
  });

  container.querySelectorAll("[data-action='move-down']").forEach((button) => {
    button.addEventListener("click", () => moveInterviewQuestion(button.dataset.questionId, 1));
  });

  container.querySelectorAll("[data-action='delete-question']").forEach((button) => {
    button.addEventListener("click", () => deleteInterviewQuestion(button.dataset.questionId));
  });

  container.querySelectorAll(".question-answer").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const questionId = textarea.dataset.questionId;
      const value = textarea.value;
      state.interview.answers[questionId] = value;
      saveProject();
    });
  });

  container.querySelectorAll(".save-answer").forEach((button) => {
    button.addEventListener("click", () => {
      const questionId = button.dataset.questionId;
      const textarea = container.querySelector(`[data-question-id="${questionId}"].question-answer`);
      if (!textarea || !textarea.value.trim()) {
        alert("Write an answer before saving it.");
        return;
      }
      state.interview.answers[questionId] = textarea.value;
      logInterviewAnswer(questionId, textarea.value);
      saveProject();
      renderInterviewLog();
    });
  });

  renderInterviewLog();
}

function renderProjectSummary() {
  const container = document.getElementById("project-summary-content");
  if (!container) return;

  const profile = state.profile;
  const furniture = [...(profile.existingFurniture || []), profile.existingFurnitureCustom].filter(Boolean).join(", ");
  const profileItems = [
    ["Name", profile.name],
    ["Occupation", profile.occupation],
    ["Interests", profile.interests],
    ["Household size", profile.householdSize],
    ["Devices", profile.devices],
    ["Existing furniture", furniture]
  ];
  const summaryCards = [
    { title: "User profile", target: "user-profile", count: profileItems.filter((item) => item[1]).length, items: profileItems },
    { title: "Observations", target: "observation-log", count: state.observations.length, items: state.observations.slice(-5).map((item) => [item.activity || "Observation", item.finding || item.room || "No finding added"]) },
    { title: "Interview answers", target: "interview", count: (state.interview.log || []).length, items: (state.interview.log || []).slice(0, 5).map((item) => [item.question, item.answer]) },
    { title: "Inventory", target: "inventory", count: state.inventory.length, items: state.inventory.slice(-5).map((item) => [item.name, `${item.quantity || 1} ${item.category || "item"}`]) },
    { title: "Site survey", target: "site-survey", count: state.siteSurvey.length, items: state.siteSurvey.slice(-5).map((item) => [item.name, item.dimensions || item.area || "No dimensions added"]) },
    { title: "Photos", target: "photos", count: state.photos.length, items: state.photos.slice(-5).map((item) => [item.location || "Photo", item.caption || item.category || "No caption added"]) },
    { title: "Spatial studies", target: "bubble-diagram", count: (state.analysis.bubbleNodes || []).length + (state.floorPlan || []).length, items: [
      ["Bubble diagram", `${(state.analysis.bubbleNodes || []).length} bubbles`],
      ["Block plan", `${(state.floorPlan || []).length} items`]
    ] },
    { title: "Findings & conclusion", target: "findings", count: [state.analysis.findings.keyFindings, state.analysis.findings.constraints, state.analysis.findings.opportunities, state.analysis.findings.recommendations, state.analysis.conclusion.summary, state.analysis.conclusion.recommendation].filter((value) => String(value || "").trim()).length, items: [
      ["Key findings", state.analysis.findings.keyFindings],
      ["Constraints", state.analysis.findings.constraints],
      ["Opportunities", state.analysis.findings.opportunities],
      ["Conclusion", state.analysis.conclusion.summary],
      ["Design direction", state.analysis.conclusion.recommendation]
    ].filter((item) => String(item[1] || "").trim()) }
  ];

  container.innerHTML = summaryCards.map((card) => `
    <article class="summary-card" data-summary-target="${card.target || ""}" tabindex="0" role="link">
      <div class="summary-card-heading">
        <h4>${escapeHtml(card.title)}</h4>
        <strong>${card.count}</strong>
      </div>
      ${card.items.length ? `<dl>${card.items.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : '<p class="empty-state">Nothing logged yet.</p>'}
    </article>
  `).join("");

  container.querySelectorAll("[data-summary-target]").forEach((card) => {
    const openTarget = () => {
      const target = document.getElementById(card.dataset.summaryTarget);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    card.addEventListener("click", openTarget);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTarget();
      }
    });
  });
}

function addInterviewQuestion(questionText) {
  const value = String(questionText || "").trim();
  if (!value) return;

  const alreadyExists = state.interview.questions.some((question) => question.text === value);
  if (alreadyExists) return;

  state.interview.questions.push(createQuestionRecord(value, false));
  saveProject();
  renderInterviewQuestions();
}

function addCustomInterviewQuestion() {
  const input = document.getElementById("custom-question-input");
  const value = input.value.trim();

  if (!value) return;

  const exists = state.interview.questions.some((question) => question.text === value);
  if (!exists) {
    state.interview.questions.push(createQuestionRecord(value, false));
  }

  input.value = "";
  saveProject();
  renderInterviewQuestions();
}

function moveInterviewQuestion(questionId, direction) {
  const index = state.interview.questions.findIndex((question) => question.id === questionId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.interview.questions.length) return;

  const items = [...state.interview.questions];
  const [movedItem] = items.splice(index, 1);
  items.splice(targetIndex, 0, movedItem);
  state.interview.questions = items;
  saveProject();
  renderInterviewQuestions();
}

function deleteInterviewQuestion(questionId) {
  const target = state.interview.questions.find((question) => question.id === questionId);
  if (!target || target.locked) return;

  state.interview.questions = state.interview.questions.filter((question) => question.id !== questionId);
  delete state.interview.answers[questionId];
  saveProject();
  renderInterviewQuestions();
}

function renderInventoryTable() {
  const tableBody = document.getElementById("inventory-table-body");
  if (!tableBody) return;

  if (!state.inventory.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">No furniture or equipment has been added yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = state.inventory
    .map(
      (item) => `
        <tr>
          <td>${item.name || "-"}</td>
          <td>${item.category || "-"}</td>
          <td>${item.quantity || "-"}</td>
          <td>${item.room || "-"}</td>
          <td>${item.dimensions || "-"}</td>
          <td>${item.condition || "-"}</td>
          <td>${item.reuse || "-"}</td>
          <td>${item.notes || "-"}</td>
        </tr>
      `
    )
    .join("");
}

function renderSiteSurveyTable() {
  const tableBody = document.getElementById("site-survey-table-body");
  if (!tableBody) return;

  if (!state.siteSurvey.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">No site survey entries have been saved yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = state.siteSurvey
    .map(
      (room) => `
        <tr>
          <td>${room.name || "-"}</td>
          <td>${room.dimensions || "-"}</td>
          <td>${room.area || "-"}</td>
          <td>${room.doors || "-"}</td>
          <td>${room.windows || "-"}</td>
          <td>${room.lighting || "-"}</td>
          <td>${room.ventilation || "-"}</td>
          <td>${room.noise || "-"}</td>
          <td><button type="button" class="secondary-btn small-btn edit-site-survey" data-room-id="${room.id}">Edit</button></td>
        </tr>
      `
    )
    .join("");

  tableBody.querySelectorAll(".edit-site-survey").forEach((button) => {
    button.addEventListener("click", () => editSiteSurvey(button.dataset.roomId));
  });
}

function editSiteSurvey(roomId) {
  const room = state.siteSurvey.find((item) => String(item.id) === String(roomId));
  if (!room) return;

  editingSiteSurveyId = String(room.id);
  const fields = {
    "site-room-name": room.name,
    "site-dimensions": room.dimensions,
    "site-area": room.area,
    "site-doors": room.doors,
    "site-windows": room.windows,
    "site-stairs": room.stairs,
    "site-ceiling": room.ceiling,
    "site-lighting": room.lighting,
    "site-ventilation": room.ventilation,
    "site-noise": room.noise,
    "site-views": room.views,
    "site-observations": room.observations,
    "site-outlets": room.outlets,
    "site-plumbing": room.plumbing,
    "site-mechanical": room.mechanical,
    "site-router": room.router,
    "site-builtins": room.builtIns
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value ?? "";
  });

  const form = document.getElementById("site-survey-form");
  const submitButton = form ? form.querySelector("button[type='submit']") : null;
  const cancelButton = document.getElementById("cancel-site-survey-edit");
  if (submitButton) submitButton.textContent = "Update room survey";
  if (cancelButton) cancelButton.hidden = false;
  form?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelSiteSurveyEdit() {
  editingSiteSurveyId = null;
  const form = document.getElementById("site-survey-form");
  const submitButton = form ? form.querySelector("button[type='submit']") : null;
  const cancelButton = document.getElementById("cancel-site-survey-edit");
  form?.reset();
  if (submitButton) submitButton.textContent = "Add room survey";
  if (cancelButton) cancelButton.hidden = true;
}

function renderPhotoGallery() {
  const gallery = document.getElementById("photo-gallery");
  if (!gallery) return;

  if (!state.photos.length) {
    gallery.innerHTML = '<p class="empty-state">No photos have been added yet. Add images to build a report-ready gallery.</p>';
    return;
  }

  gallery.innerHTML = state.photos
    .map(
      (photo) => `
        <figure class="photo-card">
          <img src="${photo.url}" alt="${photo.caption || "Project photo"}" />
          <figcaption>
            <strong>${photo.location || "Unknown location"}</strong>
            <span>${photo.category || "Photo"}</span>
            <small>${photo.caption || "No caption added."}</small>
          </figcaption>
        </figure>
      `
    )
    .join("");
}

// Shared "spaces" registry: a room/space added in the Floor Plan, Bubble Diagram,
// or Proximity Matrix is kept in sync across all three via this single list.
function generateSpaceId() {
  return `space-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function ensureSpacesRegistry() {
  if (!Array.isArray(state.analysis.spaces)) {
    state.analysis.spaces = [];
  }

  // Backfill spaces for older saved projects that only had bubble nodes / floor plan rooms.
  (state.analysis.bubbleNodes || []).forEach((node) => {
    if (!node.spaceId) {
      const existing = state.analysis.spaces.find((space) => space.name === node.name);
      node.spaceId = existing ? existing.id : generateSpaceId();
    }
    if (!state.analysis.spaces.some((space) => space.id === node.spaceId)) {
      state.analysis.spaces.push({ id: node.spaceId, name: node.name || "Space" });
    }
  });

  (state.floorPlan || []).forEach((room) => {
    if (room.isFurniture) return;
    if (!room.spaceId) {
      const existing = state.analysis.spaces.find((space) => space.name === room.name);
      room.spaceId = existing ? existing.id : generateSpaceId();
    }
    if (!state.analysis.spaces.some((space) => space.id === room.spaceId)) {
      state.analysis.spaces.push({ id: room.spaceId, name: room.name || "Room" });
    }
  });
}

function removeLegacyExampleSpaces() {
  const nodes = state.analysis.bubbleNodes || [];
  const legacyNodes = nodes.filter((node) => legacyExampleSpaceNames.has(node.name));
  const legacySpaceIds = new Set(legacyNodes.map((node) => node.spaceId).filter(Boolean));
  const hasLegacySpace = (state.analysis.spaces || []).some((space) => legacyExampleSpaceNames.has(space.name));
  const hasLegacyRoom = (state.floorPlan || []).some((room) => legacyExampleSpaceNames.has(room.name));
  if (!legacyNodes.length && !hasLegacySpace && !hasLegacyRoom) return false;

  state.analysis.bubbleNodes = nodes.filter((node) => !legacyExampleSpaceNames.has(node.name));
  state.analysis.spaces = (state.analysis.spaces || []).filter((space) => {
    return !legacySpaceIds.has(space.id) && !legacyExampleSpaceNames.has(space.name);
  });
  state.floorPlan = (state.floorPlan || []).filter((room) => !legacySpaceIds.has(room.spaceId) && !legacyExampleSpaceNames.has(room.name));
  state.analysis.bubbleLinks = (state.analysis.bubbleLinks || []).filter((link) => {
    return state.analysis.bubbleNodes.some((node) => node.id === link.from) && state.analysis.bubbleNodes.some((node) => node.id === link.to);
  });
  return true;
}

// Adds a space and auto-creates the matching Bubble Diagram node + Floor Plan room.
function addSpace(name, options = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;

  ensureSpacesRegistry();

  const spaceId = generateSpaceId();
  state.analysis.spaces.push({ id: spaceId, name: trimmed });

  if (!Array.isArray(state.analysis.bubbleNodes)) state.analysis.bubbleNodes = [];
  const bubbleIndex = state.analysis.bubbleNodes.length;
  const bubbleId = `bubble-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  state.analysis.bubbleNodes.push({
    id: bubbleId,
    spaceId,
    name: trimmed,
    x: 120 + (bubbleIndex % 3) * 150,
    y: 70 + Math.floor(bubbleIndex / 3) * 120,
    size: 88
  });
  selectedBubbleId = bubbleId;

  if (!Array.isArray(state.floorPlan)) state.floorPlan = [];
  state.floorPlan.push({
    id: Date.now() + Math.floor(Math.random() * 10000),
    name: trimmed,
    spaceId,
    x: clamp(options.x ?? 80, 40, 900),
    y: clamp(options.y ?? 80, 40, 620),
    width: enforceMinimumDimension(options.width ?? 180, 80),
    height: enforceMinimumDimension(options.height ?? 140, 80),
    isFurniture: false
  });

  saveProject();
  return spaceId;
}

// Renames a space everywhere it's referenced (space registry, bubble node, floor plan room).
function renameSpace(spaceId, newName) {
  if (!spaceId) return;
  const trimmed = String(newName || "").trim();
  if (!trimmed) return;

  ensureSpacesRegistry();
  const space = state.analysis.spaces.find((item) => item.id === spaceId);
  if (space) space.name = trimmed;

  (state.analysis.bubbleNodes || []).forEach((node) => {
    if (node.spaceId === spaceId) node.name = trimmed;
  });
  (state.floorPlan || []).forEach((room) => {
    if (room.spaceId === spaceId) room.name = trimmed;
  });

  saveProject();
}

// Removes a space and cascades the deletion to its bubble node, floor plan room, links, and matrix cells.
function deleteSpace(spaceId) {
  if (!spaceId) return;

  const removedNodeIds = (state.analysis.bubbleNodes || [])
    .filter((node) => node.spaceId === spaceId)
    .map((node) => node.id);

  state.analysis.spaces = (state.analysis.spaces || []).filter((space) => space.id !== spaceId);
  state.analysis.bubbleNodes = (state.analysis.bubbleNodes || []).filter((node) => node.spaceId !== spaceId);
  state.analysis.bubbleLinks = (state.analysis.bubbleLinks || []).filter(
    (link) => !removedNodeIds.includes(link.from) && !removedNodeIds.includes(link.to)
  );
  state.floorPlan = (state.floorPlan || []).filter((room) => room.spaceId !== spaceId);

  const matrix = state.analysis.proximityMatrix || {};
  Object.keys(matrix).forEach((key) => {
    if (key.split("::").includes(spaceId)) {
      delete matrix[key];
    }
  });

  if (selectedBubbleId && removedNodeIds.includes(selectedBubbleId)) {
    selectedBubbleId = state.analysis.bubbleNodes[0]?.id || null;
  }
  if (pendingConnectFromId && removedNodeIds.includes(pendingConnectFromId)) {
    pendingConnectFromId = null;
  }
  if (selectedFloorPlanItemId && !state.floorPlan.some((room) => String(room.id) === selectedFloorPlanItemId)) {
    selectedFloorPlanItemId = null;
  }

  saveProject();
}

function ensureBubbleNodes() {
  const removedExamples = removeLegacyExampleSpaces();
  ensureSpacesRegistry();

  if (!Array.isArray(state.analysis.bubbleNodes) || !state.analysis.bubbleNodes.length) {
    state.analysis.bubbleNodes = [];
    selectedBubbleId = null;
  }

  if (!Array.isArray(state.analysis.bubbleLinks)) {
    state.analysis.bubbleLinks = [];
  }
  state.analysis.bubbleLinks = state.analysis.bubbleLinks.map(normalizeBubbleLink);

  if (removedExamples) saveProject();
}

function addBubbleNode(name) {
  addSpace(name);
  renderAllProjectViews();
}

function deleteSelectedBubbleNode() {
  if (!selectedBubbleId || !Array.isArray(state.analysis.bubbleNodes)) return;

  const node = state.analysis.bubbleNodes.find((item) => item.id === selectedBubbleId);
  if (!node) return;

  deleteSpace(node.spaceId);
  renderAllProjectViews();
}

function buildBubbleDiagramLayout() {
  ensureBubbleNodes();
  const nodes = state.analysis.bubbleNodes;
  const lines = (state.analysis.bubbleLinks || [])
    .map((link) => {
      const from = nodes.find((node) => node.id === link.from);
      const to = nodes.find((node) => node.id === link.to);
      if (!from || !to) return "";

      const x1 = from.x + from.size / 2;
      const y1 = from.y + from.size / 2;
      const x2 = to.x + to.size / 2;
      const y2 = to.y + to.size / 2;
      const dashArray = link.style === "dashed" ? "14 8" : link.style === "dotted" ? "1 8" : "";

      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeHtml(link.color)}" stroke-width="${link.width}" stroke-linecap="round" ${dashArray ? `stroke-dasharray="${dashArray}"` : ""} data-link-id="${link.id}" />`;
    })
    .join("");

  const nodeMarkup = nodes
    .map((node) => `
      <div class="bubble-node ${selectedBubbleId === node.id ? "selected" : ""} ${pendingConnectFromId === node.id ? "connect-pending" : ""}" data-node-id="${node.id}" style="left:${node.x}px; top:${node.y}px; width:${node.size}px; height:${node.size}px;">
        <span class="bubble-label">${escapeHtml(node.name)}</span>
        <button type="button" class="bubble-edit" data-node-id="${node.id}" aria-label="Edit bubble name">✎</button>
        <span class="bubble-resize" data-resize-id="${node.id}" aria-label="Resize node"></span>
      </div>
    `)
    .join("");

  return `
    <svg class="bubble-lines" viewBox="0 0 700 360" preserveAspectRatio="none" aria-hidden="true">
      ${lines}
    </svg>
    ${nodeMarkup}
  `;
}

// Redraws just the SVG lines touching a node while it's being dragged/resized, so connections keep following live.
function updateConnectedLinePositions(board, nodeId) {
  const nodes = state.analysis.bubbleNodes || [];
  const relatedLinks = (state.analysis.bubbleLinks || []).filter(
    (link) => link.from === nodeId || link.to === nodeId
  );

  relatedLinks.forEach((link) => {
    const lineElement = board.querySelector(`.bubble-lines line[data-link-id="${link.id}"]`);
    if (!lineElement) return;

    const fromNode = nodes.find((item) => item.id === link.from);
    const toNode = nodes.find((item) => item.id === link.to);
    if (!fromNode || !toNode) return;

    lineElement.setAttribute("x1", fromNode.x + fromNode.size / 2);
    lineElement.setAttribute("y1", fromNode.y + fromNode.size / 2);
    lineElement.setAttribute("x2", toNode.x + toNode.size / 2);
    lineElement.setAttribute("y2", toNode.y + toNode.size / 2);
  });
}

// Ensures every saved link has an id/width/style/color, defaulting older data.
function normalizeBubbleLink(link) {
  return {
    id: link.id || `link-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    from: link.from,
    to: link.to,
    width: Number.isFinite(Number(link.width)) ? clamp(Number(link.width), 1, 10) : 2,
    style: ["solid", "dashed", "dotted"].includes(link.style) ? link.style : "solid",
    color: typeof link.color === "string" && link.color ? link.color : "#5e8f6e"
  };
}

function addBubbleLink(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  if (!Array.isArray(state.analysis.bubbleLinks)) state.analysis.bubbleLinks = [];

  const alreadyLinked = state.analysis.bubbleLinks.some(
    (link) => (link.from === fromId && link.to === toId) || (link.from === toId && link.to === fromId)
  );
  if (alreadyLinked) return;

  const widthInput = document.getElementById("bubble-line-width");
  const styleInput = document.getElementById("bubble-line-style");
  const colorInput = document.getElementById("bubble-line-color");

  state.analysis.bubbleLinks.push(
    normalizeBubbleLink({
      from: fromId,
      to: toId,
      width: widthInput ? widthInput.value : 2,
      style: styleInput ? styleInput.value : "solid",
      color: colorInput ? colorInput.value : "#5e8f6e"
    })
  );

  saveProject();
  renderBubbleDiagram();
}

function updateBubbleLink(linkId, patch) {
  const link = (state.analysis.bubbleLinks || []).find((item) => item.id === linkId);
  if (!link) return;

  Object.assign(link, patch);
  saveProject();
  renderBubbleDiagram();
}

function deleteBubbleLink(linkId) {
  state.analysis.bubbleLinks = (state.analysis.bubbleLinks || []).filter((link) => link.id !== linkId);
  saveProject();
  renderBubbleDiagram();
}

function renderBubbleConnectionsList() {
  const container = document.getElementById("bubble-connections-list");
  if (!container) return;

  const nodes = state.analysis.bubbleNodes || [];
  const links = state.analysis.bubbleLinks || [];

  if (!links.length) {
    container.innerHTML = '<p class="empty-state">No connections yet. Turn on Connect mode, then click one bubble and then another to draw a line.</p>';
    return;
  }

  container.innerHTML = links
    .map((link) => {
      const fromNode = nodes.find((node) => node.id === link.from);
      const toNode = nodes.find((node) => node.id === link.to);
      const label = `${escapeHtml(fromNode ? fromNode.name : "?")} \u2192 ${escapeHtml(toNode ? toNode.name : "?")}`;

      return `
        <div class="bubble-connection-row" data-link-id="${link.id}">
          <span class="bubble-connection-label">${label}</span>
          <input type="color" class="link-color-input" data-link-id="${link.id}" value="${link.color}" title="Line color" />
          <input type="number" min="1" max="10" class="link-width-input" data-link-id="${link.id}" value="${link.width}" title="Line width" />
          <select class="link-style-input" data-link-id="${link.id}" title="Line style">
            <option value="solid" ${link.style === "solid" ? "selected" : ""}>Solid</option>
            <option value="dashed" ${link.style === "dashed" ? "selected" : ""}>Dashed</option>
            <option value="dotted" ${link.style === "dotted" ? "selected" : ""}>Dotted</option>
          </select>
          <button type="button" class="danger-btn small-btn link-delete-btn" data-link-id="${link.id}">Delete</button>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".link-color-input").forEach((input) => {
    input.addEventListener("change", () => updateBubbleLink(input.dataset.linkId, { color: input.value }));
  });
  container.querySelectorAll(".link-width-input").forEach((input) => {
    input.addEventListener("change", () => updateBubbleLink(input.dataset.linkId, { width: clamp(Number(input.value) || 2, 1, 10) }));
  });
  container.querySelectorAll(".link-style-input").forEach((select) => {
    select.addEventListener("change", () => updateBubbleLink(select.dataset.linkId, { style: select.value }));
  });
  container.querySelectorAll(".link-delete-btn").forEach((button) => {
    button.addEventListener("click", () => deleteBubbleLink(button.dataset.linkId));
  });
}

function renameBubbleNode(nodeId, newName) {
  const node = state.analysis.bubbleNodes.find((item) => item.id === nodeId);
  if (!node) return;

  renameSpace(node.spaceId, newName);
  renderAllProjectViews();
}

function renderBubbleDiagram() {
  const container = document.getElementById("bubble-diagram-output");
  if (!container) return;

  const title = document.getElementById("bubble-diagram-title");
  if (title) title.value = state.analysis.bubbleTitle || "";

  ensureBubbleNodes();
  container.innerHTML = `
    <div class="bubble-diagram-board">
      ${buildBubbleDiagramLayout()}
    </div>
  `;

  renderBubbleConnectionsList();

  const connectToggle = document.getElementById("bubble-connect-toggle");
  if (connectToggle) {
    connectToggle.textContent = bubbleConnectMode ? "\ud83d\udd17 Connect mode: On (click two bubbles)" : "\ud83d\udd17 Connect mode: Off";
    connectToggle.classList.toggle("active", bubbleConnectMode);
  }

  const board = container.querySelector(".bubble-diagram-board");
  if (!board) return;

  let bubbleInteraction = null;

  board.querySelectorAll(".bubble-node").forEach((nodeElement) => {
    const nodeId = nodeElement.dataset.nodeId;
    const node = state.analysis.bubbleNodes.find((item) => item.id === nodeId);
    if (!node) return;

    const updateSelectedState = () => {
      board.querySelectorAll(".bubble-node").forEach((element) => {
        const isSelected = element.dataset.nodeId === selectedBubbleId;
        element.classList.toggle("selected", isSelected);
      });
    };

    nodeElement.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".bubble-edit") || event.target.closest(".bubble-resize")) {
        return;
      }

      if (bubbleConnectMode) {
        event.preventDefault();
        if (!pendingConnectFromId) {
          pendingConnectFromId = nodeId;
        } else if (pendingConnectFromId !== nodeId) {
          addBubbleLink(pendingConnectFromId, nodeId);
          pendingConnectFromId = null;
          return;
        } else {
          pendingConnectFromId = null;
        }
        renderBubbleDiagram();
        return;
      }

      selectedBubbleId = nodeId;
      updateSelectedState();
      bubbleInteraction = {
        id: nodeId,
        mode: "move",
        startX: event.clientX,
        startY: event.clientY,
        originX: node.x,
        originY: node.y
      };
      event.preventDefault();
    });

    const editButton = nodeElement.querySelector(".bubble-edit");
    if (editButton) {
      editButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedBubbleId = nodeId;
        updateSelectedState();
        const nextName = window.prompt("Edit bubble label", node.name);
        if (nextName !== null) renameBubbleNode(nodeId, nextName);
      });
    }

    const resizeHandle = nodeElement.querySelector(".bubble-resize");
    if (resizeHandle) {
      resizeHandle.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        selectedBubbleId = nodeId;
        updateSelectedState();
        bubbleInteraction = {
          id: nodeId,
          mode: "resize",
          startX: event.clientX,
          startY: event.clientY,
          originSize: node.size
        };
      });
    }
  });

  board.onpointermove = (event) => {
    if (!bubbleInteraction) return;
    const node = state.analysis.bubbleNodes.find((item) => item.id === bubbleInteraction.id);
    if (!node) return;

    const dx = event.clientX - bubbleInteraction.startX;
    const dy = event.clientY - bubbleInteraction.startY;

    if (bubbleInteraction.mode === "move") {
      node.x = clamp(bubbleInteraction.originX + dx * 0.85, 12, 560);
      node.y = clamp(bubbleInteraction.originY + dy * 0.85, 12, 260);
    } else {
      node.size = clamp(bubbleInteraction.originSize + Math.max(dx, dy) * 0.9, 54, 180);
    }

    const nodeElement = board.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeElement) {
      nodeElement.style.left = `${node.x}px`;
      nodeElement.style.top = `${node.y}px`;
      nodeElement.style.width = `${node.size}px`;
      nodeElement.style.height = `${node.size}px`;
    }

    updateConnectedLinePositions(board, node.id);

    saveProject();
  };

  board.onpointerup = () => {
    bubbleInteraction = null;
    saveProject();
  };

  board.onpointerleave = () => {
    if (!bubbleInteraction) return;
    bubbleInteraction = null;
    saveProject();
  };
}

function normalizeMatrixValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(2, Math.round(numeric)));
}

// Stable, order-independent key so deleting/reordering spaces can't corrupt unrelated cells.
function matrixKey(idA, idB) {
  return [idA, idB].sort().join("::");
}

// One-time upgrade of older projects that stored matrix cells by row/col index.
function migrateProximityMatrixKeys() {
  const spaces = state.analysis.spaces || [];
  const matrix = state.analysis.proximityMatrix || {};
  const oldKeyPattern = /^\d+-\d+$/;
  const oldKeys = Object.keys(matrix).filter((key) => oldKeyPattern.test(key));
  if (!oldKeys.length) return;

  oldKeys.forEach((key) => {
    const [rowIndex, colIndex] = key.split("-").map(Number);
    const rowSpace = spaces[rowIndex];
    const colSpace = spaces[colIndex];
    if (rowSpace && colSpace) {
      matrix[matrixKey(rowSpace.id, colSpace.id)] = matrix[key];
    }
    delete matrix[key];
  });
}

function buildProximityMatrix() {
  ensureSpacesRegistry();
  migrateProximityMatrixKeys();

  const spaces = state.analysis.spaces || [];
  const matrix = state.analysis.proximityMatrix || {};

  const addSpaceForm = `
    <div class="matrix-add-space-row">
      <input type="text" id="matrix-add-space-input" placeholder="Add a space" />
      <button type="button" id="matrix-add-space-btn" class="primary-btn small-btn">Add space</button>
    </div>
  `;

  if (!spaces.length) {
    return `${addSpaceForm}<p class="empty-state">No spaces yet. Add one above, or from the Bubble Diagram / Block Plan.</p>`;
  }

  const legend = `
    <div class="proximity-legend">
      <span><strong>white</strong> = no relation</span>
      <span><strong>grey</strong> = weak relation</span>
      <span><strong>black</strong> = strong relation</span>
    </div>
  `;

  const headerCells = spaces
    .map((space) => `<div class="triangle-header-cell">${escapeHtml(space.name)}</div>`)
    .join("");

  const rows = spaces
    .map((rowSpace, rowIndex) => {
      const cells = spaces
        .map((colSpace, colIndex) => {
          if (colIndex <= rowIndex) {
            return `<div class="triangle-placeholder"></div>`;
          }

          const key = matrixKey(rowSpace.id, colSpace.id);
          const value = normalizeMatrixValue(matrix[key]);
          const classes = `triangle-cell matrix-${value === 0 ? "white" : value === 1 ? "grey" : "black"}`;
          return `<button type="button" class="${classes}" data-matrix-key="${key}" title="${escapeHtml(rowSpace.name)} / ${escapeHtml(colSpace.name)}" aria-label="${escapeHtml(rowSpace.name)} and ${escapeHtml(colSpace.name)} adjacency">
            ${value === 0 ? "" : value === 1 ? "•" : "■"}
          </button>`;
        })
        .join("");

      return `
        <div class="triangle-row">
          <div class="triangle-row-label">
            <span class="triangle-row-label-text">${escapeHtml(rowSpace.name)}</span>
            <button type="button" class="matrix-delete-space" data-space-id="${rowSpace.id}" title="Delete ${escapeHtml(rowSpace.name)}" aria-label="Delete ${escapeHtml(rowSpace.name)}">×</button>
          </div>
          ${cells}
        </div>
      `;
    })
    .join("");

  return `
    ${addSpaceForm}
    ${legend}
    <div class="proximity-triangle" style="--triangle-columns:${spaces.length};">
      <div class="triangle-row triangle-header-row">
        <div class="triangle-header-spacer"></div>
        ${headerCells}
      </div>
      ${rows}
    </div>
  `;
}

function renderProximityMatrix() {
  const container = document.getElementById("proximity-matrix-table");
  if (!container) return;
  container.innerHTML = buildProximityMatrix();

  container.querySelectorAll(".triangle-cell").forEach((cell) => {
    const key = cell.dataset.matrixKey;
    if (!key) return;

    const applyNextState = (event) => {
      const current = normalizeMatrixValue(state.analysis.proximityMatrix[key]);
      const next = current === 0 ? 1 : current === 1 ? 2 : 0;
      state.analysis.proximityMatrix[key] = String(next);
      cell.className = `triangle-cell matrix-${next === 0 ? "white" : next === 1 ? "grey" : "black"}`;
      cell.textContent = next === 0 ? "" : next === 1 ? "•" : "■";
      saveProject();
      if (event && event.type === "keydown") {
        event.preventDefault();
      }
    };

    cell.addEventListener("click", applyNextState);
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        applyNextState(event);
      }
    });
  });

  const addButton = container.querySelector("#matrix-add-space-btn");
  const addInput = container.querySelector("#matrix-add-space-input");
  if (addButton && addInput) {
    const submitNewSpace = () => {
      const value = addInput.value.trim();
      if (!value) return;
      addSpace(value);
      renderAllProjectViews();
    };

    addButton.addEventListener("click", submitNewSpace);
    addInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitNewSpace();
      }
    });
  }

  container.querySelectorAll(".matrix-delete-space").forEach((button) => {
    button.addEventListener("click", () => {
      const spaceId = button.dataset.spaceId;
      if (!spaceId) return;
      const space = (state.analysis.spaces || []).find((item) => item.id === spaceId);
      const label = space ? space.name : "this space";
      if (!confirm(`Delete "${label}"? This also removes it from the Bubble Diagram and Block Plan.`)) return;
      deleteSpace(spaceId);
      renderAllProjectViews();
    });
  });
}

function renderDataVisualization() {
  const container = document.getElementById("visualization-chart");
  if (!container) return;

  const activityCounts = {};
  const roomCounts = {};
  const durationTotals = {};

  state.observations.forEach((entry) => {
    const activity = entry.activity || "Unspecified";
    const room = entry.room || "Unknown";
    const durationText = String(entry.duration || "0");
    const durationNumber = Number.parseFloat(durationText.replace(/[^\d.]/g, "")) || 0;

    activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    roomCounts[room] = (roomCounts[room] || 0) + 1;
    durationTotals[room] = (durationTotals[room] || 0) + durationNumber;
  });

  const topActivities = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const roomUsage = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const longestRoomUse = Object.entries(durationTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!topActivities.length && !roomUsage.length) {
    container.innerHTML = '<p class="empty-state">No useful observation data is available yet. Add more observation entries to generate meaningful patterns.</p>';
    return;
  }

  const maxActivity = Math.max(1, ...topActivities.map(([, count]) => count));
  const maxRoom = Math.max(1, ...roomUsage.map(([, count]) => count));

  const activityMarkup = topActivities.length
    ? topActivities.map(([label, count]) => `
        <div class="bar-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / maxActivity) * 100}%"></div></div>
          <strong>${count}</strong>
        </div>
      `).join("")
    : '<p class="empty-state">No activity patterns available.</p>';

  const roomMarkup = roomUsage.length
    ? roomUsage.map(([room, count]) => `
        <div class="bar-row">
          <span>${room}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / maxRoom) * 100}%"></div></div>
          <strong>${count}</strong>
        </div>
      `).join("")
    : '<p class="empty-state">No room usage data available.</p>';

  const durationMarkup = longestRoomUse.length
    ? longestRoomUse.map(([room, duration]) => `<li><strong>${room}</strong><span>${duration.toFixed(1)} hours total</span></li>`).join("")
    : '<li class="empty-state">No duration totals available.</li>';

  container.innerHTML = `
    <div class="viz-grid">
      <div class="viz-card">
        <h5>Top activity frequency</h5>
        ${activityMarkup}
      </div>
      <div class="viz-card">
        <h5>Room usage</h5>
        ${roomMarkup}
      </div>
      <div class="viz-card">
        <h5>Longest-used rooms</h5>
        <ul class="report-list">${durationMarkup}</ul>
      </div>
    </div>
  `;
}

function renderFindingsSummary() {
  const container = document.getElementById("findings-summary");
  if (!container) return;

  const findings = state.analysis.findings || {};
  const rendered = [
    findings.keyFindings ? `<li><strong>Key findings:</strong> ${findings.keyFindings}</li>` : "",
    findings.constraints ? `<li><strong>Constraints:</strong> ${findings.constraints}</li>` : "",
    findings.opportunities ? `<li><strong>Opportunities:</strong> ${findings.opportunities}</li>` : "",
    findings.recommendations ? `<li><strong>Recommendations:</strong> ${findings.recommendations}</li>` : ""
  ].filter(Boolean).join("");

  container.innerHTML = rendered || '<p class="empty-state">No findings have been added yet.</p>';
}

function renderConclusionSummary() {
  const container = document.getElementById("conclusion-summary");
  if (!container) return;

  const conclusion = state.analysis.conclusion || {};
  const summary = [
    conclusion.summary ? `<p>${conclusion.summary}</p>` : "",
    conclusion.recommendation ? `<p><strong>Recommended direction:</strong> ${conclusion.recommendation}</p>` : ""
  ].filter(Boolean).join("");

  container.innerHTML = summary || '<p class="empty-state">No conclusion has been added yet.</p>';
}

function renderReportPreview() {
  const container = document.getElementById("report-preview-content");
  if (!container) return;

  const profile = state.profile;
  const observations = state.observations || [];
  const inventory = state.inventory || [];
  const siteSurvey = state.siteSurvey || [];
  const floorPlan = state.floorPlan || [];

  const profileSummary = [
    profile.name ? `Name: ${profile.name}` : "Name: Not yet entered",
    profile.occupation ? `Occupation: ${profile.occupation}` : "Occupation: Not yet entered",
    profile.householdSize ? `Household size: ${profile.householdSize}` : "Household size: Not yet entered",
    profile.interests ? `Interests: ${profile.interests}` : "Interests: Not yet entered"
  ].join(" | ");

  const observationSummary = observations.length
    ? observations
        .slice(0, 4)
        .map(
          (entry) => `
            <li>
              <strong>${entry.date || "Date not recorded"}</strong>
              <span>${entry.activity || "Activity not recorded"}</span>
              <small>${entry.finding || "No notable finding added."}</small>
            </li>
          `
        )
        .join("")
    : '<li class="empty-state">No observations have been recorded yet.</li>';

  const inventorySummary = inventory.length
    ? inventory
        .slice(0, 5)
        .map(
          (item) => `<li>${item.name || "Unnamed item"} — ${item.category || "Unspecified category"} (${item.quantity || 0})</li>`
        )
        .join("")
    : '<li class="empty-state">No furniture or equipment has been added yet.</li>';

  const siteSummary = siteSurvey.length
    ? siteSurvey
        .slice(0, 5)
        .map(
          (room) => `<li>${room.name || "Unnamed room"} — ${room.dimensions || "Dimensions not entered"}</li>`
        )
        .join("")
    : '<li class="empty-state">No site survey rooms have been added yet.</li>';

  const floorPlanSummary = floorPlan.length
    ? floorPlan
        .slice(0, 6)
        .map(
          (room) => `<li>${room.name || "Unnamed room"} — ${Math.round(room.width)} × ${Math.round(room.height)} mm</li>`
        )
        .join("")
    : '<li class="empty-state">No block plan items have been added yet.</li>';

  const interviewSummary = Object.values(state.interview.answers || {}).filter(Boolean).length
    ? state.interview.questions
        .filter((question) => (state.interview.answers[question.id] || "").trim())
        .slice(0, 4)
        .map(
          (question) => `
            <li>
              <strong>${question.text}</strong>
              <span>${state.interview.answers[question.id] || "No answer recorded."}</span>
            </li>
          `
        )
        .join("")
    : '<li class="empty-state">No interview answers have been added yet.</li>';

  const findingsText = state.analysis.findings?.keyFindings || "No findings entered yet.";
  const conclusionText = state.analysis.conclusion?.summary || "No conclusion entered yet.";

  container.innerHTML = `
    <article class="report-preview-paper">
      <header class="report-header">
        <div>
          <p class="eyebrow">Interior Design</p>
          <h3>Programming Report</h3>
        </div>
        <span class="badge">Draft</span>
      </header>

      <section class="report-section">
        <h4>1. Project overview</h4>
        <p>${profileSummary}</p>
      </section>

      <section class="report-section">
        <h4>2. Observation highlights</h4>
        <ul class="report-list">${observationSummary}</ul>
      </section>

      <section class="report-section">
        <h4>3. Interview responses</h4>
        <ul class="report-list">${interviewSummary}</ul>
      </section>

      <section class="report-section">
        <h4>4. Site survey summary</h4>
        <ul class="report-list">${siteSummary}</ul>
      </section>

      <section class="report-section">
        <h4>5. Furniture and equipment</h4>
        <ul class="report-list">${inventorySummary}</ul>
      </section>

      <section class="report-section">
        <h4>6. Block plan summary</h4>
        <ul class="report-list">${floorPlanSummary}</ul>
      </section>

      <section class="report-section">
        <h4>7. Findings</h4>
        <p>${findingsText}</p>
      </section>

      <section class="report-section">
        <h4>8. Conclusion</h4>
        <p>${conclusionText}</p>
      </section>
    </article>
  `;
}

function exportReportToPdf() {
  renderReportPreview();
  window.print();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function enforceMinimumDimension(value, min = 80) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return min;
  return Math.max(numericValue, min);
}

function syncFloorPlanSettings() {
  const showDimensions = document.getElementById("show-floor-dimensions");
  const furnitureSymbolsOnly = document.getElementById("furniture-symbols-only");
  const textSize = document.getElementById("floor-plan-text-size");

  if (!state.floorPlanSettings) {
    state.floorPlanSettings = { ...structuredClone(defaultState.floorPlanSettings) };
  }

  if (showDimensions) state.floorPlanSettings.showDimensions = showDimensions.checked;
  if (furnitureSymbolsOnly) state.floorPlanSettings.furnitureSymbolsOnly = furnitureSymbolsOnly.checked;
  if (textSize) state.floorPlanSettings.textSize = textSize.value;
}

function getFloorPlanDisplaySettings() {
  const settings = state.floorPlanSettings || { ...structuredClone(defaultState.floorPlanSettings) };
  const showDimensions = document.getElementById("show-floor-dimensions");
  const furnitureSymbolsOnly = document.getElementById("furniture-symbols-only");
  const textSize = document.getElementById("floor-plan-text-size");

  return {
    showDimensions: showDimensions ? showDimensions.checked : settings.showDimensions,
    furnitureSymbolsOnly: furnitureSymbolsOnly ? furnitureSymbolsOnly.checked : settings.furnitureSymbolsOnly,
    textSize: textSize ? textSize.value : settings.textSize
  };
}

function snapValue(value, increment = 10) {
  return Math.round(value / increment) * increment;
}

function getFloorPlanSvgPoint(event, svg) {
  const rect = svg.getBoundingClientRect();
  const scaleX = 1000 / rect.width;
  const scaleY = 700 / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function updateFloorPlanLabelEditor(roomId, x, y, label) {
  const editor = document.getElementById("floor-plan-label-editor");
  const input = document.getElementById("floor-plan-label-input");
  if (!editor || !input) return;

  editor.classList.remove("hidden");
  input.value = label;
  editor.style.left = `${x}px`;
  editor.style.top = `${y}px`;
  input.dataset.roomId = roomId;
  input.focus();
  input.select();
}

function hideFloorPlanLabelEditor() {
  const editor = document.getElementById("floor-plan-label-editor");
  if (editor) editor.classList.add("hidden");
}

function attachFloorPlanItemInteractions(svg) {
  if (!svg) return;

  const snapToGrid = document.getElementById("snap-to-grid");
  const snapToEdge = document.getElementById("snap-to-edge");

  svg.querySelectorAll(".floor-room-shape").forEach((group) => {
    const roomId = group.dataset.roomId;
    const room = state.floorPlan.find((item) => String(item.id) === roomId);
    if (!room) return;

    group.addEventListener("pointerdown", (event) => {
      const point = getFloorPlanSvgPoint(event, svg);
      const insideLabel = event.target && event.target.tagName === "TEXT";
      selectedFloorPlanItemId = roomId;

      if (insideLabel) {
        updateFloorPlanLabelEditor(roomId, room.x + 10, room.y + 6, room.name);
        return;
      }

      floorPlanDragState = {
        mode: "move",
        roomId,
        offsetX: point.x - room.x,
        offsetY: point.y - room.y
      };
      svg.style.cursor = "grabbing";
      event.preventDefault();
    });

    const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    handle.setAttribute("class", "floor-room-handle");
    handle.setAttribute("x", String(room.x + room.width - 16));
    handle.setAttribute("y", String(room.y + room.height - 16));
    handle.setAttribute("width", "16");
    handle.setAttribute("height", "16");
    handle.setAttribute("rx", "4");
    handle.dataset.resizeRoomId = roomId;
    group.appendChild(handle);

    handle.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      floorPlanDragState = {
        mode: "resize",
        roomId,
        startX: room.x,
        startY: room.y,
        startWidth: room.width,
        startHeight: room.height,
        pointerStartX: getFloorPlanSvgPoint(event, svg).x,
        pointerStartY: getFloorPlanSvgPoint(event, svg).y
      };
      svg.style.cursor = "nwse-resize";
      event.preventDefault();
    });
  });

  svg.onpointermove = (event) => {
    if (!floorPlanDragState) return;

    const room = state.floorPlan.find((item) => String(item.id) === floorPlanDragState.roomId);
    if (!room) return;

    const point = getFloorPlanSvgPoint(event, svg);

    if (floorPlanDragState.mode === "move") {
      let nextX = point.x - floorPlanDragState.offsetX;
      let nextY = point.y - floorPlanDragState.offsetY;

      if (snapToGrid && snapToGrid.checked) {
        nextX = snapValue(nextX, 10);
        nextY = snapValue(nextY, 10);
      }

      if (snapToEdge && snapToEdge.checked) {
        const edges = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600, 620, 640, 660, 680, 700];
        const snappedX = edges.reduce((best, edge) => (Math.abs(nextX - edge) < Math.abs(nextX - best) ? edge : best), edges[0]);
        const snappedY = edges.reduce((best, edge) => (Math.abs(nextY - edge) < Math.abs(nextY - best) ? edge : best), edges[0]);
        nextX = snappedX;
        nextY = snappedY;
      }

      room.x = clamp(nextX, 20, 1000 - room.width - 20);
      room.y = clamp(nextY, 20, 700 - room.height - 20);
    }

    if (floorPlanDragState.mode === "resize") {
      const dx = point.x - floorPlanDragState.pointerStartX;
      const dy = point.y - floorPlanDragState.pointerStartY;
      let nextWidth = floorPlanDragState.startWidth + dx;
      let nextHeight = floorPlanDragState.startHeight + dy;

      if (snapToGrid && snapToGrid.checked) {
        nextWidth = snapValue(nextWidth, 10);
        nextHeight = snapValue(nextHeight, 10);
      }

      room.width = enforceMinimumDimension(nextWidth, 80);
      room.height = enforceMinimumDimension(nextHeight, 80);
      room.x = clamp(floorPlanDragState.startX, 20, 1000 - room.width - 20);
      room.y = clamp(floorPlanDragState.startY, 20, 700 - room.height - 20);
    }

    saveProject();
    renderFloorPlan();
  };

  svg.onpointerup = () => {
    floorPlanDragState = null;
    svg.style.cursor = "default";
  };

  svg.onpointerleave = () => {
    if (!floorPlanDragState) return;
    floorPlanDragState = null;
    svg.style.cursor = "default";
  };
}

function renderFloorPlan() {
  syncFloorPlanSettings();

  const svg = document.getElementById("floor-plan-svg");
  if (!svg) return;

  const settings = getFloorPlanDisplaySettings();
  const textSizeMap = { small: 16, medium: 22, large: 28 };
  const labelFontSize = textSizeMap[settings.textSize] || 22;
  const dimensionFontSize = Math.max(11, labelFontSize - 8);

  if (!state.floorPlan.length) {
    svg.innerHTML = `
      <rect x="0" y="0" width="1000" height="700" fill="#f4faf5" stroke="#dfeee3" stroke-width="2" rx="18"/>
      <text x="500" y="350" text-anchor="middle" fill="#5e7268" font-size="26" font-family="Inter, sans-serif">No rooms added yet. Add your first room and drag it around the canvas.</text>
    `;
    svg.style.cursor = "default";
    return;
  }

  const roomColors = ["#dfeee3", "#cfe3d3", "#d8e9d2", "#ebf3eb", "#d5e7da"];

  svg.innerHTML = `
    <rect x="0" y="0" width="1000" height="700" fill="#f9fdf9" stroke="#dfeee3" stroke-width="2" rx="18"/>
    ${state.floorPlan
      .map((room, index) => {
        const color = room.isFurniture ? (room.color || roomColors[index % roomColors.length]) : roomColors[index % roomColors.length];
        const visibleName = room.isFurniture && settings.furnitureSymbolsOnly ? room.name.split(" ")[0] : room.name;
        const roomLabel = escapeHtml(visibleName || "Item");
        const widthMeters = (room.width / 100).toFixed(1);
        const heightMeters = (room.height / 100).toFixed(1);
        const dimensionText = settings.showDimensions && !room.isFurniture ? `${widthMeters}m × ${heightMeters}m` : "";

        return `
          <g class="floor-room-shape ${selectedFloorPlanItemId === room.id ? "selected" : ""}" data-room-id="${room.id}" style="cursor: grab;">
            <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" rx="12" fill="${color}" stroke="#3d6d4f" stroke-width="${selectedFloorPlanItemId === room.id ? 3 : 2}"/>
            <text x="${room.x + room.width / 2}" y="${room.y + room.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#1e2f27" font-size="${labelFontSize}" font-weight="600" font-family="Inter, sans-serif">${roomLabel}</text>
            ${dimensionText ? `<text x="${room.x + room.width + 8}" y="${room.y + room.height / 2}" text-anchor="start" fill="#3d6d4f" font-size="${dimensionFontSize}" font-family="Inter, sans-serif">${widthMeters}m</text>` : ""}
            ${dimensionText ? `<text x="${room.x + room.width / 2}" y="${room.y - 8}" text-anchor="middle" fill="#3d6d4f" font-size="${dimensionFontSize}" font-family="Inter, sans-serif">${heightMeters}m</text>` : ""}
          </g>
        `;
      })
      .join("")}
  `;

  svg.style.cursor = "default";
  attachFloorPlanItemInteractions(svg);
}

function addFurnitureToPlan(toolName) {
  const svg = document.getElementById("floor-plan-svg");
  if (!svg) return;

  const furnitureMap = {
    bed: { label: "🛏️ Bed", width: 120, height: 90, fill: "#cfe3d3" },
    desk: { label: "🖥️ Desk", width: 100, height: 70, fill: "#dfeee3" },
    chair: { label: "🪑 Chair", width: 60, height: 60, fill: "#ebf3eb" },
    sofa: { label: "🛋️ Sofa", width: 130, height: 80, fill: "#d8e9d2" },
    table: { label: "🪵 Table", width: 100, height: 80, fill: "#dfeee3" },
    storage: { label: "🗄️ Storage", width: 90, height: 70, fill: "#d5e7da" }
  };

  const furniture = furnitureMap[toolName] || furnitureMap.bed;
  const roomId = `furniture-${Date.now()}`;
  state.floorPlan.push({
    id: roomId,
    name: furniture.label,
    x: 120,
    y: 120,
    width: furniture.width,
    height: furniture.height,
    isFurniture: true,
    color: furniture.fill
  });

  saveProject();
  renderFloorPlan();
}

// Converts a chosen image file into a data URL so it's embedded directly in the saved/exported project.
const MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024;

function wireImageFileInput(fileInputId, urlInputId) {
  const fileInput = document.getElementById(fileInputId);
  const urlInput = document.getElementById(urlInputId);
  if (!fileInput || !urlInput) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      fileInput.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      alert(`That image is too large (max ${(MAX_UPLOAD_IMAGE_BYTES / (1024 * 1024)).toFixed(0)} MB). Try a smaller photo or paste a URL instead.`);
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      urlInput.value = String(reader.result);
    };
    reader.onerror = () => {
      alert("Could not read that image file. Please try again.");
    };
    reader.readAsDataURL(file);
  });
}

function attachPhaseTwoListeners() {
  const observationForm = document.getElementById("observation-form");
  if (observationForm) {
    observationForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const newEntry = {
        id: Date.now(),
        date: document.getElementById("observation-date").value,
        time: document.getElementById("observation-time").value,
        room: document.getElementById("observation-room").value,
        activity: document.getElementById("observation-activity").value,
        duration: document.getElementById("observation-duration").value,
        photo: document.getElementById("observation-photo").value,
        finding: document.getElementById("observation-finding").value
      };

      if (!newEntry.activity.trim() && !newEntry.room.trim()) {
        alert("Please add at least an activity or room before saving the observation.");
        return;
      }

      state.observations.push(newEntry);
      observationForm.reset();
      saveProject();
      renderObservationTable();
    });
  }

  document.querySelectorAll(".chip-button").forEach((button) => {
    button.addEventListener("click", () => {
      const activityField = document.getElementById("observation-activity");
      activityField.value = button.dataset.activity;
    });
  });

  const customQuestionButton = document.getElementById("add-custom-question");
  if (customQuestionButton) {
    customQuestionButton.addEventListener("click", addCustomInterviewQuestion);
  }

  const inventoryForm = document.getElementById("inventory-form");
  if (inventoryForm) {
    inventoryForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const selectedReuse = document.querySelector('input[name="itemReuse"]:checked');
      const newItem = {
        id: Date.now(),
        name: document.getElementById("item-name").value,
        category: document.getElementById("item-category").value,
        quantity: document.getElementById("item-quantity").value,
        room: document.getElementById("item-room").value,
        dimensions: document.getElementById("item-dimensions").value,
        condition: document.getElementById("item-condition").value,
        reuse: selectedReuse ? selectedReuse.value : "",
        notes: document.getElementById("item-notes").value,
        photo: document.getElementById("item-photo").value
      };

      if (!newItem.name.trim() || !newItem.category.trim()) {
        alert("Please add an item name and category before saving it.");
        return;
      }

      state.inventory.push(newItem);
      inventoryForm.reset();
      saveProject();
      renderInventoryTable();
    });
  }

  const siteSurveyForm = document.getElementById("site-survey-form");
  if (siteSurveyForm) {
    siteSurveyForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const newRoom = {
        id: Date.now(),
        name: document.getElementById("site-room-name").value,
        dimensions: document.getElementById("site-dimensions").value,
        area: document.getElementById("site-area").value,
        doors: document.getElementById("site-doors").value,
        windows: document.getElementById("site-windows").value,
        stairs: document.getElementById("site-stairs").value,
        ceiling: document.getElementById("site-ceiling").value,
        lighting: document.getElementById("site-lighting").value,
        ventilation: document.getElementById("site-ventilation").value,
        noise: document.getElementById("site-noise").value,
        views: document.getElementById("site-views").value,
        observations: document.getElementById("site-observations").value,
        outlets: document.getElementById("site-outlets").value,
        plumbing: document.getElementById("site-plumbing").value,
        mechanical: document.getElementById("site-mechanical").value,
        router: document.getElementById("site-router").value,
        builtIns: document.getElementById("site-builtins").value
      };

      if (!newRoom.name.trim()) {
        alert("Please give the room a name before saving.");
        return;
      }

      if (editingSiteSurveyId) {
        const existingIndex = state.siteSurvey.findIndex((room) => String(room.id) === editingSiteSurveyId);
        if (existingIndex >= 0) state.siteSurvey[existingIndex] = { ...newRoom, id: state.siteSurvey[existingIndex].id };
      } else {
        state.siteSurvey.push(newRoom);
      }

      cancelSiteSurveyEdit();
      saveProject();
      renderSiteSurveyTable();
    });
  }

  const cancelSiteSurveyButton = document.getElementById("cancel-site-survey-edit");
  if (cancelSiteSurveyButton) {
    cancelSiteSurveyButton.addEventListener("click", cancelSiteSurveyEdit);
  }

  const photoForm = document.getElementById("photo-form");
  if (photoForm) {
    photoForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const url = document.getElementById("photo-url").value.trim();
      const location = document.getElementById("photo-location").value.trim();
      const category = document.getElementById("photo-category").value;
      const caption = document.getElementById("photo-caption").value.trim();

      if (!url) {
        alert("Please add an image URL or upload a photo before saving.");
        return;
      }

      state.photos.push({
        id: Date.now(),
        url,
        location,
        category,
        caption
      });

      photoForm.reset();
      saveProject();
      renderPhotoGallery();
    });
  }

  const findingsForm = document.getElementById("findings-form");
  if (findingsForm) {
    findingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.analysis.findings = {
        keyFindings: document.getElementById("findings-key").value,
        constraints: document.getElementById("findings-constraints").value,
        opportunities: document.getElementById("findings-opportunities").value,
        recommendations: document.getElementById("findings-recommendations").value
      };
      saveProject();
      renderFindingsSummary();
      renderReportPreview();
    });
  }

  const conclusionForm = document.getElementById("conclusion-form");
  if (conclusionForm) {
    conclusionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.analysis.conclusion = {
        summary: document.getElementById("conclusion-summary-input").value,
        recommendation: document.getElementById("conclusion-recommendation").value
      };
      saveProject();
      renderConclusionSummary();
      renderReportPreview();
    });
  }

  wireImageFileInput("observation-photo-file", "observation-photo");
  wireImageFileInput("item-photo-file", "item-photo");
  wireImageFileInput("photo-url-file", "photo-url");

  const floorPlanForm = document.getElementById("floor-plan-form");
  if (floorPlanForm) {
    floorPlanForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const roomName = document.getElementById("floor-room-name").value.trim();
      const x = Number(document.getElementById("floor-room-x").value || 0);
      const y = Number(document.getElementById("floor-room-y").value || 0);
      const width = Number(document.getElementById("floor-room-width").value || 0);
      const height = Number(document.getElementById("floor-room-height").value || 0);

      if (!roomName || !width || !height) {
        alert("Please add a room name and room dimensions before placing it on the plan.");
        return;
      }

      const snapToGrid = document.getElementById("snap-to-grid");
      const nextX = snapToGrid && snapToGrid.checked ? snapValue(x, 10) : x;
      const nextY = snapToGrid && snapToGrid.checked ? snapValue(y, 10) : y;
      const nextWidth = snapToGrid && snapToGrid.checked ? snapValue(width, 10) : width;
      const nextHeight = snapToGrid && snapToGrid.checked ? snapValue(height, 10) : height;

      addSpace(roomName, {
        x: clamp(nextX, 40, 900),
        y: clamp(nextY, 40, 620),
        width: enforceMinimumDimension(nextWidth, 80),
        height: enforceMinimumDimension(nextHeight, 80)
      });

      floorPlanForm.reset();
      document.getElementById("floor-room-x").value = 80;
      document.getElementById("floor-room-y").value = 80;
      document.getElementById("floor-room-width").value = 180;
      document.getElementById("floor-room-height").value = 140;
      renderAllProjectViews();
    });
  }

  document.querySelectorAll(".furniture-tool").forEach((button) => {
    button.addEventListener("click", () => {
      activeFurnitureTool = button.dataset.furniture;
      document.querySelectorAll(".furniture-tool").forEach((tool) => tool.classList.toggle("active", tool === button));
    });
  });

  ["show-floor-dimensions", "furniture-symbols-only", "floor-plan-text-size"].forEach((id) => {
    const control = document.getElementById(id);
    if (!control) return;

    control.addEventListener("change", () => {
      syncFloorPlanSettings();
      saveProject();
      renderFloorPlan();
    });
  });

  const newProjectButton = document.getElementById("new-project-btn");
  if (newProjectButton) {
    newProjectButton.addEventListener("click", () => {
      const input = document.getElementById("new-project-name");
      const projectId = createProject(input ? input.value : "");
      if (input) input.value = "";
      openProject(projectId);
    });
  }

  const exportFloorPlanButton = document.getElementById("export-floor-plan-png");
  if (exportFloorPlanButton) {
    exportFloorPlanButton.addEventListener("click", () => {
      const svg = document.getElementById("floor-plan-svg");
      if (!svg) return;

      const clone = svg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgData = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 700;
        const context = canvas.getContext("2d");

        context.fillStyle = "#f9fdf9";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "programming-studio-floor-plan.png";
        link.click();
        URL.revokeObjectURL(url);
      };

      img.src = url;
    });
  }

  const floorPlanSvg = document.getElementById("floor-plan-svg");
  if (floorPlanSvg) {
    floorPlanSvg.addEventListener("dblclick", (event) => {
      const point = getFloorPlanSvgPoint(event, floorPlanSvg);
      const furnitureMap = {
        bed: { label: "🛏️ Bed", width: 120, height: 90, fill: "#cfe3d3" },
        desk: { label: "🖥️ Desk", width: 100, height: 70, fill: "#dfeee3" },
        chair: { label: "🪑 Chair", width: 60, height: 60, fill: "#ebf3eb" },
        sofa: { label: "🛋️ Sofa", width: 130, height: 80, fill: "#d8e9d2" },
        table: { label: "🪵 Table", width: 100, height: 80, fill: "#dfeee3" },
        storage: { label: "🗄️ Storage", width: 90, height: 70, fill: "#d5e7da" }
      };

      const chosen = furnitureMap[activeFurnitureTool] || furnitureMap.bed;
      state.floorPlan.push({
        id: `furniture-${Date.now()}`,
        name: chosen.label,
        x: clamp(point.x - chosen.width / 2, 30, 860),
        y: clamp(point.y - chosen.height / 2, 30, 610),
        width: chosen.width,
        height: chosen.height,
        isFurniture: true,
        color: chosen.fill
      });

      saveProject();
      renderFloorPlan();
    });
  }

  const bubbleDiagramForm = document.getElementById("bubble-diagram-form");
  if (bubbleDiagramForm) {
    bubbleDiagramForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.getElementById("bubble-diagram-title").value;
      state.analysis.bubbleTitle = title;
      saveProject();
      renderBubbleDiagram();
    });
  }

  const bubbleNameInput = document.getElementById("bubble-name-input");
  if (bubbleNameInput) {
    bubbleNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const value = bubbleNameInput.value.trim();
        if (!value) return;
        addBubbleNode(value);
        bubbleNameInput.value = "";
      }
    });
  }

  const addBubbleButton = document.getElementById("add-bubble-btn");
  if (addBubbleButton) {
    addBubbleButton.addEventListener("click", () => {
      const input = document.getElementById("bubble-name-input");
      const value = input ? input.value : "";
      addBubbleNode(value);
      if (input) input.value = "";
    });
  }

  const deleteBubbleButton = document.getElementById("delete-bubble-btn");
  if (deleteBubbleButton) {
    deleteBubbleButton.addEventListener("click", () => {
      if (!selectedBubbleId) {
        alert("Select a bubble first, then delete it.");
        return;
      }

      deleteSelectedBubbleNode();
    });
  }

  const connectToggle = document.getElementById("bubble-connect-toggle");
  if (connectToggle) {
    connectToggle.addEventListener("click", () => {
      bubbleConnectMode = !bubbleConnectMode;
      pendingConnectFromId = null;
      renderBubbleDiagram();
    });
  }

  const clearFloorPlanButton = document.getElementById("clear-floor-plan");
  if (clearFloorPlanButton) {
    clearFloorPlanButton.addEventListener("click", () => {
      state.floorPlan = [];
      selectedFloorPlanItemId = null;
      saveProject();
      renderFloorPlan();
    });
  }

  const deleteSelectedButton = document.getElementById("delete-selected-floor-item");
  if (deleteSelectedButton) {
    deleteSelectedButton.addEventListener("click", () => {
      if (!selectedFloorPlanItemId) {
        alert("Select an item on the plan first, then delete it.");
        return;
      }

      const item = state.floorPlan.find((entry) => String(entry.id) === selectedFloorPlanItemId);
      if (item && item.spaceId) {
        deleteSpace(item.spaceId);
        selectedFloorPlanItemId = null;
        renderAllProjectViews();
        return;
      }

      state.floorPlan = state.floorPlan.filter((entry) => String(entry.id) !== selectedFloorPlanItemId);
      selectedFloorPlanItemId = null;
      saveProject();
      renderFloorPlan();
    });
  }

  const labelInput = document.getElementById("floor-plan-label-input");
  if (labelInput) {
    labelInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const room = state.floorPlan.find((item) => String(item.id) === labelInput.dataset.roomId);
        if (room) {
          const newName = labelInput.value.trim() || room.name;
          if (room.spaceId) {
            renameSpace(room.spaceId, newName);
            renderAllProjectViews();
          } else {
            room.name = newName;
            saveProject();
            renderFloorPlan();
          }
          hideFloorPlanLabelEditor();
        }
      }

      if (event.key === "Escape") {
        hideFloorPlanLabelEditor();
      }
    });

    labelInput.addEventListener("blur", () => {
      const room = state.floorPlan.find((item) => String(item.id) === labelInput.dataset.roomId);
      if (room) {
        const newName = labelInput.value.trim() || room.name;
        if (room.spaceId) {
          renameSpace(room.spaceId, newName);
          renderAllProjectViews();
        } else {
          room.name = newName;
          saveProject();
          renderFloorPlan();
        }
      }
      hideFloorPlanLabelEditor();
    });
  }
}

function attachNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.section;
      const targetSection = document.getElementById(targetId);

      if (!targetSection) return;

      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });

      document.querySelectorAll(".nav-item").forEach((navItem) => {
        navItem.classList.toggle("active", navItem === button);
      });
    });
  });
}

function attachReportExportListeners() {
  const exportButton = document.getElementById("export-report-pdf");
  if (exportButton) {
    exportButton.addEventListener("click", exportReportToPdf);
  }
}

function attachSidebarToggle() {
  if (!sidebarToggle) return;

  const shell = document.querySelector(".app-shell");
  if (!shell) return;

  const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  shell.classList.toggle("sidebar-collapsed", savedCollapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!savedCollapsed));
  sidebarToggle.setAttribute("aria-controls", "project-navigation");
  sidebarToggle.title = savedCollapsed ? "Open sidebar" : "Close sidebar";

  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = shell.classList.toggle("sidebar-collapsed");
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarToggle.title = isCollapsed ? "Open sidebar" : "Close sidebar";
  });
}

// 9) Manual save button.
manualSaveButton.addEventListener("click", () => {
  saveProject();
  saveStatus.textContent = "Saved manually";
});

// 10) Reset project with confirmation.
resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("Reset this project? This will clear the current profile data from the browser.");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, structuredClone(defaultState));
  form.reset();
  populateForm();
  updateSaveMessage();
  updateDashboardProgress();
  renderObservationTable();
  renderInterviewCategories();
  renderInterviewQuestions();
  renderInventoryTable();
  renderSiteSurveyTable();
  renderPhotoGallery();
  renderBubbleDiagram();
  renderProximityMatrix();
  renderDataVisualization();
  renderFindingsSummary();
  renderConclusionSummary();
  renderFloorPlan();
});

// 11) Initial app setup.
renderProjectList();
if (activeProjectId) {
  state = loadProject();
  toggleProjectPicker(false);
} else {
  state = structuredClone(defaultState);
  toggleProjectPicker(true);
}

populateForm();
attachInputListeners();
attachNavigation();
attachSidebarToggle();
attachPhaseTwoListeners();
renderObservationTable();
renderInterviewCategories();
renderInterviewQuestions();
renderProjectSummary();
renderInventoryTable();
renderSiteSurveyTable();
renderPhotoGallery();
renderBubbleDiagram();
renderProximityMatrix();
renderDataVisualization();
renderFindingsSummary();
renderConclusionSummary();
renderReportPreview();
renderFloorPlan();
attachReportExportListeners();

const switchProjectButton = document.getElementById("switch-project-btn");
if (switchProjectButton) {
  switchProjectButton.addEventListener("click", () => {
    showProjectPicker();
  });
}

// Lets a project move between devices/browsers manually via a downloaded JSON file (no account needed).
function exportProjectData() {
  const list = loadProjectList();
  const matchedProject = list.find((project) => project.id === activeProjectId);
  const projectName = (matchedProject && matchedProject.name) || state.profile.name || "project";
  const safeName = projectName.trim().replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-") || "project";

  const payload = {
    exportedAt: new Date().toISOString(),
    projectName,
    data: state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProjectData(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch (error) {
      alert("That file isn't valid JSON. Please choose a file exported from this app.");
      return;
    }

    const importedData = parsed && typeof parsed === "object" && parsed.data ? parsed.data : parsed;
    if (!importedData || typeof importedData !== "object") {
      alert("That file doesn't look like a Programming Studio export.");
      return;
    }

    const projectName = (parsed && parsed.projectName) || (importedData.profile && importedData.profile.name) || "Imported project";
    const projectId = `project-${Date.now()}`;
    const list = loadProjectList();
    list.push({ id: projectId, name: projectName });
    persistProjectList(list);
    localStorage.setItem(getProjectStorageKey(projectId), JSON.stringify(mergeWithDefaultState(importedData)));

    openProject(projectId);
    alert(`Imported "${projectName}" as a new project.`);
  };

  reader.onerror = () => {
    alert("Could not read that file. Please try again.");
  };

  reader.readAsText(file);
}

const exportDataButton = document.getElementById("export-data-btn");
if (exportDataButton) {
  exportDataButton.addEventListener("click", exportProjectData);
}

const importDataButton = document.getElementById("import-data-btn");
const importDataInput = document.getElementById("import-data-input");
if (importDataButton && importDataInput) {
  importDataButton.addEventListener("click", () => importDataInput.click());
  importDataInput.addEventListener("change", () => {
    const file = importDataInput.files && importDataInput.files[0];
    if (file) importProjectData(file);
    importDataInput.value = "";
  });
}
