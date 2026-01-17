# How to Deploy Aura HRMS on Railway

Here is the step-by-step guide to deploy your full-stack application (Frontend + Backend + Database) on Railway.app.

## Phase 1: Preparation (Already Done ✅)

I have already updated your code to be "Cloud Ready":
1.  **Backend Port**: The server now listens on `process.env.PORT` (required for Railway).
2.  **Frontend API URL**: The frontend now looks for `VITE_API_URL` environment variable so it can connect to your live backend instead of localhost.

---

## Phase 2: Push to GitHub

1.  Create a new repository on **GitHub** (e.g., `aura-hrms`).
2.  Push your code to this repository:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for deployment"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/aura-hrms.git
    git push -u origin main
    ```

---

## Phase 3: Create Project on Railway

1.  Go to [Railway.app](https://railway.app/) and login with GitHub.
2.  Click **"New Project"** → **"Deploy from GitHub repo"**.
3.  Select your `aura-hrms` repository.
4.  Click **"Add Variables"** but don't add anything yet, just click **"Deploy Now"**.
    *   *Note: It might fail initially because we haven't set up the database yet. That's normal.*

This will create a project with one service (your repo). We need to split this into two services (Frontend & Backend) + Database.

---

## Phase 4: Add Database

1.  inside your Railway project, click **"New"** (top right) → **Database** → **PostgreSQL**.
2.  Wait for it to initialize. A card for "PostgreSQL" will appear.

---

## Phase 5: Configure Backend Service

1.  Click the specific card representing your **GitHub Repo** (let's rename this service to "Backend").
2.  Go to **Settings** → **General**.
    *   **Root Directory**: Change to `/backend`.
    *   **Watch Paths**: Change to `/backend/**`.
3.  Go to **Variables** tab. Add these:
    *   `DATABASE_URL`: Click "Reference Variable" and select `${Postgres.DATABASE_URL}`.
    *   `PORT`: `5001` (optional, Railway assigns one automatically, but good to set).
4.  Go to **Build** settings.
    *   Build Command: `npm install && npx prisma generate`
    *   Start Command: `node server.js`
5.  Go to **Settings** → **Networking** → **Generate Domain**.
    *   Copy this domain (e.g., `backend-production.up.railway.app`). You'll need it for the frontend.

**Redeploy the backend** (if it doesn't auto-deploy). It should now be green/healthy.

---

## Phase 6: Configure Frontend Service

We need a second service for the frontend.

1.  Click **"New"** (top right) → **GitHub Repo**.
2.  Select the **same repository** (`aura-hrms`) again. It will add a new service card.
3.  Rename this service to "Frontend".
4.  Go to **Settings** → **General**.
    *   **Root Directory**: Leave as `/` (Root).
    *   **Watch Paths**: Change to `/src/**` (optional, or just leave default).
5.  Go to **Variables** tab. Add this:
    *   `VITE_API_URL`: Paste your **Backend Domain** from Phase 5 (e.g., `https://backend-production.up.railway.app/api`).
        *   **IMPORTANT**: Add `/api` at the end!
        *   **IMPORTANT**: Must start with `https://`.
6.  Go to **Settings** → **Networking** → **Generate Domain**.
    *   This is your website URL!

**Redeploy the frontend**.

---

## Phase 7: Final Database Setup

The first time it runs, the database will be empty. You need to push your local schema.

1.  Install Railway CLI on your computer: `npm i -g @railway/cli`
2.  Login: `railway login`
3.  Link your local folder to the Railway project: `railway link` (select your project).
4.  Push schema:
    ```bash
    cd backend
    railway run npx prisma db push
    ```

---

## Summary of Architecture

- **Service 1 (Backend)**: Runs Node.js from `/backend` folder. Connects to Postgres.
- **Service 2 (Frontend)**: Runs Vite/React from `/` root. Connects to Backend via `VITE_API_URL`.
- **Postgres**: Managed database by Railway.

Your app is now live! 🚀
