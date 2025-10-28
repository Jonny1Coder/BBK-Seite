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
        container.style.alignItems = 'flex-start';
        container.style.gap = '12px';

        const left = document.createElement('div');
        left.style.flex = '1 1 60%';

        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.style.fontWeight = 'bold';
        title.style.fontSize = '1.2rem';
        left.appendChild(title);

        // Haupttermin Block
        const mainBlock = document.createElement('div');
        mainBlock.style.marginTop = '8px';
        const mainLabel = document.createElement('div');
        mainLabel.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        mainLabel.style.fontSize = '0.95rem';
        mainBlock.appendChild(mainLabel);

        const mainHint = document.createElement('div');
        mainHint.textContent = 'Countdown zum Haupttermin:';
        mainHint.style.fontSize = '0.85rem';
        mainHint.style.color = '#333';
        mainBlock.appendChild(mainHint);

        // Nachschreib Block
        const nachBlock = document.createElement('div');
        nachBlock.style.marginTop = '8px';
        const nachLabel = document.createElement('div');
        nachLabel.textContent = `Nachschreibtermin: ${formatDateISO(exam.nachschreibtermin)}`;
        nachLabel.style.fontSize = '0.95rem';
        nachBlock.appendChild(nachLabel);

        const nachHint = document.createElement('div');
        nachHint.textContent = 'Countdown zum Nachschreibtermin:';
        nachHint.style.fontSize = '0.85rem';
        nachHint.style.color = '#333';
        nachBlock.appendChild(nachHint);

        left.appendChild(mainBlock);
        left.appendChild(nachBlock);

        // Right: zwei Countdowns, jeweils rechtsbündig
        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.flexDirection = 'column';
        right.style.alignItems = 'flex-end';
        right.style.gap = '8px';
        right.style.minWidth = '220px';

        const mainCountdown = document.createElement('div');
        mainCountdown.className = 'exam-countdown';
        mainCountdown.style.fontFamily = 'Consolas, "Fira Mono", monospace';
        mainCountdown.style.fontSize = '1.05rem';
        mainCountdown.style.color = '#b08d00';
        mainCountdown.textContent = 'Lädt...';
        // Metadaten
        mainCountdown.dataset.iso = exam.termin;
        mainCountdown.dataset.type = 'termin';

        const nachCountdown = document.createElement('div');
        nachCountdown.className = 'exam-countdown';
        nachCountdown.style.fontFamily = 'Consolas, "Fira Mono", monospace';
        nachCountdown.style.fontSize = '1.05rem';
        nachCountdown.style.color = '#0056b3';
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
        if (now >= target) {
            const type = elem.dataset.type === 'nach' ? 'Nachschreibtermin' : 'Prüfung';
            elem.textContent = `${type} vorbei`; // z.B. "Prüfung vorbei" oder "Nachschreibtermin vorbei"
            return;
        }
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
        exams.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
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
