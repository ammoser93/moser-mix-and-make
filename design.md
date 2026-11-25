# Moser Mix & Make — Design System (`design.md`)

> Living design specification for the **Moser Mix & Make** household web app.  
> Update this document whenever the visual theme, typography, colors, or layout patterns evolve.

---

## 1. Design Philosophy: "Kindle E-Reader Calm"

The interface draws from the look and feel of a **Kindle Paperwhite / Scribe e-reader device** — calm matte surfaces, high-legibility typography, minimalist chrome, and zero visual noise — rather than a literal printed book with chapters or Roman numerals. It should feel effortless to read from across the kitchen counter, and inviting enough for kids to tap through when picking dinner for the week.

### Core Principles
1. **E-Ink Surface & Soft Ink:** Matte warm paper backgrounds and soft charcoal ink instead of stark `#FFFFFF` / `#000000` glare.
2. **Typography & Whitespace First:** Clear hierarchy via serif + sans pairing, crisp sizing, and generous breathing room rather than loud gradients or heavy drop shadows.
3. **Hairline Structure:** Thin `1px` borders and subtle separators give every card, list, and control an e-ink crispness.
4. **Device-Style Quiet Chrome:** A single slim top toolbar (brand mark, navigation links, and `Aa` display settings) plus a thumb-friendly bottom bar on phones/tablets.
5. **Kitchen & Family Ergonomics:** Live `Aa` theme/font-size/spacing scaling across the whole app, large tap targets (`>= 44px`), checkable ingredients/steps, and joyful tactile feedback on the Weekly Menu picker.

---

## 2. Brand Mark & Iconography

- **Monogram Logo:** A custom rounded-square e-ink stamp badge containing a refined serif **`M`** with a subtle warm bookmark accent corner — designed to work cleanly at favicon (`16px`–`32px`), header (`28px`), and future phone home-screen icon sizes.
- **Navigation Icons:** Clean, thin-stroke (`1.6px`) monochrome SVG icons in the mobile bottom bar, adapting automatically to Paper, Sepia, and Night ink colors.

---

## 3. Color Palettes (E-Reader Display Themes)

Switchable live via the **`Aa`** Display Settings menu and persisted in `localStorage`. Defined in `css/tokens.css`.

### Theme A: Paper *(Default — Daylight E-Ink)*
| Token | Value | Role |
| :--- | :--- | :--- |
| `--bg-page` | `#F6F2E9` | Main matte paper canvas |
| `--bg-surface` | `#FDFBF7` | Cards, panels, popovers |
| `--bg-subtle` | `#ECE6D9` | Recessed fills, pills, hover states |
| `--ink-primary` | `#1F1D1A` | Primary headings & body copy |
| `--ink-secondary` | `#5C554B` | Subtitles, descriptions, labels |
| `--ink-muted` | `#8A8175` | Metadata, footer, checked-off items |
| `--rule` | `#D9D1C3` | Hairline dividers & card borders |
| `--rule-strong` | `#BFB5A4` | Active borders & form outlines |
| `--accent` | `#8C4A32` | Warm terracotta accent (active nav, buttons, checkmarks, menu picks) |
| `--accent-soft` | `#F1E3DC` | Soft accent wash for selected pills & badges |
| `--status-ok` | `#46664C` | Sage green — "In Stock" / picked confirmation |
| `--status-low` | `#9A6B26` | Warm ochre — "Running Low" |
| `--status-out` | `#9E3E33` | Muted brick — "Out" |

### Theme B: Sepia *(Warm Evening)*
- Canvas `#EFE5D1`, Surface `#F7EFE0`, Subtle `#E3D5BC`, Ink `#2B2218`, Accent `#854128`.

### Theme C: Night *(Dark E-Ink)*
- Canvas `#191816`, Surface `#22201D`, Subtle `#2C2925`, Ink `#E6E0D5`, Accent `#CE886A`.

---

## 4. Typography & Live `Aa` Scaling

| Role | Font Family | Fallback | Notes |
| :--- | :--- | :--- | :--- |
| **Reading & Titles** | `Literata` | `Georgia, "Iowan Old Style", serif` | E-reader serif designed for crisp digital legibility |
| **UI Chrome, Controls & Numbers** | `Inter` | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Clean navigation, tags, pills, and tabular numbers (`tabular-nums`) |

### Root Font-Size Scaling (`html[data-size]`)
Because all page typography uses `rem` units, text-size settings scale the **root `html` font size** directly so headings, body text, ingredients, steps, cards, and tables all resize together cleanly:
- **Compact (`A−`):** `14.5px` root
- **Standard *(default)*:** `16.5px` root
- **Large (`A+`):** `19.5px` root

*(The `Aa` popover itself uses fixed `px` sizes so controls stay steady while clicking through sizes.)*

### Line Spacing (`html[data-spacing]`)
- **Compact:** `1.48`
- **Standard:** `1.66`
- **Relaxed:** `1.88`

---

## 5. Navigation & Page Architecture

| Page | Route | Purpose |
| :--- | :--- | :--- |
| **Home** | `#home` | Clean e-reader home screen with section launcher cards & quick kitchen shortcuts |
| **Menu** | `#menu` | Kid-friendly visual recipe picker with celebratory pick animation & combined weekly ingredient list |
| **Recipes** | `#recipes` / `#recipe/:id` | Searchable household recipe library & distraction-free cooking view with tap-to-check lines |
| **Pantry** | `#pantry` | Pantry, freezer, fridge, and spice inventory ledger with quick status cycling |
| **Frameworks** | `#frameworks` | Interactive ratio calculators (Sourdough, Scalable House Chili, etc.) |
| **Import** | `#import` | Photo-to-recipe upload & review flow |
| **Admin** *(Phase 10)* | `#admin` | Role-gated household settings, member allowlist, menu reset, and data tools (backed by Firebase Security Rules) |

---

## 6. Signature E-Reader & Family UI Patterns

- **Clean E-Ink Cards:** `--bg-surface` + `1px solid var(--rule)` + `8px` radius + subtle hover border darkening.
- **Weekly Menu Pick Animation:** Selecting a meal triggers a springy card pop, a lightweight warm-palette particle sparkle burst, an animated "Picked for This Week" stamp badge, and a bouncy floating tray summarizing chosen meals with a one-tap **Weekly Ingredient List** modal/drawer.
- **Interactive Cooking Checklists:** Tapping any ingredient or step marks it off with muted ink and a crisp checkmark.
- **Bottom Mobile Bar (`< 760px`):** Collapses top nav links into a sticky thumb-friendly icon + label bar for phones and kitchen tablets.

---

## 7. Design Changelog
- **v0.2:** Shifted from literal "Kindle book / chapters / TOC" framing to a clean **Kindle e-reader** aesthetic; renamed Contents → **Home**; replaced `§` with custom **`M` monogram SVG** icon & favicon; fixed `Aa` text-size scaling by scaling root `html` font-size; added kid-friendly **Menu** page preview with pick animations & combined weekly ingredient list; documented planned **Admin** page.
- **v0.1:** Initial Paper / Sepia / Night palettes, `Literata` + `Inter` pairing, `Aa` display popover, and starter shell.
