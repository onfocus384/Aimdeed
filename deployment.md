# Deployment Guide — A to Z (www.aimdeed.in)

Super simple, one step at a time. Do them in this order.

## What goes where (MEMORIZE THIS)

| Website | What you upload | Folder in this project |
|---|---|---|
| **Vercel** | the frontend (the website people see) | `frontend/` |
| **Render** | the backend (the API) | `backend/` |
| **Supabase** | the database + login system | none (just paste a file) |
| **Redis** | the cache | none (just a URL) |

You will need these accounts: **Vercel**, **Render**, **Supabase**, **Redis** (free tier is fine), and access to **your domain's DNS** (wherever you bought aimdeed.in — GoDaddy, Namecheap, Cloudflare, etc.).

Your URLs at the end will be:

- `https://www.aimdeed.in` → Vercel (the main website)
- `https://aimdeed.in` → redirects to `www` (automatic)
- `https://api.aimdeed.in` → Render (the backend)

---

## STEP 1 — Supabase (make the database)

1. Go to https://supabase.com and sign up.
2. Click **New project**. Name it anything, pick a region close to you, set a password.
3. After it creates, click **Project Settings** (bottom left) → **API**.
4. You will see 3 values. Copy them somewhere safe:
   - **Project URL**
   - **anon public**
   - **service_role secret**
5. Go back to your project → **SQL Editor** → **New query**.
6. Open the file `supabase/schema.sql` from this project, copy ALL of it, paste it in the query box, click **Run**.
7. Click **Authentication** (left sidebar) → **URL Configuration**.
   - **Site URL:** put `https://www.aimdeed.in`
   - **Redirect URLs:** add these 3 lines (one per box):
     - `https://www.aimdeed.in/**`
     - `https://aimdeed.in/**`
     - `http://localhost:5173/**`

✅ Supabase is done. Keep the 3 values from step 4, you need them later.

---

## STEP 2 — Deploy the backend on Render (use the `backend` folder)

1. Go to https://render.com and sign up with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and pick the **Aimdeed repo**.
4. Very important — there is a box called **Root Directory**. Type: `backend`
   (this tells Render to only use the `backend/` folder).
5. Set these:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free (or Starter)
6. Click **Create Web Service**. Wait for it to finish building (green check).
7. Now add the environment variables. Go to the service → **Environment** tab →
   **Add Environment Variable**, add each line below (Variable = the name, Value = what you put):

   | Variable | Value (what to type) |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `FRONTEND_URL` | `https://www.aimdeed.in` |
   | `CORS_ORIGINS` | `https://www.aimdeed.in,https://aimdeed.in` |
   | `SUPABASE_URL` | the Project URL from STEP 1 |
   | `SUPABASE_ANON_KEY` | the anon public from STEP 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role from STEP 1 |
   | `REDIS_URL` | the Redis URL from STEP 5 (do STEP 5 first, then come back) |
   | `REDIS_ENABLED` | `true` |
   | `REDIS_PREFIX` | `aimdeed` |
   | `EMAIL_USERNAME` | your Gmail address |
   | `EMAIL_PASSWORD` | a 16-character Gmail **App Password** |
   | `EMAIL_FROM` | `Aimdeed <your.email@gmail.com>` |
   | `CONTACT_TO` | the email where contact messages should arrive |
   | `UPI_ID` | your UPI ID for payments (optional) |
   | `GROK_API_KEY` | OR |
   | `GROQ_API_KEY` | OR |
   | `XAI_API_KEY` | OR |
   | `OPENROUTER_API_KEY` | — put ONE of these 4 for the chatbot |
   | `LOG_LEVEL` | `info` |

8. After adding everything, Render will restart. Your backend now has an address like
   `https://aimdeed-api.onrender.com`.

9. Give the backend a nicer address — `api.aimdeed.in`:
   - Render → your service → **Settings** → **Custom Domains** → **Add Custom Domain**
   - Type `api.aimdeed.in`, click **Add**
   - Render will show you a value like `your-service.onrender.com` — you'll need this in STEP 4.

✅ Backend done. Write down your Render address (e.g. `https://aimdeed-api.onrender.com` or `https://api.aimdeed.in` after STEP 4).

---

## STEP 3 — Deploy the frontend on Vercel (use the `frontend` folder)

1. Go to https://vercel.com and sign up with GitHub.
2. Click **Add New…** → **Project**.
3. Import the **Aimdeed repo**.
4. Very important — before you hit Deploy, scroll down and change **Root Directory**.
   Click it → select **`frontend`**.
   (This tells Vercel to only build the `frontend/` folder. `vercel.json` is inside it.)
5. Vercel should auto-detect **Vite**. Check these:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click **Deploy**. Wait for it to finish.
7. Add environment variables: Vercel → your project → **Settings** →
   **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Project URL from STEP 1 |
   | `VITE_SUPABASE_ANON_KEY` | the anon public from STEP 1 |

   Then click **Redeploy** (Deployments → ... → Redeploy).

8. Open `frontend/vercel.json` in this project. It contains the address
   `https://api.aimdeed.in` in several places. That is correct IF your backend is at
   `api.aimdeed.in`. If your backend is still at `https://aimdeed-api.onrender.com`,
   replace every `https://api.aimdeed.in` with `https://aimdeed-api.onrender.com`.
   Save the file, commit, push — Vercel auto-redeploys.

✅ Frontend done. Your site is now live at `https://your-project.vercel.app`.

---

## STEP 4 — Connect your domain www.aimdeed.in (DNS)

Now you log into the website where you bought `aimdeed.in` (GoDaddy / Namecheap / Cloudflare).

### A. Add the domain to Vercel

1. Vercel → your project → **Settings** → **Domains** → **Add**.
2. Type `www.aimdeed.in`, click **Add**. Then type `aimdeed.in`, click **Add**.
3. Vercel will show you which DNS records to create.

### B. Create 3 DNS records at your registrar

Find the **DNS** / **Domain Name System** page. Delete any old records that point
somewhere else, then add these 3:

| Record Type | Name (Host) | Value (Points to) | Why |
|---|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` | makes `www.aimdeed.in` open your Vercel site |
| `A` | `@` (empty / the root) | `76.76.21.21` | makes `aimdeed.in` open your Vercel site |
| `CNAME` | `api` | `your-service.onrender.com` | makes `api.aimdeed.in` open your Render backend |

(For the last one, copy the exact value Render showed you in STEP 2.9.)

> If using Cloudflare: turn the **orange cloud OFF** (grey cloud = "DNS only") for the
> `www` and `@` records so Vercel can provide HTTPS.

### C. Redirect the bare domain to www

1. Vercel → project → **Settings** → **Domains**.
2. Find `aimdeed.in` → next to it choose **Redirect to:** → `www.aimdeed.in`.

Wait 5–30 minutes for DNS to spread. Vercel will automatically create an HTTPS
certificate (a green padlock) for both names.

✅ Domain done. `https://www.aimdeed.in` should now load your site.

---

## STEP 5 — Redis (the cache)

1. In **Render** → click **New +** → **Redis** (or use Upstash/Redis Cloud).
2. Wait for it to create. Click into it → copy the **External Connection String**
   (looks like `redis://default:xxxxxxxx@host:6379`).
3. Go back to your backend service → **Environment** → edit `REDIS_URL` → paste it.
4. Render restarts the backend.

✅ Redis done.

---

## STEP 6 — Final test list

Open your browser and check:

1. `https://www.aimdeed.in` loads with pictures ✓
2. `https://aimdeed.in` jumps to `https://www.aimdeed.in` ✓
3. Pricing page shows the payment plans ✓
4. The chat bubble answers ✓
5. Contact form sends you an email ✓
6. Login with Supabase works ✓
7. `https://api.aimdeed.in/healthz` shows `ok` ✓

If something breaks, see the table below.

---

## If something doesn't work

| Problem | Cause | Fix |
|---|---|---|
| Site loads but API data is missing / 404 | `frontend/vercel.json` still points to the old address | Update it to your real backend URL and redeploy |
| `api.aimdeed.in` doesn't open | DNS record for `api` not added or wrong | Fix the `CNAME api` record in STEP 4B |
| "Not allowed by CORS" error | Backend doesn't know your site address | On Render, set `CORS_ORIGINS` = `https://www.aimdeed.in,https://aimdeed.in` |
| Login keeps going back to start | Supabase doesn't allow your URL | Re-check STEP 1.7 Redirect URLs |
| Redis warnings in the backend logs | Redis URL wrong | Re-check STEP 5.3 |
| Certificate/padlock not ready yet | DNS still spreading | Wait up to 30 minutes |
| Render deploy failed | Wrong Root Directory | STEP 2.4 must say exactly `backend` |

---

## Local development files (only for your computer, not needed for hosting)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The real secrets live in the Vercel / Render dashboards — never put them in a file
that gets pushed to GitHub.
