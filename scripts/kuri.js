#!/usr/bin/env node
/**
 * kuri — Pi skill CLI for Kuri browser automation.
 *
 * Core operations are always available directly.
 * Advanced operations (click, type, fill, audit, etc.) are documented
 * in references/ADVANCED.md and invoked via 'kuri.js action <args>'.
 *
 * Usage:
 *   node kuri.js health
 *   node kuri.js tabs
 *   node kuri.js navigate <url> [tab_id]
 *   node kuri.js tab-new [url]
 *   node kuri.js screenshot [tab_id] [--output path]
 *   node kuri.js page-info [tab_id]
 *   node kuri.js text [tab_id]
 *   node kuri.js markdown [tab_id]
 *   node kuri.js links [tab_id]
 *   node kuri.js snap [tab_id]
 *   node kuri.js action <click|type|fill|select|scroll|evaluate|...> [args...]
 *   node kuri.js advanced               # Print reference to ADVANCED.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createWriteStream } from "node:fs";
import { get } from "node:https";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Configuration ──────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

function kuriBaseUrl() {
  return process.env.KURI_BASE_URL || "http://127.0.0.1:8080";
}

function kuriApiToken() {
  if (process.env.KURI_API_TOKEN) return process.env.KURI_API_TOKEN;
  if (process.env.KURI_SECRET) return process.env.KURI_SECRET;
  try {
    return readFileSync(`${homedir()}/.kuri/api.token`, "utf-8").trim();
  } catch {
    return "";
  }
}

function defaultSession() {
  return process.env.KURI_SESSION || "pi-kuri-skill";
}

function sessionTabId() {
  return process.env.KURI_TAB_ID || "";
}

function headers(session) {
  const h = {
    "X-Kuri-Session": session || defaultSession(),
    Accept: "application/json",
  };
  const token = kuriApiToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

async function kuriFetch(path, query = {}, method = "GET", body = null) {
  const base = kuriBaseUrl().replace(/\/+$/, "");
  const params = new URLSearchParams(query).toString();
  const url = `${base}${path}${params ? `?${params}` : ""}`;
  const opts = {
    method,
    headers: headers(query.session || ""),
    signal: AbortSignal.timeout(30_000),
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(url, opts);
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("image/png") || ct.includes("image/")) {
    const buf = await resp.arrayBuffer();
    return { _binary: true, data: Buffer.from(buf), contentType: ct };
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Kuri ${path}: ${resp.status} ${resp.statusText} — ${text.slice(0, 300)}`);
  }
  return resp.json();
}

// ── Output helpers ──────────────────────────────────────────────────────────

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function printText(label, data) {
  if (typeof data === "string") {
    console.log(data);
    return;
  }
  if (data._binary) {
    console.log(`[binary: ${data.data.length} bytes, ${data.contentType}]`);
    return;
  }
  // Navigate through common response shapes
  let result = data;
  if (data && typeof data === "object") {
    if (data.result && typeof data.result === "object") {
      const r = data.result;
      if (r.result && r.result.value !== undefined) result = r.result.value;
      else if (r.value !== undefined) result = r.value;
      else if (r.text !== undefined) result = r.text;
      else if (r.data !== undefined) result = r.data;
      else if (r.markdown !== undefined) result = r.markdown;
      else result = r;
    } else if (data.value !== undefined) {
      result = data.value;
    } else if (data.text !== undefined) {
      result = data.text;
    } else if (data.markdown !== undefined) {
      result = data.markdown;
    }
  }
  if (typeof result === "string") {
    console.log(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

// ── Core operations ─────────────────────────────────────────────────────────

async function cmdHealth() {
  const data = await kuriFetch("/health");
  printJson(data);
}

async function cmdTabs() {
  const data = await kuriFetch("/tabs");
  printJson(data);
}

async function cmdTabNew(url) {
  const params = {};
  if (url) params.url = encodeURI(url);
  const data = await kuriFetch("/tab/new", params);
  const tabId = data?.result?.tabId || data?.result?.id || data?.id || "";
  if (tabId) {
    // Store the tab ID for convenience
    console.log(`Tab created: ${tabId}`);
    // Also print full response
    printJson(data);
  } else {
    printJson(data);
  }
}

async function cmdNavigate(url, tabId) {
  if (!url) {
    console.error("Usage: kuri.js navigate <url> [tab_id]");
    process.exit(1);
  }
  if (!tabId) {
    // Try to find the current tab
    try {
      const tabs = await kuriFetch("/tabs");
      const list = Array.isArray(tabs) ? tabs : (tabs.tabs || tabs.result || []);
      const current = list.find((t) => t.current);
      if (current) tabId = current.id;
    } catch { /* ignore */ }
  }
  if (!tabId) {
    console.error("No tab available. Open one first: kuri.js tab-new <url>");
    process.exit(1);
  }
  const params = { url, tab_id: tabId };
  const data = await kuriFetch("/navigate", params);
  printText("Navigated", data);
}

async function resolveTabId(requested) {
  if (requested) return requested;
  if (sessionTabId()) return sessionTabId();
  try {
    const tabs = await kuriFetch("/tabs");
    const list = Array.isArray(tabs) ? tabs : (tabs.tabs || tabs.result || []);
    const current = list.find((t) => t.current);
    if (current) return current.id;
  } catch { /* ignore */ }
  return "";
}

async function cmdPageInfo(tabId) {
  const params = {};
  if (tabId) params.tab_id = tabId;
  // Kuri v0.4.1+ may not have /page-info; fall back to /tabs filtered by tab
  try {
    const data = await kuriFetch("/page-info", params);
    printJson(data);
  } catch (err) {
    // Fallback: list tabs and find the requested one
    const tabs = await kuriFetch("/tabs");
    const list = Array.isArray(tabs) ? tabs : (tabs.tabs || tabs.result || []);
    if (tabId) {
      const tab = list.find((t) => t.id === tabId);
      if (tab) {
        console.log(JSON.stringify({ url: tab.url, title: tab.title, current: tab.current || false }, null, 2));
        return;
      }
    }
    // Show current tab info
    const current = list.find((t) => t.current);
    if (current) {
      console.log(JSON.stringify({ url: current.url, title: current.title, tab_id: current.id }, null, 2));
    } else {
      printJson(tabs);
    }
  }
}

async function cmdScreenshot(tabId, outputPath) {
  tabId = await resolveTabId(tabId);
  const params = {};
  if (tabId) params.tab_id = tabId;
  const data = await kuriFetch("/screenshot", params);

  if (data._binary) {
    const path = outputPath || `/tmp/kuri-screenshot-${Date.now()}.png`;
    writeFileSync(path, data.data);
    console.log(`Screenshot saved: ${path} (${data.data.length} bytes)`);
    return;
  }

  // Handle JSON-wrapped base64
  let raw = data;
  if (data.result?.data) raw = data.result.data;
  else if (data.data) raw = data.data;
  else if (typeof data === "string") raw = data;

  if (typeof raw === "string") {
    // Strip data URI prefix
    if (raw.includes(",")) raw = raw.split(",")[1];
    const buf = Buffer.from(raw, "base64");
    const path = outputPath || `/tmp/kuri-screenshot-${Date.now()}.png`;
    writeFileSync(path, buf);
    console.log(`Screenshot saved: ${path} (${buf.length} bytes)`);
  } else {
    printJson(data);
  }
}

async function cmdText(tabId) {
  tabId = await resolveTabId(tabId);
  const params = {};
  if (tabId) params.tab_id = tabId;
  const data = await kuriFetch("/text", params);
  printText("Text", data);
}

async function cmdMarkdown(tabId) {
  tabId = await resolveTabId(tabId);
  const params = {};
  if (tabId) params.tab_id = tabId;
  const data = await kuriFetch("/markdown", params);
  printText("Markdown", data);
}

async function cmdLinks(tabId) {
  tabId = await resolveTabId(tabId);
  const params = {};
  if (tabId) params.tab_id = tabId;
  const data = await kuriFetch("/links", params);
  printJson(data);
}

async function cmdSnap(tabId) {
  tabId = await resolveTabId(tabId);
  const params = {};
  if (tabId) params.tab_id = tabId;
  try {
    const data = await kuriFetch("/snapshot", { ...params, filter: "interactive", format: "compact" });
    printText("Accessibility snapshot", data);
  } catch {
    // Fallback to full snapshot
    const data = await kuriFetch("/snapshot", params);
    printText("Accessibility snapshot", data);
  }
}

// ── Advanced operation dispatcher ───────────────────────────────────────────

async function cmdAction(action, args) {
  const tabId = args.tab_id || sessionTabId();
  const params = { ...args };
  if (tabId) params.tab_id = tabId;

  switch (action) {
    // Navigation
    case "back": {
      const data = await kuriFetch("/back", params);
      printText("Back", data);
      break;
    }
    case "forward": {
      const data = await kuriFetch("/forward", params);
      printText("Forward", data);
      break;
    }
    case "reload": {
      const data = await kuriFetch("/reload", params);
      printText("Reload", data);
      break;
    }

    // Interaction
    case "click": {
      if (!args.ref) { console.error("Usage: click <ref> [tab_id]"); process.exit(1); }
      const data = await kuriFetch("/action", { ...params, action: "click", ref: args.ref });
      printText("Click", data);
      break;
    }
    case "type": {
      if (!args.ref || !args.value) { console.error("Usage: type <ref> <value> [tab_id]"); process.exit(1); }
      const data = await kuriFetch("/action", { ...params, action: "type", ref: args.ref, value: args.value });
      printText("Type", data);
      break;
    }
    case "fill": {
      if (!args.ref || !args.value) { console.error("Usage: fill <ref> <value> [tab_id]"); process.exit(1); }
      const data = await kuriFetch("/action", { ...params, action: "fill", ref: args.ref, value: args.value });
      printText("Fill", data);
      break;
    }
    case "select": {
      if (!args.ref || !args.value) { console.error("Usage: select <ref> <value> [tab_id]"); process.exit(1); }
      const data = await kuriFetch("/action", { ...params, action: "select", ref: args.ref, value: args.value });
      printText("Select", data);
      break;
    }
    case "scroll": {
      const dir = args.direction || "down";
      const amount = args.amount || "";
      const data = await kuriFetch("/action", { ...params, action: "scroll", direction: dir, ...(amount ? { amount } : {}) });
      printText("Scroll", data);
      break;
    }

    // Content
    case "evaluate": {
      if (!args.expression) { console.error("Usage: evaluate <expression> [tab_id]"); process.exit(1); }
      const data = await kuriFetch("/evaluate", { ...params, expression: args.expression });
      printText("Evaluate", data);
      break;
    }

    // Cookies & Security
    case "cookies": {
      const data = await kuriFetch("/cookies", params);
      printJson(data);
      break;
    }
    case "audit": {
      const data = await kuriFetch("/audit", params);
      printJson(data);
      break;
    }

    // Tab management
    case "close-tab": {
      if (!args.tab_id && !tabId) { console.error("Usage: close-tab <tab_id>"); process.exit(1); }
      const data = await kuriFetch("/tab/close", { tab_id: args.tab_id || tabId });
      printText("Close tab", data);
      break;
    }

    default:
      console.error(`Unknown action: ${action}`);
      console.error("See references/ADVANCED.md for all available actions.");
      process.exit(1);
  }
}

function cmdAdvanced() {
  const advPath = resolve(SKILL_ROOT, "references", "ADVANCED.md");
  console.log(`\n  📖 Full Kuri API reference: ${advPath}`);
  console.log("  Read that file with the 'read' tool for all ~100 advanced options.\n");
}

// ── CLI routing ─────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2];
  const args = process.argv.slice(3);

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(`
Kuri Browser Automation — Pi Skill CLI

Usage:
  node scripts/kuri.js <command> [args...]

Core Commands:
  health                  Check if Kuri server is running
  tabs                    List all browser tabs
  tab-new [url]           Open a new tab (optionally navigate to URL)
  navigate <url> [tab_id] Navigate tab to URL
  page-info [tab_id]      Get current page URL, title, ready state
  screenshot [tab_id]     Capture page screenshot
  text [tab_id]           Extract page text content
  markdown [tab_id]       Extract page as markdown
  links [tab_id]          Extract all links
  snap [tab_id]           Get accessibility snapshot (interactive refs)

Advanced (see references/ADVANCED.md for full docs):
  action click <ref> [tab_id]
  action type <ref> <value> [tab_id]
  action fill <ref> <value> [tab_id]
  action select <ref> <value> [tab_id]
  action scroll [direction] [amount] [tab_id]
  action evaluate <expression> [tab_id]
  action cookies [tab_id]
  action audit [tab_id]
  action back|forward|reload [tab_id]
  action close-tab <tab_id>

Utilities:
  advanced                Print path to full API reference
`);
    return;
  }

  try {
    switch (cmd) {
      case "health":
        await cmdHealth();
        break;
      case "tabs":
        await cmdTabs();
        break;
      case "tab-new":
        await cmdTabNew(args[0]);
        break;
      case "navigate":
        await cmdNavigate(args[0], args[1]);
        break;
      case "page-info":
        await cmdPageInfo(args[0]);
        break;
      case "screenshot":
        await cmdScreenshot(args[0], process.env.KURI_OUTPUT);
        break;
      case "text":
        await cmdText(args[0]);
        break;
      case "markdown":
        await cmdMarkdown(args[0]);
        break;
      case "links":
        await cmdLinks(args[0]);
        break;
      case "snap":
        await cmdSnap(args[0]);
        break;
      case "action":
        // Parse remaining args: action <subcommand> [key=value...]
        const sub = args[0];
        const actionArgs = {};
        for (let i = 1; i < args.length; i++) {
          if (args[i].includes("=")) {
            const [k, ...v] = args[i].split("=");
            actionArgs[k] = v.join("=");
          } else if (!actionArgs.ref && !["back", "forward", "reload"].includes(sub)) {
            // Positional args fill in as needed
            if (!actionArgs.ref) actionArgs.ref = args[i];
            else if (!actionArgs.value) actionArgs.value = args[i];
            else if (!actionArgs.direction) actionArgs.direction = args[i];
          }
        }
        await cmdAction(sub, actionArgs);
        break;
      case "advanced":
        cmdAdvanced();
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        console.error("Run 'node scripts/kuri.js --help' for usage.");
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
