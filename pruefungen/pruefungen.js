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
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // Erzeugt eine Karte mit zwei Terminen (Haupttermin + Nachschreibtermin)
    function createExamCard(exam) {
        const container = document.createElement('div');
        container.className = 'exam-card';

        // Titel
        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.className = 'exam-title';

        // Haupttermin Label + Countdown (Countdown direkt nach Label im DOM)
        const mainLabel = document.createElement('div');
        mainLabel.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        mainLabel.className = 'exam-main-label';

        const mainCountdown = document.createElement('div');
        mainCountdown.className = 'exam-countdown exam-countdown-main';
        mainCountdown.textContent = 'Lädt...';
        mainCountdown.dataset.iso = exam.termin || '';
        mainCountdown.dataset.type = 'termin';

        // Nachschreibtermin Label + Countdown (immer erzeugen, aber ggf. verstecken)
        const nachLabel = document.createElement('div');
        nachLabel.className = 'exam-nach-label';
        const nachText = formatDateISO(exam.nachschreibtermin);
        nachLabel.textContent = nachText ? `Nachschreibtermin: ${nachText}` : '';

        const nachCountdown = document.createElement('div');
        nachCountdown.className = 'exam-countdown exam-countdown-nach';
        nachCountdown.textContent = nachText ? 'Lädt...' : '';
        nachCountdown.dataset.iso = exam.nachschreibtermin || '';
        nachCountdown.dataset.type = 'nach';

        // Falls kein Nachschreibtermin vorhanden ist: nur das Datumselement und Countdown verbergen, Container bleibt sichtbar
        if (!exam.nachschreibtermin) {
            nachLabel.classList.add('hidden');
            nachCountdown.classList.add('hidden');
            // Zusätzlich leeren wir den Inhalt (Sicherheit)
            nachLabel.textContent = '';
            nachCountdown.textContent = '';
        }

        // Aufbau der Karte: Titel, Haupttermin+Countdown, Nachschreibtermin+Countdown
        container.appendChild(title);

        const mainBlock = document.createElement('div');
        mainBlock.className = 'exam-main-block';
        mainBlock.appendChild(mainLabel);
        mainBlock.appendChild(mainCountdown);

        const nachBlock = document.createElement('div');
        nachBlock.className = 'exam-nach-block';
        nachBlock.appendChild(nachLabel);
        nachBlock.appendChild(nachCountdown);

        container.appendChild(mainBlock);
        container.appendChild(nachBlock);

        return {container, mainCountdown, nachCountdown};
    }

    function updateCountdownElement(elem) {
        const iso = elem.dataset.iso;
        if (!iso) {
            elem.textContent = '';
            return;
        }
        const target = new Date(iso);
        const now = new Date();
        if (isNaN(target)) {
            elem.textContent = '';
            return;
        }
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
        // Annahme: Eine Prüfung gilt als vollständig vorbei, wenn sowohl Haupttermin als auch (falls vorhanden) Nachschreibtermin in der Vergangenheit liegen
        const upcoming = [];
        const fullyExpired = [];
        exams.forEach(exam => {
            const main = exam.termin ? new Date(exam.termin) : null;
            const nach = exam.nachschreibtermin ? new Date(exam.nachschreibtermin) : null;

            if (!main || isNaN(main)) {
                upcoming.push(exam);
                return;
            }

            if (nach) {
                if (main <= now && nach <= now) {
                    fullyExpired.push(exam);
                } else {
                    upcoming.push(exam);
                }
            } else {
                if (main <= now) {
                    fullyExpired.push(exam);
                } else {
                    upcoming.push(exam);
                }
            }
        });

        // Zuerst kommende Prüfungen rendern
        upcoming.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
            list.appendChild(container);
            if (mainCountdown) countdownElems.push(mainCountdown);
            if (exam.nachschreibtermin && nachCountdown) countdownElems.push(nachCountdown);
        });

        // Danach vollständig vergangene Prüfungen rendern (ausgegraut, nach unten)
        fullyExpired.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
            // optische Hervorhebung: ausgegraut (CSS-Klasse statt Inline-Styles)
            container.classList.add('exam-expired');
            container.dataset.fullyExpired = 'true';

            list.appendChild(container);
            if (mainCountdown) countdownElems.push(mainCountdown);
            if (exam.nachschreibtermin && nachCountdown) countdownElems.push(nachCountdown);
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
