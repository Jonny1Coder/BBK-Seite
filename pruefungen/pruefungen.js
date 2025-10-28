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

    function createExamCard(exam, idx) {
        const container = document.createElement('div');
        container.className = 'exam-card';
        container.style.padding = '12px 16px';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '12px';
        container.style.background = '#fff';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';

        const left = document.createElement('div');
        const title = document.createElement('div');
        title.textContent = `${exam.fach}`;
        title.style.fontWeight = 'bold';
        title.style.fontSize = '1.2rem';
        left.appendChild(title);

        const dateSmall = document.createElement('div');
        dateSmall.textContent = `Termin: ${formatDateISO(exam.termin)}`;
        dateSmall.style.fontSize = '0.95rem';
        left.appendChild(dateSmall);

        const nach = document.createElement('div');
        nach.textContent = `Nachschreibtermin: ${formatDateISO(exam.nachschreibtermin)}`;
        nach.style.fontSize = '0.85rem';
        nach.style.color = '#555';
        left.appendChild(nach);

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.flexDirection = 'column';
        right.style.alignItems = 'flex-end';

        const countdown = document.createElement('div');
        countdown.className = 'exam-countdown';
        countdown.style.fontFamily = 'Consolas, "Fira Mono", monospace';
        countdown.style.fontSize = '1.1rem';
        countdown.style.color = '#b08d00';
        countdown.textContent = 'Lädt...';

        const switchBtn = document.createElement('button');
        switchBtn.textContent = 'Zum Nachschreibtermin';
        switchBtn.style.marginTop = '8px';
        switchBtn.onclick = () => {
            // Toggle between main termin and nachschreibtermin
            const current = countdown.getAttribute('data-target');
            if (current === 'termin') {
                countdown.setAttribute('data-target', 'nach');
                switchBtn.textContent = 'Zum Haupttermin';
            } else {
                countdown.setAttribute('data-target', 'termin');
                switchBtn.textContent = 'Zum Nachschreibtermin';
            }
            // sofort aktualisieren
            updateCountdownForElement(countdown, exam);
        };

        right.appendChild(countdown);
        right.appendChild(switchBtn);

        container.appendChild(left);
        container.appendChild(right);

        // set initial target attribute
        countdown.setAttribute('data-target', 'termin');

        // store exam data on element for easy access
        countdown._exam = exam;

        return {container, countdown};
    }

    function updateCountdownForElement(elem, exam) {
        const targetKey = elem.getAttribute('data-target') || 'termin';
        const iso = targetKey === 'termin' ? exam.termin : exam.nachschreibtermin;
        const target = new Date(iso);
        const now = new Date();
        if (now >= target) {
            elem.textContent = targetKey === 'termin' ? 'Prüfung läuft oder vorbei 🎓' : 'Nachschreibtermin vorbei';
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
        const elems = [];
        exams.forEach((exam, idx) => {
            const {container, countdown} = createExamCard(exam, idx);
            list.appendChild(container);
            elems.push({countdown, exam});
        });

        function tick() {
            elems.forEach(({countdown, exam}) => updateCountdownForElement(countdown, exam));
        }

        tick();
        setInterval(tick, 1000);
    }).catch(err => {
        list.textContent = 'Fehler beim Laden der Prüfungsdaten.';
        console.error(err);
    });
});

