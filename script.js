/* =========================
   STATE
========================= */

let isLoggedIn = false;

/* =========================
   NAVIGATION (FIXED - ONLY ONE)
========================= */

function goTo(pageId) {
  if (!isLoggedIn && pageId !== "authPage") {
    alert("Please sign in first.");
    return;
  }

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}

/* =========================
   SIGN IN
========================= */

function signIn() {
  const email = document.querySelector('#authPage input[type="email"]').value.trim();
  const password = document.querySelector('#authPage input[type="password"]').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  isLoggedIn = true;
  goTo("dashboard");
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
   THEME
========================= */

const themeMap = {
  "AP Calculus AB": { color: "#4CAF50", glow: "#4CAF50" },
  "AP Pre-Calculus": { color: "#00e676", glow: "#00e676" },
  "AP Macroeconomics": { color: "#FF9800", glow: "#FF9800" },
  "AP Environmental Science": { color: "#9C27B0", glow: "#9C27B0" },
  default: { color: "#2196F3", glow: "#2196F3" }
};

function applyTheme(theme) {
  document.documentElement.style.setProperty("--theme", theme.color);
  document.documentElement.style.setProperty("--glow", theme.glow);
}

/* =========================
   DATA
========================= */

const dataRegistry = {};

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
}
loadAllData();

/* =========================
   SUBJECTS
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
   NORMALIZER
========================= */

function normalizeData(data) {
  if (!data) return { units: [] };

  let units = [];

  if (Array.isArray(data.Units)) {
    units = data.Units.map(u => ({
      title: u.Title || "",
      topics: (u.Topics || []).map(t => ({
        topic: t.Topic || "",
        notes: Array.isArray(t.Notes) ? t.Notes : [t.Notes],
        questions: t.Practice_Questions || []
      }))
    }));
  } else if (Array.isArray(data.units)) {
    units = data.units.map(u => ({
      title: u.title || "",
      topics: (u.topics || []).map(t => ({
        topic: t.topic || "",
        notes: Array.isArray(t.notes) ? t.notes : [],
        questions: t.practice_questions || []
      }))
    }));
  }

  return { units };
}

/* =========================
   OPEN CLASS
========================= */

function openClass(className) {
  goTo("classPage");
  document.getElementById("classTitle").innerText = className;

  const theme = themeMap[className] || themeMap.default;
  applyTheme(theme);

  const raw = dataRegistry[className];
  if (!raw) return renderEmpty();

  const data = normalizeData(raw);

  renderNotes(data);
  renderQuiz(data);
  renderGame(data);
}

/* =========================
   EMPTY
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
  let html = `<h3>📚 Study Guide</h3>`;

  data.units.forEach(u => {
    html += `<h2>${u.title}</h2>`;

    u.topics.forEach(t => {
      html += `<h3>${t.topic}</h3><ul>`;

      (t.notes || []).forEach(n => {
        html += `<li>${n}</li>`;
      });

      html += `</ul>`;
    });
  });

  document.getElementById("notesTab").innerHTML = html;
}

/* =========================
   QUIZ (FIXED)
========================= */

let quizBank = [];
let quizIndex = 0;
let currentQ = null;

function renderQuiz(data) {
  quizBank = [];

  data.units.forEach(u => {
    u.topics.forEach(t => {
      if (Array.isArray(t.questions)) quizBank.push(...t.questions);
    });
  });

  quizIndex = 0;
  showQuestion();
}

function showQuestion() {
  const container = document.getElementById("quizTab");

  if (!quizBank.length) {
    container.innerHTML = "<p>No quiz</p>";
    return;
  }

  if (quizIndex >= quizBank.length) {
    container.innerHTML = "<h3>Quiz Complete 🎉</h3>";
    return;
  }

  currentQ = quizBank[quizIndex];

  let html = `
    <h3>Question</h3>
    <p>${currentQ.question}</p>
  `;

  const choices =
    currentQ.choices ||
    currentQ.Choices ||
    currentQ.options ||
    [];

  choices.forEach((c, i) => {
    html += `<button class="game-btn" onclick="answer(${i})">${c}</button>`;
  });

  html += `<p id="fb"></p>`;

  container.innerHTML = html;
}

/* ✅ FIXED ANSWER FUNCTION */
function answer(i) {
  const fb = document.getElementById("fb");

  const correctAnswer = Number(currentQ.answer);

  const isCorrect = i === correctAnswer;

  fb.innerText = isCorrect ? "✅ Correct" : "❌ Wrong";

  quizIndex++;
  setTimeout(showQuestion, 600);
}

/* =========================
   GAME (PATH)
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
  gameState.questions = buildGameQuestions(data);

  if (!gameState.questions.length) {
    document.getElementById("gameTab").innerHTML = "<p>No game available</p>";
    return;
  }

  drawGame();
  nextGameQuestion();
}

function drawGame() {
  let html = `<div class="game-wrapper">
    <div class="game-goal">GOAL</div>
    <div class="game-path">`;

  for (let i = 0; i < gameState.pathLength; i++) {
    html += `<div class="game-node">
      ${i === gameState.position ? `<div class="player"></div>` : ""}
    </div>`;
  }

  html += `</div></div><div id="game-q"></div>`;

  document.getElementById("gameTab").innerHTML = html;
}

function nextGameQuestion() {
  const q = gameState.questions[Math.floor(Math.random() * gameState.questions.length)];
  gameState.current = q;

  let html = `<h3>${q.question}</h3>`;

  (q.choices || []).forEach((c, i) => {
    html += `<button class="game-btn" onclick="gameAnswer(${i})">${c}</button>`;
  });

  document.getElementById("game-q").innerHTML = html;
}

function gameAnswer(i) {
  if (i === gameState.current.answer) {
    gameState.position = Math.max(0, gameState.position - 1);
  } else {
    gameState.position = Math.min(gameState.pathLength - 1, gameState.position + 1);
  }

  drawGame();
  nextGameQuestion();
}

/* =========================
   TABS
========================= */

function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}