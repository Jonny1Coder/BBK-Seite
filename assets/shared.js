const stunden = [
    ["07:55", "08:40"],
    ["08:40", "09:25"],
    ["09:40", "10:25"],
    ["10:25", "11:10"],
    ["11:25", "12:10"],
    ["12:10", "12:55"],
    ["13:10", "13:55"],
    ["13:55", "14:40"]
];

/**
 * Konvertiert eine Zeitangabe (HH:MM) in Minuten seit Mitternacht
 * @param {string} str - Zeit im Format "HH:MM"
 * @returns {number} Minuten seit Mitternacht
 */
function timeToMinutes(str) {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
}

/**
 * Gibt den Index der aktuell laufenden Schulstunde zurück
 * @returns {number} Index der Stunde (0-7) oder -1 wenn keine Stunde läuft
 */
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

/**
 * Formatiert ein ISO-Datum in ein lokalisiertes deutsches Format
 * @param {string} iso - ISO-Datum String
 * @returns {string} Formatiertes Datum (z.B. "18.05.2026, 09:00")
 */
function formatDateISO(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

