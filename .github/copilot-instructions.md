# HRMS Copilot Instructions

## Architecture Overview

Node.js/Express MVC app with MongoDB (Mongoose). Four user roles drive all structural decisions:
- `admin` — full control (employees, projects, attendance, leaves, recruitment)
- `employee` — self-service (attendance, leaves, expenses, projects)
- `project_manager` — employee management + performance appraisals
- `accounts_manager` — payroll, payslips, salary management

Route/controller/view triads are role-scoped:
- `routes/admin.js` → `controllers/adminController.js` → `views/Admin/`
- `routes/employee.js` → `controllers/employeeController.js` → `views/Employee/`
- `routes/manager.js` → `controllers/managerController.js` → `views/Manager/`

`routes/index.js` handles auth (login, signup, logout, role-based redirect at `/check-type`).

## Developer Workflows

```bash
# Install dependencies
npm install

# Seed initial users (required before first run)
node seed/user-seeder.js

# Start dev server (NODE_ENV=debug, port 3000)
npm start

# Run tests (NODE_ENV=test, auto-seeds test DB, uses DB_URL_TEST)
npm test
```

Requires `.env` with `DB_URL` and `DB_URL_TEST` (MongoDB connection strings). See `db.js` for `NODE_ENV`-based URL switching.

**Test credentials (from `seed/user-seeder.js`):**
- Admin: `admin@admin.com` / `admin123`
- Project Manager: `pm@pm.com` / `pm1234`
- Accounts Manager: `am@am.com` / `am1234`
- Employee: `employee1@employee.com` / `123456`

## Key Conventions

### Controllers
All controller exports are `async (req, res, next)` with try/catch. Always pass `csrfToken: req.csrfToken()`, `userName: req.user.name`, and `title` to `res.render()`. Use `Promise.all` for parallel DB queries (see `adminController.viewHome`).

### CSRF
Every POST form requires a hidden `_csrf` field. Controllers obtain the token via `req.csrfToken()` and pass it to views. `csrfProtection` middleware (`csurf`) is applied on `routes/index.js`; admin/employee/manager routers inherit it globally via `app.use`.

### Validation
Uses `express-validator` v4 (legacy API). Validation is done in `config/passport.js` strategies using `req.checkBody()` and `req.validationErrors()`. Errors are stored as flash messages: `req.flash("error", messages)`.

### Route Protection
All role routes use `isLoggedIn` from `routes/middleware.js` mounted at the top of each router:
```js
router.use("/", isLoggedIn, function isAuthenticated(req, res, next) { next(); });
```

### Views
EJS templates include shared partials: `header`, `navbar`, `scripts`, and role-specific sidebars. Sidebar includes receive `{ activePage: 'home' }`. Navbar receives `{ pageTitle, userName, csrfToken, profileUrl, userRole }`.

### UI / Styling
Use **Bootstrap only** for all layout and styling — do not introduce other CSS frameworks (e.g., Tailwind, Bulma). All pages must be **mobile-responsive** using Bootstrap's grid (`col-`, `col-md-`, etc.) and responsive utilities. Prefer Bootstrap utility classes over custom CSS. Existing custom CSS (e.g., `stat-card`, `section-card`) is scoped to individual views and must not break on small screens.

### Passport Strategies
Named strategies in `config/passport.js`: `local.signin`, `local.signup`, `local.add-employee`. The `user.type` field on the `User` model determines role; `indexController.checkTypeOfLoggedInUser` redirects after login.

## Testing Pattern

Tests use Jest + Supertest + Cheerio. Each test file:
1. Connects to DB and requires `app` inside `beforeAll`
2. Extracts CSRF token from the login page HTML before authenticating
3. Uses a persistent `request.agent` to maintain session cookies across requests
4. Asserts on rendered HTML via Cheerio selectors

```js
const csrfToken = $('input[name="_csrf"]').val();
await admin_agent.post("/login").send({ _csrf: csrfToken, email, password });
```

`test/setupTests.js` seeds the test DB via `node seed/user-seeder.js` before all suites.

## Key Files

| File | Purpose |
|---|---|
| `db.js` | DB connection with `NODE_ENV`-based URL switching |
| `config/passport.js` | All Passport strategies + serialize/deserialize |
| `routes/middleware.js` | `isLoggedIn` guard |
| `models/user.js` | Central user model with `type` field and bcrypt helpers |
| `seed/user-seeder.js` | Test fixture data and credentials |
