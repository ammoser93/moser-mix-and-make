/* ==========================================================================
   Moser Mix & Make — Recipe Add/Edit Form, Tag-Chip Autocomplete & JSON Import
   ========================================================================== */

(function () {
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stepsToLines(steps) {
    const out = [];
    (steps || []).forEach((step) => {
      if (typeof step === "string") {
        if (step.trim()) out.push(step.trim());
      } else if (step && step.text) {
        out.push(step.text.trim());
        (step.substeps || []).forEach((sub) => {
          if (String(sub).trim()) out.push(`  - ${String(sub).trim()}`);
        });
      }
    });
    return out.join("\n");
  }

  function linesToSteps(text) {
    const steps = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach((rawLine) => {
        if (!rawLine.trim()) return;
        const isSubstep = /^(\s{2,}|\t|-\s+|\*\s+)/.test(rawLine);
        const cleaned = rawLine
          .replace(/^\s*[-*•]\s+/, "")
          .replace(/^\s*\d+[.)]\s+/, "")
          .trim();
        if (!cleaned) return;

        if (isSubstep && steps.length > 0) {
          const prev = steps[steps.length - 1];
          if (!Array.isArray(prev.substeps)) prev.substeps = [];
          prev.substeps.push(cleaned);
        } else {
          steps.push({ text: cleaned });
        }
      });
    return steps;
  }

  function linesToIngredients(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*([-*•]|\[[ xX]?\])\s*/, "").trim())
      .filter(Boolean);
  }

  function compressImageFile(file, maxWidth = 720, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Selected file is not a valid image."));
        img.onload = () => {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderRecipeForm({ recipe, isEdit, canEdit }) {
    if (!canEdit) {
      return `
        <a class="back-link" href="#recipes">← Back to Recipes</a>
        <div class="callout-note">
          <strong>Editor Access Required:</strong> Sign in with an authorized Google account to add or edit recipes.
          <div style="margin-top:0.85rem;">
            <button type="button" class="btn btn--primary" data-open-auth>Sign In</button>
          </div>
        </div>
      `;
    }

    const r = recipe || {
      id: "",
      title: "",
      subtitle: "",
      tags: [],
      showOnMenu: true,
      imageUrl: "",
      meta: { prepTime: "", cookTime: "", yield: "", sourceName: "", sourceUrl: "" },
      ingredientGroups: [{ label: "", items: [] }],
      instructionGroups: [{ label: "", steps: [] }],
      notes: "",
    };

    const meta = r.meta || {};
    const hasMeta = Boolean(meta.prepTime || meta.cookTime || meta.yield || meta.sourceName || meta.sourceUrl);
    const ingGroups = r.ingredientGroups?.length ? r.ingredientGroups : [{ label: "", items: [] }];
    const instGroups = r.instructionGroups?.length ? r.instructionGroups : [{ label: "", steps: [] }];

    return `
      <div class="editor-sticky-bar">
        <a class="btn btn--ghost btn--sm" href="${isEdit ? `#recipe/${encodeURIComponent(r.id)}` : "#recipes"}">Cancel</a>
        <span class="editor-sticky-bar__title">${isEdit ? "Edit Recipe" : "New Recipe"}</span>
        <button type="submit" form="recipe-editor-form" class="btn btn--primary btn--sm" data-rf-save-btn>
          ${isEdit ? "Save" : "Save Recipe"}
        </button>
      </div>

      <header class="page-head">
        <h1 class="page-title">${isEdit ? "Edit Recipe" : "New Recipe"}</h1>
        <p class="page-subtitle">Matches our household format — only Title is required; everything else stays lightweight.</p>
      </header>

      <form id="recipe-editor-form" class="recipe-form" novalidate>
        <div class="form-section">
          <label class="field-label">
            <span>Recipe Title *</span>
            <input type="text" id="rf-title" class="field-input field-input--serif" value="${escapeHtml(r.title)}" placeholder="e.g. Grandma Moser Spaghetti" required />
          </label>

          <label class="field-label">
            <span>Short Description <span class="field-opt">(optional)</span></span>
            <input type="text" id="rf-subtitle" class="field-input" value="${escapeHtml(r.subtitle)}" placeholder="Quick summary shown on the Recipe list & Weekly Menu cards" />
          </label>

          <label class="toggle-row">
            <input type="checkbox" id="rf-show-menu" ${r.showOnMenu !== false ? "checked" : ""} />
            <span>
              <strong>Show on Weekly Menu</strong>
              <small>Let the kids see and pick this meal on the Weekly Menu page (turn off for spice mixes, sauces, or staples).</small>
            </span>
          </label>
        </div>

        <!-- Tag-Chip Autocomplete -->
        <div class="form-section">
          <label class="field-label" for="rf-tag-input">
            <span>Tags <span class="field-opt">(pick existing or type a new tag and press Enter)</span></span>
          </label>
          <div class="tag-picker" id="rf-tag-picker">
            <div class="tag-picker__chips" id="rf-tag-chips"></div>
            <input
              type="text"
              id="rf-tag-input"
              class="tag-picker__input"
              placeholder="Add tag…"
              autocomplete="off"
              aria-autocomplete="list"
              aria-controls="rf-tag-menu"
            />
            <div class="tag-picker__menu" id="rf-tag-menu" role="listbox" hidden></div>
          </div>
        </div>

        <!-- Photo (Upload or URL) -->
        <div class="form-section">
          <span class="field-label"><span>Dish Photo <span class="field-opt">(optional — shown on Weekly Menu cards)</span></span></span>
          <div class="photo-picker">
            <div class="photo-picker__preview" id="rf-photo-preview" ${r.imageUrl ? "" : "hidden"}>
              <img id="rf-photo-img" src="${escapeHtml(r.imageUrl)}" alt="Recipe preview" />
              <button type="button" class="btn btn--ghost" id="rf-photo-remove">Remove photo</button>
            </div>
            <div class="photo-picker__controls">
              <label class="btn" style="cursor:pointer;">
                Upload / Snap Photo
                <input type="file" id="rf-photo-file" accept="image/*" hidden />
              </label>
              <input type="url" id="rf-image-url" class="field-input" value="${escapeHtml(r.imageUrl)}" placeholder="…or paste an image URL" />
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div class="form-section">
          <div class="form-section__head">
            <h2 class="recipe-section-title" style="margin:0; border:0; padding:0;">Ingredients</h2>
            <button type="button" class="btn btn--ghost btn--sm" id="rf-add-ing-group">+ Add Ingredient Group</button>
          </div>
          <div id="rf-ing-groups" class="group-stack">
            ${ingGroups.map((g, idx) => renderIngredientGroupEditor(g, idx, ingGroups.length > 1)).join("")}
          </div>
        </div>

        <!-- Instructions -->
        <div class="form-section">
          <div class="form-section__head">
            <h2 class="recipe-section-title" style="margin:0; border:0; padding:0;">Instructions</h2>
            <button type="button" class="btn btn--ghost btn--sm" id="rf-add-inst-group">+ Add Instruction Section</button>
          </div>
          <p class="field-hint">One step per line. Start a line with <code>- </code> or two spaces to nest it as a sub-step under the previous step.</p>
          <div id="rf-inst-groups" class="group-stack">
            ${instGroups.map((g, idx) => renderInstructionGroupEditor(g, idx, instGroups.length > 1)).join("")}
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <label class="field-label">
            <span>Notes &amp; Tips <span class="field-opt">(optional)</span></span>
            <textarea id="rf-notes" class="field-textarea" rows="4" placeholder="Variations, storage tips, or notes for next time…">${escapeHtml(r.notes)}</textarea>
          </label>
        </div>

        <!-- Optional Metadata -->
        <details class="form-details" ${hasMeta ? "open" : ""}>
          <summary>Optional Details (Prep / Cook Time, Yield, Source)</summary>
          <div class="form-grid-3">
            <label class="field-label">
              <span>Prep Time</span>
              <input type="text" id="rf-prep" class="field-input" value="${escapeHtml(meta.prepTime)}" placeholder="e.g. 15 min" />
            </label>
            <label class="field-label">
              <span>Cook Time</span>
              <input type="text" id="rf-cook" class="field-input" value="${escapeHtml(meta.cookTime)}" placeholder="e.g. 30 min" />
            </label>
            <label class="field-label">
              <span>Yield</span>
              <input type="text" id="rf-yield" class="field-input" value="${escapeHtml(meta.yield)}" placeholder="e.g. 4 servings" />
            </label>
          </div>
          <div class="form-grid-2" style="margin-top:0.75rem;">
            <label class="field-label">
              <span>Source Name</span>
              <input type="text" id="rf-source-name" class="field-input" value="${escapeHtml(meta.sourceName)}" placeholder="e.g. Grandma Moser / Blog Name" />
            </label>
            <label class="field-label">
              <span>Source URL</span>
              <input type="url" id="rf-source-url" class="field-input" value="${escapeHtml(meta.sourceUrl)}" placeholder="https://…" />
            </label>
          </div>
        </details>

        <p class="modal-error" id="rf-error" role="alert" hidden></p>

        <div class="form-actions">
          <div class="form-actions__left">
            <button type="submit" class="btn btn--primary" data-rf-save-btn>
              ${isEdit ? "Save Changes" : "Save Recipe"}
            </button>
            <a class="btn btn--ghost" href="${isEdit ? `#recipe/${encodeURIComponent(r.id)}` : "#recipes"}">Cancel</a>
          </div>
          ${isEdit ? `<button type="button" class="btn btn--danger" id="rf-delete-btn">Delete Recipe</button>` : ""}
        </div>
      </form>
    `;
  }

  function renderIngredientGroupEditor(group, index, showRemove) {
    const itemsText = (group.items || []).join("\n");
    return `
      <div class="group-box" data-ing-group>
        <div class="group-box__top">
          <input
            type="text"
            class="field-input field-input--sm"
            data-group-label
            value="${escapeHtml(group.label || "")}"
            placeholder="Optional group heading (e.g. Mix, Sauce, Dough)"
          />
          ${showRemove ? `<button type="button" class="btn btn--ghost btn--sm" data-remove-group>Remove</button>` : ""}
        </div>
        <textarea
          class="field-textarea"
          rows="6"
          data-group-items
          placeholder="One ingredient per line&#10;e.g. 2 cups (285g) all-purpose flour"
        >${escapeHtml(itemsText)}</textarea>
      </div>
    `;
  }

  function renderInstructionGroupEditor(group, index, showRemove) {
    const stepsText = stepsToLines(group.steps);
    return `
      <div class="group-box" data-inst-group>
        <div class="group-box__top">
          <input
            type="text"
            class="field-input field-input--sm"
            data-group-label
            value="${escapeHtml(group.label || "")}"
            placeholder="Optional section heading (e.g. Freezer Instructions)"
          />
          ${showRemove ? `<button type="button" class="btn btn--ghost btn--sm" data-remove-group>Remove</button>` : ""}
        </div>
        <textarea
          class="field-textarea"
          rows="7"
          data-group-steps
          placeholder="One step per line&#10;1. Mix dry ingredients&#10;2. At the same time:&#10;  - Boil pasta&#10;  - Brown beef"
        >${escapeHtml(stepsText)}</textarea>
      </div>
    `;
  }

  function bindRecipeForm(stage, { recipe, isEdit, masterTags, onSaved, onDeleted }) {
    const form = stage.querySelector("#recipe-editor-form");
    if (!form) return;

    /* --- Tag-Chip Autocomplete --- */
    const selectedTags = [...(recipe?.tags || [])];
    const allSuggestions = [...new Set([...(masterTags || []), ...selectedTags])];
    const chipsEl = stage.querySelector("#rf-tag-chips");
    const tagInput = stage.querySelector("#rf-tag-input");
    const tagMenu = stage.querySelector("#rf-tag-menu");
    const tagPicker = stage.querySelector("#rf-tag-picker");

    function renderChips() {
      chipsEl.innerHTML = selectedTags
        .map(
          (t) => `
          <span class="tag-chip">
            <span>${escapeHtml(t)}</span>
            <button type="button" class="tag-chip__remove" data-remove-tag="${escapeHtml(t)}" aria-label="Remove ${escapeHtml(t)}">×</button>
          </span>`
        )
        .join("");
    }

    function addTag(raw) {
      const clean = String(raw || "").trim().replace(/,+$/, "");
      if (!clean) return;
      const existing = allSuggestions.find((t) => t.toLowerCase() === clean.toLowerCase());
      const canonical = existing || clean;
      if (!selectedTags.some((t) => t.toLowerCase() === canonical.toLowerCase())) {
        selectedTags.push(canonical);
      }
      if (!existing) allSuggestions.push(canonical);
      tagInput.value = "";
      renderChips();
      renderTagDropdown();
    }

    function renderTagDropdown() {
      const q = tagInput.value.trim().toLowerCase();
      const matches = allSuggestions.filter(
        (t) =>
          !selectedTags.some((s) => s.toLowerCase() === t.toLowerCase()) &&
          (!q || t.toLowerCase().includes(q))
      );
      const exactExists = allSuggestions.some((t) => t.toLowerCase() === q);

      if (!matches.length && (!q || exactExists)) {
        tagMenu.hidden = true;
        return;
      }

      const itemsHtml = matches
        .slice(0, 10)
        .map(
          (t) => `
          <button type="button" class="tag-picker__option" role="option" data-pick-tag="${escapeHtml(t)}">
            ${escapeHtml(t)}
          </button>`
        )
        .join("");

      const createHtml =
        q && !exactExists
          ? `<button type="button" class="tag-picker__option tag-picker__option--create" role="option" data-pick-tag="${escapeHtml(tagInput.value.trim())}">
               + Create tag "<strong>${escapeHtml(tagInput.value.trim())}</strong>"
             </button>`
          : "";

      tagMenu.innerHTML = itemsHtml + createHtml;
      tagMenu.hidden = false;
    }

    chipsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-tag]");
      if (!btn) return;
      const idx = selectedTags.indexOf(btn.dataset.removeTag);
      if (idx >= 0) selectedTags.splice(idx, 1);
      renderChips();
      renderTagDropdown();
    });

    tagPicker.addEventListener("click", () => tagInput.focus());
    tagInput.addEventListener("focus", renderTagDropdown);
    tagInput.addEventListener("input", renderTagDropdown);
    tagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        if (tagInput.value.trim()) addTag(tagInput.value);
      } else if (e.key === "Backspace" && !tagInput.value && selectedTags.length) {
        selectedTags.pop();
        renderChips();
        renderTagDropdown();
      } else if (e.key === "Escape") {
        tagMenu.hidden = true;
      }
    });

    tagMenu.addEventListener("mousedown", (e) => {
      const opt = e.target.closest("[data-pick-tag]");
      if (!opt) return;
      e.preventDefault();
      addTag(opt.dataset.pickTag);
    });

    document.addEventListener(
      "click",
      (e) => {
        if (!tagPicker.contains(e.target)) tagMenu.hidden = true;
      },
      { passive: true }
    );

    renderChips();

    /* --- Photo Upload / URL Preview --- */
    const photoFile = stage.querySelector("#rf-photo-file");
    const imageUrlInput = stage.querySelector("#rf-image-url");
    const previewBox = stage.querySelector("#rf-photo-preview");
    const previewImg = stage.querySelector("#rf-photo-img");
    const removePhotoBtn = stage.querySelector("#rf-photo-remove");
    const errEl = stage.querySelector("#rf-error");

    const showErr = (msg) => {
      errEl.textContent = msg;
      errEl.hidden = !msg;
    };

    function syncPhotoPreview(url) {
      const clean = String(url || "").trim();
      if (clean) {
        previewImg.src = clean;
        previewBox.hidden = false;
      } else {
        previewImg.removeAttribute("src");
        previewBox.hidden = true;
      }
    }

    photoFile?.addEventListener("change", async () => {
      const file = photoFile.files?.[0];
      if (!file) return;
      showErr("");
      try {
        const compressed = await compressImageFile(file);
        imageUrlInput.value = compressed;
        syncPhotoPreview(compressed);
      } catch (err) {
        showErr(err?.message || "Could not process photo.");
      }
    });

    imageUrlInput?.addEventListener("input", () => syncPhotoPreview(imageUrlInput.value));
    removePhotoBtn?.addEventListener("click", () => {
      imageUrlInput.value = "";
      if (photoFile) photoFile.value = "";
      syncPhotoPreview("");
    });

    /* --- Dynamic Ingredient / Instruction Groups --- */
    const ingContainer = stage.querySelector("#rf-ing-groups");
    const instContainer = stage.querySelector("#rf-inst-groups");

    stage.querySelector("#rf-add-ing-group")?.addEventListener("click", () => {
      ingContainer.insertAdjacentHTML(
        "beforeend",
        renderIngredientGroupEditor({ label: "", items: [] }, ingContainer.children.length, true)
      );
    });

    stage.querySelector("#rf-add-inst-group")?.addEventListener("click", () => {
      instContainer.insertAdjacentHTML(
        "beforeend",
        renderInstructionGroupEditor({ label: "", steps: [] }, instContainer.children.length, true)
      );
    });

    [ingContainer, instContainer].forEach((box) => {
      box.addEventListener("click", (e) => {
        const rm = e.target.closest("[data-remove-group]");
        if (!rm) return;
        if (box.children.length > 1) rm.closest(".group-box")?.remove();
      });
    });

    /* --- Submit Save --- */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showErr("");

      // Commit any half-typed tag in the input box
      if (tagInput.value.trim()) addTag(tagInput.value);

      const title = stage.querySelector("#rf-title").value.trim();
      if (!title) {
        showErr("Please enter a recipe title.");
        stage.querySelector("#rf-title").focus();
        return;
      }

      const ingredientGroups = [...ingContainer.querySelectorAll("[data-ing-group]")]
        .map((el) => ({
          label: el.querySelector("[data-group-label]").value.trim(),
          items: linesToIngredients(el.querySelector("[data-group-items]").value),
        }))
        .filter((g) => g.items.length > 0 || g.label);

      const instructionGroups = [...instContainer.querySelectorAll("[data-inst-group]")]
        .map((el) => ({
          label: el.querySelector("[data-group-label]").value.trim(),
          steps: linesToSteps(el.querySelector("[data-group-steps]").value),
        }))
        .filter((g) => g.steps.length > 0 || g.label);

      const payload = {
        id: isEdit && recipe?.id ? recipe.id : window.MoserDB.slugify(title),
        title,
        subtitle: stage.querySelector("#rf-subtitle").value.trim(),
        tags: selectedTags,
        showOnMenu: stage.querySelector("#rf-show-menu").checked,
        imageUrl: imageUrlInput.value.trim(),
        meta: {
          prepTime: stage.querySelector("#rf-prep").value.trim(),
          cookTime: stage.querySelector("#rf-cook").value.trim(),
          yield: stage.querySelector("#rf-yield").value.trim(),
          sourceName: stage.querySelector("#rf-source-name").value.trim(),
          sourceUrl: stage.querySelector("#rf-source-url").value.trim(),
        },
        ingredientGroups,
        instructionGroups,
        notes: stage.querySelector("#rf-notes").value.trim(),
        createdAt: isEdit ? recipe?.createdAt : undefined,
      };

      const saveBtns = [...stage.querySelectorAll("[data-rf-save-btn]")];
      saveBtns.forEach((b) => {
        b.disabled = true;
        b.dataset.origLabel = b.textContent;
        b.textContent = "Saving…";
      });

      try {
        const saved = await window.MoserDB.saveRecipe(payload);
        onSaved(saved);
      } catch (err) {
        showErr(err?.message || "Could not save recipe to Firebase.");
        saveBtns.forEach((b) => {
          b.disabled = false;
          b.textContent = b.dataset.origLabel || "Save";
        });
      }
    });

    /* --- Delete Recipe --- */
    stage.querySelector("#rf-delete-btn")?.addEventListener("click", async () => {
      if (!recipe?.id) return;
      if (!window.confirm(`Delete "${recipe.title}" permanently?`)) return;
      try {
        await window.MoserDB.deleteRecipe(recipe.id);
        onDeleted(recipe.id);
      } catch (err) {
        showErr(err?.message || "Could not delete recipe.");
      }
    });
  }

  /* --- Batch JSON Import Helper (for Google Drive migration & backup restore) --- */
  async function handleJsonImportFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.recipes)
      ? parsed.recipes
      : null;
    if (!list || !list.length) {
      throw new Error("JSON file must contain an array of recipes (or a { recipes: [...] } object).");
    }
    await window.MoserDB.batchImportRecipes(list);
    return list.length;
  }

  window.MoserRecipeForm = {
    renderRecipeForm,
    bindRecipeForm,
    handleJsonImportFile,
  };
})();
