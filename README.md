# Atlassian Forge Apps (Jira)

This repo contains learning/demo Atlassian Forge apps, starting with a **Jira UI Kit** app.

- Jira app source: [jira-app/melduoapp/](jira-app/melduoapp/)

> Public repo note: don’t commit secrets (API tokens, private keys). Forge apps generally don’t need raw Jira API tokens—use Forge auth (`asApp()` / `asUser()`) instead.

---

## What this Jira app does

The Jira app includes two UI entry points (defined in the Forge manifest):

- **Project page** (`jira:projectPage`): shows up as a tab/page inside a Jira project sidebar. This is the easiest place to test while learning.
- **Admin page** (`jira:adminPage`): shows up under Jira admin settings (easy to miss).

The UI (React via `@forge/react`) calls backend “resolver” functions via `invoke(...)` (`@forge/bridge`).
The backend uses `@forge/api` to call Jira’s REST APIs.

---

## How Forge pieces fit together (mental model)

Forge apps are split into:

1. **Manifest** ([jira-app/melduoapp/manifest.yml](jira-app/melduoapp/manifest.yml))
   - Declares modules (where UI appears), permissions (scopes), and runtime.
2. **Frontend (UI Kit React)** ([jira-app/melduoapp/src/frontend/index.jsx](jira-app/melduoapp/src/frontend/index.jsx))
   - Runs in Atlassian’s UI runtime.
   - Calls backend functions with `invoke('functionName', payload)`.
3. **Backend (Resolver)** ([jira-app/melduoapp/src/resolvers/index.js](jira-app/melduoapp/src/resolvers/index.js))
   - Defines named functions with `resolver.define('name', handler)`.
   - Can call Jira/Confluence/etc using Forge-provided auth.

**Important:** the UI cannot call Jira REST directly. It calls the resolver, and the resolver calls Jira.

---

## Prerequisites

- Node.js (LTS recommended)
- Forge CLI installed:
  ```bash
  npm install -g @forge/cli@latest
  ```
- Forge login:
  ```bash
  forge login
  forge whoami
  ```

---

## Run / deploy / install (Jira)

From the Jira app folder:

```bash
cd jira-app/melduoapp
npm install
```

### 1) Deploy

```bash
forge deploy -e development
```

Why `-e development`?

- Forge has **environments**: `development`, `staging`, `production`.
- `forge deploy` without `-e` deploys to your **default** environment.
- Your install is tied to an environment. If you installed `development`, deploy to `development` to see changes.

Check what your default is:

```bash
forge settings list
```

### 2) Install onto a Jira site

Replace placeholders:

- `<your-site>.atlassian.net` → the Jira site you want to test on

```bash
forge install -e development --site <your-site>.atlassian.net --product jira
```

List installations:

```bash
forge install list
```

If you change **permissions/scopes** or **modules** in the manifest, upgrade the install:

```bash
forge install -e development --site <your-site>.atlassian.net --product jira --upgrade all
```

### 3) Tunnel (optional, fast local iteration)

```bash
forge tunnel
```

Tunnel lets you see code changes quickly while developing.

---

## Where to find the app in Jira

After installing:

- **Project page**: open a Jira project → look for `melduoapp` in the project sidebar (sometimes under “Apps” or “More …”).
- **Admin page**: Jira settings (gear icon) → Jira admin settings → Apps/Jira apps → look for `melduoapp (Admin)`.

---

## Manifest: adding a Jira project page

In [jira-app/melduoapp/manifest.yml](jira-app/melduoapp/manifest.yml), a project page looks like:

```yml
modules:
  jira:projectPage:
    - key: my-project-page
      resource: main
      resolver:
        function: resolver
      render: native
      title: My Project Page

resources:
  - key: main
    path: src/frontend/index.jsx

function:
  - key: resolver
    handler: index.handler
```

### Permissions (scopes)

To read/write Jira issues and comments, you need scopes like:

```yml
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
```

After changing scopes, you must run an **install upgrade** to re-consent scopes:

```bash
forge install -e development --site <your-site>.atlassian.net --product jira --upgrade all
```

---

## Using `@forge/api` (calling Jira from the resolver)

The backend resolver uses `@forge/api`:

- `api.asApp().requestJira(...)` → calls Jira as the **app** (comments/actions are performed by the app identity)
- `api.asUser().requestJira(...)` → calls Jira as the **current user** (requires user consent; useful when you want the action attributed to the user)

Example pattern (Jira search):

- New endpoint: `POST /rest/api/3/search/jql`
- Old endpoint removed: `GET /rest/api/3/search` (returns 410)

---

## Common issues / gotchas

### 1) Runtime validation error (`nodejs24.x`)

Forge currently validates the runtime name. If you see a validation error like:

- runtime `nodejs24.x` not allowed

Use a supported runtime in the manifest (example):

```yml
app:
  runtime:
    name: nodejs22.x
```

### 2) Jira search API removed (HTTP 410)

If you see:

- `Jira API error (410): The requested API has been removed...`

Update your code to use:

- `POST /rest/api/3/search/jql`

### 3) Dependency vulnerabilities (e.g., lodash)

After adding packages, `npm audit` may report vulnerabilities in transitive deps (for example `lodash`).

To remediate:

```bash
npm audit
npm audit fix
```

Only run `npm audit fix --force` if you understand the breaking changes.

---

## Repo structure

- [jira-app/melduoapp/](jira-app/melduoapp/) — Jira UI Kit app (project page + admin page)

---

## License

See individual package licenses and Atlassian Forge terms.
