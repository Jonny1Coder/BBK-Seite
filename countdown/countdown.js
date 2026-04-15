window.resetView = function() {
    try {
        const auswahl = document.getElementById && document.getElementById('auswahl');
        if (auswahl) auswahl.style.display = "";
        const view = document.getElementById && document.getElementById('countdown-view');
        if (view) view.style.display = "none";
        if (window.countdownInterval) clearInterval(window.countdownInterval);
    } catch (e) {
        // ignore
    }
};

document.addEventListener("DOMContentLoaded", async function() {
    let schoolEndTitle = "Das Ende von Leiden";
    let schoolEndDate = new Date('2026-05-11T14:40:00');

    function updateSchoolEndTitle() {
        const titleElement = document.querySelector('.schoolend-title');
        if (!titleElement) return;

        const formattedDate = schoolEndDate.toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        titleElement.textContent = `${schoolEndTitle} (${formattedDate}):`;
    }

    try {
        const response = await fetch('../assets/data.json');
        const data = await response.json();
        if (data.dates && data.dates.length > 0) {
            const firstDate = data.dates[0];
            if (firstDate && typeof firstDate.title === 'string' && firstDate.title.trim()) {
                schoolEndTitle = firstDate.title;
            }
            const parsedDate = new Date(firstDate && firstDate.date);
            if (!Number.isNaN(parsedDate.getTime())) {
                schoolEndDate = parsedDate;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
    }

    updateSchoolEndTitle();

    function updateSchoolEndCountdown() {
        const now = new Date();

        if (now >= schoolEndDate) {
            const node = document.getElementById('schoolend-countdown');
            if (node) node.textContent = "Schule ist vorbei! 🎉";
            return;
        }

        const out = formatDateDiff(schoolEndDate, now, 'de-DE');
        const node = document.getElementById('schoolend-countdown');
        if (node) node.textContent = out;
    }

    function formatDateDiff(targetDate, fromDate, locale = 'de-DE') {
        if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) return '';
        if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime())) return '';

        if (targetDate <= fromDate) {
            return locale === 'de-DE' ? '0 Monate, 0 Tage, 00:00:00' : '0 months, 0 days, 00:00:00';
        }

        const cursor = new Date(fromDate.getTime());
        let months = (targetDate.getFullYear() - cursor.getFullYear()) * 12 + (targetDate.getMonth() - cursor.getMonth());

        const monthAnchor = new Date(cursor.getTime());
        monthAnchor.setMonth(monthAnchor.getMonth() + months);
        if (monthAnchor > targetDate) {
            months -= 1;
            monthAnchor.setMonth(monthAnchor.getMonth() - 1);
        }

        let days = 0;
        while (true) {
            const nextDay = new Date(monthAnchor.getTime());
            nextDay.setDate(nextDay.getDate() + 1);
            if (nextDay <= targetDate) {
                days += 1;
                monthAnchor.setTime(nextDay.getTime());
            } else {
                break;
            }
        }

        let remainingSec = Math.floor((targetDate.getTime() - monthAnchor.getTime()) / 1000);
        const hours = Math.floor(remainingSec / 3600);
        remainingSec %= 3600;
        const minutes = Math.floor(remainingSec / 60);
        const seconds = remainingSec % 60;

        const monthWord = locale === 'de-DE' ? (months === 1 ? 'Monat' : 'Monate') : (months === 1 ? 'month' : 'months');
        const dayWord = locale === 'de-DE' ? (days === 1 ? 'Tag' : 'Tage') : (days === 1 ? 'day' : 'days');

        return `${months} ${monthWord}, ${days} ${dayWord}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    setInterval(updateSchoolEndCountdown, 1000);
    updateSchoolEndCountdown();

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

    window.renderButtons = renderButtons;
    window.resetView = function() {
        document.getElementById('auswahl').style.display = "";
        document.getElementById('countdown-view').style.display = "none";
        if (window.countdownInterval) clearInterval(window.countdownInterval);
        const t = document.getElementById('stunde-target'); if (t) t.textContent = '';
        if (typeof renderButtons === 'function') renderButtons();
    }

    let countdownInterval = null;
    window.countdownInterval = countdownInterval;

    let activeCountdownNode = document.getElementById('countdown');
    let pipWindowRef = null;
    let pipWindowCountdownNode = null;
    let currentTargetDate = null;
    let currentLessonIndex = null;

    function getTargetTime(idx) {
        const today = new Date();
        const [h, m] = stunden[idx][1].split(":").map(Number);
        let target = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0, 0);
        if (target < today) target.setDate(target.getDate() + 1);
        return target;
    }

    function startCountdown(idx) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            window.countdownInterval = null;
        }
        document.getElementById('auswahl').style.display = "none";
        document.getElementById('countdown-view').style.display = "";
        document.getElementById('stunde-label').textContent = `${idx+1}. Stunde: ${stunden[idx][0]} – ${stunden[idx][1]}`;
        const targetEl = document.getElementById('stunde-target');
        if (targetEl) targetEl.textContent = '';
        currentTargetDate = getTargetTime(idx);
        currentLessonIndex = idx;
        updateTargetDisplay();
        updateCountdown();
        countdownInterval = setInterval(() => updateCountdown(), 1000);
        window.countdownInterval = countdownInterval;
    }

    function updateTargetDisplay(){
        const targetEl = document.getElementById('stunde-target');
        if (!targetEl || !currentTargetDate) return;
        const hh = String(currentTargetDate.getHours()).padStart(2,'0');
        const mm = String(currentTargetDate.getMinutes()).padStart(2,'0');
        targetEl.textContent = `Ziel: ${hh}:${mm}`;
    }

    function updateCountdown() {
        if (!currentTargetDate) return;
        const now = new Date();
        let diffSec = Math.floor((currentTargetDate - now) / 1000);

        if (diffSec <= 0) {
            const finishedText = "Die Stunde ist vorbei!";
            if (activeCountdownNode) activeCountdownNode.textContent = finishedText;
            if (pipWindowRef && typeof pipWindowRef.setCountdownText === 'function') {
                try { pipWindowRef.setCountdownText(finishedText); } catch (e) {}
            } else if (pipWindowCountdownNode) {
                try { pipWindowCountdownNode.textContent = finishedText; } catch (e) {}
            }

            let elapsed = Math.floor((now - currentTargetDate) / 1000);
            const h = Math.floor(elapsed / 3600);
            elapsed %= 3600;
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            const elapsedText = `vor ${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
            if (activeCountdownNode) activeCountdownNode.textContent = elapsedText;
            if (pipWindowRef && typeof pipWindowRef.setCountdownText === 'function') {
                try { pipWindowRef.setCountdownText(elapsedText); } catch (e) {}
            } else if (pipWindowCountdownNode) {
                try { pipWindowCountdownNode.textContent = elapsedText; } catch (e) {}
            }
            return;
        }

        const h = Math.floor(diffSec / 3600);
        diffSec %= 3600;
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        const text = (h > 0 ? `${h}h ` : "") + `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

        if (activeCountdownNode) activeCountdownNode.textContent = text;
        if (pipWindowRef && typeof pipWindowRef.setCountdownText === 'function') {
            try { pipWindowRef.setCountdownText(text); } catch (e) { pipWindowRef = null; }
        } else if (pipWindowCountdownNode) {
            try { pipWindowCountdownNode.textContent = text; } catch (e) { pipWindowCountdownNode = null; }
        }
    }

    function shiftTargetBy(minutes) {
        if (!currentTargetDate) return;
        currentTargetDate = new Date(currentTargetDate.getTime() + minutes * 60 * 1000);
        updateTargetDisplay();
        updateCountdown();
    }

    const shiftBackBtn = document.getElementById('shift-back');
    const shiftFwdBtn = document.getElementById('shift-forward');
    if (shiftBackBtn) shiftBackBtn.addEventListener('click', () => shiftTargetBy(-15));
    if (shiftFwdBtn) shiftFwdBtn.addEventListener('click', () => shiftTargetBy(15));

    renderButtons();

    const pipBtn = document.getElementById('pip-btn');
    if (pipBtn) {
        const isPipSupported = typeof documentPictureInPicture !== 'undefined' && typeof documentPictureInPicture.requestWindow === 'function';

        async function openCountdownInPiP() {
            if (!isPipSupported) {
                alert('Ihr Browser unterstützt die Document Picture-in-Picture API nicht.');
                return;
            }

            const countdownDiv = document.getElementById('countdown');
            if (!countdownDiv) {
                alert('Countdown-Element nicht gefunden.');
                return;
            }

            try {
                pipBtn.disabled = true;
                const pipWindow = await documentPictureInPicture.requestWindow({ width: 320, height: 140 });

                const styles = document.querySelectorAll('link[rel="stylesheet"], style');
                styles.forEach(style => {
                    try {
                        pipWindow.document.head.appendChild(style.cloneNode(true));
                    } catch (e) {
                        console.warn('Style konnte nicht kopiert werden:', e);
                    }
                });

                pipWindow.document.body.style.margin = '0';
                pipWindow.document.body.style.display = 'flex';
                pipWindow.document.body.style.alignItems = 'center';
                pipWindow.document.body.style.justifyContent = 'center';
                pipWindow.document.body.style.background = 'white';

                const pipStyle = pipWindow.document.createElement('style');
                pipStyle.textContent = `
                  
                  body {
                    font-size: 11px !important;
                    color: #000 !important;
                    background: #fff !important;
                    margin:0;
                    padding:0;
                    align-items:center;
                    justify-content:center;
                    font-family: Arial, Helvetica, sans-serif !important;
                    height: 50%
                  }
                  #countdown, .countdown {
                    font-size: 34px !important;
                    color: #000 !important;
                    font-weight:700 !important;
                    line-height:1 !important;
                  }
                  #stunde-label {
                      font-size: 12px !important;
                      color: #000 !important;
                      font-weight:800 !important;
                      margin:0 0 4px 0; padding:0;
                  }
                  .schoolend-countdown, .exam-countdown {
                    color: #000 !important;
                  }
                  .countdown {
                      margin: 0 !important;
                      padding: 0 !important;
                  }
                `;
                pipWindow.document.head.appendChild(pipStyle);

                try {
                    const pipClone = countdownDiv.cloneNode(true);
                    pipClone.id = 'countdown-pip';
                    pipWindow.document.body.appendChild(pipClone);

                    try {
                        const pipScript = pipWindow.document.createElement('script');
                        pipScript.type = 'text/javascript';
                        pipScript.text = `window.setCountdownText = function(t){ try{ var el = document.getElementById('countdown-pip'); if(el) el.textContent = t;}catch(e){} };`;
                        pipWindow.document.head.appendChild(pipScript);
                    } catch (e) {
                        console.warn('Konnte PiP-Update-Skript nicht einfügen:', e);
                    }

                    pipWindowRef = pipWindow;
                    pipWindowCountdownNode = pipClone;
                } catch (e) {
                    console.warn('Konnte Countdown-Kopie im PiP-Fenster nicht erstellen:', e);
                }

                const restore = () => {
                    try {
                        if (pipWindowRef) {
                            try {
                                const el = pipWindowRef.document.getElementById('countdown-pip');
                                if (el && el.parentNode) el.parentNode.removeChild(el);
                            } catch (e) {
                                // ignore
                            }
                        }
                        pipWindowCountdownNode = null;
                        pipWindowRef = null;
                    } catch (e) {
                        console.error('Fehler beim Rückverschieben des Countdowns:', e);
                        pipWindowCountdownNode = null;
                        pipWindowRef = null;
                    }
                    pipBtn.disabled = false;
                };

                pipWindow.addEventListener('unload', restore);

            } catch (err) {
                pipBtn.disabled = false;
                alert('Fehler beim Öffnen des PiP-Fensters: ' + (err && err.message ? err.message : err));
            }
        }
        pipBtn.addEventListener('click', openCountdownInPiP);
    }
})
