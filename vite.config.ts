// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // This ERP runs on the shop's own Mac against a local SQLite file, so it is
  // built as a plain Node server rather than for Cloudflare Workers — Workers
  // cannot open a local database, which is what broke the hosted version.
  nitro: { preset: "node-server" },
  vite: {
    build: {
      // better-sqlite3 is a native module: it must stay external and be
      // required at runtime rather than bundled.
      rollupOptions: { external: ["better-sqlite3"] },
    },
  },
});
