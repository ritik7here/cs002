KindredBridge — Community Donation Management System
KindredBridge is a community donation management platform that connects donors with verified NGOs to coordinate donations, pickup, receipt, and distribution while maintaining persistent records and an audit trail.
Features

- Role-aware experiences for donors, NGOs, and administrators
- Authentication and backend authorization checks
- NGO onboarding, profile management, and administrator verification
- Donation creation, NGO requirements, and donation matching
- Donation requests and donor/NGO decisions
- Pickup scheduling and lifecycle coordination
- NGO receipt confirmation and partial/final distribution tracking
- Persistent notifications, donation status history, and audit logs
- Supabase-backed data persistence through the FastAPI backend
  Feature availability should be verified through the API and persisted data. A visible UI element alone does not prove that an operation is connected to the backend.

Architecture
React + TypeScript frontend
|
v
FastAPI backend
|
v
Supabase PostgreSQL / Auth
Layer Technology
Frontend React 19, TypeScript, Vite 8, Tailwind CSS 4
Backend Python, FastAPI, Pydantic
Data and authentication Supabase PostgreSQL, Supabase Auth/JWT validation
Database scripts SQL migrations and seed data in supabase/
Tests Pytest and FastAPI test client

The backend is the trusted boundary for authorization and service-role database access. Never expose the Supabase service-role key or JWT signing secrets to the frontend.
Requirements

- Git
- Node.js compatible with the version declared by the project; Vite 8 requires a recent Node.js version (Node.js 20.19+ or 22.12+ is recommended)
- Python 3.11 or newer
  Run locally

1. Get the code
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd kindredbridge-ngo-community-management
   If you already have the project locally, open a terminal in the repository root.
2. Install and start the frontend
   On Windows PowerShell:
   npm ci
   npm run dev
   Vite starts at http://localhost:3000.

Useful frontend checks:
npm run lint
npm run build
npm run lint runs the TypeScript compiler without emitting files. 3. Configure and start the backend
From the repository root, create a virtual environment:
py -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
py -m pip install --upgrade pip
py -m pip install -r backend\requirements.txt
If PowerShell blocks activation, use Command Prompt:
backend\.venv\Scripts\activate.bat
Create a local .env file in the repository root for the root-level Uvicorn command below. Keep it out of Git. Set values for the actual Supabase project; the following shows variable names only:
ENVIRONMENT=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_BACKEND_ONLY_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=YOUR_PROJECT_JWT_VERIFICATION_SECRET
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
Use the JWT configuration that matches the Supabase project's token-signing setup. Do not invent a signing secret. Never commit real credentials or place the service-role key in frontend variables.

Start the backend from the repository root:
py -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
Local endpoints:

- Health: http://127.0.0.1:8000/health
- API docs during development: http://127.0.0.1:8000/api/v1/docs
  The frontend's API base URL must point to the local backend at http://127.0.0.1:8000 using the project's existing frontend configuration.
  Run backend tests
  Run these commands from the repository root with the backend virtual environment activated. Install dependencies first using backend/requirements.txt.

Run the full suite:
py -m pytest backend/tests -v
Run one test file:
py -m pytest backend/tests/test_auth.py -v
Run tests matching a name:
py -m pytest backend/tests -k "status_history" -v
The tests use test clients, test doubles, and dependency overrides where configured. Do not run destructive tests against production data. If a test fails, inspect the assertion and traceback; a test failure does not automatically mean the live workflow is broken.
Database scripts
The supabase/ directory contains project SQL migrations and seed data. Review migration contents and the target Supabase project before applying SQL. Keep live RLS and schema changes deliberate and reproducible; do not run unreviewed destructive SQL against production.
Security notes

- Keep .env files, service-role credentials, JWT signing secrets, and real tokens out of Git.
- The backend must enforce identity, role, ownership, and NGO-verification rules; hiding frontend controls is not an authorization mechanism.
- The Supabase service-role key bypasses RLS, so backend authorization checks remain essential.
- Do not return raw database exceptions or secrets to API clients.
- Configure production environment variables in the hosting provider's dashboard.
- Use exact HTTPS frontend origins for production CORS configuration.
- Confirm the actual hosting providers, frontend URL, and Supabase signing configuration before deployment.
  Deployment
  The anticipated deployment option is a FastAPI backend on Render and a Vite frontend on Netlify, with Supabase as the data/auth provider. The final hosting arrangement is to be confirmed by the project team.

For production, configure the environment variables required by the application in the backend hosting dashboard. Do not commit production .env files. Verify health checks, login, role separation, CORS, and the full donation → request/match → pickup → receipt → distribution workflow in a staging or controlled environment before release.
Contributing and repository hygiene

- Commit source code, tests, SQL migrations, lockfiles, and useful project documentation.
- Do not commit node_modules/, dist/, Python virtual environments, cache directories, logs, local database files, or ZIP backups.
- .gitignore does not remove files already tracked by Git; inspect git status and tracked-file lists before pushing.
- If a credential was committed, rotate/revoke it. Deleting it in a later commit is not sufficient.
  Maintainer
  Om Mathur

Copyright © 2026 Deep Diver team. All rights reserved.
