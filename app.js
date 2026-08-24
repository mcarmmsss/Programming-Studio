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

    const parsed = JSON.parse(stored);
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
  } catch (error) {
    console.warn("Could not load project. Using default values.", error);
    return structuredClone(defaultState);
  }
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
                  <label class="choice-row">
                    <input type="checkbox" class="suggested-question-check" value="${question}" />
                    <span>${question}</span>
                  </label>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
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
    .slice(0, 8)
    .map(
      (entry) => `
        <div class="interview-log-item">
          <strong>${entry.question}</strong>
          <span>${entry.answer}</span>
          <small>${entry.date}</small>
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
    id: Date.now(),
    question: question.text,
    answer: trimmed,
    date: new Date().toLocaleString()
  };

  state.interview.log = [entry, ...(state.interview.log || [])].slice(0, 12);
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
          <textarea data-question-id="${question.id}" class="question-answer" rows="2" placeholder="Enter answer...">${answer}</textarea>
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
      logInterviewAnswer(questionId, value);
      saveProject();
      renderInterviewLog();
    });
  });

  renderInterviewLog();
}

function addSelectedInterviewQuestions() {
  const selected = Array.from(document.querySelectorAll(".suggested-question-check:checked"))
    .map((checkbox) => checkbox.value)
    .filter((value) => value);

  if (!selected.length) return;

  selected.forEach((questionText) => {
    const alreadyExists = state.interview.questions.some((question) => question.text === questionText);
    if (!alreadyExists) {
      state.interview.questions.push(createQuestionRecord(questionText, false));
    }
  });

  document.querySelectorAll(".suggested-question-check:checked").forEach((checkbox) => {
    checkbox.checked = false;
  });

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
        <td colspan="8" class="empty-state">No site survey entries have been saved yet.</td>
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
        </tr>
      `
    )
    .join("");
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

function ensureBubbleNodes() {
  if (!Array.isArray(state.analysis.bubbleNodes) || !state.analysis.bubbleNodes.length) {
    const labels = [
      "Reception",
      "Lobby",
      "Therapy",
      "Gym",
      "Wellness",
      "Office"
    ];

    state.analysis.bubbleNodes = labels.map((label, index) => ({
      id: `bubble-${index + 1}`,
      name: label,
      x: 80 + (index % 3) * 150,
      y: 60 + Math.floor(index / 3) * 120,
      size: 86
    }));
    selectedBubbleId = state.analysis.bubbleNodes[0]?.id || null;
  }

  if (!Array.isArray(state.analysis.bubbleLinks)) {
    state.analysis.bubbleLinks = [];
  }
}

function addBubbleNode(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;

  if (!Array.isArray(state.analysis.bubbleNodes)) {
    state.analysis.bubbleNodes = [];
  }

  const nextId = `bubble-${Date.now()}`;
  state.analysis.bubbleNodes.push({
    id: nextId,
    name: trimmed,
    x: 120 + (state.analysis.bubbleNodes.length % 3) * 150,
    y: 70 + Math.floor(state.analysis.bubbleNodes.length / 3) * 120,
    size: 88
  });
  selectedBubbleId = nextId;
  saveProject();
  renderBubbleDiagram();
}

function deleteSelectedBubbleNode() {
  if (!selectedBubbleId || !Array.isArray(state.analysis.bubbleNodes)) return;

  state.analysis.bubbleNodes = state.analysis.bubbleNodes.filter((node) => node.id !== selectedBubbleId);
  state.analysis.bubbleLinks = (state.analysis.bubbleLinks || []).filter((link) => {
    return link.from !== selectedBubbleId && link.to !== selectedBubbleId;
  });
  selectedBubbleId = state.analysis.bubbleNodes[0]?.id || null;
  saveProject();
  renderBubbleDiagram();
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

      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5e8f6e" stroke-width="2" stroke-linecap="round" opacity="0.7" />`;
    })
    .join("");

  const nodeMarkup = nodes
    .map((node) => `
      <div class="bubble-node ${selectedBubbleId === node.id ? "selected" : ""}" data-node-id="${node.id}" style="left:${node.x}px; top:${node.y}px; width:${node.size}px; height:${node.size}px;">
        <span class="bubble-label">${node.name}</span>
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

function renameBubbleNode(nodeId, newName) {
  const node = state.analysis.bubbleNodes.find((item) => item.id === nodeId);
  if (!node) return;

  const trimmed = String(newName || "").trim();
  if (!trimmed) return;
  node.name = trimmed;
  saveProject();
  renderBubbleDiagram();
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

function getRoomNames() {
  const names = (state.analysis.bubbleNodes || []).map((node) => node.name).filter(Boolean);
  if (names.length) return names;

  const fallback = (state.siteSurvey || []).map((room) => room.name).filter(Boolean);
  return fallback.length ? fallback : ["Reception", "Therapy", "Gym", "Office"];
}

function normalizeMatrixValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(2, Math.round(numeric)));
}

function buildProximityMatrix() {
  const rooms = getRoomNames();
  const matrix = state.analysis.proximityMatrix || {};

  const legend = `
    <div class="proximity-legend">
      <span><strong>white</strong> = no relation</span>
      <span><strong>grey</strong> = weak relation</span>
      <span><strong>black</strong> = strong relation</span>
    </div>
  `;

  const headerCells = rooms
    .map((room) => `<div class="triangle-header-cell">${room}</div>`)
    .join("");

  const rows = rooms
    .map((rowName, rowIndex) => {
      const cells = rooms
        .map((colName, colIndex) => {
          if (colIndex <= rowIndex) {
            return `<div class="triangle-placeholder"></div>`;
          }

          const key = `${rowIndex}-${colIndex}`;
          const value = normalizeMatrixValue(matrix[key]);
          const classes = `triangle-cell matrix-${value === 0 ? "white" : value === 1 ? "grey" : "black"}`;
          return `<button type="button" class="${classes}" data-matrix-key="${key}" title="${rowName} / ${colName}" aria-label="${rowName} and ${colName} adjacency">
            ${value === 0 ? "" : value === 1 ? "•" : "■"}
          </button>`;
        })
        .join("");

      return `
        <div class="triangle-row">
          <div class="triangle-row-label">${rowName}</div>
          ${cells}
        </div>
      `;
    })
    .join("");

  return `
    ${legend}
    <div class="proximity-triangle" style="--triangle-columns:${rooms.length};">
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
    : '<li class="empty-state">No floor plan items have been added yet.</li>';

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
        <h4>6. Floor plan summary</h4>
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
        const roomLabel = visibleName || "Item";
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

  const addSelectedButton = document.querySelector("#interview-categories .secondary-btn");
  if (addSelectedButton) {
    addSelectedButton.remove();
  }

  const interviewCategories = document.getElementById("interview-categories");
  if (interviewCategories) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "primary-btn small-btn";
    addButton.textContent = "Add selected";
    addButton.addEventListener("click", addSelectedInterviewQuestions);
    interviewCategories.appendChild(addButton);
  }

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

      state.siteSurvey.push(newRoom);
      siteSurveyForm.reset();
      saveProject();
      renderSiteSurveyTable();
    });
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
        alert("Please add an image URL before saving the photo.");
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

      state.floorPlan.push({
        id: Date.now(),
        name: roomName,
        x: clamp(nextX, 40, 900),
        y: clamp(nextY, 40, 620),
        width: enforceMinimumDimension(nextWidth, 80),
        height: enforceMinimumDimension(nextHeight, 80),
        isFurniture: false
      });

      floorPlanForm.reset();
      document.getElementById("floor-room-x").value = 80;
      document.getElementById("floor-room-y").value = 80;
      document.getElementById("floor-room-width").value = 180;
      document.getElementById("floor-room-height").value = 140;
      saveProject();
      renderFloorPlan();
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

      state.floorPlan = state.floorPlan.filter((item) => String(item.id) !== selectedFloorPlanItemId);
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
          room.name = labelInput.value.trim() || room.name;
          saveProject();
          renderFloorPlan();
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
        room.name = labelInput.value.trim() || room.name;
        saveProject();
        renderFloorPlan();
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
