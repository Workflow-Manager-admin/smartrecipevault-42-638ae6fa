# smartrecipevault-42-638ae6fa

This app provides a full-stack example of SmartRecipeVault:

- **Frontend:** React app (with Supabase user authentication and per-user ingredient CRUD)
- **Backend:** Node.js/Express server with `/api/recipe` to securely fetch AI-generated recipes (OpenAI by default).
- **Security:** No API keys on frontend; secrets only in backend `.env`

---

## Quickstart: Installation & Running

### 1. Install (Frontend)

```bash
cd smartrecipevault
npm install
npm install @supabase/supabase-js
```

### 2. Install (Backend)

```bash
npm install express node-fetch dotenv
```

Or if running backend in a separate folder, move/rename `server.js` to your backend root and:

```bash
npm install express node-fetch dotenv
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your actual OpenAI API key:

```
cp .env.example .env
# Edit OPENAI_API_KEY=sk-... with your API key
```

### 4. Supabase

You must set up your Supabase project/table:
- Add table: `ingredients` with at least columns: `id` (PK, int), `user_id` (UUID/string), `name` (text/string)
- Add authentication (enable email sign-in/out).
- Fill in the `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `smartrecipevault/src/SmartRecipeVault.js`.

### 5. Running

**Frontend** (in `smartrecipevault`):

```bash
PORT=3000 npm start
```

**Backend** (from root):

```bash
node server.js
```
Or with explicit port/env config:

```bash
OPENAI_API_KEY=sk-... node server.js
```

### 6. Usage

- Visit [http://localhost:3000](http://localhost:3000) for UI.
- Ensure backend (`server.js`) runs on port 5000 (default) or adjust both sides for proxying.
- The React component will POST to `/api/recipe` to get a recipe suggestion using the user's saved ingredients.
- Use the UI to register/login, add/delete ingredients, and get an AI recipe.

---

## NPM Package Reference

Frontend required:
- `@supabase/supabase-js`
- `react`, `react-dom`, `react-scripts`

Backend required:
- `express`
- `dotenv`
- `node-fetch@2` (for ESM Node.js, use v2 or adjust `require()` accordingly)

---

## Security

- **Do NOT** put secrets such as `OPENAI_API_KEY` in frontend or commit `.env`.
- Backend reads keys from `.env`.
- CORS policy set to allow requests from frontend only.

---