function goTo(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

const subjects = {
  Math: ["AP Calculus AB", "AP Calculus BC", "AP Pre-Calculus"],
  Science: ["AP Biology", "AP Chemistry", "AP Physics"],
  English: ["AP Literature", "AP Language"],
  History: ["AP US History", "AP World History"]
};

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

function openClass(className) {
  goTo("classPage");
  document.getElementById("classTitle").innerText = className;
}

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}

function goTo(pageId) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  setTimeout(() => {
    document.getElementById(pageId).classList.add("active");
  }, 50);
}