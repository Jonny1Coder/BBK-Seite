// Funktionen spezifisch für die Startseite (index.html)

/**
 * Aktualisiert die Anzeige der verbleibenden Zeit bis zum Ende der aktuellen Stunde
 */
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

/**
 * Startet den Countdown für das Ende der aktuellen Stunde
 */
function startLessonCountdown() {
    updateNextLessonEnd();
    setInterval(updateNextLessonEnd, 1000);
}

