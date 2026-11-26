# Moser Mix & Make

A Kindle-inspired household kitchen book for **recipes**, **pantry & freezer inventory**, **interactive cooking frameworks** (like sourdough calculators and scalable chili ratios), and **photo-to-recipe importing**.

## Project Docs
- [`TODO.md`](./TODO.md) — Feature roadmap and progress checklist
- [`design.md`](./design.md) — Living Kindle e-reader theme and design system
- [`schema.md`](./schema.md) — Firestore data model and mass-update workflow

## Running Locally (With Real Firebase Login)
Firebase Google Sign-In requires `http://localhost` (it won't run on `file://`).
- Double-click **`serve.cmd`** (or run `.\serve.ps1` in PowerShell) to launch a zero-dependency local server at **`http://localhost:8080`** and open it in your browser.
- `localhost` is authorized by Firebase Auth by default, so you can sign in with Google and test real Firestore reads/writes locally before pushing!
