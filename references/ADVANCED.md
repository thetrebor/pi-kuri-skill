# Kuri Advanced API Reference

This document covers all advanced Kuri operations beyond the core commands
in SKILL.md. Load this on demand when you need click, type, fill, select,
scroll, JavaScript evaluation, cookies, security audits, or tab management.

---

## Usage Pattern

All advanced operations use the `action` subcommand:

```bash
node scripts/kuri.js action <operation> [params...]
```

Parameters can be passed positionally or as `key=value` pairs:

```bash
# Positional
node scripts/kuri.js action click e3
node scripts/kuri.js action type e3 hello

# Key=value
node scripts/kuri.js action click ref=e3
node scripts/kuri.js action type ref=e3 value=hello tab_id=MYTABID

# Combined
node scripts/kuri.js action click ref=e3 tab_id=MYTABID
```

---

## 🔹 Mouse Actions

### Click Element

```bash
node scripts/kuri.js action click <ref> [tab_id]
node scripts/kuri.js action click ref=e3 tab_id=MYTABID
```

### Right-click

```bash
node scripts/kuri.js action click ref=e3 button=right
```

### Double-click

```bash
node scripts/kuri.js action click ref=e3 clickCount=2
```

### Hover

The action endpoint supports hover semantics when no click is performed.
Use evaluate for precise hover scenarios, or rely on the accessibility
snapshot to detect hover-triggered elements.

---

## 🔹 Keyboard Actions

### Type Text

Types text into an input field, replacing existing content:

```bash
node scripts/kuri.js action type <ref> <text> [tab_id]
node scripts/kuri.js action type ref=e3 value="hello world"
```

### Fill Input

Fills an input value (similar to type but may clear first):

```bash
node scripts/kuri.js action fill <ref> <value> [tab_id]
node scripts/kuri.js action fill ref=e3 value="user@example.com"
```

### Select Dropdown

Select an option in a dropdown/select element:

```bash
node scripts/kuri.js action select <ref> <value> [tab_id]
node scripts/kuri.js action select ref=e3 value="option-value"
```

### Key Press

Press a specific keyboard key:

```bash
node scripts/kuri.js action evaluate ref=e3 expression="document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}))"
```

---

## 🔹 Navigation Actions

### Browser Back

```bash
node scripts/kuri.js action back [tab_id]
```

### Browser Forward

```bash
node scripts/kuri.js action forward [tab_id]
```

### Reload Page

```bash
node scripts/kuri.js action reload [tab_id]
```

### Close Tab

```bash
node scripts/kuri.js action close-tab <tab_id>
```

---

## 🔹 Scrolling

```bash
# Scroll down (default, ~5 units)
node scripts/kuri.js action scroll [tab_id]
node scripts/kuri.js action scroll direction=down [tab_id]

# Scroll up
node scripts/kuri.js action scroll direction=up amount=10 [tab_id]

# Scroll left/right
node scripts/kuri.js action scroll direction=left amount=3 [tab_id]
node scripts/kuri.js action scroll direction=right [tab_id]

# Scroll to specific pixel position
node scripts/kuri.js action scroll direction=down amount=500 [tab_id]
```

---

## 🔹 JavaScript Evaluation

Execute arbitrary JavaScript in the page context and get the result:

```bash
node scripts/kuri.js action evaluate <expression> [tab_id]
node scripts/kuri.js action evaluate expression="document.title"
node scripts/kuri.js action evaluate expression="document.querySelector('h1').textContent"
node scripts/kuri.js action evaluate expression="JSON.stringify(window.__INITIAL_STATE__)"
node scripts/kuri.js action evaluate expression="document.body.scrollHeight"
```

Returns the evaluated result (string, number, boolean, or JSON).

---

## 🔹 Cookies

List all cookies for the current page with security flags:

```bash
node scripts/kuri.js action cookies [tab_id]
```

Output includes: name, value, domain, path, secure, httpOnly, sameSite, expires.

---

## 🔹 Security Audit

Run a full security audit on the current page:

```bash
node scripts/kuri.js action audit [tab_id]
```

Checks:
- Security response headers (HSTS, CSP, X-Frame-Options, etc.)
- Cookie security flags (Secure, HttpOnly, SameSite)
- Mixed content warnings
- HTTPS enforcement

---

## 🔹 Session Management

Kuri uses the `X-Kuri-Session` header for session-based tab management.
Set your session before making calls:

```bash
export KURI_SESSION="my-session"
```

A session groups tabs and actions together. When you use `export KURI_SESSION`,
you don't need to pass `tab_id` — Kuri tracks the current tab per session.

### Get/Set Current Tab Per Session

```bash
export KURI_SESSION="my-session"
node scripts/kuri.js tab-new https://example.com   # Creates tab in session
node scripts/kuri.js navigate https://other.com     # Uses session's current tab
```

### Override Tab ID

When you need to target a specific tab:

```bash
node scripts/kuri.js navigate <url> <tab_id>
node scripts/kuri.js action click ref=e3 tab_id=TABID123
```

---

## 🔹 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KURI_BASE_URL` | `http://127.0.0.1:8080` | Kuri server URL |
| `KURI_SESSION` | `pi-kuri-skill` | Active session ID |
| `KURI_TAB_ID` | (empty) | Default tab ID override |
| `KURI_API_TOKEN` | (from `~/.kuri/api.token`) | API auth token |
| `KURI_SECRET` | (same as token) | Alternative token env var |
| `KURI_OUTPUT` | `/tmp/kuri-*.png` | Screenshot output path |
| `KURI_PORT` | `8080` | Server port (used by `mh kuri start`) |

---

## 🔹 Full Endpoint Map

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server health check |
| GET | `/tabs` | List all tabs |
| GET/POST | `/tab/new` | Create new tab |
| GET | `/tab/close` | Close a tab |
| GET | `/navigate` | Navigate tab to URL |
| GET | `/page-info` | Current page metadata |
| GET | `/page` | Page state |
| GET | `/screenshot` | Capture viewport screenshot |
| GET | `/snapshot` | Accessibility tree snapshot |
| GET | `/text` | Page plain text |
| GET | `/markdown` | Page as markdown |
| GET | `/links` | Extract all links |
| GET | `/action` | Perform action (click, type, fill, select, scroll) |
| GET | `/evaluate` | Execute JavaScript |
| GET | `/cookies` | List cookies |
| GET | `/audit` | Security audit |
| GET | `/back` | Browser back |
| GET | `/forward` | Browser forward |
| GET | `/reload` | Reload page |
| GET | `/har` | HTTP Archive recording |
| GET | `/har/start` | Start HAR recording |
| GET | `/har/stop` | Stop and return HAR |
| GET | `/headers` | Response security headers |
| GET | `/token` | Print or rotate API token |

### Query Parameters (applicable to most endpoints)

| Parameter | Type | Description |
|-----------|------|-------------|
| `tab_id` | string | Target tab ID |
| `url` | string | URL to navigate to |
| `ref` | string | Element reference from snapshot |
| `action` | string | Action type: click, type, fill, select, scroll |
| `value` | string | Value for type/fill/select |
| `direction` | string | Scroll direction: up, down, left, right |
| `amount` | number | Scroll amount |
| `button` | string | Mouse button: left, right, middle |
| `clickCount` | number | Click count (1=single, 2=double) |
| `expression` | string | JavaScript expression to evaluate |
| `filter` | string | Snapshot filter: interactive, all |
| `format` | string | Snapshot format: compact, json, verbose |
| `session` | string | X-Kuri-Session override |
| `wait` | number | Wait before response (ms) |
| `timeout` | number | Operation timeout (ms) |

---

## 🔹 Common Workflow Patterns

### Pattern 1: Quick Screenshot Verification

```bash
node scripts/kuri.js navigate https://example.com/page
node scripts/kuri.js page-info                          # Verify loaded
export KURI_OUTPUT=/tmp/evidence.png
node scripts/kuri.js screenshot                         # Visual proof
```

### Pattern 2: Fill Form and Submit

```bash
node scripts/kuri.js navigate https://example.com/login
node scripts/kuri.js snap                               # Get refs
node scripts/kuri.js action type ref=e0 value="user@example.com"
node scripts/kuri.js action type ref=e1 value="password123"
node scripts/kuri.js action click ref=e2                # Submit button
node scripts/kuri.js page-info                          # Check result
```

### Pattern 3: Extract Dynamic Content

```bash
node scripts/kuri.js navigate https://example.com/app
node scripts/kuri.js action evaluate expression="JSON.stringify(window.__DATA__)"
node scripts/kuri.js text                               # Also get rendered text
```

### Pattern 4: Multi-step Interaction Loop

```bash
# 1. Open page
node scripts/kuri.js navigate https://example.com/search
# 2. Get snapshot for refs
node scripts/kuri.js snap
# 3. Search
node scripts/kuri.js action type ref=e0 value="query"
# 4. Wait for results (evaluate to check)
node scripts/kuri.js action evaluate expression="document.querySelectorAll('.result').length"
# 5. Re-snap after DOM change
node scripts/kuri.js snap
# 6. Click a result
node scripts/kuri.js action click ref=e3
# 7. Verify
node scripts/kuri.js page-info
node scripts/kuri.js screenshot
```
