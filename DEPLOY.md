# Deploy Guide — BD Medicine Price Web App

You're deploying 2 pieces:
1. **Backend** (`api/` folder) → Render.com (free)
2. **Frontend** (`web/index.html`) → Netlify (free)

---

## Step 1 — Push this project to GitHub

If you don't have a GitHub account yet, make one at github.com first.

```bash
cd bd-medicine-app          # this folder
git init
git add .
git commit -m "Web app version"
```

Then on github.com: click **New repository** → name it `bd-medicine-app` → **Create repository** (don't add README/gitignore, you already have them).

Copy the commands GitHub shows you under "…or push an existing repository", they'll look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bd-medicine-app.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy the backend (Render)

1. Go to [render.com](https://render.com) → sign up with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your `bd-medicine-app` repo. Render will detect `render.yaml` automatically and pre-fill everything (root dir `api`, build command, start command).
4. Click **Create Web Service**. First deploy takes ~2-3 minutes.
5. When it's live, copy the URL Render gives you — looks like:
   `https://bd-medicine-api.onrender.com`
6. Test it: open `https://bd-medicine-api.onrender.com/api/stats` in your browser. You should see JSON with generic/brand counts.

**Note:** Free Render services sleep after 15 min of no traffic and take ~30-50 seconds to wake up on the next request. That's normal for the free tier.

---

## Step 3 — Point the frontend at your backend

Open `web/index.html`, find this line near the bottom:

```js
const API_BASE = "http://localhost:8000";
```

Replace it with your real Render URL:

```js
const API_BASE = "https://bd-medicine-api.onrender.com";
```

Save the file.

---

## Step 4 — Deploy the frontend (Netlify)

**Easiest way — drag and drop, no git needed:**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `web` folder onto the page.
3. Done — Netlify gives you a live URL like `https://random-name-123.netlify.app` in seconds.

**Or, connect via GitHub (auto-redeploys on every push):**
1. Push your updated code (with the fixed `API_BASE`) to GitHub: `git add . && git commit -m "set API URL" && git push`
2. On Netlify: **Add new site** → **Import an existing project** → pick your repo.
3. Set **Base directory** to `web`, leave build command empty, publish directory `.`
4. Deploy.

---

## Step 5 — Test it

Open your Netlify URL on your phone. Search "napa" or "omeprazole" — you should see real prices and be able to tap into alternatives.

---

## What's NOT included yet

- **Prescription OCR scanning** was removed from the deploy requirements (paddleocr is too heavy for Render's free tier — it would fail to build). Search/price/alternatives all work fully. We can add OCR back later on a paid tier or a separate lightweight OCR service.
- **Custom domain** — both Render and Netlify let you attach one for free once you're ready.

---

## Later: turning this into an Android APK

Once the web app is live and working, wrapping it into an installable APK is much simpler than your original Expo/EAS setup — using **Capacitor**, which just wraps your existing website. No Gradle fights, no `bd-medicine-app/mobile` path issues. Ask me when you're ready and I'll set that up.
