document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('exams-list');

    function loadData() {
        return fetch('data.json')
            .then(res => {
                if (!res.ok) throw new Error('Fehler beim Laden von data.json');
                return res.json();
            });
    }

    function formatDateISO(iso) {
        const d = new Date(iso);
        return d.toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // Erzeugt eine Karte mit zwei Terminen (Haupttermin + Nachschreibtermin)
    function createExamCard(exam) {
        const container = document.createElement('div');
        container.className = 'exam-card';
        container.style.padding = '12px 16px';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '12px';
        container.style.background = '#fff';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        // damit die linke und rechte Spalte gleich hoch sind
        container.style.alignItems = 'stretch';
        container.style.gap = '12px';

        const left = document.createElement('div');
        left.style.flex = '1 1 60%';
        // linke Spalte als Column: oberer Block (Titel + Haupttermin) und unterer Block (Nachschreibtermin)
        left.style.display = 'flex';
        left.style.flexDirection = 'column';
        left.style.justifyContent = 'space-between';

        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.style.fontWeight = '700';
        title.style.fontSize = '1.2rem';

        // Oberer Block: Titel + Haupttermin (so bleiben sie oben)
        const topGroup = document.createElement('div');
        topGroup.style.display = 'flex';
        topGroup.style.flexDirection = 'column';
        topGroup.appendChild(title);

        // Haupttermin Block (größer)
        const mainBlock = document.createElement('div');
        mainBlock.style.marginTop = '8px';
        const mainLabel = document.createElement('div');
        mainLabel.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        mainLabel.style.fontSize = '1.05rem';
        mainLabel.style.fontWeight = '600';
        mainLabel.style.color = '#222';
        mainBlock.appendChild(mainLabel);

        topGroup.appendChild(mainBlock);

        // Nachschreib Block (kleiner) - bleibt unten
        const nachBlock = document.createElement('div');
        nachBlock.style.marginTop = '8px';
        const nachLabel = document.createElement('div');
        nachLabel.textContent = `Nachschreibtermin: ${formatDateISO(exam.nachschreibtermin)}`;
        nachLabel.style.fontSize = '0.95rem';
        nachLabel.style.color = '#555';
        nachBlock.appendChild(nachLabel);

        left.appendChild(topGroup);
        left.appendChild(nachBlock);

        // Right: zwei Countdowns, jeweils rechtsbündig und am unteren Rand der linken Blöcke ausgerichtet
        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.flexDirection = 'column';
        // verteile die Countdowns so, dass einer oben, einer unten sitzt und damit auf Höhe der Labels
        right.style.justifyContent = 'space-between';
        right.style.alignItems = 'flex-end';
        right.style.gap = '8px';
        right.style.minWidth = '220px';

        const mainCountdown = document.createElement('div');
        mainCountdown.className = 'exam-countdown';
        mainCountdown.style.fontFamily = 'Consolas, "Fira Mono", monospace';
        mainCountdown.style.fontSize = '1.25rem';
        mainCountdown.style.fontWeight = '700';
        mainCountdown.style.color = '#b08d00';
        mainCountdown.textContent = 'Lädt...';
        // Metadaten
        mainCountdown.dataset.iso = exam.termin;
        mainCountdown.dataset.type = 'termin';

        const nachCountdown = document.createElement('div');
        nachCountdown.className = 'exam-countdown';
        nachCountdown.style.fontFamily = 'Consolas, "Fira Mono", monospace';
        nachCountdown.style.fontSize = '0.95rem';
        nachCountdown.style.fontWeight = '600';
        nachCountdown.style.color = '#666';
        nachCountdown.textContent = 'Lädt...';
        nachCountdown.dataset.iso = exam.nachschreibtermin;
        nachCountdown.dataset.type = 'nach';

        right.appendChild(mainCountdown);
        right.appendChild(nachCountdown);

        container.appendChild(left);
        container.appendChild(right);

        return {container, mainCountdown, nachCountdown};
    }

    function updateCountdownElement(elem) {
        const iso = elem.dataset.iso;
        if (!iso) {
            elem.textContent = '-';
            return;
        }
        const target = new Date(iso);
        const now = new Date();
        // Wenn Ziel in der Vergangenheit liegt: zeige die Zeit seit dem Ereignis (laufend)
        if (now >= target) {
            let diff = Math.floor((now - target) / 1000); // vergangene Sekunden
            const days = Math.floor(diff / (3600 * 24));
            diff %= 3600 * 24;
            const hours = Math.floor(diff / 3600);
            diff %= 3600;
            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            // Nutzerwunsch: statt "seit" soll "vor" angezeigt werden
            elem.textContent = `vor ${days}d ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
            return;
        }
        // Sonst: Countdown bis zum Ereignis
        let diff = Math.floor((target - now) / 1000);
        const days = Math.floor(diff / (3600 * 24));
        diff %= 3600 * 24;
        const hours = Math.floor(diff / 3600);
        diff %= 3600;
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        elem.textContent = `${days}d ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
    }

    loadData().then(data => {
        const exams = data.exams || [];
        const countdownElems = [];

        const now = new Date();
        // Annahme: Eine Prüfung gilt als vollständig vorbei, wenn sowohl Haupttermin als auch Nachschreibtermin in der Vergangenheit liegen
        const upcoming = [];
        const fullyExpired = [];
        exams.forEach(exam => {
            const main = new Date(exam.termin);
            const nach = new Date(exam.nachschreibtermin);
            if (main <= now && nach <= now) {
                fullyExpired.push(exam);
            } else {
                upcoming.push(exam);
            }
        });

        // Zuerst kommende Prüfungen rendern
        upcoming.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
            list.appendChild(container);
            countdownElems.push(mainCountdown, nachCountdown);
        });

        // Danach vollständig vergangene Prüfungen rendern (ausgegraut, nach unten)
        fullyExpired.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
            // optische Hervorhebung: ausgegraut
            container.style.opacity = '0.65';
            container.style.filter = 'grayscale(40%)';
            container.style.background = '#f5f5f5';
            container.dataset.fullyExpired = 'true';

            list.appendChild(container);
            countdownElems.push(mainCountdown, nachCountdown);
        });

        function tick() {
            countdownElems.forEach(elem => updateCountdownElement(elem));
        }

        tick();
        setInterval(tick, 1000);
    }).catch(err => {
        list.textContent = 'Fehler beim Laden der Prüfungsdaten.';
        console.error(err);
    });
});
