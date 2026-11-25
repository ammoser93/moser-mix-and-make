/* ==========================================================================
   Moser Mix & Make — Navigation, Aa Controls & Interactive Prototype Views
   ========================================================================== */

(function () {
  const PREFS_KEY = "moser_reader_prefs_v2";
  const PICKS_KEY = "moser_weekly_picks_v1";

  const state = {
    route: "home",
    recipeId: null,
    recipeSearch: "",
    recipeCategory: "All",
    menuCategory: "All",
    pantryFilter: "All",
    chiliMeatLbs: 2.0,
    showGroceryList: false,
    checkedItems: new Set(),
    weeklyPicks: loadWeeklyPicks(),
    pantry: (window.MOSER_SAMPLE_DATA?.pantry || []).map((item) => ({ ...item })),
    prefs: loadPrefs(),
  };

  const SECTION_LABELS = {
    home: "Home",
    menu: "Weekly Menu",
    recipes: "Recipes",
    recipe: "Recipes",
    pantry: "Pantry & Freezer",
    frameworks: "Frameworks",
    import: "Photo Import",
  };

  /* ------------------------------------------------------------------------
     Persistence (Display Settings & Weekly Menu Picks)
     ------------------------------------------------------------------------ */

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        theme: saved.theme || "paper",
        size: saved.size || "standard",
        spacing: saved.spacing || "standard",
      };
    } catch {
      return { theme: "paper", size: "standard", spacing: "standard" };
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
    } catch {
      /* ignore storage restrictions */
    }
  }

  function loadWeeklyPicks() {
    try {
      const arr = JSON.parse(localStorage.getItem(PICKS_KEY) || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveWeeklyPicks() {
    try {
      localStorage.setItem(PICKS_KEY, JSON.stringify([...state.weeklyPicks]));
    } catch {
      /* ignore storage restrictions */
    }
  }

  const THEME_COLORS = {
    paper: "#F6F2E9",
    sepia: "#EFE5D1",
    night: "#191816",
  };

  let deferredInstallPrompt = null;

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.theme = state.prefs.theme;
    root.dataset.size = state.prefs.size;
    root.dataset.spacing = state.prefs.spacing;

    const themeMeta = document.getElementById("theme-color-meta");
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[state.prefs.theme] || THEME_COLORS.paper);
    }

    document.querySelectorAll("[data-pref-group]").forEach((btn) => {
      const group = btn.dataset.prefGroup;
      const val = btn.dataset.prefValue;
      const isSelected = state.prefs[group] === val;
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function initPWA() {
    if (
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.protocol === "http:")
    ) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        /* ignore registration errors in local dev */
      });
    }

    const wrap = document.getElementById("pwa-install-wrap");
    const btn = document.getElementById("pwa-install-btn");
    if (!wrap || !btn) return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      wrap.hidden = false;
    });

    btn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } finally {
        deferredInstallPrompt = null;
        wrap.hidden = true;
      }
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      wrap.hidden = true;
    });
  }

  function initReaderPopover() {
    const toggleBtn = document.getElementById("aa-toggle");
    const popover = document.getElementById("aa-popover");
    if (!toggleBtn || !popover) return;

    function setOpen(open) {
      popover.hidden = !open;
      toggleBtn.setAttribute("aria-expanded", String(open));
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(popover.hidden);
    });

    popover.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pref-group]");
      if (!btn) return;
      state.prefs[btn.dataset.prefGroup] = btn.dataset.prefValue;
      applyPrefs();
      savePrefs();
    });

    document.addEventListener("click", (e) => {
      if (!popover.hidden && !popover.contains(e.target) && e.target !== toggleBtn) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !popover.hidden) {
        setOpen(false);
        toggleBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Hash Router & Nav Sync
     ------------------------------------------------------------------------ */

  function parseHash() {
    const raw = (window.location.hash || "#home").replace(/^#/, "");
    if (raw.startsWith("recipe/")) {
      return { route: "recipe", recipeId: raw.slice("recipe/".length) };
    }
    const valid = ["home", "menu", "recipes", "pantry", "frameworks", "import"];
    return { route: valid.includes(raw) ? raw : "home", recipeId: null };
  }

  function syncNavUI() {
    const activeSection = state.route === "recipe" ? "recipes" : state.route;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === activeSection);
    });

    const footerSection = document.getElementById("footer-section");
    if (footerSection) {
      footerSection.textContent = SECTION_LABELS[state.route] || "Home";
    }

    const count = state.weeklyPicks.size;
    document.querySelectorAll("[data-menu-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  }

  /* ------------------------------------------------------------------------
     Helpers & Editorial Dish Illustrations (Placeholder Art for Menu Cards)
     ------------------------------------------------------------------------ */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDishArtwork(kind) {
    const art = {
      chicken: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <circle cx="160" cy="104" r="68" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="2"/>
          <circle cx="160" cy="104" r="56" stroke="var(--rule)" stroke-width="1.2" stroke-dasharray="3 4"/>
          <ellipse cx="144" cy="100" rx="30" ry="20" transform="rotate(-14 144 100)" fill="#B86B43" opacity="0.88"/>
          <ellipse cx="140" cy="96" rx="18" ry="9" transform="rotate(-14 140 96)" fill="#D99B66" opacity="0.7"/>
          <circle cx="192" cy="88" r="15" fill="#E8C55A" stroke="#C59D31" stroke-width="2"/>
          <circle cx="192" cy="88" r="10" stroke="#FDFBF7" stroke-width="1.4" stroke-dasharray="4 3"/>
          <path d="M128 130 C148 122, 178 124, 198 134" stroke="#4F7454" stroke-width="5" stroke-linecap="round"/>
          <path d="M138 140 C158 132, 182 135, 202 142" stroke="#648B69" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="122" cy="116" r="7" fill="#D5A664"/>
          <circle cx="182" cy="118" r="8" fill="#CCA05E"/>
        </svg>`,
      tacos: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <ellipse cx="160" cy="146" rx="92" ry="18" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="1.8"/>
          <path d="M92 134 C92 84, 168 84, 168 134 Z" fill="#DDB46D" stroke="#A67C37" stroke-width="2"/>
          <path d="M102 114 C118 100, 146 100, 158 114" stroke="#537B58" stroke-width="6" stroke-linecap="round"/>
          <circle cx="124" cy="112" r="4" fill="#B64937"/>
          <circle cx="142" cy="110" r="4" fill="#B64937"/>
          <path d="M148 140 C148 88, 228 88, 228 140 Z" fill="#E6C27D" stroke="#A67C37" stroke-width="2"/>
          <path d="M160 118 C178 102, 204 102, 216 118" stroke="#537B58" stroke-width="6" stroke-linecap="round"/>
          <path d="M168 122 C182 114, 198 114, 210 122" stroke="#E0A53C" stroke-width="4" stroke-linecap="round"/>
          <circle cx="184" cy="115" r="4" fill="#B64937"/>
          <circle cx="198" cy="118" r="3.5" fill="#B64937"/>
        </svg>`,
      pasta: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <rect x="74" y="64" width="172" height="84" rx="20" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="2"/>
          <rect x="86" y="74" width="148" height="64" rx="14" fill="#B94E38" opacity="0.88"/>
          <rect x="104" y="88" width="26" height="11" rx="5" transform="rotate(-18 104 88)" fill="#E9CFA0"/>
          <rect x="142" y="84" width="28" height="11" rx="5" transform="rotate(14 142 84)" fill="#F1DDA9"/>
          <rect x="180" y="92" width="26" height="11" rx="5" transform="rotate(-12 180 92)" fill="#E9CFA0"/>
          <rect x="122" y="109" width="28" height="11" rx="5" transform="rotate(8 122 109)" fill="#F1DDA9"/>
          <rect x="166" y="110" width="26" height="11" rx="5" transform="rotate(-16 166 110)" fill="#E9CFA0"/>
          <circle cx="136" cy="96" r="12" fill="#FDF8EE" opacity="0.85"/>
          <circle cx="176" cy="106" r="13" fill="#FDF8EE" opacity="0.85"/>
          <ellipse cx="158" cy="98" rx="9" ry="5" transform="rotate(-24 158 98)" fill="#4D7452"/>
          <ellipse cx="166" cy="102" rx="8" ry="4.5" transform="rotate(20 166 102)" fill="#628C67"/>
        </svg>`,
      sourdough: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <ellipse cx="160" cy="144" rx="94" ry="18" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="1.6"/>
          <path d="M84 132 C84 68, 236 68, 236 132 C236 146, 84 146, 84 132 Z" fill="#B57441" stroke="#854E24" stroke-width="2"/>
          <path d="M108 104 C132 82, 188 82, 212 104" stroke="#F4E7CF" stroke-width="4" stroke-linecap="round"/>
          <path d="M126 112 C146 98, 174 98, 194 112" stroke="#854E24" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="140" cy="86" r="2.2" fill="#F4E7CF" opacity="0.8"/>
          <circle cx="160" cy="82" r="2.5" fill="#F4E7CF" opacity="0.8"/>
          <circle cx="182" cy="87" r="2" fill="#F4E7CF" opacity="0.8"/>
        </svg>`,
      pancakes: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <ellipse cx="160" cy="146" rx="88" ry="18" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="1.8"/>
          <ellipse cx="160" cy="134" rx="64" ry="15" fill="#C98A49" stroke="#9A642E" stroke-width="1.6"/>
          <ellipse cx="160" cy="120" rx="62" ry="15" fill="#D49654" stroke="#9A642E" stroke-width="1.6"/>
          <ellipse cx="160" cy="106" rx="60" ry="15" fill="#DFAA67" stroke="#9A642E" stroke-width="1.6"/>
          <path d="M138 100 C150 96, 176 96, 184 104 C188 112, 182 126, 178 126 C174 126, 172 114, 166 114 C158 114, 156 122, 150 122 C144 122, 142 110, 138 100 Z" fill="#8C4A27" opacity="0.85"/>
          <rect x="149" y="92" width="22" height="12" rx="3" fill="#F4DF8F" stroke="#C9AE4F" stroke-width="1.5"/>
        </svg>`,
      broccoli: `
        <svg class="menu-card__art" viewBox="0 0 320 200" fill="none" aria-hidden="true">
          <rect width="320" height="200" fill="var(--bg-subtle)"/>
          <circle cx="160" cy="104" r="64" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="2"/>
          <path d="M148 118 L142 140 M172 118 L178 138" stroke="#6E946B" stroke-width="7" stroke-linecap="round"/>
          <circle cx="142" cy="96" r="19" fill="#4B7250"/>
          <circle cx="164" cy="86" r="21" fill="#58825D"/>
          <circle cx="182" cy="102" r="18" fill="#466B4B"/>
          <circle cx="158" cy="110" r="17" fill="#5D8862"/>
          <circle cx="146" cy="88" r="4" fill="#2E4431" opacity="0.7"/>
          <circle cx="174" cy="94" r="4.5" fill="#2E4431" opacity="0.7"/>
          <circle cx="196" cy="126" r="11" fill="#E8C55A" stroke="#C59D31" stroke-width="1.6"/>
        </svg>`,
    };
    return art[kind] || art.chicken;
  }

  function spawnPickBurst(originEl) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#8C4A32", "#C88263", "#46664C", "#D4A65E", "#B86B43"];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      const shape = i % 3 === 0 ? "pick-particle--star" : i % 2 === 0 ? "pick-particle--dot" : "";
      p.className = `pick-particle ${shape}`;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const dist = 48 + Math.random() * 58;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist - 14}px`;
      const rot = `${Math.round((Math.random() - 0.5) * 280)}deg`;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.backgroundColor = colors[i % colors.length];
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--dy", dy);
      p.style.setProperty("--rot", rot);
      document.body.appendChild(p);

      window.setTimeout(() => p.remove(), 760);
    }
  }

  /* ------------------------------------------------------------------------
     Page Renderers
     ------------------------------------------------------------------------ */

  function render() {
    const stage = document.getElementById("reader-stage");
    if (!stage) return;

    const isWide = state.route === "menu" || state.route === "recipe" || state.route === "pantry";
    stage.classList.toggle("reader-stage--wide", isWide);

    switch (state.route) {
      case "menu":
        stage.innerHTML = renderMenuView();
        bindMenuEvents(stage);
        break;
      case "recipes":
        stage.innerHTML = renderRecipesView();
        bindRecipesEvents(stage);
        break;
      case "recipe":
        stage.innerHTML = renderRecipeDetailView(state.recipeId);
        bindRecipeDetailEvents(stage);
        break;
      case "pantry":
        stage.innerHTML = renderPantryView();
        bindPantryEvents(stage);
        break;
      case "frameworks":
        stage.innerHTML = renderFrameworksView();
        bindFrameworksEvents(stage);
        break;
      case "import":
        stage.innerHTML = renderImportView();
        break;
      default:
        stage.innerHTML = renderHomeView();
        break;
    }

    syncNavUI();
  }

  function renderHomeView() {
    const recipesCount = (window.MOSER_SAMPLE_DATA?.recipes || []).length;
    const lowCount = state.pantry.filter((p) => p.status !== "ok").length;
    const picksCount = state.weeklyPicks.size;

    return `
      <header class="home-hero">
        <svg class="home-hero__emblem" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="41" height="41" rx="9" fill="var(--bg-surface)" stroke="var(--rule-strong)" stroke-width="1.5"/>
          <path d="M31 1.5 H36 C39.5 1.5 42.5 4.5 42.5 8 V13 L31 1.5 Z" fill="var(--accent)"/>
          <text x="21.5" y="30.5" text-anchor="middle" font-family="Literata, Georgia, serif" font-size="24" font-weight="600" fill="var(--ink-primary)">M</text>
        </svg>
        <div>
          <h1 class="home-hero__title">Moser Mix <span class="home-hero__amp">&amp;</span> Make</h1>
          <p class="home-hero__sub">Household recipes, weekly family menu, pantry list, and cooking frameworks.</p>
        </div>
      </header>

      <section aria-label="Main sections">
        <p class="section-label">Library</p>
        <ul class="home-nav-list">
          <li class="home-nav-item">
            <a class="home-nav-link" href="#menu">
              <div>
                <span class="home-nav-link__title">Weekly Menu</span>
                <span class="home-nav-link__desc">Visual meal picker for the kids + combined grocery list</span>
              </div>
              <span class="home-nav-link__right">${picksCount ? `${picksCount} picked` : "Pick meals"} →</span>
            </a>
          </li>
          <li class="home-nav-item">
            <a class="home-nav-link" href="#recipes">
              <div>
                <span class="home-nav-link__title">Recipes</span>
                <span class="home-nav-link__desc">Browse, search, and cook from distraction-free recipe pages</span>
              </div>
              <span class="home-nav-link__right">${recipesCount} samples →</span>
            </a>
          </li>
          <li class="home-nav-item">
            <a class="home-nav-link" href="#pantry">
              <div>
                <span class="home-nav-link__title">Pantry &amp; Freezer</span>
                <span class="home-nav-link__desc">Track what's stocked, running low, or out</span>
              </div>
              <span class="home-nav-link__right">${state.pantry.length} items →</span>
            </a>
          </li>
          <li class="home-nav-item">
            <a class="home-nav-link" href="#frameworks">
              <div>
                <span class="home-nav-link__title">Frameworks</span>
                <span class="home-nav-link__desc">Interactive calculators for sourdough, scalable chili, and more</span>
              </div>
              <span class="home-nav-link__right">Live demo →</span>
            </a>
          </li>
          <li class="home-nav-item">
            <a class="home-nav-link" href="#import">
              <div>
                <span class="home-nav-link__title">Photo Import</span>
                <span class="home-nav-link__desc">Snap a recipe photo and convert it into our house format</span>
              </div>
              <span class="home-nav-link__right">Planned →</span>
            </a>
          </li>
        </ul>
      </section>

      <hr class="divider-rule" />

      <section aria-label="Quick access">
        <p class="section-label">Quick Access</p>
        <div class="card-grid">
          <a class="eink-card eink-card--interactive eink-card--accent" href="#menu">
            <span class="eink-card__meta">Kid-Friendly Picker</span>
            <h3 class="eink-card__title">${picksCount ? `${picksCount} Meal${picksCount === 1 ? "" : "s"} Picked This Week` : "Build This Week's Menu"}</h3>
            <p class="eink-card__body">Tap recipe cards to pick meals for the week and pull a combined ingredient list.</p>
          </a>
          <a class="eink-card eink-card--interactive" href="#recipe/sheet-pan-lemon-chicken">
            <span class="eink-card__meta">Cooking View Preview</span>
            <h3 class="eink-card__title">Crispy Lemon &amp; Herb Chicken</h3>
            <p class="eink-card__body">Check off ingredients and steps as you cook, and test the Aa display controls.</p>
          </a>
          <a class="eink-card eink-card--interactive" href="#pantry">
            <span class="eink-card__meta">Pantry Snapshot</span>
            <h3 class="eink-card__title">${lowCount} Items Running Low or Out</h3>
            <p class="eink-card__body">Tap any status badge to cycle between In Stock, Running Low, and Out.</p>
          </a>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     Weekly Family Menu (#menu)
     ------------------------------------------------------------------------ */

  function renderMenuView() {
    const recipes = window.MOSER_SAMPLE_DATA?.recipes || [];
    const categories = ["All", ...new Set(recipes.map((r) => r.category))];
    const filtered = recipes.filter(
      (r) => state.menuCategory === "All" || r.category === state.menuCategory
    );

    const pickedRecipes = recipes.filter((r) => state.weeklyPicks.has(r.id));
    const pickedNames = pickedRecipes.map((r) => r.title).join(" · ");

    return `
      <header class="page-head page-head--row">
        <div>
          <h1 class="page-title">Weekly Menu</h1>
          <p class="page-subtitle">Tap any meal to add it to this week's menu and build an ingredient list.</p>
        </div>
        ${
          pickedRecipes.length
            ? `<button type="button" class="btn btn--primary" id="toggle-grocery-top">
                 ${state.showGroceryList ? "Hide Ingredient List" : `Ingredient List (${pickedRecipes.length})`}
               </button>`
            : ""
        }
      </header>

      <div class="toolbar">
        <div class="pill-bar" role="group" aria-label="Filter menu by category">
          ${categories
            .map(
              (cat) => `
            <button type="button" class="pill ${state.menuCategory === cat ? "is-active" : ""}" data-menu-cat="${escapeHtml(cat)}">
              ${escapeHtml(cat)}
            </button>`
            )
            .join("")}
        </div>
      </div>

      <div class="menu-grid">
        ${filtered
          .map((r) => {
            const picked = state.weeklyPicks.has(r.id);
            return `
              <article class="menu-card ${picked ? "is-picked" : ""}" data-menu-card="${escapeHtml(r.id)}">
                <div class="menu-card__media">
                  ${renderDishArtwork(r.illustration)}
                  <span class="menu-card__stamp" aria-hidden="${!picked}">✓ On This Week's Menu</span>
                </div>
                <div class="menu-card__body">
                  <div class="menu-card__top-meta">
                    <span class="tag">${escapeHtml(r.category)}</span>
                    <span>${escapeHtml(r.prepTime)} + ${escapeHtml(r.cookTime)}</span>
                  </div>
                  <h2 class="menu-card__title">${escapeHtml(r.title)}</h2>
                  <p class="menu-card__desc">${escapeHtml(r.subtitle)}</p>
                  <div class="menu-card__actions">
                    <button
                      type="button"
                      class="pick-btn"
                      data-pick-recipe="${escapeHtml(r.id)}"
                      aria-pressed="${picked}"
                    >
                      ${picked ? "✓ Picked!" : "+ Pick This Meal"}
                    </button>
                    <a class="menu-card__view-link" href="#recipe/${encodeURIComponent(r.id)}">Recipe →</a>
                  </div>
                </div>
              </article>`;
          })
          .join("")}
      </div>

      ${
        pickedRecipes.length
          ? `
        <div class="menu-tray" id="menu-tray">
          <div class="menu-tray__summary">
            <span class="menu-tray__title">This Week's Picks (${pickedRecipes.length})</span>
            <span class="menu-tray__meals">${escapeHtml(pickedNames)}</span>
          </div>
          <div class="menu-tray__actions">
            <button type="button" class="btn btn--ghost" id="clear-picks">Clear</button>
            <button type="button" class="btn btn--primary" id="toggle-grocery-tray">
              ${state.showGroceryList ? "Hide Ingredients" : "View Ingredient List"}
            </button>
          </div>
        </div>`
          : ""
      }

      ${state.showGroceryList && pickedRecipes.length ? renderWeeklyGroceryPanel(pickedRecipes) : ""}
    `;
  }

  function renderWeeklyGroceryPanel(pickedRecipes) {
    return `
      <section class="grocery-panel" id="grocery-panel" aria-labelledby="grocery-heading">
        <div class="grocery-panel__head">
          <div>
            <p class="section-label" style="margin-bottom: 0.25rem;">Generated From ${pickedRecipes.length} Picked Meal${pickedRecipes.length === 1 ? "" : "s"}</p>
            <h2 id="grocery-heading" class="eink-card__title" style="margin:0;">Weekly Ingredient List</h2>
          </div>
          <button type="button" class="btn btn--ghost" id="close-grocery">Close</button>
        </div>

        ${pickedRecipes
          .map(
            (r) => `
          <div class="grocery-group">
            <h3 class="grocery-group__title">${escapeHtml(r.title)}</h3>
            <ul class="check-list">
              ${r.ingredients
                .map((ing, i) => {
                  const key = `grocery:${r.id}:${i}`;
                  const checked = state.checkedItems.has(key);
                  return `
                    <li class="check-list__item ${checked ? "is-checked" : ""}" data-check-key="${key}" role="checkbox" aria-checked="${checked}" tabindex="0">
                      <span class="check-box" aria-hidden="true">✓</span>
                      <span class="check-list__text">${escapeHtml(ing)}</span>
                    </li>`;
                })
                .join("")}
            </ul>
          </div>`
          )
          .join("")}
      </section>
    `;
  }

  function bindMenuEvents(stage) {
    stage.querySelectorAll("[data-menu-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.menuCategory = btn.dataset.menuCat;
        render();
      });
    });

    stage.querySelectorAll("[data-pick-recipe]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.pickRecipe;
        const wasPicked = state.weeklyPicks.has(id);

        if (wasPicked) {
          state.weeklyPicks.delete(id);
          if (state.weeklyPicks.size === 0) state.showGroceryList = false;
        } else {
          state.weeklyPicks.add(id);
          spawnPickBurst(btn);
        }

        saveWeeklyPicks();
        render();

        if (!wasPicked) {
          const card = document.querySelector(`[data-menu-card="${CSS.escape(id)}"]`);
          if (card) {
            card.classList.add("just-picked");
            card.addEventListener("animationend", () => card.classList.remove("just-picked"), { once: true });
          }
          const tray = document.getElementById("menu-tray");
          if (tray) {
            tray.classList.add("is-bumping");
            tray.addEventListener("animationend", () => tray.classList.remove("is-bumping"), { once: true });
          }
        }
      });
    });

    const toggleGrocery = () => {
      state.showGroceryList = !state.showGroceryList;
      render();
      if (state.showGroceryList) {
        const panel = document.getElementById("grocery-panel");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    stage.querySelector("#toggle-grocery-top")?.addEventListener("click", toggleGrocery);
    stage.querySelector("#toggle-grocery-tray")?.addEventListener("click", toggleGrocery);
    stage.querySelector("#close-grocery")?.addEventListener("click", () => {
      state.showGroceryList = false;
      render();
    });

    stage.querySelector("#clear-picks")?.addEventListener("click", () => {
      state.weeklyPicks.clear();
      state.showGroceryList = false;
      saveWeeklyPicks();
      render();
    });

    bindCheckableItems(stage);
  }

  /* ------------------------------------------------------------------------
     Recipes Index & Cooking View (#recipes, #recipe/:id)
     ------------------------------------------------------------------------ */

  function renderRecipesView() {
    const recipes = window.MOSER_SAMPLE_DATA?.recipes || [];
    const categories = ["All", ...new Set(recipes.map((r) => r.category))];
    const q = state.recipeSearch.trim().toLowerCase();

    const filtered = recipes.filter((r) => {
      const catOk = state.recipeCategory === "All" || r.category === state.recipeCategory;
      const searchOk =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return catOk && searchOk;
    });

    const rows = filtered.length
      ? filtered
          .map(
            (r) => `
          <li class="recipe-row">
            <a class="recipe-row__link" href="#recipe/${encodeURIComponent(r.id)}">
              <div>
                <div class="recipe-row__title">${escapeHtml(r.title)}</div>
                <p class="recipe-row__blurb">${escapeHtml(r.subtitle)}</p>
              </div>
              <div class="recipe-row__meta">
                <span class="tag">${escapeHtml(r.category)}</span>
                <span>${escapeHtml(r.prepTime)} + ${escapeHtml(r.cookTime)}</span>
              </div>
            </a>
          </li>`
          )
          .join("")
      : `<li class="empty-state">No recipes match "${escapeHtml(state.recipeSearch)}".</li>`;

    return `
      <header class="page-head page-head--row">
        <div>
          <h1 class="page-title">Recipes</h1>
          <p class="page-subtitle">Placeholder entries — our real format will follow your Google Drive recipes.</p>
        </div>
        <button type="button" class="btn btn--primary" id="mock-add-recipe">+ Add Recipe</button>
      </header>

      <div class="toolbar">
        <input
          type="search"
          id="recipe-search"
          class="search-input"
          placeholder="Search recipes by title or style…"
          value="${escapeHtml(state.recipeSearch)}"
          aria-label="Search recipes"
        />
        <div class="pill-bar" role="group" aria-label="Filter by category">
          ${categories
            .map(
              (cat) => `
            <button type="button" class="pill ${state.recipeCategory === cat ? "is-active" : ""}" data-cat="${escapeHtml(cat)}">
              ${escapeHtml(cat)}
            </button>`
            )
            .join("")}
        </div>
      </div>

      <ul class="recipe-index">${rows}</ul>
    `;
  }

  function bindRecipesEvents(stage) {
    const search = stage.querySelector("#recipe-search");
    if (search) {
      search.addEventListener("input", (e) => {
        state.recipeSearch = e.target.value;
        render();
        const nextInput = document.getElementById("recipe-search");
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }

    stage.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.recipeCategory = btn.dataset.cat;
        render();
      });
    });

    stage.querySelector("#mock-add-recipe")?.addEventListener("click", () => {
      alert("Add/Edit Recipe forms will be built in Phase 5 after we finalize your Google Drive recipe format and Firebase setup.");
    });
  }

  function renderRecipeDetailView(recipeId) {
    const recipes = window.MOSER_SAMPLE_DATA?.recipes || [];
    const recipe = recipes.find((r) => r.id === recipeId) || recipes[0];
    if (!recipe) return `<p class="empty-state">Recipe not found.</p>`;

    return `
      <a class="back-link" href="#recipes">← Back to Recipes</a>

      <header class="page-head">
        <h1 class="page-title">${escapeHtml(recipe.title)}</h1>
        <p class="page-subtitle">${escapeHtml(recipe.subtitle)}</p>
        <div class="recipe-meta-strip">
          <span><strong>Category:</strong> ${escapeHtml(recipe.category)}</span>
          <span><strong>Prep:</strong> ${escapeHtml(recipe.prepTime)}</span>
          <span><strong>Cook:</strong> ${escapeHtml(recipe.cookTime)}</span>
          <span><strong>Yield:</strong> ${escapeHtml(recipe.servings)}</span>
        </div>
      </header>

      <div class="recipe-layout">
        <section aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" class="recipe-section-title">Ingredients</h2>
          <ul class="check-list">
            ${recipe.ingredients
              .map((ing, i) => {
                const key = `${recipe.id}:ing:${i}`;
                const checked = state.checkedItems.has(key);
                return `
                  <li class="check-list__item ${checked ? "is-checked" : ""}" data-check-key="${key}" role="checkbox" aria-checked="${checked}" tabindex="0">
                    <span class="check-box" aria-hidden="true">✓</span>
                    <span class="check-list__text">${escapeHtml(ing)}</span>
                  </li>`;
              })
              .join("")}
          </ul>
        </section>

        <section aria-labelledby="method-heading">
          <h2 id="method-heading" class="recipe-section-title">Method</h2>
          <ol class="step-list">
            ${recipe.steps
              .map((step, i) => {
                const key = `${recipe.id}:step:${i}`;
                const checked = state.checkedItems.has(key);
                return `
                  <li class="step-item ${checked ? "is-checked" : ""}" data-check-key="${key}" role="checkbox" aria-checked="${checked}" tabindex="0">
                    <span>${escapeHtml(step)}</span>
                  </li>`;
              })
              .join("")}
          </ol>

          <aside class="callout-note">
            <strong>Kitchen Note:</strong> ${escapeHtml(recipe.notes)}
          </aside>
        </section>
      </div>
    `;
  }

  function bindCheckableItems(stage) {
    const toggle = (el) => {
      const key = el.dataset.checkKey;
      if (!key) return;
      if (state.checkedItems.has(key)) {
        state.checkedItems.delete(key);
      } else {
        state.checkedItems.add(key);
      }
      const checked = state.checkedItems.has(key);
      el.classList.toggle("is-checked", checked);
      el.setAttribute("aria-checked", String(checked));
    };

    stage.querySelectorAll("[data-check-key]").forEach((el) => {
      el.addEventListener("click", () => toggle(el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(el);
        }
      });
    });
  }

  function bindRecipeDetailEvents(stage) {
    bindCheckableItems(stage);
  }

  /* ------------------------------------------------------------------------
     Pantry & Freezer (#pantry)
     ------------------------------------------------------------------------ */

  function renderPantryView() {
    const locations = ["All", "Pantry", "Freezer", "Fridge", "Spices"];
    const items = state.pantry.filter(
      (item) => state.pantryFilter === "All" || item.location === state.pantryFilter
    );

    const statusMeta = {
      ok: { label: "In Stock", cls: "status-btn--ok" },
      low: { label: "Running Low", cls: "status-btn--low" },
      out: { label: "Out", cls: "status-btn--out" },
    };

    return `
      <header class="page-head page-head--row">
        <div>
          <h1 class="page-title">Pantry &amp; Freezer</h1>
          <p class="page-subtitle">Tap any status pill to cycle between In Stock, Running Low, and Out.</p>
        </div>
        <button type="button" class="btn btn--primary" id="mock-add-pantry">+ Add Item</button>
      </header>

      <div class="toolbar">
        <div class="pill-bar" role="group" aria-label="Filter by storage location">
          ${locations
            .map(
              (loc) => `
            <button type="button" class="pill ${state.pantryFilter === loc ? "is-active" : ""}" data-loc="${loc}">
              ${loc}
            </button>`
            )
            .join("")}
        </div>
      </div>

      <table class="ledger-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Location</th>
            <th>On Hand</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              const s = statusMeta[item.status] || statusMeta.ok;
              return `
                <tr>
                  <td class="ledger-table__name">${escapeHtml(item.name)}</td>
                  <td><span class="tag">${escapeHtml(item.location)}</span></td>
                  <td class="ledger-table__qty">${escapeHtml(item.qty)}</td>
                  <td>
                    <button type="button" class="status-btn ${s.cls}" data-pantry-id="${item.id}" title="Click to cycle status">
                      ${s.label}
                    </button>
                  </td>
                </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  function bindPantryEvents(stage) {
    const order = ["ok", "low", "out"];

    stage.querySelectorAll("[data-loc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.pantryFilter = btn.dataset.loc;
        render();
      });
    });

    stage.querySelectorAll("[data-pantry-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.pantryId);
        const item = state.pantry.find((p) => p.id === id);
        if (!item) return;
        item.status = order[(order.indexOf(item.status) + 1) % order.length];
        render();
      });
    });

    stage.querySelector("#mock-add-pantry")?.addEventListener("click", () => {
      alert("Adding & saving pantry items will connect to Firebase in Phase 7.");
    });
  }

  /* ------------------------------------------------------------------------
     Interactive Frameworks (#frameworks)
     ------------------------------------------------------------------------ */

  function formatAmount(val, unit) {
    const rounded = Math.round(val * 4) / 4;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
    return `${text} ${unit}`;
  }

  function renderFrameworksView() {
    const lbs = state.chiliMeatLbs;
    const ratio = lbs / 2.0;

    return `
      <header class="page-head">
        <h1 class="page-title">Frameworks</h1>
        <p class="page-subtitle">Interactive ratio-driven tools for food you make by feel and math rather than fixed recipes.</p>
      </header>

      <div class="card-grid">
        <article class="eink-card eink-card--accent">
          <span class="eink-card__meta">Planned · Phase 8</span>
          <h2 class="eink-card__title">Sourdough Calculator</h2>
          <p class="eink-card__body">Baker's percentages, hydration scaling, levain build, and fermentation timeline.</p>
        </article>
        <article class="eink-card eink-card--accent">
          <span class="eink-card__meta">Live Preview Below</span>
          <h2 class="eink-card__title">Scalable House Chili</h2>
          <p class="eink-card__body">Dial in whatever weight of meat you pulled from the freezer to scale beans, tomatoes, broth, and spices.</p>
        </article>
      </div>

      <section class="framework-preview" aria-labelledby="chili-preview-heading">
        <p class="section-label">Interactive Preview</p>
        <h2 id="chili-preview-heading" class="eink-card__title">House Chili Scaler (Demo)</h2>
        <p class="eink-card__body">Drag the slider to test how interactive controls feel in the e-reader theme.</p>

        <div class="slider-row">
          <label for="chili-meat-slider">Meat available (ground beef / chuck):</label>
          <span class="slider-row__value" id="chili-meat-readout">${lbs.toFixed(2).replace(/\.00$/, "")} lb</span>
          <input
            type="range"
            id="chili-meat-slider"
            class="range-input"
            min="0.5"
            max="5"
            step="0.25"
            value="${lbs}"
          />
        </div>

        <ul class="ratio-grid" id="chili-ratios">
          ${renderChiliRatios(ratio)}
        </ul>
      </section>
    `;
  }

  function renderChiliRatios(ratio) {
    return `
      <li><span>Yellow Onion (diced)</span><strong>${formatAmount(1.5 * ratio, "medium")}</strong></li>
      <li><span>Garlic Cloves</span><strong>${formatAmount(4 * ratio, "cloves")}</strong></li>
      <li><span>Crushed Tomatoes</span><strong>${formatAmount(28 * ratio, "oz")}</strong></li>
      <li><span>Beans (drained)</span><strong>${formatAmount(2 * ratio, "cans")}</strong></li>
      <li><span>Broth / Stock</span><strong>${formatAmount(1.5 * ratio, "cups")}</strong></li>
      <li><span>Chili Powder</span><strong>${formatAmount(3 * ratio, "tbsp")}</strong></li>
      <li><span>Ground Cumin</span><strong>${formatAmount(1.5 * ratio, "tbsp")}</strong></li>
      <li><span>Smoked Paprika</span><strong>${formatAmount(1 * ratio, "tsp")}</strong></li>
    `;
  }

  function bindFrameworksEvents(stage) {
    const slider = stage.querySelector("#chili-meat-slider");
    const readout = stage.querySelector("#chili-meat-readout");
    const ratiosList = stage.querySelector("#chili-ratios");
    if (!slider || !readout || !ratiosList) return;

    slider.addEventListener("input", () => {
      state.chiliMeatLbs = parseFloat(slider.value);
      readout.textContent = `${state.chiliMeatLbs.toFixed(2).replace(/\.00$/, "")} lb`;
      ratiosList.innerHTML = renderChiliRatios(state.chiliMeatLbs / 2.0);
    });
  }

  /* ------------------------------------------------------------------------
     Photo Import (#import)
     ------------------------------------------------------------------------ */

  function renderImportView() {
    return `
      <header class="page-head">
        <h1 class="page-title">Photo Import</h1>
        <p class="page-subtitle">Snap a cookbook page, clipping, or handwritten card to convert it into our house recipe format.</p>
      </header>

      <div class="drop-frame">
        <svg class="drop-frame__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <h2 class="drop-frame__title">Drop a recipe photo or open your camera</h2>
        <p class="drop-frame__hint">
          Once we finalize our recipe format (Phase 3) and connect Firebase (Phase 4), uploading a photo here will extract ingredients, steps, and notes into an editable preview before saving.
        </p>
        <button type="button" class="btn btn--primary" disabled aria-disabled="true">Coming in Phase 9</button>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     Bootstrap
     ------------------------------------------------------------------------ */

  function handleRouteChange() {
    const parsed = parseHash();
    state.route = parsed.route;
    state.recipeId = parsed.recipeId;
    render();
    window.scrollTo(0, 0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyPrefs();
    initReaderPopover();
    initPWA();
    handleRouteChange();
    window.addEventListener("hashchange", handleRouteChange);
  });
})();
