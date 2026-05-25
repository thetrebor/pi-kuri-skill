# pi-kuri-skill

A [Pi](https://pi.dev) skill for **Kuri** browser automation — navigate, screenshot, extract page content, and interact with web pages via Kuri's HTTP API.

## Design

Two-phase progressive disclosure:

- **Phase 1 (Core)** 🟢 — 10 essential commands always in context (navigate, screenshot, page info, text/markdown extraction, links, accessibility snapshots, tab management)
- **Phase 2 (Advanced)** 🔵 — ~100 advanced options loaded on demand by reading `references/ADVANCED.md` (click, type, fill, select, scroll, JS eval, cookies, security audit, HAR, session management)

## Prerequisites

- [Kuri](https://github.com/justrach/kuri) server running on `http://127.0.0.1:8080` (or custom `KURI_BASE_URL`)
- Node.js 18+

## Installation

### Option A: Pi Skill Discovery

Clone into a pi skill location:

```bash
git clone https://github.com/thetrebor/pi-kuri-skill.git ~/.pi/agent/skills/pi-kuri-skill
cd ~/.pi/agent/skills/pi-kuri-skill
npm install
```

### Option B: Project-Level Skill

```bash
cd /path/to/your/project
git clone https://github.com/thetrebor/pi-kuri-skill.git .pi/skills/pi-kuri-skill
cd .pi/skills/pi-kuri-skill
npm install
```

### Option C: Standalone Usage

```bash
git clone https://github.com/thetrebor/pi-kuri-skill.git
cd pi-kuri-skill
npm install
```

Then use the CLI directly:

```bash
node scripts/kuri.js health
node scripts/kuri.js navigate https://example.com
node scripts/kuri.js screenshot
```

## Quick Start

```bash
# Ensure Kuri is running
mh kuri start

# Navigate to a page
node scripts/kuri.js navigate https://example.com

# Check page info
node scripts/kuri.js page-info

# Take a screenshot
node scripts/kuri.js screenshot

# Extract content
node scripts/kuri.js text
node scripts/kuri.js links

# For interactive actions, load the advanced reference
# (read references/ADVANCED.md)
```

## Core Commands

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
| `kuri.js action <...>` | Advanced actions (click, type, fill, etc.) |

## Advanced Reference

See [references/ADVANCED.md](references/ADVANCED.md) for the full API reference
covering ~100 endpoints, options, and workflow patterns.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KURI_BASE_URL` | `http://127.0.0.1:8080` | Kuri server URL |
| `KURI_SESSION` | `pi-kuri-skill` | Active session ID |
| `KURI_API_TOKEN` | (from `~/.kuri/api.token`) | API auth token |
| `KURI_OUTPUT` | `/tmp/kuri-*.png` | Screenshot output path |

## Related

- [Kuri](https://github.com/justrach/kuri) — Zig-native browser automation server
- [pi-dev](https://github.com/thetrebor/pi-dev) — Milhouse control plane (includes `mh kuri` commands)
- [Pi](https://pi.dev) — The coding agent harness
