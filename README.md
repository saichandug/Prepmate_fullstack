# PrepMate

**From Job Description to Job Ready.**

PrepMate is a full-stack placement-preparation and job-application tracker for college students and fresh graduates. Users create an account, sign in with email and password, and everything they do is saved to MongoDB.

## Core Features

1. Account system: create an account, or sign in if you already have one
2. Job Application Tracker with validation (saved per user in MongoDB)
3. Gemini AI + rule-based Job Description Analyzer
4. Personalized Preparation Roadmap
5. General Coding Practice with topic/difficulty filters
6. Gemini AI Mock Interview with answer evaluation
7. Daily Preparation Streak

## Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** bcrypt password hashing, JWT in an httpOnly cookie
- **AI:** Gemini API, called only from the server

## Setup

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev
```

Open **http://localhost:5173**. The React app runs on Vite and proxies `/api` calls to the Express server on port 5000.

### `.env`

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URL` | yes | Your connection string. With Atlas, keep the `<db_password>` placeholder in it. |
| `MONGODB_PASSWORD` | yes (Atlas) | Inserted into the URL automatically. Special characters are encoded for you. |
| `MONGODB_DB` | no | Database name. Defaults to `prepmate`. |
| `JWT_SECRET` | yes in production | Long random string. In development a temporary one is used if it is missing. |
| `PORT` | no | API port. Defaults to `5000`. |
| `GEMINI_API_KEY` | no | Enables the AI features. Without it the app uses its built-in fallbacks. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash-lite`. |

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If you use MongoDB Atlas, add your current IP address under **Network Access** or the server will not be able to connect.

## Authentication

- Opening the app while signed out shows the login page.
- **Sign in** with email and password.
- If the email has no account, the page switches to **Create account** automatically.
- If you try to create an account with an email that already exists, it switches to **Sign in**.
- Passwords need at least 8 characters and are stored only as bcrypt hashes.
- Sessions last 7 days. **Sign out** is in the top-right of the header.

## Data Storage

| Collection | Contents |
| --- | --- |
| `users` | name, email, password hash |
| `applications` | one document per job application, linked to a user |
| `progresses` | one document per user: coding completion, roadmap completion, mock interview history, streak, JD analyzer state, roadmap |

Every query is scoped to the signed-in user, so accounts never see each other's data. The browser stores no PrepMate data; only the currently open page is remembered in `sessionStorage`.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account and sign in |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| GET | `/api/data` | Applications and progress for the signed-in user |
| POST | `/api/applications` | Add an application |
| PUT | `/api/applications/:id` | Update an application |
| DELETE | `/api/applications/:id` | Delete an application |
| PUT | `/api/progress` | Save progress |
| POST | `/api/gemini` | AI analysis, question generation and evaluation (sign-in required) |

## Production

```bash
npm run build
npm start
```

`npm start` runs the Express server, which also serves the built React app, so one process and one port handle everything. Set `JWT_SECRET` and the MongoDB variables on your host. This works on any Node host (Render, Railway, Fly.io, a VPS). It is no longer a Vercel serverless project, so `vercel.json` and `api/` were removed.

## Validation Rules

- Application preparation time must be greater than 0 and no more than 24 hours/day.
- Job descriptions must contain meaningful job-related language or relevant skills.
- The same validation runs in the browser and on the server.
- No official company interview questions are claimed; generated questions are preparation material.

## Security Notes

- Never put the Gemini key or MongoDB credentials in React source or `VITE_` variables.
- Never commit `.env`. It is already in `.gitignore`.
- Login and signup are rate limited.
