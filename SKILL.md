---
name: kuri
description: Kuri browser automation — navigate, screenshot, extract page content, and interact with web pages via the Kuri HTTP server. Use when an agent needs to browse the web, take screenshots, extract content, or verify rendered pages.
---

# Kuri Browser Automation Skill

This skill provides browser automation capabilities through Kuri's HTTP API.
Kuri is a Zig-native browser automation server running on `http://127.0.0.1:8080`.

## Design — Two Phases

| Phase | What's Available | When |
|-------|-----------------|------|
| **Core** 🟢 | Navigate, screenshot, page info, text/markdown extraction, links, accessibility snapshots, tab management | Always loaded |
| **Advanced** 🔵 | Click, type, fill, select, scroll, JS eval, cookies, audit, session mgmt, HAR | Read `ADVANCED.md` on demand |

## ⚙️ Setup

Kuri must be running:

```bash
# From the project workspace
mh kuri start
mh kuri status
```

The CLI scripts are at `~/.pi/agent/skills/kuri/scripts/kuri.js`.
The full advanced reference is at `~/.pi/agent/skills/kuri/references/ADVANCED.md`.

## 🟢 Phase 1 — Core Operations

Run the CLI script from any directory:

### Health & Tabs

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js health
node ~/.pi/agent/skills/kuri/scripts/kuri.js tabs
node ~/.pi/agent/skills/kuri/scripts/kuri.js tab-new [url]
```

### Navigation

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js navigate <url>
```

### Page Information

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js page-info
```

### Screenshots

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js screenshot
```

Set `KURI_OUTPUT` env var to customize save path.

### Content Extraction

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js text
node ~/.pi/agent/skills/kuri/scripts/kuri.js markdown
node ~/.pi/agent/skills/kuri/scripts/kuri.js links
```

### Accessibility Snapshot (for interactive refs)

```bash
node ~/.pi/agent/skills/kuri/scripts/kuri.js snap
```

Snapshot returns refs like `e0`, `e1`... These are used with advanced actions.

## 🔵 Phase 2 — Advanced Operations

```bash
read ~/.pi/agent/skills/kuri/references/ADVANCED.md
```

Covers: click, right-click, double-click, hover, type, fill, select, scroll,
back/forward/reload, JavaScript evaluation, cookies, security audit, session
management, network HAR recording, browser configuration.

## 🔄 Typical Workflow

1. `node ~/.pi/agent/skills/kuri/scripts/kuri.js health`
2. `node ~/.pi/agent/skills/kuri/scripts/kuri.js navigate https://example.com`
3. `node ~/.pi/agent/skills/kuri/scripts/kuri.js page-info`
4. `node ~/.pi/agent/skills/kuri/scripts/kuri.js screenshot`
5. `node ~/.pi/agent/skills/kuri/scripts/kuri.js text`
6. Read ADVANCED.md if interactive actions are needed

**Tip:** Re-snap after navigation or DOM changes — refs are snapshot-local.
