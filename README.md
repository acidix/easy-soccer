# ⚽ Easy Soccer

Mit **Easy Soccer** verwalten Jugendfußball-Trainer ihre Mannschaften, Formationen und Aufstellungen auf modernste, intuitive Weise. Die Webapplikation bietet ein ansprechendes Premium-Design im smaragdgrünen Dark-Mode (Glassmorphismus), interaktive Taktiktafeln mit Drag-and-Drop, Echtzeit-Analysen und einen detaillierten Vergleich von Aufstellungen inklusive SVG-Radar-Chart (Spinnennetz-Diagramm).

---

## ✨ Kernfunktionen

### 1. 📋 Kader- & Spielermanagement
* **Detaillierte Spielerprofile**: Erfassung von Namen, Trikotnummern, bevorzugtem Fuß (Links, Rechts, Beidfüßig) sowie spezifischen Leistungsbewertungen in 5 Kernbereichen (Schuss, Passen, Dribbling, Tackling, Tempo).
* **Torwart-Spezialisierung**: Eigene Bewertungskategorie für Torwart-Reflexe.
* **Flexible Sortierung**:
  * *Manuelles Verschieben*: Spieler über Pfeiltasten (`▲` / `▼`) flexibel im Roster anordnen.
  * *Automatisches Sortieren*: Spaltenköpfe für Trikotnummer oder Name anklicken für sofortige alphabetische oder numerische Sortierung.
  * *Datenpersistenz*: Die individuelle Reihenfolge (`sortOrder`) wird dauerhaft gespeichert.
* **Trikotnummern-Schutz**: Verhindert doppelte Jersey-Nummern. Bei manueller Änderung inline wird die Validierung beim Verlassen des Feldes (`onBlur`) durchgeführt, um ungestörte mehrstellige Eingaben zu ermöglichen.

### 2. 🛡️ Taktiktafel & Auto-Aufstellung
* **Interaktives Spielfeld**: Spieler per Klick oder Drag-and-Drop auf dem Feld positionieren.
* **Smarte Auto-Aufstellung**: Ein intelligenter, greedy-basierter Algorithmus stellt die Mannschaft vollautomatisch auf Basis der Spieler-Ratings auf:
  * Torhüter werden zuverlässig im Tor platziert.
  * Stürmer und Abwehrspieler werden entsprechend ihrer Stärken zugeteilt.
  * **Flügel-Ausrichtung**: Linksfüßer werden bevorzugt auf der linken Spielfeldhälfte aufgestellt, während Rechtsfüßer auf die rechte Seite kommen.
* **Echtzeit-Stärkeanalyse**: Graphische "Mannschaftsanalyse"-Karte direkt unter dem Spielfeld mit Neon-glow Progress-Bars für Torwart, Abwehr, Mittelfeld und Sturm sowie einem Badge für die Gesamtteamstärke.

### 3. 📐 Formations-Designer
* **Eigene Formationen erstellen**: Über ein interaktives Taktikfeld können Spieler-Dots frei verschoben werden.
* **Spieleranzahl-Regler**: Flexible Systeme von 5er- bis 11er-Teams (inklusive Torwart).
* **Dynamische Zonen-Erkennung**: Das System teilt die Spieler auf dem Feld automatisch in Abwehr, Mittelfeld und Sturm ein und generiert in Echtzeit den passenden Formations-Code (z.B. `2-3-1`).
* **Speichern & Verwalten**: Eigene Spielsysteme benennen und dauerhaft sichern.

### 4. 📊 Aufstellungs-Vergleich & Spinnennetz-Chart
* **Gegenüberstellung**: Zwei Aufstellungen (des gleichen Teams oder verschiedener Teams) übersichtlich nebeneinander betrachten.
* **Pures SVG-Radar-Chart**: Ein hochpräzises, rein vektorisiertes Spinnennetz-Diagramm vergleicht die Durchschnittswerte beider Teams in allen 6 Attributen visuell in Echtzeit.
* **Trainer-Spielprognose**: Automatisierte, mathematische Analyse der Team-Durchschnitte inklusive taktischer Spielprognose für beide Mannschaften.

### 5. 🖨️ PDF-Export & Druckansicht
* **Optimierte Druckseiten**: Ein Klick auf "Drucken" öffnet den Druckdialog des Browsers.
* **Perfektes A4-Format**: Dank dedizierter CSS-Druckmedienstile (`@media print`) werden Navigationsleisten und Editor-Buttons ausgeblendet. Das Spielfeld wird optimal zentriert, gefolgt von einer sauberen, übersichtlichen Tabelle aller Spieler und ihrer Positionen.

---

## 🛠️ Technologie-Stack

* **Core**: [React 18](https://react.dev/) mit [TypeScript](https://www.typescriptlang.org/)
* **Build-Tool**: [Vite](https://vitejs.dev/)
* **Styling**: Vanilla-CSS mit edlen Glassmorphismus-Effekten, CSS-Variablen für ein flexibles Farbsystem und flüssigen CSS-Transitionen.
* **Icons**: [Lucide React](https://lucide.dev/)
* **Datenbank & Sync**: [Firebase Firestore & Authentication](https://firebase.google.com/)
  * **Local-first Fallback**: Läuft ohne Firebase-Konfiguration oder bei Offline-Verbindung vollautomatisch über den lokalen Browserspeicher (`localStorage`).

---

## 🚀 Installation & Lokale Ausführung

### 1. Voraussetzungen
Stelle sicher, dass [Node.js](https://nodejs.org/) (Version 16 oder höher) auf deinem System installiert ist.

### 2. Repository klonen und installieren
Navigiere in das Projektverzeichnis und installiere alle Abhängigkeiten:
```bash
npm install
```

### 3. Entwicklungsserver starten
Starte den lokalen Vite-Server:
```bash
npm run dev
```
Öffne anschließend die im Terminal angezeigte URL (in der Regel `http://localhost:5173`) in deinem Browser. Klicke auf **"Lokal ohne Anmeldung fortfahren"**, um die Anwendung direkt offline zu testen!

### 4. Optional: Firebase einrichten
Kopiere die `.env.example` zu `.env` und trage deine Firebase-Konfigurationsdaten ein:
```bash
cp .env.example .env
```
Sobald die Variablen gefüllt sind, ist der Login über Google-Auth sowie der Cloud-Sync für mehrere Endgeräte aktiv.

---

## 📦 Production Build & Deployment

Um ein hochoptimiertes, minifiziertes Paket für das Deployment (z. B. auf Vercel, Netlify oder einen eigenen Server) zu erstellen, führe aus:
```bash
npm run build
```
Die fertigen statischen HTML/CSS/JS-Dateien befinden sich anschließend im Ordner `dist/`.

---

Easy Soccer wurde mit Liebe zum Detail für moderne Jugendfußball-Trainer entwickelt. ⚽🔥
