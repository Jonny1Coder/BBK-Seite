// Zentrale Definition der Stundenzeiten
const stunden = [
    ["07:55", "08:40"],
    ["08:40", "09:25"],
    ["09:40", "10:25"],
    ["10:25", "11:10"],
    ["11:25", "12:10"],
    ["12:10", "12:55"],
    ["13:10", "13:55"],
    ["13:55", "14:40"]
];

function timeToMinutes(str) {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
}
function getCurrentStundeIndex() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < stunden.length; i++) {
        const start = timeToMinutes(stunden[i][0]);
        const end = timeToMinutes(stunden[i][1]);
        if (nowMin >= start && nowMin < end) {
            return i;
        }
    }
    return -1;
}
function updateNextLessonEnd() {
    const idx = getCurrentStundeIndex();
    const div = document.getElementById('next-lesson-end');
    if (!div) return;
    if (idx === -1) {
        div.textContent = "Gerade läuft keine Stunde.";
        return;
    }
    const now = new Date();
    const [h, m] = stunden[idx][1].split(":").map(Number);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let diff = Math.floor((end - now) / 1000);
    if (diff <= 0) {
        div.textContent = `Die ${idx+1}. Stunde ist vorbei.`;
        return;
    }
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    div.textContent = `${idx+1}. Stunde noch ${min} Minuten ${sec} Sekunden ...`;
}
function startLessonCountdown() {
    updateNextLessonEnd();
    setInterval(updateNextLessonEnd, 1000);
}

