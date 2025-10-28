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

        const left = document.createElement('div');
        left.className = 'exam-left';

        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.className = 'exam-title';

        // Oberer Block: Titel + Haupttermin (so bleiben sie oben)
        const topGroup = document.createElement('div');
        topGroup.className = 'exam-top';
        topGroup.appendChild(title);

        // Haupttermin Block (größer)
        const mainBlock = document.createElement('div');
        const mainLabel = document.createElement('div');
        mainLabel.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        mainLabel.className = 'exam-main-label';
        mainBlock.appendChild(mainLabel);

        topGroup.appendChild(mainBlock);

        // Nachschreib Block (kleiner) - bleibt unten
        const nachBlock = document.createElement('div');
        const nachLabel = document.createElement('div');
        nachLabel.textContent = `Nachschreibtermin: ${formatDateISO(exam.nachschreibtermin)}`;
        nachLabel.className = 'exam-nach-label';
        nachBlock.appendChild(nachLabel);

        left.appendChild(topGroup);
        left.appendChild(nachBlock);

        // Right: zwei Countdowns, jeweils rechtsbündig und am unteren Rand der linken Blöcke ausgerichtet
        const right = document.createElement('div');
        right.className = 'exam-right';

        const mainCountdown = document.createElement('div');
        // Klassen: Basis + Variante
        mainCountdown.className = 'exam-countdown exam-countdown-main';
        mainCountdown.textContent = 'Lädt...';
        // Metadaten
        mainCountdown.dataset.iso = exam.termin;
        mainCountdown.dataset.type = 'termin';

        const nachCountdown = document.createElement('div');
        nachCountdown.className = 'exam-countdown exam-countdown-nach';
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
            // optische Hervorhebung: ausgegraut (CSS-Klasse statt Inline-Styles)
            container.classList.add('exam-expired');
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
