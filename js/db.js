/* ==========================================================================
   Moser Mix & Make — Firebase Auth & Firestore Data Layer (window.MoserDB)
   Security model: public read-only; verified Google admins (stored in
   Firestore admins/{email}) have full edit access. Zero personal emails in code.
   ========================================================================== */

(function () {
  const DEFAULT_TAGS = [
    "Entrees",
    "Sides",
    "Breakfast",
    "Bread & Dough",
    "Sourdough",
    "Dessert",
    "Mixes & Sauces",
    "Canning & Pickles",
    "Freezer-Friendly",
  ];

  let app = null;
  let auth = null;
  let db = null;
  let ready = false;
  let initError = null;

  function init() {
    if (ready) return true;
    if (typeof window.firebase === "undefined" || !window.MOSER_FIREBASE_CONFIG) {
      initError = "Firebase SDK not loaded (offline or blocked).";
      return false;
    }

    try {
      app = window.firebase.apps.length
        ? window.firebase.app()
        : window.firebase.initializeApp(window.MOSER_FIREBASE_CONFIG);
      auth = window.firebase.auth();
      db = window.firebase.firestore();

      // Enable offline persistence where supported (fails harmlessly in private/multi-tab modes)
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

      ready = true;
      return true;
    } catch (err) {
      initError = err?.message || String(err);
      return false;
    }
  }

  function slugify(text) {
    return (
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || `item-${Date.now()}`
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* ------------------------------------------------------------------------
     Authentication (Google Sign-In) & Admin Check (admins/{email})
     ------------------------------------------------------------------------ */

  async function checkIsAdmin(user) {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    try {
      const snap = await db.collection("admins").doc(email).get();
      return snap.exists;
    } catch (err) {
      if (err?.code === "permission-denied") return false;
      throw err;
    }
  }

  function onAuthChange(callback) {
    if (!init()) {
      callback({ user: null, isAdmin: false, ready: false, error: initError });
      return () => {};
    }

    return auth.onAuthStateChanged(async (user) => {
      if (!user) {
        callback({ user: null, isAdmin: false, ready: true, error: null });
        return;
      }

      try {
        const isAdmin = await checkIsAdmin(user);
        callback({ user, isAdmin, ready: true, error: null });
      } catch (err) {
        callback({ user, isAdmin: false, ready: true, error: err?.message || String(err) });
      }
    });
  }

  async function signInWithGoogle() {
    if (!init()) throw new Error(initError || "Firebase not initialized.");
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      return await auth.signInWithPopup(provider);
    } catch (err) {
      // Fallback for iOS standalone PWA or popup-blocked browsers
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        await auth.signInWithRedirect(provider);
        return null;
      }
      throw err;
    }
  }

  async function signOut() {
    if (!init()) return;
    return auth.signOut();
  }

  /* ------------------------------------------------------------------------
     Recipes Collection (recipes/{recipeId})
     ------------------------------------------------------------------------ */

  function normalizeRecipe(docId, data) {
    const raw = data || {};
    return {
      id: docId || raw.id || slugify(raw.title),
      title: raw.title || "Untitled Recipe",
      subtitle: raw.subtitle || "",
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      showOnMenu: raw.showOnMenu !== false,
      illustration: raw.illustration || "",
      imageUrl: raw.imageUrl || "",
      meta: {
        prepTime: raw.meta?.prepTime || "",
        cookTime: raw.meta?.cookTime || "",
        yield: raw.meta?.yield || "",
        sourceName: raw.meta?.sourceName || "",
        sourceUrl: raw.meta?.sourceUrl || "",
      },
      ingredientGroups: Array.isArray(raw.ingredientGroups) ? raw.ingredientGroups : [],
      instructionGroups: Array.isArray(raw.instructionGroups) ? raw.instructionGroups : [],
      notes: raw.notes || "",
      createdAt: raw.createdAt || "",
      updatedAt: raw.updatedAt || "",
    };
  }

  function subscribeRecipes(onData, onError) {
    if (!init()) return () => {};
    return db
      .collection("recipes")
      .orderBy("title")
      .onSnapshot(
        (snap) => {
          const list = snap.docs.map((d) => normalizeRecipe(d.id, d.data()));
          onData(list);
        },
        (err) => onError && onError(err)
      );
  }

  async function saveRecipe(recipe) {
    if (!init()) throw new Error("Firebase not initialized.");
    const id = recipe.id ? slugify(recipe.id) : slugify(recipe.title);
    const now = nowIso();
    const tags = [...new Set((recipe.tags || []).map((t) => String(t).trim()).filter(Boolean))];

    const payload = {
      id,
      title: String(recipe.title || "").trim(),
      subtitle: String(recipe.subtitle || "").trim(),
      tags,
      showOnMenu: Boolean(recipe.showOnMenu),
      imageUrl: String(recipe.imageUrl || "").trim(),
      meta: {
        prepTime: String(recipe.meta?.prepTime || "").trim(),
        cookTime: String(recipe.meta?.cookTime || "").trim(),
        yield: String(recipe.meta?.yield || "").trim(),
        sourceName: String(recipe.meta?.sourceName || "").trim(),
        sourceUrl: String(recipe.meta?.sourceUrl || "").trim(),
      },
      ingredientGroups: recipe.ingredientGroups || [],
      instructionGroups: recipe.instructionGroups || [],
      notes: String(recipe.notes || "").trim(),
      createdAt: recipe.createdAt || now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(db.collection("recipes").doc(id), payload, { merge: true });

    if (tags.length) {
      batch.set(
        db.collection("settings").doc("tags"),
        {
          items: window.firebase.firestore.FieldValue.arrayUnion(...tags),
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    return payload;
  }

  async function deleteRecipe(recipeId) {
    if (!init()) throw new Error("Firebase not initialized.");
    await db.collection("recipes").doc(recipeId).delete();
  }

  async function batchImportRecipes(recipes) {
    if (!init()) throw new Error("Firebase not initialized.");
    const now = nowIso();
    const allTags = new Set();
    const CHUNK = 400;

    for (let i = 0; i < recipes.length; i += CHUNK) {
      const slice = recipes.slice(i, i + CHUNK);
      const batch = db.batch();
      for (const r of slice) {
        const id = r.id ? slugify(r.id) : slugify(r.title);
        const tags = [...new Set((r.tags || []).map((t) => String(t).trim()).filter(Boolean))];
        tags.forEach((t) => allTags.add(t));
        batch.set(
          db.collection("recipes").doc(id),
          {
            ...normalizeRecipe(id, r),
            tags,
            createdAt: r.createdAt || now,
            updatedAt: now,
          },
          { merge: true }
        );
      }
      await batch.commit();
    }

    if (allTags.size) {
      await db
        .collection("settings")
        .doc("tags")
        .set(
          {
            items: window.firebase.firestore.FieldValue.arrayUnion(...allTags),
            updatedAt: now,
          },
          { merge: true }
        );
    }
  }

  /* ------------------------------------------------------------------------
     Master Tags (settings/tags)
     ------------------------------------------------------------------------ */

  function subscribeMasterTags(onData, onError) {
    if (!init()) return () => {};
    return db
      .collection("settings")
      .doc("tags")
      .onSnapshot(
        (snap) => {
          const items = snap.exists && Array.isArray(snap.data()?.items) ? snap.data().items : DEFAULT_TAGS;
          onData(items);
        },
        (err) => onError && onError(err)
      );
  }

  async function saveMasterTags(items) {
    if (!init()) throw new Error("Firebase not initialized.");
    const clean = [...new Set((items || []).map((t) => String(t).trim()).filter(Boolean))];
    await db.collection("settings").doc("tags").set({ items: clean, updatedAt: nowIso() }, { merge: true });
  }

  async function renameTag(oldTag, newTag) {
    if (!init()) throw new Error("Firebase not initialized.");
    const from = String(oldTag || "").trim();
    const to = String(newTag || "").trim();
    if (!from || !to || from === to) return 0;

    const now = nowIso();
    const snap = await db.collection("recipes").where("tags", "array-contains", from).get();
    const batch = db.batch();

    snap.docs.forEach((doc) => {
      const curr = Array.isArray(doc.data()?.tags) ? doc.data().tags : [];
      const next = [...new Set(curr.map((t) => (t === from ? to : t)))];
      batch.update(doc.ref, { tags: next, updatedAt: now });
    });

    const tagsRef = db.collection("settings").doc("tags");
    const tagsSnap = await tagsRef.get();
    const master = tagsSnap.exists && Array.isArray(tagsSnap.data()?.items) ? tagsSnap.data().items : DEFAULT_TAGS;
    const nextMaster = [...new Set(master.map((t) => (t === from ? to : t)))];
    batch.set(tagsRef, { items: nextMaster, updatedAt: now }, { merge: true });

    await batch.commit();
    return snap.size;
  }

  /* ------------------------------------------------------------------------
     Weekly Menu (weeklyMenu/current)
     ------------------------------------------------------------------------ */

  function subscribeWeeklyMenu(onData, onError) {
    if (!init()) return () => {};
    return db
      .collection("weeklyMenu")
      .doc("current")
      .onSnapshot(
        (snap) => {
          const data = snap.exists ? snap.data() : {};
          onData({
            recipeIds: Array.isArray(data.recipeIds) ? data.recipeIds : [],
            checkedGroceryKeys: Array.isArray(data.checkedGroceryKeys) ? data.checkedGroceryKeys : [],
          });
        },
        (err) => onError && onError(err)
      );
  }

  async function saveWeeklyMenu({ recipeIds, checkedGroceryKeys }) {
    if (!init()) throw new Error("Firebase not initialized.");
    const payload = { updatedAt: nowIso() };
    if (Array.isArray(recipeIds)) payload.recipeIds = recipeIds;
    if (Array.isArray(checkedGroceryKeys)) payload.checkedGroceryKeys = checkedGroceryKeys;
    await db.collection("weeklyMenu").doc("current").set(payload, { merge: true });
  }

  /* ------------------------------------------------------------------------
     Pantry & Freezer (pantry/{itemId})
     ------------------------------------------------------------------------ */

  function subscribePantry(onData, onError) {
    if (!init()) return () => {};
    return db
      .collection("pantry")
      .orderBy("name")
      .onSnapshot(
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          onData(items);
        },
        (err) => onError && onError(err)
      );
  }

  async function savePantryItem(item) {
    if (!init()) throw new Error("Firebase not initialized.");
    const id = item.id ? String(item.id) : slugify(item.name);
    const payload = {
      name: String(item.name || "").trim(),
      location: String(item.location || "Pantry").trim(),
      qty: String(item.qty || "").trim(),
      status: ["ok", "low", "out"].includes(item.status) ? item.status : "ok",
      updatedAt: nowIso(),
    };
    await db.collection("pantry").doc(id).set(payload, { merge: true });
    return { id, ...payload };
  }

  async function deletePantryItem(id) {
    if (!init()) throw new Error("Firebase not initialized.");
    await db.collection("pantry").doc(String(id)).delete();
  }

  /* ------------------------------------------------------------------------
     Admin Editors (admins/{email}) & Full JSON Backup Export
     ------------------------------------------------------------------------ */

  function subscribeAdmins(onData, onError) {
    if (!init()) return () => {};
    return db.collection("admins").onSnapshot(
      (snap) => onData(snap.docs.map((d) => ({ email: d.id, ...d.data() }))),
      (err) => onError && onError(err)
    );
  }

  async function saveAdmin(email, { name = "" } = {}) {
    if (!init()) throw new Error("Firebase not initialized.");
    const cleanEmail = String(email || "").trim().toLowerCase();
    await db.collection("admins").doc(cleanEmail).set({ name, updatedAt: nowIso() }, { merge: true });
  }

  async function removeAdmin(email) {
    if (!init()) throw new Error("Firebase not initialized.");
    await db.collection("admins").doc(String(email || "").trim().toLowerCase()).delete();
  }

  async function exportAllData() {
    if (!init()) throw new Error("Firebase not initialized.");
    const [recipesSnap, pantrySnap, tagsSnap, menuSnap] = await Promise.all([
      db.collection("recipes").get(),
      db.collection("pantry").get(),
      db.collection("settings").doc("tags").get(),
      db.collection("weeklyMenu").doc("current").get(),
    ]);

    return {
      exportedAt: nowIso(),
      recipes: recipesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      pantry: pantrySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      settings: { tags: tagsSnap.exists ? tagsSnap.data() : { items: DEFAULT_TAGS } },
      weeklyMenu: menuSnap.exists ? menuSnap.data() : { recipeIds: [] },
    };
  }

  window.MoserDB = {
    DEFAULT_TAGS,
    init,
    slugify,
    onAuthChange,
    signInWithGoogle,
    signOut,
    subscribeRecipes,
    saveRecipe,
    deleteRecipe,
    batchImportRecipes,
    subscribeMasterTags,
    saveMasterTags,
    renameTag,
    subscribeWeeklyMenu,
    saveWeeklyMenu,
    subscribePantry,
    savePantryItem,
    deletePantryItem,
    subscribeAdmins,
    saveAdmin,
    removeAdmin,
    exportAllData,
  };
})();
