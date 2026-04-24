# Vertigo

Vertigo is a food rescue platform for Algeria (Oran, Mostaganem, Sidi Bel Abbès) that connects consumers with local restaurants and stores selling surplus food at a discount. Customers browse discounted baskets nearby, merchants publish offers and fulfil orders, admins approve merchant applications.

---

## Features

**Customers**
- Sign up / log in (cookie-based auth)
- Browse nearby restaurants with active discount baskets, filtered by location (GPS or chosen wilaya), radius, and sort order (best discount / distance / rating)
- Place an order on any deal, pay at pickup, track status (`Pending → Preparing → OnTheWay → Delivered`)
- Report a restaurant

**Merchants (Gerants)**
- Apply to become a merchant with a Registre de Commerce; wait for admin approval
- Manage their own baskets (create / edit / delete)
- Accept incoming orders and advance their status
- Report a customer

**Admins**
- Dedicated dashboard (distinct UI) at `/admin/approvals`
- Approve or reject pending merchant applications
- See platform-wide stats (users, merchants, orders, banned users, etc.)

**In-app AI assistant**
- Floating chatbot (bottom-right on every page), bilingual EN/FR, answers questions and guides users around the site. Powered via OpenRouter.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 (Create React App), React Router v6, Tailwind CSS (custom eco-* tokens), plain JavaScript, native `fetch` |
| Backend | ASP.NET Core Web API + MVC hybrid (.NET 10), Cookie authentication, Entity Framework Core 10, SQL Server LocalDB |
| AI | OpenRouter (configured for `anthropic/claude-haiku-4.5` by default, any OpenRouter model ID works) |
| State | React Context (`AuthContext`) + local component state — no Redux/Zustand |

---

## Repository layout

```
vertigo/
  .env.example                 # sample env file for the frontend
  .gitignore
  package.json                 # React app deps
  public/                      # CRA public assets
  src/                         # React frontend source
    api/                       # fetch wrappers (client.js, auth.js, orders.js, ...)
    components/                # shared components (AuthedHeader, AdminChrome, ...)
    context/                   # AuthContext
    pages/                     # page components (LoginPage, DealsPage, ...)
    assets/                    # images
    HomePage.js                # public landing page
    App.js                     # router + providers
    index.js                   # CRA entry
    backend/
      Vertigo/
        Vertigo.sln
        Vertigo/
          Controllers/         # API + MVC controllers
          Models/              # EF entities (Utilisateur, Boutique, Panier, Commande, ...)
          Dtos/                # API DTOs
          Data/                # VertigoContext (DbContext)
          Services/            # SeedData
          Utils/               # SecurityHelper (BCrypt)
          Migrations/          # EF Core migrations
          Properties/          # launchSettings
          Program.cs           # host + middleware
          appsettings.json
          Vertigo.csproj
```

---

## Prerequisites

- **Node.js** 18+ and npm (for the React frontend)
- **.NET 10 SDK** (for the ASP.NET Core backend)
- **SQL Server LocalDB** (ships with Visual Studio / SQL Server Express)
- **`dotnet-ef`** global tool for migrations:
  ```bash
  dotnet tool install --global dotnet-ef
  ```
- An **OpenRouter API key** (for the chatbot) — <https://openrouter.ai/keys>

---

## Quickstart (local development)

### 1. Clone and install frontend deps

```bash
git clone <this-repo>
cd vertigo
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```ini
REACT_APP_OPENROUTER_KEY=sk-or-v1-your-real-key-here
REACT_APP_API_URL=http://localhost:5096
```

**Never commit `.env`.** It's gitignored. Rotate the key immediately if it leaks.

### 3. Apply backend migrations and run

```bash
cd src/backend/Vertigo/Vertigo
dotnet ef database update
dotnet run
```

The API listens on `http://localhost:5096`. On first run, the `SeedData` service populates:
- 1 admin: `admin@vertigo.local` / `AdminPass123`
- 1 gérant: `seed@vertigo.local` / `SeedPass123`
- 12 restaurants around Oran, each with 1–2 active discounted baskets

Migrations are idempotent; re-running is safe.

### 4. Run the frontend (new terminal)

```bash
cd vertigo
npm start
```

CRA opens `http://localhost:3000` automatically. If the port is busy it may fall back to 3001/3002 — the backend's dev CORS allows any `localhost` origin.

---

## Seeded test accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@vertigo.local` | `AdminPass123` |
| Gérant | `seed@vertigo.local` | `SeedPass123` |

Sign up any other account via `/signup` to test the customer flow.

---

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `REACT_APP_OPENROUTER_KEY` | `.env` (frontend) | Chatbot — OpenRouter API key. Required for chatbot functionality. |
| `REACT_APP_API_URL` | `.env` (frontend) | Base URL for the backend API. Default `http://localhost:5096`. |
| `ConnectionStrings:DefaultConnection` | `src/backend/Vertigo/Vertigo/appsettings.json` | SQL Server LocalDB connection string. |

CRA reads `.env` only at startup — restart `npm start` after any change.

---

## API surface (JSON, cookie-auth)

All endpoints below use cookie session auth. Frontend fetches set `credentials: "include"`.

### Account — `/account`
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/account/login` | Body `{ Email, Password }` — sets session cookie |
| POST | `/account/create` | Body: Utilisateur payload — sign up and auto-login |
| GET | `/account/me` | Current user profile |
| POST | `/account/logout` | Clears cookie |

### Restaurants (deals feed) — `/api/restaurants`
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/restaurants/nearby?latitude&longitude&radiusKm&sortBy` | Nearby approved restaurants with active offers; Haversine distance included |

### Orders — `/api/orders`
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/orders` | Body `{ panierId }` — customer places an order |
| GET | `/api/orders/mine` | Customer's order history |
| GET | `/api/orders/boutique` | Gérant's incoming orders |
| POST | `/api/orders/{id}/status` | Body `{ status }` — advance to Preparing/OnTheWay/Delivered/Cancelled |
| POST | `/api/orders/{id}/complete` | Legacy "mark paid/delivered" shortcut |
| POST | `/api/orders/{id}/cancel` | Hard cancel (only if not yet completed) |

### Deals (merchant-managed baskets) — `/api/deals`
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/deals/mine` | Gérant's baskets |
| POST | `/api/deals` | Create a new basket (auto-computes discounted price) |
| PUT | `/api/deals/{id}` | Update basket |
| DELETE | `/api/deals/{id}` | Hard-delete if no orders exist; otherwise soft-deactivate |

### Merchants (application workflow) — `/api/merchants`
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/merchants/apply` | Customer submits merchant application with Registre de Commerce |
| GET | `/api/merchants/mine` | Applicant checks their status |
| GET | `/api/merchants/pending` *(admin)* | Pending applications list |
| POST | `/api/merchants/{id}/approve` *(admin)* | Approves — sets `Valide=true`, promotes user to Gerant |
| POST | `/api/merchants/{id}/reject` *(admin)* | Deletes the unapproved application |

### Admin — `/api/admin`
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/stats` *(admin)* | Platform-wide counts (users, merchants, orders, pending, etc.) |

### Reports — `/api/reports`
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/reports/user/{id}` | Report a customer |
| POST | `/api/reports/boutique/{id}` | Report a restaurant |

### Home (public) — `/home`
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/home/init` | Public homepage stats (food rescued, partner count, cities) |

There is also a parallel set of **MVC** controllers (`BoutiquesController`, `PaniersController`, `CommandesController`, `UtilisateursController`) that return Razor Views — these are legacy and not consumed by the React app.

---

## Architecture notes

**Auth.** Cookie-based (`CookieAuthenticationDefaults`), 14-day sliding expiration. Passwords hashed with BCrypt (`Vertigo.Utils.SecurityHelper`). Frontend never handles tokens manually — `fetch` sends `credentials: "include"` and the browser manages the cookie.

**CORS.** Dev policy allows any `localhost` / `127.0.0.1` origin (so CRA can run on 3000/3001/3002 freely). Tighten for production in `Program.cs`.

**Order lifecycle.** `Commande.Status` is a string: `Pending → Preparing → OnTheWay → Delivered` (with `Cancelled` as a terminal branch). Role-based state transitions are enforced in `OrdersController.UpdateStatus`.

**Merchant approval.** `Boutique.Valide=false` by default. Approving flips it to `true` and promotes the user's `Role` to `Gerant`. Rejection hard-deletes the unapproved boutique.

**Seeded demo data.** `Services/SeedData.EnsureSeededAsync` runs at startup; idempotent guard on `Boutique.Latitude != null`.

**Geolocation.** Deals page uses `navigator.geolocation`. On denial it falls back to Oran city centre. The settings panel lets users force a specific wilaya (persisted to `localStorage`).

---

## Running tests

```bash
npm test        # React tests (CRA)
# Backend has no tests yet.
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `CORS error` in browser | Backend not running, or wrong port | Make sure `dotnet run` is up on 5096 |
| `401` on every API call | Cookie not being sent | Ensure frontend uses `http://localhost:*` (not `file://`); check DevTools → Application → Cookies |
| `no named pipe instance matching 'MSSQLLOCALDB'` | LocalDB instance stopped | `sqllocaldb start MSSQLLocalDB` |
| Migration wants to drop columns | Model drifted from snapshot | Edit the generated `.cs` to keep only `AddColumn` operations, then `dotnet ef database update` |
| `error MSB3021: file locked by Vertigo (PID …)` | Old `dotnet run` still holding binaries | `Stop-Process -Name Vertigo -Force` then rebuild |
| Chatbot returns "Sorry, I'm having trouble…" | Missing or malformed `REACT_APP_OPENROUTER_KEY` | Confirm `.env` starts line with `REACT_APP_OPENROUTER_KEY=sk-or-v1-…`, restart `npm start` |
| Port 3000 shows a different app / CRA moves to 3001 | Port already in use | Kill the other process, or live with whatever port CRA picks — CORS allows any localhost |

---

## Deployment checklist

Before shipping to production:

- [ ] Tighten CORS in `Program.cs` to your real domain only
- [ ] Swap the SQL Server LocalDB connection string for a real SQL Server / Azure SQL instance
- [ ] Set `Cookie.SecurePolicy = Always` and serve over HTTPS
- [ ] Rotate all seeded passwords and delete the admin/gerant seed in non-dev environments
- [ ] Move the OpenRouter key off `process.env.REACT_APP_*` (it ships in the frontend bundle) — proxy chatbot calls through a backend endpoint
- [ ] Add proper logging and error tracking
- [ ] Write automated tests

---

## License

Proprietary — internal school/portfolio project.
