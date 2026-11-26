# Moser Mix & Make — Features & To-Do List

> A living roadmap for **Moser Mix & Make** (`moser-mix-and-make`), a Kindle e-reader-inspired household kitchen app for recipes, weekly family menu picking, pantry/freezer tracking, and interactive cooking frameworks.  
> **Stack:** HTML, CSS, JavaScript (frontend) + Firebase (database, auth & storage).

---

## Feature 1: Project Setup
- [x] **Come up with a repo name** — `moser-mix-and-make` *(Display: Moser Mix & Make)*
- [x] **Create the project folder / Git repo** — `C:\Projects\moser-mix-and-make`
- [x] **Add `TODO.md` and `design.md` to the repo root**

## Feature 2: Kindle E-Reader Theme & Starter Shell
- [x] **Draft `design.md`** defining the Kindle e-reader aesthetic (Paper/Sepia/Night palettes, `Literata` + `Inter` typography, `Aa` display settings, custom `M` monogram icon, and kitchen ergonomics)
- [x] **Build navigation & multi-page layout prototype** (HTML/CSS/JS) with Home, Menu preview, Recipes, Pantry, Frameworks, and Import views
- [x] **Refine e-reader shell** — remove literal book/chapter wording, fix `Aa` text size scaling, add `M` monogram icon, and build interactive Weekly Menu preview
- [x] **Final theme sign-off** *(v0.2 recorded in `design.md`)*

## Feature 3: Recipe Format & Google Drive Reference
- [x] **Pull and review existing recipes from Google Drive** — inspected template + 6 sample recipes across 30 root `"Recipe: ..."` docs
- [x] **Finalize the household recipe format / data schema** — documented in `schema.md` (`tags[]`, `showOnMenu` boolean, `ingredientGroups`, `instructionGroups` with sub-steps, optional `meta`, `settings/tags`, and backup-first mass-update workflow) and updated the prototype to match

## Feature 4: Firebase Backend & Household Security
- [x] **Create Firebase project (`moser-mix-and-make`)** with Firestore and Google Sign-In enabled
- [x] **Finalize simplified Security Rules** (`firestore.rules` & `storage.rules`: public read-only, verified Google `admins/{email}` write access, zero personal emails in Git)
- [x] **Wire up Firebase SDK and JS data layer** (`js/firebase-config.js`, `js/db.js`, Google-only sign-in modal & live public-read / admin-write Firestore sync)
- [x] **Disable Email/Password, create `admins` docs, publish `firestore.rules`, and verify live sync**

## Feature 5: Recipe Book
- [x] **Recipe library view** (browse, search, filter by tags — live from Firestore)
- [x] **Distraction-free cooking / reading view** (checkable ingredients/steps, Screen Wake Lock toggle, Edit button for admins, dish photo header)
- [x] **Add & edit recipe forms** (`js/recipe-form.js`) with **tag-chip autocomplete input** (`settings/tags` + create new), photo upload/compression, grouped ingredients & instructions, nested sub-steps, and delete support
- [x] **Export & parse 30 root `"Recipe: ..."` Google Drive docs** into schema-matched JSON (`import/drive-recipes-import.json`) + built 1-click **Import JSON** tool in the Recipes header
- [ ] **Run 1-click Import JSON in the app & verify recipes in Firebase** *(current step)*

## Feature 6: Weekly Family Menu & Shopping List
- [ ] Kid-friendly visual Menu page showing `showOnMenu: true` recipes with photos
- [ ] Playful selection animation & weekly pick state saved to Firebase so the whole household sees what was chosen
- [ ] Auto-generated combined ingredient / grocery list from all selected meals for the week (with pantry cross-check & weekly reset)

## Feature 7: Pantry & Freezer Inventory
- [ ] Pantry & freezer inventory view (organized by location: Pantry, Freezer, Fridge, Spices, etc.)
- [ ] Quick add, update quantity/status, and mark items low or out
- [ ] Cross-reference pantry items with Weekly Menu grocery list and interactive frameworks

## Feature 8: Interactive Cooking Frameworks
- [ ] Frameworks hub page using the shared e-reader theme
- [ ] Sourdough calculator page
- [ ] Scalable chili framework (dynamically scales ratios based on available meat)
- [ ] Reusable page pattern for adding more interactive frameworks later

## Feature 9: Photo-to-Recipe Importer
- [ ] Image upload / mobile camera capture UI
- [ ] Convert recipe photos into our structured recipe format
- [ ] Review & tweak extracted recipe before saving to the recipe book

## Feature 10: Admin Page
- [ ] Admin page restricted to authorized editors in `admins/{email}` (enforced via Firebase Auth + Firestore Security Rules)
- [ ] Editor allowlist management (add/remove authorized Google emails)
- [ ] **Master tag manager** (add, rename, merge, or prune tags in `settings/tags` and sync affected recipes)
- [ ] Kitchen & app management tools (reset weekly menu, manage pantry locations, 1-click JSON export/backup, and additional admin tools as needs emerge)

## Feature 11: Automated Backups to Google Drive
- [ ] Periodic scheduled backup job that exports Firestore data (`recipes`, `pantry`, `settings`, `weeklyMenu`) to a timestamped JSON file
- [ ] Automatically upload and archive backup snapshots to a dedicated Google Drive folder (with retention/rotation so Drive stays tidy)
- [ ] Optional manual "Back up now" trigger & restore-from-JSON workflow

## Feature 12: Polish & Household Deployment
- [x] **PWA installability** — `manifest.webmanifest` (`short_name: "Mix & Make"`), iOS/Android PNG icons, service worker (`sw.js`), mobile safe-area insets, and dynamic status-bar theme color
- [ ] Responsive layout polish for phones, tablets, and kitchen counters
- [ ] Deploy over HTTPS for household access & phone installation (Firebase Hosting)
