#!/bin/bash
# Build for Cloudflare Pages
bun run build
# Copy SSR worker to client output so Cloudflare Pages picks it up
cp dist/server/server.js dist/client/_worker.js
