# 🏔️ Mario & Sonic Winter Olympics — Torneo Olimpico

> **Un'app web per trasformare una serata tra amici con la Wii in una vera cerimonia olimpica.**  
> Costruita in React + TypeScript, deployata su GitHub Pages, ispirata alle Olimpiadi di Milano Cortina 2026.

[![Deploy](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00cfff?style=for-the-badge&logo=github)](https://andred2909.github.io/WinterOlympicGamesAtHome2026/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)

---

## 🎮 Di cosa si tratta

In occasione delle **Olimpiadi Invernali Milano Cortina 2026**, ho organizzato una serata a tema con amici: Mario & Sonic at the Olympic Winter Games su Nintendo Wii, trasformata in un vero torneo con classifica, punteggi e cerimonia di premiazione.

Invece di tenere il punteggio su un foglio di carta, ho costruito questa **web app in tempo reale** per gestire tutto in modo professionale (e divertente).

---

## ✨ Features

- 🏆 **Classifica in tempo reale** con podio animato e progress bar
- 🎿 **6 eventi olimpici** — incluso il Dream Snowboard Cross a **punti doppi**
- ⭐ **Sistema bonus** con 11 premi speciali, tra cui 3 bonus segreti svelati solo a metà serata
- 🔐 **Pannello Admin protetto da password** per l'inserimento risultati
- 💾 **Auto-save su localStorage** — i dati non si perdono mai
- 📱 **Responsive** — funziona su telefono, tablet e PC
- 🚀 **Deploy automatico** su GitHub Pages via GitHub Actions

---

## 🛠️ Stack Tecnico

| Tecnologia | Scelta |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | CSS-in-JS (inline styles) con design system custom |
| State | useState + localStorage persistence |
| Deploy | GitHub Actions → GitHub Pages |
| Font | Bebas Neue + Exo 2 (Google Fonts) |

Nessuna libreria UI esterna. Tutto il design — dark theme, animazioni neve, podio, badge medaglie — è scritto a mano con stili inline e CSS keyframes.

---

## 🏅 Come funziona il torneo

Ogni giocatore sceglie un personaggio (Mario, Sonic, Peach, Shadow...) e una nazione da rappresentare. Si giocano 6 eventi in ordine:

| # | Evento | Note |
|---|---|---|
| 1 | 🎿 Salto con gli Sci | Riscaldamento |
| 2 | 🛷 Bob | |
| 3 | 🥌 Curling | Pausa + rivelazione bonus segreti |
| 4 | 🩰 Pattinaggio di Figura | |
| 5 | 🏒 Hockey su Ghiaccio | |
| 6 | 🏂 Dream Snowboard Cross | **Finale — punti doppi!** |

**Punti per piazzamento:** 🥇 5pt · 🥈 3pt · 🥉 2pt · 4° 1pt

Oltre ai punti evento, si assegnano **bonus speciali** durante la serata — dal Premio Simpatia al Telecronista, dal Doppio Carburante alla Nemesi Giurata.

---

## 🚀 Avvio locale

```bash
# Clona il repo
git clone https://github.com/andred2909/WinterOlympicGamesAtHome2026.git
cd WinterOlympicGamesAtHome2026

# Installa le dipendenze
npm install

# Avvia in sviluppo
npm run dev
```

Crea un file `.env` nella root con:
```
VITE_ADMIN_PASSWORD=tuapassword
```

---

## 📦 Deploy

Il progetto si deploya automaticamente su GitHub Pages ad ogni push su `master` tramite GitHub Actions. Il workflow:

1. Installa le dipendenze
2. Esegue `npm run build` iniettando i secrets
3. Publica la cartella `dist/` sul branch `gh-pages`

---

## 💡 Cosa ho imparato

Questo progetto è nato in una serata e cresciuto iterativamente. Alcune cose interessanti che ho affrontato:

- **TypeScript strict mode** su un progetto esistente in JSX — refactoring completo con tipi espliciti, `import type`, e risoluzione di tutti gli errori di inferenza
- **`verbatimModuleSyntax`** e come gestire correttamente i type-only imports
- **React purity rules** — spostare `Math.random()` fuori dal render per i fiocchi di neve
- **GitHub Actions** per CI/CD con variabili d'ambiente iniettate al build time
- **GitHub Pages** con `base` path in Vite per il routing corretto su sottodomini

---

## 📸 Screenshot

> *Classifica in tempo reale con podio e progress bar*

![App Screenshot]
<img width="1911" height="876" alt="image" src="https://github.com/user-attachments/assets/dda443fa-42ac-47fc-b5ff-de5d06dab6be" />


---

## 📄 Licenza

MIT — fai pure fork e adattalo per la tua serata olimpica! 🎮

---

*Fatto con ❄️ per celebrare Milano Cortina 2026*
