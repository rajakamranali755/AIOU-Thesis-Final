# 📚 Academic Thesis Builder

A production-ready React application for building and exporting professionally formatted academic thesis documents — compliant with **HEC (Higher Education Commission)** and **University of Gujrat** formatting standards.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+

### Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

---

## ☁️ Deployment Options

### Vercel (Recommended, Free)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag & drop the dist/ folder at netlify.com/drop
```

### GitHub Pages
```bash
npm install -D gh-pages
# Add to package.json scripts: "deploy": "gh-pages -d dist"
npm run deploy
```

### Static Server / cPanel
```bash
npm run build
# Upload contents of dist/ to your public_html
```

---

## 📁 Project Structure

```
thesis-builder/
├── src/
│   ├── components/
│   │   ├── ThesisBuilder.jsx
│   │   ├── CoverStep.jsx
│   │   ├── PreliminaryStep.jsx
│   │   ├── ChaptersStep.jsx
│   │   ├── ReferencesStep.jsx
│   │   └── PreviewPane.jsx
│   ├── data/
│   │   └── sampleData.js
│   ├── utils/
│   │   └── wordExport.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 📋 Format Specs (HEC Compliant)

| Element | Specification |
|---------|--------------|
| Paper | A4 |
| Font | Times New Roman |
| Body text | 12pt, 1.5 spacing, justified |
| Left margin | 3.8cm (1.5 inch) |
| Other margins | 2.5cm (1 inch) |
| Chapter number | 14pt Bold Underlined RIGHT ALL CAPS |
| Chapter title | 12pt Bold Center ALL CAPS |
| Section (1.1) | 11pt Bold Left Title Case |
| Sub-section (1.1.1) | 11pt Bold Left Title Case |
| Table caption | ABOVE table, 12pt Bold |
| Figure caption | BELOW figure, 11pt, bold label |
| References | 11pt single-spaced APA 7th hanging indent |

---

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS v3
- Lucide React icons
- Pure client-side — no backend required

---

MIT License
