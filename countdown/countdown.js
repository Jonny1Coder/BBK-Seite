/* exported resetView, renderButtons */
// Globaler Stub, damit inline onclick="resetView()" im HTML keine "not defined"-Fehler zeigt.
window.resetView = function() {
    // defensives Verhalten falls Script noch nicht vollständig geladen ist
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

document.addEventListener("DOMContentLoaded", function() {
    // Schulende-Datum: 29. Mai 2026, 00:00:00
    const schoolEndDate = new Date(2026, 4, 18, 0, 0, 0, 0); // Monat 4 = Mai (0-basiert)

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

    // Exportiere renderButtons und eine echte resetView-Implementierung global,
    // damit das Inline-onclick und externe Aufrufer funktionieren.
    window.renderButtons = renderButtons;
    window.resetView = function() {
        document.getElementById('auswahl').style.display = "";
        document.getElementById('countdown-view').style.display = "none";
        if (window.countdownInterval) clearInterval(window.countdownInterval);
        if (typeof renderButtons === 'function') renderButtons();
    }

    let countdownInterval = null;
    window.countdownInterval = countdownInterval;

    let activeCountdownNode = document.getElementById('countdown');
    let pipWindowRef = null;
    let pipWindowCountdownNode = null;
    // mutable target date for currently selected lesson
    let currentTargetDate = null;
    let currentLessonIndex = null;

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
        // stoppe evtl. vorherigen Countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            window.countdownInterval = null;
        }
        document.getElementById('auswahl').style.display = "none";
        document.getElementById('countdown-view').style.display = "";
        document.getElementById('stunde-label').textContent = `${idx+1}. Stunde: ${stunden[idx][0]} – ${stunden[idx][1]}`;
        // create a mutable target date so shift buttons can modify it
        currentTargetDate = getTargetTime(idx);
        currentLessonIndex = idx;
        updateCountdown();
        countdownInterval = setInterval(() => updateCountdown(), 1000);
        // keep the global reference in sync so resetView() can clear it
        window.countdownInterval = countdownInterval;
    }

    function updateCountdown(idx) {
        if (!currentTargetDate) return;
        const now = new Date();
        let diffSec = Math.floor((currentTargetDate - now) / 1000);

        // If target is already passed, show "Die Stunde ist vorbei!" and stop interval
        if (diffSec <= 0) {
            const finishedText = "Die Stunde ist vorbei!";
            if (activeCountdownNode) activeCountdownNode.textContent = finishedText;
            if (pipWindowRef && typeof pipWindowRef.setCountdownText === 'function') {
                try { pipWindowRef.setCountdownText(finishedText); } catch (e) {}
            } else if (pipWindowCountdownNode) {
                try { pipWindowCountdownNode.textContent = finishedText; } catch (e) {}
            }
            // keep running but show elapsed time as negative (how long since finished)
            // compute elapsed seconds
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

    // shift target by minutes (positive or negative)
    function shiftTargetBy(minutes) {
        if (!currentTargetDate) return;
        currentTargetDate = new Date(currentTargetDate.getTime() + minutes * 60 * 1000);
        // update label to reflect changed target (optional)
        if (currentLessonIndex !== null) {
            document.getElementById('stunde-label').textContent = `${currentLessonIndex+1}. Stunde: ${stunden[currentLessonIndex][0]} – ${stunden[currentLessonIndex][1]} (Ziel: ${currentTargetDate.getHours().toString().padStart(2,'0')}:${currentTargetDate.getMinutes().toString().padStart(2,'0')})`;
        }
        updateCountdown();
    }

    // hook shift buttons
    const shiftBackBtn = document.getElementById('shift-back');
    const shiftFwdBtn = document.getElementById('shift-forward');
    if (shiftBackBtn) shiftBackBtn.addEventListener('click', () => shiftTargetBy(-15));
    if (shiftFwdBtn) shiftFwdBtn.addEventListener('click', () => shiftTargetBy(15));

    // Initiales Rendern der Buttons mit Markierung
    renderButtons();

    // --- Picture-in-Picture (Document Picture-in-Picture API) Button-Handler ---
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
                // Öffne ein neues PiP-Fenster
                const pipWindow = await documentPictureInPicture.requestWindow({ width: 320, height: 140 });

                // Kopiere notwendige Styles in das PiP-Dokument, damit das Aussehen erhalten bleibt
                const styles = document.querySelectorAll('link[rel="stylesheet"], style');
                styles.forEach(style => {
                    try {
                        pipWindow.document.head.appendChild(style.cloneNode(true));
                    } catch (e) {
                        // Ignoriere wenn ein Style nicht kopiert werden kann
                        console.warn('Style konnte nicht kopiert werden:', e);
                    }
                });

                // Etwas Basis-Layout für das PiP-Fenster
                pipWindow.document.body.style.margin = '0';
                pipWindow.document.body.style.display = 'flex';
                pipWindow.document.body.style.alignItems = 'center';
                pipWindow.document.body.style.justifyContent = 'center';
                pipWindow.document.body.style.background = 'white';

                // PiP-spezifische CSS: kleinere Schrift und schwarzer Text
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
                    font-size: 18px !important;
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
                    // give it a unique id inside the PiP document
                    pipClone.id = 'countdown-pip';
                    pipWindow.document.body.appendChild(pipClone);

                    // create a small script in the PiP window that exposes a setter function
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

                // Wenn das PiP-Fenster geschlossen wird: nur Referenzen aufräumen und Button aktivieren
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
