// Installs the background services so the shop owner never runs anything by hand.
//   npm run services:install     → install and start
//   npm run services:status      → show what is running
//   npm run services:uninstall   → remove everything
//
// Three launchd agents are created:
//   com.shopos.app          starts ShopOS at login and restarts it if it stops
//   com.shopos.backup       daily backup at 22:00
//   com.shopos.maintenance  weekly integrity check + optimise, Sunday 03:00
//
// These are LaunchAgents (per-user), not LaunchDaemons, so no admin password is
// needed. They start when this user logs in — set the Mac to log in
// automatically if it should come back up unattended after a power cut.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AGENTS_DIR = join(homedir(), "Library", "LaunchAgents");
const LOG_DIR = join(homedir(), "ShopOS", "logs");
const NODE = process.execPath;                     // absolute path — launchd has almost no PATH
const PORT = process.env.SHOPOS_PORT || "3000";

const AGENTS = {
  "com.shopos.app": {
    label: "ShopOS app",
    args: [NODE, join(PROJECT_DIR, ".output", "server", "index.mjs")],
    env: { PORT, NODE_ENV: "production" },
    keepAlive: true,
    runAtLoad: true,
  },
  "com.shopos.backup": {
    label: "Daily backup (22:00)",
    args: [NODE, join(PROJECT_DIR, "scripts", "backup.mjs")],
    calendar: { Hour: 22, Minute: 0 },
  },
  "com.shopos.maintenance": {
    label: "Weekly maintenance (Sun 03:00)",
    args: [NODE, join(PROJECT_DIR, "scripts", "maintenance.mjs")],
    calendar: { Weekday: 0, Hour: 3, Minute: 0 },
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plistPath = (name) => join(AGENTS_DIR, `${name}.plist`);

function buildPlist(name, cfg) {
  const args = cfg.args.map((a) => `      <string>${esc(a)}</string>`).join("\n");
  const env = Object.entries(cfg.env ?? {})
    .map(([k, v]) => `      <key>${esc(k)}</key>\n      <string>${esc(v)}</string>`)
    .join("\n");
  const calendar = cfg.calendar
    ? `    <key>StartCalendarInterval</key>
    <dict>
${Object.entries(cfg.calendar).map(([k, v]) => `      <key>${k}</key>\n      <integer>${v}</integer>`).join("\n")}
    </dict>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${name}</string>
    <key>ProgramArguments</key>
    <array>
${args}
    </array>
    <key>WorkingDirectory</key>
    <string>${esc(PROJECT_DIR)}</string>
${env ? `    <key>EnvironmentVariables</key>\n    <dict>\n${env}\n    </dict>` : ""}
    <key>RunAtLoad</key>
    <${cfg.runAtLoad ? "true" : "false"}/>
${cfg.keepAlive ? "    <key>KeepAlive</key>\n    <true/>" : ""}
${calendar}
    <key>StandardOutPath</key>
    <string>${esc(join(LOG_DIR, `${name}.log`))}</string>
    <key>StandardErrorPath</key>
    <string>${esc(join(LOG_DIR, `${name}.error.log`))}</string>
  </dict>
</plist>
`;
}

function launchctl(...args) {
  try {
    return execFileSync("launchctl", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    return err.stdout ?? "";
  }
}

const uid = process.getuid();
const domain = `gui/${uid}`;

function install() {
  if (!existsSync(join(PROJECT_DIR, ".output", "server", "index.mjs"))) {
    console.error("No production build found. Run this first:\n  npm run build");
    process.exit(1);
  }
  mkdirSync(AGENTS_DIR, { recursive: true });
  mkdirSync(LOG_DIR, { recursive: true });

  for (const [name, cfg] of Object.entries(AGENTS)) {
    const path = plistPath(name);
    launchctl("bootout", `${domain}/${name}`);          // ignore "not loaded"
    writeFileSync(path, buildPlist(name, cfg));
    launchctl("bootstrap", domain, path);
    launchctl("enable", `${domain}/${name}`);
    console.log(`✓ ${cfg.label.padEnd(34)} ${name}`);
  }

  console.log(`\nShopOS will start automatically at login on http://localhost:${PORT}`);
  console.log(`Logs: ${LOG_DIR}`);
  console.log(`\nFor unattended restarts after a power cut, also enable automatic login:`);
  console.log(`  System Settings → Users & Groups → Automatic login`);
}

function uninstall() {
  for (const [name, cfg] of Object.entries(AGENTS)) {
    launchctl("bootout", `${domain}/${name}`);
    const path = plistPath(name);
    if (existsSync(path)) unlinkSync(path);
    console.log(`✓ removed ${cfg.label}`);
  }
  console.log("\nShopOS will no longer start automatically.");
}

function status() {
  for (const [name, cfg] of Object.entries(AGENTS)) {
    const out = launchctl("print", `${domain}/${name}`);
    if (!out) {
      console.log(`✗ ${cfg.label.padEnd(34)} NOT INSTALLED`);
      continue;
    }
    const running = /state = running/.test(out);
    const pid = out.match(/pid = (\d+)/)?.[1];
    const lastExit = out.match(/last exit code = (\d+)/)?.[1];

    // The app should always be running; scheduled jobs are idle between fires,
    // which is normal rather than a fault.
    let detail;
    if (cfg.keepAlive) {
      detail = running ? `running (pid ${pid})` : "STOPPED — check the error log";
    } else {
      detail = running ? `running now (pid ${pid})` : "scheduled, waiting for next run";
    }
    const failed = lastExit && lastExit !== "0" && lastExit !== "(never exited)";
    console.log(`${running || !cfg.keepAlive ? "✓" : "✗"} ${cfg.label.padEnd(34)} ${detail}${failed ? `  ⚠ last run exited ${lastExit}` : ""}`);
  }
  console.log(`\nLogs: ${LOG_DIR}`);
}

switch (process.argv[2]) {
  case "install":   install(); break;
  case "uninstall": uninstall(); break;
  case "status":    status(); break;
  default:
    console.log(`Usage:
  node scripts/install-services.mjs install
  node scripts/install-services.mjs status
  node scripts/install-services.mjs uninstall`);
}
