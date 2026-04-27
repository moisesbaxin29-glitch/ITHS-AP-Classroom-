/* =========================
   NAVIGATION
========================= */

function goTo(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  setTimeout(() => {
    document.getElementById(pageId).classList.add("active");
  }, 50);
}

/* =========================
   SUBJECT MAP
========================= */

const subjects = {
  Math: ["AP Calculus AB", "AP Pre-Calculus"],
  Science: ["AP Environmental Science"],
  English: ["AP Literature", "AP Language"],
  History: ["AP US History", "AP World History", "AP Macroeconomics"]
};

/* =========================
   FILE MAP
========================= */

const fileMap = {
  "AP Calculus AB": "ap_calcAB.json",
  "AP Pre-Calculus": "ap_precalc.json",
  "AP Literature": "ap_lit.json",
  "AP Language": "ap_lang.json",
  "AP US History": "ap_ush.json",
  "AP World History": "ap_world.json",
  "AP Macroeconomics": "ap_macroEc.json",
  "AP Environmental Science": "ap_envir.json"
};

/* =========================
   THEMES
========================= */

const themeMap = {
  "AP Calculus AB": { color: "#4CAF50", glow: "#4CAF50" },
  "AP Pre-Calculus": { color: "#00e676", glow: "#00e676" },
  "AP Macroeconomics": { color: "#FF9800", glow: "#FF9800" },
  "AP Environmental Science": { color: "#9C27B0", glow: "#9C27B0" },
  default: { color: "#2196F3", glow: "#2196F3" }
};

let currentTheme = themeMap.default;

/* =========================
   APPLY THEME
========================= */

function applyTheme(theme) {
  document.documentElement.style.setProperty("--theme", theme.color);
  document.documentElement.style.setProperty("--glow", theme.glow);
}

/* =========================
   DATA REGISTRY
========================= */

const dataRegistry = {};

/* =========================
   LOAD JSON FILES
========================= */

async function loadAllData() {
  await Promise.all(
    Object.entries(fileMap).map(async ([key, file]) => {
      try {
        const res = await fetch(file);
        dataRegistry[key] = await res.json();
      } catch (e) {
        console.warn("Failed loading:", key);
      }
    })
  );

  console.log("All data loaded");
}

loadAllData();

/* =========================
   OPEN SUBJECT
========================= */

function openSubject(subject) {
  goTo("subjectPage");
  document.getElementById("subjectTitle").innerText = subject;

  const list = document.getElementById("classList");
  list.innerHTML = "";

  subjects[subject].forEach(cls => {
    const div = document.createElement("div");
    div.innerText = cls;
    div.onclick = () => openClass(cls);
    list.appendChild(div);
  });
}

/* =========================
   NORMALIZER (FIXED UNIVERSAL)
========================= */

function normalizeData(data) {
  if (!data) return { units: [] };

  let units = [];

  if (Array.isArray(data.Units)) {
    units = data.Units.map(u => ({
      title: u.Title || `Unit ${u.Unit || ""}`,
      topics: (u.Topics || []).map(t => ({
        topic: t.Topic || "Untitled Topic",
        notes: normalizeNotes(t.Notes),
        questions: normalizeQuestions(t.Practice_Questions)
      }))
    }));
  } else if (Array.isArray(data.units)) {
    units = data.units.map(u => ({
      title: u.title || `Unit ${u.unit_id || ""}`,
      topics: (u.topics || []).map(t => ({
        topic: t.name || t.topic || t.Topic || "Untitled Topic",
        notes: normalizeNotes(
          t.notes || t.key_terms || t.examples || t.key_concepts || ""
        ),
        questions: normalizeQuestions(
          t.practice_questions || t.Practice_Questions
        )
      }))
    }));
  }

  return { units };
}

/* =========================
   NOTES
========================= */

function normalizeNotes(notes) {
  if (!notes) return [];

  if (typeof notes === "string") return [notes];

  if (Array.isArray(notes)) {
    return notes.map(n =>
      typeof n === "string"
        ? n
        : n.title && n.content
        ? `${n.title}: ${n.content}`
        : n.term && n.definition
        ? `${n.term}: ${n.definition}`
        : JSON.stringify(n)
    );
  }

  return [];
}

/* =========================
   QUESTIONS
========================= */

function normalizeQuestions(qs) {
  if (!Array.isArray(qs)) return [];

  return qs.map(q => ({
    question: q.question || q.Question || "No question",
    choices: q.choices || q.Choices || [],
    answer: q.answer ?? q.Answer ?? 0,
    explanation: q.explanation || ""
  }));
}

/* =========================
   OPEN CLASS
========================= */

function openClass(className) {
  goTo("classPage");
  document.getElementById("classTitle").innerText = className;

  currentTheme = themeMap[className] || themeMap.default;
  applyTheme(currentTheme);

  const raw = dataRegistry[className];

  if (!raw) {
    renderEmpty();
    return;
  }

  const data = normalizeData(raw);

  renderNotes(data);
  renderQuiz(data);
  renderGame(data);
}

/* =========================
   EMPTY STATE
========================= */

function renderEmpty() {
  document.getElementById("notesTab").innerHTML = "<p>No data available</p>";
  document.getElementById("quizTab").innerHTML = "<p>No quiz available</p>";
  document.getElementById("gameTab").innerHTML = "<p>No game available</p>";
}

/* =========================
   NOTES
========================= */

function renderNotes(data) {
  const container = document.getElementById("notesTab");

  let html = `<h3 style="color:var(--theme)">📚 Study Guide</h3>`;

  data.units.forEach(unit => {
    html += `<h2>${unit.title}</h2>`;

    unit.topics.forEach(topic => {
      html += `<h3 style="color:var(--theme)">${topic.topic}</h3><ul>`;

      topic.notes.forEach(n => {
        html += `<li>${n}</li>`;
      });

      html += `</ul>`;
    });
  });

  container.innerHTML = html;
}

/* =========================
   QUIZ SYSTEM
========================= */

let quizBank = [];
let quizIndex = 0;
let currentQ = null;

function renderQuiz(data) {
  quizBank = [];

  data.units.forEach(u => {
    u.topics.forEach(t => {
      if (Array.isArray(t.questions)) {
        quizBank.push(...t.questions);
      }
    });
  });

  quizIndex = 0;
  showQuestion();
}

function showQuestion() {
  const container = document.getElementById("quizTab");

  if (!quizBank.length) {
    container.innerHTML = "<p>No quiz questions</p>";
    return;
  }

  if (quizIndex >= quizBank.length) {
    container.innerHTML = "<h3>Quiz Complete 🎉</h3>";
    return;
  }

  currentQ = quizBank[quizIndex];

  let html = `
    <h3 style="color:var(--theme)">Question</h3>
    <p>${currentQ.question}</p>
  `;

  (currentQ.choices || []).forEach((c, i) => {
    html += `
      <button class="game-btn" onclick="answer(${i})">${c}</button>
    `;
  });

  html += `<p id="fb"></p>`;

  container.innerHTML = html;
}

function answer(i) {
  const fb = document.getElementById("fb");

  fb.innerText =
    i === currentQ.answer ? "✅ Correct" : "❌ Wrong";

  quizIndex++;
  setTimeout(showQuestion, 800);
}

/* =========================
   GAME SYSTEM (PATH MODE)
========================= */

let gameState = {
  position: 3,
  pathLength: 7,
  questions: [],
  current: null
};

function buildGameQuestions(data) {
  let qs = [];

  data.units.forEach(u => {
    u.topics.forEach(t => {
      if (Array.isArray(t.questions)) qs.push(...t.questions);
    });
  });

  return qs;
}

function renderGame(data) {
  const container = document.getElementById("gameTab");

  gameState.questions = buildGameQuestions(data);

  if (!gameState.questions.length) {
    container.innerHTML = "<p>No game available</p>";
    return;
  }

  drawGame();
  nextGameQuestion();
}

function drawGame() {
  let html = `
    <div class="game-wrapper">
      <div class="game-goal">GOAL</div>
      <div class="game-path">
  `;

  for (let i = 0; i < gameState.pathLength; i++) {
    html += `
      <div class="game-node">
        ${i === gameState.position ? `<div class="player"></div>` : ""}
      </div>
    `;
  }

  html += `</div></div><div id="game-q"></div>`;

  document.getElementById("gameTab").innerHTML = html;
}

function nextGameQuestion() {
  const q =
    gameState.questions[
      Math.floor(Math.random() * gameState.questions.length)
    ];

  gameState.current = q;

  const box = document.getElementById("game-q");

  let html = `<h3 style="color:var(--theme)">${q.question}</h3>`;

  (q.choices || []).forEach((c, i) => {
    html += `<button class="game-btn" onclick="gameAnswer(${i})">${c}</button>`;
  });

  box.innerHTML = html;
}

function gameAnswer(i) {
  if (i === gameState.current.answer) {
    gameState.position = Math.max(0, gameState.position - 1);
  } else {
    gameState.position = Math.min(
      gameState.pathLength - 1,
      gameState.position + 1
    );
  }

  drawGame();
  nextGameQuestion();
}

/* =========================
   TABS
========================= */

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}