document.addEventListener("DOMContentLoaded", function() {
    // Schulende-Datum: 29. Mai 2026, 00:00:00
    const schoolEndDate = new Date(2026, 4, 29, 0, 0, 0, 0); // Monat 4 = Mai (0-basiert)

    function updateSchoolEndCountdown() {
        const now = new Date();
        let y1 = now.getFullYear(), m1 = now.getMonth(), d1 = now.getDate();
        let y2 = schoolEndDate.getFullYear(), m2 = schoolEndDate.getMonth(), d2 = schoolEndDate.getDate();

        // Korrigiere Zielzeit auf 00:00 des Zieltags
        let target = new Date(schoolEndDate.getTime());

        // Wenn schon vorbei:
        if (now >= target) {
            document.getElementById('schoolend-countdown').textContent = "Schule ist vorbei! 🎉";
            return;
        }

        // Monate und Tage berechnen
        let years = y2 - y1;
        let months = m2 - m1;
        let days = d2 - d1;

        if (days < 0) {
            // Einen Monat zurück, Tage addieren
            months -= 1;
            let prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            days += prevMonth;
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }
        // Zeitanteile (h:m:s)
        let base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        let diffMillis = target - now;
        let diffSeconds = Math.floor((target - now) / 1000);

        let hours = now.getHours() > 0 || now.getMinutes() > 0 || now.getSeconds() > 0
            ? 23 - now.getHours()
            : 0;
        let minutes = now.getMinutes() > 0 || now.getSeconds() > 0
            ? 59 - now.getMinutes()
            : 0;
        let seconds = now.getSeconds() > 0
            ? 60 - now.getSeconds()
            : 0;
        // Alternativ: Restzeit nach Tagen abziehen
        let rest = target - new Date(now.getFullYear(), now.getMonth(), now.getDate()+days+months*30+years*365, 0, 0, 0, 0);
        let total = target - now;
        let totalSec = Math.floor(total / 1000);
        let s = totalSec % 60;
        let m = Math.floor(totalSec / 60) % 60;
        let h = Math.floor(totalSec / 3600) % 24;

        // Anzeige
        let out = "";
        if (years > 0) out += `${years} Jahr${years > 1 ? "e" : ""}, `;
        if (months > 0 || years > 0) out += `${months} Monat${months !== 1 ? "e" : ""}, `;
        out += `${days} Tag${days !== 1 ? "e" : ""}, `;
        out += `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        document.getElementById('schoolend-countdown').textContent = out;
    }

    setInterval(updateSchoolEndCountdown, 1000);
    updateSchoolEndCountdown();

// Stundenzeiten: [Start, Ende]
// Format: "HH:MM"
    const stunden = [
        ["07:55", "08:40"], // 1
        ["08:40", "09:25"], // 2
        ["09:40", "10:25"], // 3
        ["10:25", "11:10"], // 4
        ["11:25", "12:10"], // 5
        ["12:10", "12:55"], // 6
        ["13:10", "13:55"], // 7
        ["13:55", "14:40"]  // 8
    ];

// Hilfsfunktion: Wandelt "HH:MM" in Minuten seit Tagesbeginn um
    function timeToMinutes(str) {
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
    }

// Bestimmt die aktuelle Stunde (Index), falls gerade eine läuft. Sonst -1.
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

// Buttons generieren
    function renderButtons() {
        const btnGrid = document.getElementById('stunden-btns');
        btnGrid.innerHTML = ''; // Vorherige Buttons entfernen
        const currentIdx = getCurrentStundeIndex();
        stunden.forEach((st, idx) => {
            const btn = document.createElement('button');
            btn.textContent = `${idx+1}. Stunde`;
            btn.onclick = () => startCountdown(idx);
            if (idx === currentIdx) {
                btn.classList.add('current-lesson');
                btn.title = "Gerade laufende Stunde";
            }
            btnGrid.appendChild(btn);
        });
    }

    let countdownInterval = null;

    function parseTime(str) {
        const [h, m] = str.split(":").map(Number);
        return {h, m};
    }

    function getTargetTime(idx) {
        const today = new Date();
        const {h, m} = parseTime(stunden[idx][1]); // Endzeit
        let target = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0, 0);
        // Falls die Stunde schon vorbei ist, nimm den nächsten Tag
        if (target < today) target.setDate(target.getDate() + 1);
        return target;
    }

    function startCountdown(idx) {
        document.getElementById('auswahl').style.display = "none";
        document.getElementById('countdown-view').style.display = "";
        document.getElementById('stunde-label').textContent = `${idx+1}. Stunde: ${stunden[idx][0]} – ${stunden[idx][1]}`;
        updateCountdown(idx);
        countdownInterval = setInterval(() => updateCountdown(idx), 1000);
    }

    function updateCountdown(idx) {
        const now = new Date();
        const end = getTargetTime(idx);
        let diff = Math.floor((end - now) / 1000);

        if (diff <= 0) {
            document.getElementById('countdown').textContent = "Die Stunde ist vorbei!";
            clearInterval(countdownInterval);
            return;
        }
        const h = Math.floor(diff / 3600);
        diff %= 3600;
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        document.getElementById('countdown').textContent =
            (h > 0 ? `${h}h ` : "") +
            `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }

    function resetView() {
        document.getElementById('auswahl').style.display = "";
        document.getElementById('countdown-view').style.display = "none";
        if (countdownInterval) clearInterval(countdownInterval);
        renderButtons(); // Buttons neu rendern, falls sich die aktuelle Stunde geändert hat
    }

// Initiales Rendern der Buttons mit Markierung
    renderButtons();

// Optional: Die Buttons alle paar Minuten neu rendern, damit die Markierung aktualisiert wird
    setInterval(renderButtons, 60 * 1000); // jede Minute
})