# Moser Mix & Make — Data Schema (`schema.md`)

> Canonical Firestore data model for **Moser Mix & Make**.  
> Designed around the household Google Drive recipe format, supporting flexible tags, weekly menu picking, pantry inventory, and role-based admin controls.

---

## SQL → Firestore Mental Model

Unlike a normalized SQL database (separate `recipes`, `tags`, and `recipe_tags` join tables), **Firestore** stores self-contained JSON documents in collections so a page loads in 1 read with zero joins:

- Each recipe stores its own `tags: ["Entrees", "Sourdough"]` array directly for instant rendering and `array-contains` filtering.
- A single lightweight document (`settings/tags`) holds the master tag list for autocomplete/chip selection. When anyone adds a brand-new tag on a recipe, the app appends it via Firestore `arrayUnion()`, immediately making it available to everyone else.
- The Admin page can rename, merge, or clean up tags in `settings/tags` (and batch-update matching recipes).

---

## 1. Collection: `recipes/{recipeId}`

Matches the household Google Drive template (**Title → Ingredients → Instructions → Notes**) while supporting grouped ingredients, extra instruction sections, nested sub-steps, and optional metadata.

```json
{
  "id": "pizza-dough-50-50",
  "title": "Pizza Dough (50/50 Blend or All-Purpose)",
  "subtitle": "",
  "tags": ["Entrees", "Bread & Dough", "Freezer-Friendly"],
  "showOnMenu": true,

  "ingredientGroups": [
    {
      "label": "",
      "items": [
        "75 g fresh-milled flour (or swap for 75 g all-purpose)",
        "75 g all-purpose flour",
        "110 g cool water",
        "3 g salt (1/2 tsp)",
        "1.5 g instant yeast (1/2 tsp)",
        "5 g olive oil (1 tsp)"
      ]
    }
  ],

  "instructionGroups": [
    {
      "label": "",
      "steps": [
        {
          "text": "Stir together flour, salt, yeast, water, and olive oil until cohesive."
        },
        {
          "text": "At the same time:",
          "substeps": [
            "Combine sauce ingredients and heat",
            "Brown meat and drain grease",
            "Boil pasta"
          ]
        }
      ]
    },
    {
      "label": "Freezer Instructions",
      "steps": [
        { "text": "Par-bake crusts at 475°F for 4–5 minutes until firm but pale." }
      ]
    }
  ],

  "notes": "Fresh-milled flour absorbs water slowly; overnight rest develops gluten with no kneading.",

  "meta": {
    "prepTime": "",
    "cookTime": "",
    "yield": "",
    "sourceName": "",
    "sourceUrl": ""
  },

  "imageUrl": "",
  "createdAt": "2026-11-25T00:00:00Z",
  "updatedAt": "2026-11-25T00:00:00Z"
}
```

### Field Rules
- **`title`** *(required)*: Display title (strip `"Recipe: "` prefix when importing from Google Drive).
- **`tags`** *(string[])*: Zero or more flexible tags. Used for filtering in **Recipes** and **Menu**.
- **`showOnMenu`** *(boolean)*: Controls whether the recipe appears on the kid-friendly **Weekly Menu** picker (`true` for meals/breakfasts/sides, `false` for spice mixes, sauces, canning staples).
- **`ingredientGroups`**: Array of `{ label, items[] }`. Simple recipes have one group with `label: ""`. Multi-part recipes (e.g., *Hamburger Helper*: `"Mix"` + `"Cooking"`) have multiple labeled groups. Each item stays a clean plain-text string to preserve parenthetical notes and substitutions.
- **`instructionGroups`**: Array of `{ label, steps[] }`. Primary instructions use `label: ""`. Extra sections (e.g., `"Freezer Instructions"`) get their own labeled group. Each step is `{ text, substeps? }`.
- **`notes`** *(string, optional)*: Freeform tips/notes (multiline). Empty or template placeholder text (`"[Any additional notes or tips]"`) is omitted on render.
- **`meta`** *(object, all fields optional)*: `prepTime`, `cookTime`, `yield`, `sourceName`, `sourceUrl`. Only rendered if non-empty.
- **`imageUrl`** *(string, optional)*: URL to the recipe's photo (used on **Weekly Menu** cards so the kids can see the dish, and optionally on the recipe page). Empty string falls back to clean default e-ink artwork.

---

## 2. Collection: `settings`

### `settings/tags`
Single lightweight master tag list powering the token/chip autocomplete input and Admin tag manager:
```json
{
  "items": [
    "Entrees",
    "Sides",
    "Breakfast",
    "Bread & Dough",
    "Sourdough",
    "Dessert",
    "Mixes & Sauces",
    "Canning & Pickles",
    "Freezer-Friendly"
  ],
  "updatedAt": "2026-11-25T00:00:00Z"
}
```

### `settings/pantry` *(Phase 7 / 10)*
```json
{
  "locations": ["Pantry", "Freezer", "Fridge", "Spices"]
}
```

---

## 3. Collection: `weeklyMenu` *(Phase 6)*

### `weeklyMenu/current`
Shared across the household so when kids tap meals on a tablet/phone, everyone sees the week's picks live:
```json
{
  "recipeIds": ["crispy-beef-tacos", "baked-cheesy-pasta"],
  "checkedGroceryKeys": [],
  "updatedAt": "2026-11-25T00:00:00Z"
}
```

---

## 4. Collection: `pantry/{itemId}` *(Phase 7)*

```json
{
  "id": "ground-beef-85-15",
  "name": "Ground Beef (85/15)",
  "location": "Freezer",
  "qty": "2.5 lb",
  "status": "ok",
  "updatedAt": "2026-11-25T00:00:00Z"
}
```
- `status`: `"ok"` (`In Stock`) | `"low"` (`Running Low`) | `"out"` (`Out`).

---

## 5. Collection: `admins/{email}` *(Feature 4 / 10 — Security)*

Public read-only model with a small private list of authorized editors (Google Sign-In only, `email_verified == true`). Keyed by lowercase Google email in Firestore so **zero personal email addresses ever appear in the public Git repo**:
```json
{
  "name": "Alex",
  "updatedAt": "2026-11-25T00:00:00Z"
}
```
- **Everyone (signed out or non-admin):** Full read-only access to `recipes`, `weeklyMenu`, `pantry`, and `settings` (cannot read `admins`).
- **Admins (listed in `admins/{email}`):** Full read/write access across all collections + access to the Admin page.

---

## 6. Schema Evolution & Mass Updates

- **Adding new optional fields (zero migration needed):** Firestore is schemaless — our JS data layer always applies safe defaults (e.g. `recipe.rating ?? null`), so older documents keep working immediately without a table `ALTER`.
- **When a true mass update / backfill is needed:**
  1. **Backup first:** Export the household Firestore collections to a local JSON snapshot (also planned as a 1-click button on the Admin page).
  2. **Preview & batch-apply:** Run a small idempotent migration script (either via an AI agent using Firebase Admin/CLI locally, or an Admin-page batched write up to 500 docs per batch) with a dry-run diff before committing writes.
