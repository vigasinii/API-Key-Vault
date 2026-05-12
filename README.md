# ⬡ Vault — API Key Manager

A self-hosted, encrypted API key vault with a dark dashboard UI.  
Built with Vanilla HTML/CSS/JS + Vercel Serverless Functions + Turso (SQLite).

---

## Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | Vanilla HTML + CSS + JS (zero build step) |
| Backend   | Vercel Serverless Functions (Node.js)     |
| Database  | Turso (libSQL / SQLite)                   |
| Deploy    | Vercel                                    |

---

## Features

- Add, edit, delete API keys
- Masked display — copy to clipboard reveals the real value
- Reveal modal with copy button
- Tag keys with comma-separated labels
- Expiry dates with expired card highlighting
- Expiring keys view in the sidebar
- Last-used tracking on every copy/reveal
- Search + sort in the topbar
- Stats in the sidebar (total / expired / used today)

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Turso (free tier)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up / login
turso auth login

# Create a database
turso db create vault

# Get your URL and token
turso db show vault --url
turso db tokens create vault
```

### 3. Create `.env.local`

```env
TURSO_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

### 4. Run locally with Vercel Dev

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Deploy (follow prompts — framework preset: Other)
vercel

# Set env vars
vercel env add TURSO_URL
vercel env add TURSO_AUTH_TOKEN

# Redeploy with env vars
vercel --prod
```

Done. Your vault is live. 🚀

---

## Project Structure

```
api-key-vault/
├── api/
│   ├── _db.js          # shared Turso client + schema init
│   ├── keys.js         # GET list, POST create
│   ├── keys/
│   │   └── [id].js     # GET reveal, PATCH update, DELETE
│   └── stats.js        # dashboard counts
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── vercel.json
├── package.json
└── README.md
```

---

## Security Notes

- API keys are stored in plaintext in Turso — for stronger security, encrypt values client-side (e.g. with SubtleCrypto) before sending to the API
- Add auth (Vercel password protection or a simple bearer token check in `_db.js`) before making this public-facing
- Turso databases are private by default

---

## Next Steps

- [ ] Add password/auth protection
- [ ] Client-side encryption with SubtleCrypto
- [ ] Export to JSON/CSV
- [ ] Slack/email alerts for expiring keys
- [ ] Team sharing mode
