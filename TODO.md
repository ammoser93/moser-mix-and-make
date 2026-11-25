# Moser Mix & Make — Features & To-Do List

> A living roadmap for **Moser Mix & Make** (`moser-mix-and-make`), a Kindle e-reader-inspired household kitchen app for recipes, weekly family menu picking, pantry/freezer tracking, and interactive cooking frameworks.  
> **Stack:** HTML, CSS, JavaScript (frontend) + Firebase (database, auth & storage).

---

## Phase 1: Project Setup
- [x] **Come up with a repo name** — `moser-mix-and-make` *(Display: Moser Mix & Make)*
- [x] **Create the project folder / Git repo** — `C:\Projects\moser-mix-and-make`
- [x] **Add `TODO.md` and `design.md` to the repo root**

## Phase 2: Kindle E-Reader Theme & Starter Shell
- [x] **Draft `design.md`** defining the Kindle e-reader aesthetic (Paper/Sepia/Night palettes, `Literata` + `Inter` typography, `Aa` display settings, custom `M` monogram icon, and kitchen ergonomics)
- [x] **Build navigation & multi-page layout prototype** (HTML/CSS/JS) with Home, Menu preview, Recipes, Pantry, Frameworks, and Import views
- [x] **Refine e-reader shell** — remove literal book/chapter wording, fix `Aa` text size scaling, add `M` monogram icon, and build interactive Weekly Menu preview
- [x] **Final theme sign-off** — Phase 2 complete! *(v0.2 recorded in `design.md`)*

## Phase 3: Recipe Format & Google Drive Reference
- [x] **Pull and review existing recipes from Google Drive** — inspected template + 6 sample recipes across 30 root `"Recipe: ..."` docs
- [x] **Finalize the household recipe format / data schema** — documented in `schema.md` (`tags[]`, `showOnMenu` boolean, `ingredientGroups`, `instructionGroups` with sub-steps, optional `meta`, `settings/tags`, and backup-first mass-update workflow) and updated the prototype to match

## Phase 4: Firebase Backend & Household Security
- [ ] **Create Firebase project (`moser-mix-and-make`)** and configure Firestore database, Firebase Auth, and Storage (for recipe photos) *(in progress)*
- [ ] Write Firestore & Storage Security Rules so data access is strictly enforced on the backend
- [ ] Wire up Firebase SDK and a clean JS data layer

## Phase 5: Recipe Book
- [ ] Recipe library view (browse, search, filter by tags)
- [ ] Distraction-free cooking / reading view (checkable ingredients/steps, screen wake-lock while cooking)
- [ ] Add & edit recipe forms with **tag-chip autocomplete input** (pick existing tags from `settings/tags` or type a new tag that auto-adds for everyone) + image upload
- [ ] Import the 30 root `"Recipe: ..."` Google Drive docs into Firebase *(skipping subfolders for now)*

## Phase 6: Weekly Family Menu & Shopping List
- [ ] Kid-friendly visual Menu page showing `showOnMenu: true` recipes with photos
- [ ] Playful selection animation & weekly pick state saved to Firebase so the whole household sees what was chosen
- [ ] Auto-generated combined ingredient / grocery list from all selected meals for the week (with pantry cross-check & weekly reset)

## Phase 7: Pantry & Freezer Inventory
- [ ] Pantry & freezer inventory view (organized by location: Pantry, Freezer, Fridge, Spices, etc.)
- [ ] Quick add, update quantity/status, and mark items low or out
- [ ] Cross-reference pantry items with Weekly Menu grocery list and interactive frameworks

## Phase 8: Interactive Cooking Frameworks
- [ ] Frameworks hub page using the shared e-reader theme
- [ ] Sourdough calculator page
- [ ] Scalable chili framework (dynamically scales ratios based on available meat)
- [ ] Reusable page pattern for adding more interactive frameworks later

## Phase 9: Photo-to-Recipe Importer
- [ ] Image upload / mobile camera capture UI
- [ ] Convert recipe photos into our structured recipe format
- [ ] Review & tweak extracted recipe before saving to the recipe book

## Phase 10: Admin Page
- [ ] Admin page restricted to admin role (enforced via Firebase Auth + Firestore Security Rules)
- [ ] Household member / role management (e.g., admin vs. household member / kid-friendly access)
- [ ] **Master tag manager** (add, rename, merge, or prune tags in `settings/tags` and sync affected recipes)
- [ ] Kitchen & app management tools (reset weekly menu, manage pantry locations, data export/backup, and additional admin tools as needs emerge)

## Phase 11: Polish & Household Deployment
- [x] **PWA installability** — `manifest.webmanifest` (`short_name: "Mix & Make"`), iOS/Android PNG icons, service worker (`sw.js`), mobile safe-area insets, and dynamic status-bar theme color
- [ ] Responsive layout polish for phones, tablets, and kitchen counters
- [ ] Deploy over HTTPS for household access & phone installation (Firebase Hosting)
