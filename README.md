# Flashcard Study App

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)

A full-stack flashcard learning platform with real-time multiplayer, speedrun mode, and spaced repetition tracking.

> **Note:** Live demo temporarily offline — AWS EC2 free trial expired. See [Getting Started](#getting-started) to run locally.

---

<!-- Add a screenshot or GIF of the app here -->
> _Screenshot / demo GIF coming soon_

---

## Features

- **Multiplayer Versus Mode** — Socket.io-powered rooms where players race to answer flashcards first; host controls pacing and card reveals
- **Speedrun Mode** — solo timed run through a deck with live scoring
- **Spaced Repetition Schema** — flashcard model stores SM-2 fields (ease factor, interval, due date) to support optimal review scheduling
- **JWT Authentication** — stateless auth with token-based socket handshake for secure real-time connections
- **Folder Organization** — group cards into folders and select any folder as a game deck

## Tech Stack

| Layer      | Technology                                                     |
|------------|----------------------------------------------------------------|
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| Backend    | Node.js, Express, Socket.io 4                                  |
| Database   | MongoDB, Mongoose                                              |
| Auth       | JSON Web Tokens (JWT)                                          |
| Deployment | AWS EC2, NGINX (previously deployed)                           |

## Getting Started

### Prerequisites

- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/TaDavid7/mem_study.git
cd mem_study
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

| Variable      | Description                                         |
|---------------|-----------------------------------------------------|
| `MONGO_URL`   | MongoDB Atlas connection string                     |
| `PORT`        | Express server port (e.g. `5000`)                   |
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`)         |
| `JWT_SECRET`  | A long random string used to sign tokens            |

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

| Variable                 | Description                                      |
|--------------------------|--------------------------------------------------|
| `NEXT_PUBLIC_API_BASE`   | Backend URL (e.g. `http://localhost:5000`)       |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL (same as API base)             |

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

> **Tip:** Install [nodemon](https://www.npmjs.com/package/nodemon) in the backend for automatic restarts on file changes.

## Usage

1. Register an account and log in
2. Create a folder, then add flashcards with a question and answer
3. Choose a mode from the dashboard:
   - **Study** — flip through your cards at your own pace
   - **Speedrun** — race through the deck against the clock
   - **Versus** — share a room code with friends and compete in real time

## Roadmap

- [ ] Import/export flashcard sets (CSV / Anki format)
- [ ] Active spaced repetition study mode (SM-2 fields already in schema)
- [ ] Persistent leaderboards

## License

Licensed under the Apache License 2.0 — see [LICENSE](LICENSE) for details.
