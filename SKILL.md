---
name: kuri
description: Kuri browser automation — navigate, screenshot, extract page content, and interact with web pages via the Kuri HTTP server. Use when an agent needs to browse the web, take screenshots, extract content, or verify rendered pages.
---

# Kuri Browser Automation Skill

This skill provides browser automation capabilities through Kuri's HTTP API.
Kuri is a Zig-native browser automation server running on `http://127.0.0.1:8080`.

## Design

This skill has **two phases**:

| Phase | What's Available | When |
|-------|-----------------|------|
| **Core** 🟢 | Navigate, screenshot, page info, text/markdown extraction, links, accessibility snapshots, tab management | Always loaded when this skill is active |
| **Advanced** 🔵 | Click, type, fill, select, scroll, JavaScript evaluation, cookies, security audit, tab close, back/forward/reload | Read `references/ADVANCED.md` on demand |

The core commands cover 90% of common browser automation needs. For the full API
reference (~100 endpoints and options), read the advanced reference file.

---

## ⚙️ Setup

Kuri must be running. Start it from the terminal:

```bash
mh kuri start
```

Or check status:

```bash
mh kuri status
```

The skill discovers the Kuri API token automatically from `~/.kuri/api.token`.
Override with `KURI_API_TOKEN` or `KURI_SECRET` environment variable.

Configure the server URL:

```bash
export KURI_BASE_URL="http://127.0.0.1:8080"    # default
export KURI_SESSION="my-session"                 # default: pi-kuri-skill
```

---

## 🟢 Phase 1 — Core Operations

These commands are always available. Run them from the skill directory:

```bash
cd /path/to/pi-kuri-skill
```

### Health & Tabs

```bash
node scripts/kuri.js health          # Check if server is running
node scripts/kuri.js tabs            # List all open tabs
node scripts/kuri.js tab-new [url]   # Open a new tab, optionally navigate
```

### Navigation

```bash
node scripts/kuri.js navigate <url>          # Navigate current tab to URL
node scripts/kuri.js navigate <url> <tab_id>  # Navigate a specific tab
```

### Page Information

```bash
node scripts/kuri.js page-info [tab_id]  # URL, title, ready state
```

### Screenshots

```bash
node scripts/kuri.js screenshot [tab_id]          # Saves to /tmp/
export KURI_OUTPUT=path/to/output.png
node scripts/kuri.js screenshot [tab_id]          # Saves to custom path
```

### Content Extraction

```bash
node scripts/kuri.js text [tab_id]      # Plain text of the page
node scripts/kuri.js markdown [tab_id]  # Page as Markdown
node scripts/kuri.js links [tab_id]     # All links on the page
```

### Accessibility Snapshot

```bash
node scripts/kuri.js snap [tab_id]  # Interactive element refs (e0, e1...)
```

The snapshot returns interactive elements with refs like `e0`, `e1` etc.
These refs are used with advanced actions (click, type, fill, select).

---

## 🔵 Phase 2 — Advanced Operations

For click, type, fill, select, scroll, JavaScript evaluation, cookies, security
audits, and tab management:

```bash
# Load the full reference
read references/ADVANCED.md
```

The advanced reference documents all actions with examples, including:
- Mouse actions: click, right-click, double-click, hover
- Keyboard actions: type, fill, select, key press
- Navigation: back, forward, reload, close tab
- Scrolling: scroll up, down, left, right, to element
- JavaScript evaluation
- Cookie management and security audit
- Session management
- Network request recording (HAR)
- Browser configuration flags

---

## 🔄 Typical Workflow

1. **Check health**: `node scripts/kuri.js health`
2. **Open a page**: `node scripts/kuri.js navigate https://example.com`
3. **Wait & check**: `node scripts/kuri.js page-info`
4. **Verify visually**: `node scripts/kuri.js screenshot`
5. **Get content**: `node scripts/kuri.js text` or `node scripts/kuri.js markdown`
6. **Extract links**: `node scripts/kuri.js links`
7. **Interact** (if needed): Read `references/ADVANCED.md` then use `action`
8. **Refresh state** after any navigation: re-run `page-info` and `snap`

**Tip:** Accessibility refs (`e0`, `e1`...) are snapshot-local. Always re-snap
after navigation or DOM changes before using refs with click/type/fill/select.

---

## 📚 Reference

| Command | Description |
|---------|-------------|
| `kuri.js health` | Server health check |
| `kuri.js tabs` | List all browser tabs |
| `kuri.js tab-new [url]` | Open new tab |
| `kuri.js navigate <url>` | Navigate to URL |
| `kuri.js page-info` | Current page info |
| `kuri.js screenshot` | Capture screenshot |
| `kuri.js text` | Extract plain text |
| `kuri.js markdown` | Extract markdown |
| `kuri.js links` | Extract links |
| `kuri.js snap` | Accessibility snapshot |
| `kuri.js action <...>` | Advanced actions (see ADVANCED.md) |
| `kuri.js advanced` | Print path to ADVANCED.md |
