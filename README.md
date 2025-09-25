# Personal Site — Astro + Svelte (Frontend) & FastAPI (Backend)

This is a ready-to-clone monorepo:

- **Frontend**: Astro + Svelte + Tailwind (deployed to GitHub Pages)
- **Backend**: FastAPI (deployed to Render/Railway/Fly)
- **Extras**: OpenGraph meta, `/now` & `/uses` pages, CI for GH Pages deploy, Swagger UI at `/docs`

## Quick start

### 1) Frontend (Astro + Svelte)
```bash
cd frontend
npm i
npm run dev  # http://localhost:4321
```
_If you use a project site on GitHub Pages (https://yourname.github.io/your-repo/), set `base: "/your-repo/"` in `astro.config.mjs`._

### 2) Backend (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000  # http://localhost:8000/docs
```

### 3) Deploy
- **Frontend → GitHub Pages:** Enable “Pages” → Source: GitHub Actions. Push to `main` and the workflow will build `frontend/` and deploy `dist/`.
- **Backend → Render:** Create a Web Service from this repo’s `/backend` using the Dockerfile; health check path `/docs`. Get a URL like `https://portfolio-api.onrender.com`. (Optional: add `api.yourname.com` CNAME pointing to Render.)

### 4) Wire frontend → backend
Edit your Astro/Svelte fetch calls to use your API URL, e.g.:
```ts
const res = await fetch('https://api.yourname.com/api/projects');
```

## Structure
```
personal-site/
├─ frontend/          # Astro + Svelte + Tailwind
└─ backend/           # FastAPI API
```

## Notes
- **CORS**: In `backend/app/main.py`, set `ALLOWED_ORIGINS` env var for production (comma-separated list), or update the default list.
- **OpenGraph**: Update `og.png` and meta tags in `frontend/src/pages/index.astro`.
- **Custom domain**: Add `frontend/public/CNAME` with your domain (optional).
- **.nojekyll**: Present so Pages serves `/_astro` correctly.
