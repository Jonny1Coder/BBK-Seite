document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('exams-list');

    function loadData() {
        return fetch('data.json')
            .then(res => {
                if (!res.ok) throw new Error('Fehler beim Laden von data.json');
                return res.json();
            });
    }

    function createExamCard(exam) {
        const container = document.createElement('div');
        container.className = 'exam-card';

        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.className = 'exam-title';

        const mainLabel = document.createElement('div');
        mainLabel.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        mainLabel.className = 'exam-main-label';

        const mainCountdown = document.createElement('div');
        mainCountdown.className = 'exam-countdown exam-countdown-main';
        mainCountdown.textContent = 'Lädt...';
        mainCountdown.dataset.iso = exam.termin || '';
        mainCountdown.dataset.type = 'termin';

        const nachLabel = document.createElement('div');
        nachLabel.className = 'exam-nach-label';
        const nachText = formatDateISO(exam.nachschreibtermin);
        nachLabel.textContent = nachText ? `Nachschreibtermin: ${nachText}` : '';

        const nachCountdown = document.createElement('div');
        nachCountdown.className = 'exam-countdown exam-countdown-nach';
        nachCountdown.textContent = nachText ? 'Lädt...' : '';
        nachCountdown.dataset.iso = exam.nachschreibtermin || '';
        nachCountdown.dataset.type = 'nach';

        if (!exam.nachschreibtermin) {
            nachLabel.classList.add('hidden');
            nachCountdown.classList.add('hidden');
            nachLabel.textContent = '';
            nachCountdown.textContent = '';
        }

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
        if (now >= target) {
            let diff = Math.floor((now - target) / 1000);
            const days = Math.floor(diff / (3600 * 24));
            diff %= 3600 * 24;
            const hours = Math.floor(diff / 3600);
            diff %= 3600;
            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            elem.textContent = `vor ${days}d ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
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

        const now = new Date();
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

        upcoming.forEach((exam) => {
            const {container, mainCountdown, nachCountdown} = createExamCard(exam);
            list.appendChild(container);
            if (mainCountdown) countdownElems.push(mainCountdown);
            if (exam.nachschreibtermin && nachCountdown) countdownElems.push(nachCountdown);
        });

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
