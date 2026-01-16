# Aufbau

- `./countdown`: Countdown der Schulstunden bis zum Ende des Schultags
- `./pruefungen`: Prüfunsg-Übersicht mit Countdown für Prüfungen

## Ordner `pruefungen` — Dateien & Funktionen

### `pruefungen/index.html`
- Einfaches HTML-Frontend zur Anzeige der Prüfungen.
- Wichtige Elemente:
    - `#exams-list` — Container, in den die Prüfungs-Karten (DOM) eingefügt werden.
- Lädt `pruefungen.js`.

### `pruefungen/data.json`
- Enthält die Prüfungsdaten im JSON-Format.
- Schema:
    - Root-Objekt mit Array-Property `exams`.
    - Jedes Element hat mindestens:
        - `fach` (String) — Bezeichnung des Fachs/Event.
        - `termin` (ISO-8601 String) — Haupttermin (z. B. `2026-05-18T09:00:00`).
        - optional `nachschreibtermin` (ISO-8601 String) — Nachschreibtermin.
- Hinweis: `pruefungen.js` erwartet `termin` und `nachschreibtermin`; beim Weglassen müssen Validierungs-/Fallback-Logiken ergänzt werden.

### `pruefungen/pruefungen.js`
Beschreibung der wichtigsten Funktionen und ihres Verhaltens:

- `loadData()`
    - Liefert ein Promise mit dem geparsten JSON aus `data.json`.
    - Werfen eines Fehlers bei fehlerhaftem HTTP-Status.

- `formatDateISO(iso)`
    - Wandelt einen ISO-Datum-String in eine lokalisierte (de-DE) Datums-/Uhrzeitdarstellung um.
    - Rückgabe: String, z. B. `18.05.2026, 09:00`.

- `createExamCard(exam)`
    - Erzeugt und returned ein DOM-Fragment (Element) für eine Prüfungs-Karte.
    - Struktur / Klassen (wichtig für Styling):
        - Container `.exam-card`
        - `.exam-title` — Fach
        - `.exam-main-label` & `.exam-countdown.exam-countdown-main` — Haupttermin + Countdown
            - Countdown-Element erhält `dataset.iso = exam.termin` und `dataset.type = 'termin'`
        - `.exam-nach-label` & `.exam-countdown.exam-countdown-nach` — Nachschreibtermin + Countdown
            - Countdown-Element erhält `dataset.iso = exam.nachschreibtermin` und `dataset.type = 'nach'`
    - Rückgabe: `{ container, mainCountdown, nachCountdown }`

- `updateCountdownElement(elem)`
    - Liest `elem.dataset.iso` und berechnet verbleibende Zeit bis zum Ziel oder vergangene Zeit seit Ziel.
    - Anzeige-Format:
        - Bei Zukunft: `Xd HHh MMm SSs`
        - Bei Vergangenheit: Präfix `vor` gefolgt von `Xd HHh MMm SSs` (gemäß Nutzerwunsch)
    - Setzt `elem.textContent`.

- Ablauf beim Laden
    - `loadData()` → `exams` aus JSON.
    - Trennung in `upcoming` und `fullyExpired`:
        - `fullyExpired` wenn sowohl `termin` als auch `nachschreibtermin` in der Vergangenheit sind.
    - Rendern:
        - Zuerst kommende Prüfungen (normal).
        - Anschließend voll ausgefallene Prüfungen mit Klasse `.exam-expired`.
    - Alle Countdown-Elemente werden in ein Array gesammelt.
    - `tick()` ruft `updateCountdownElement` für alle Elemente auf; Ausführung jede Sekunde via `setInterval`.

- Fehlerbehandlung
    - Bei Fehlern beim Laden: Meldung in `#exams-list` und `console.error`.

## Styling / CSS-Klassen (kurz)
- `.exam-card`, `.exam-title`, `.exam-main-label`, `.exam-nach-label`
- `.exam-countdown`, `.exam-countdown-main`, `.exam-countdown-nach`
- `.exam-expired` — optisches Ausgrauen
- Diese Klassen sind in der übergeordneten `style.css` definiert.

## Hinweise für Entwickler
- `pruefungen.js` manipuliert DOM direkt — beim Testen im Browser einen lokalen Server verwenden (z. B. `python -m http.server` oder die integrierte Server-Funktion der IDE), da `fetch('data.json')` sonst fehlschlägt.
- Beim Hinzufügen von Prüfungen in `data.json` ISO-8601-Format verwenden.
- Wenn `nachschreibtermin` optional sein soll, empfiehlt sich eine kleine Validierung in `createExamCard` / `updateCountdownElement`, um `undefined`- oder `Invalid Date`-Fälle abzudecken.
