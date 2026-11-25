/* ==========================================================================
   Moser Mix & Make — Placeholder Sample Data (Phase 3 Schema v1)
   Uses the finalized schema from schema.md (tags[], showOnMenu,
   ingredientGroups, instructionGroups with substeps, optional meta).
   Replaced by live Firebase Firestore data in Phases 4–5.
   ========================================================================== */

window.MOSER_SAMPLE_DATA = {
  masterTags: [
    "Mains",
    "Sides",
    "Breakfast",
    "Bread & Dough",
    "Sourdough",
    "Dessert",
    "Mixes & Sauces",
    "Canning & Pickles",
    "Freezer-Friendly",
  ],

  recipes: [
    {
      id: "sheet-pan-lemon-chicken",
      title: "Crispy Lemon & Herb Chicken",
      subtitle: "Golden roasted chicken thighs, Yukon potatoes, and blistered green beans",
      tags: ["Mains"],
      showOnMenu: true,
      illustration: "chicken",
      meta: {
        prepTime: "15 min",
        cookTime: "40 min",
        yield: "4 servings",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "",
          items: [
            "2 lb bone-in, skin-on chicken thighs",
            "1.5 lb Yukon gold potatoes, chunked",
            "12 oz green beans, trimmed",
            "3 tbsp olive oil",
            "4 cloves garlic, minced",
            "1 large lemon (zested & sliced)",
            "1.5 tsp kosher salt & 1 tsp dried oregano",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            { text: "Heat oven to 425°F (220°C) and preheat a rimmed sheet pan inside for 5 minutes." },
            { text: "Toss potatoes with half the oil, garlic, salt, and pepper. Roast 15 minutes on the hot pan." },
            { text: "Rub chicken thighs with remaining oil, garlic, lemon zest, oregano, and salt." },
            { text: "Nestle chicken skin-side up among potatoes with lemon rounds and roast 20 minutes." },
            { text: "Toss in green beans and roast 8–10 minutes more until chicken hits 175°F and skin is crisp." },
          ],
        },
      ],
      notes: "Sample recipe using the finalized schema — real Google Drive recipes will be imported in Phase 5.",
    },
    {
      id: "homemade-hamburger-helper",
      title: "Homemade Hamburger Helper (Sample)",
      subtitle: "Weeknight skillet pasta with a make-ahead pantry spice mix",
      tags: ["Mains", "Mixes & Sauces"],
      showOnMenu: true,
      illustration: "pasta",
      meta: {
        prepTime: "",
        cookTime: "",
        yield: "",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "Mix",
          items: [
            "1/2 cup garlic powder",
            "1/4 cup parsley",
            "1/4 cup chili powder",
            "1/4 cup onion powder",
            "1/4 cup paprika",
            "1 Tbsp salt & 1 Tbsp pepper",
          ],
        },
        {
          label: "Cooking",
          items: [
            "2 Tbsp mix",
            "1 lb ground beef",
            "2 cups milk",
            "1/2 - 1 cup water",
            "8 oz pasta",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            { text: "Brown the ground beef, set aside." },
            { text: "Add mix, milk, water, and noodles to pot and bring to a boil." },
            { text: "Simmer, covered, until pasta is tender and sauce thickens." },
          ],
        },
      ],
      notes: "Demonstrates grouped ingredients (Mix vs. Cooking) and minimal optional metadata.",
    },
    {
      id: "grandma-spaghetti-sample",
      title: "Spaghetti (Parallel Steps Demo)",
      subtitle: "Simple weeknight spaghetti showcasing nested sub-steps",
      tags: ["Mains"],
      showOnMenu: true,
      illustration: "tacos",
      meta: {
        prepTime: "",
        cookTime: "",
        yield: "",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "",
          items: [
            "2 cups tomato juice",
            "1 can tomato soup",
            "6 Tbsp sugar or 4–5 Tbsp honey",
            "1 lb ground beef",
            "Salt and pepper to taste",
            "1 lb pasta",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            {
              text: "At the same time:",
              substeps: [
                "Combine tomato juice, soup, and sugar — heat and stir",
                "Brown meat, drain grease, and season with salt and pepper",
                "Boil pasta until tender",
              ],
            },
            { text: "Mix everything together and let sit for 10 minutes before serving." },
          ],
        },
      ],
      notes: "",
    },
    {
      id: "pizza-dough-50-50-sample",
      title: "Pizza Dough (50/50 Blend)",
      subtitle: "No-knead overnight dough with make-ahead freezer pizza instructions",
      tags: ["Mains", "Bread & Dough", "Freezer-Friendly"],
      showOnMenu: true,
      illustration: "sourdough",
      meta: {
        prepTime: "",
        cookTime: "10–12 min",
        yield: "1 crust (scales easily)",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "",
          items: [
            "75 g fresh-milled flour (or swap for 75 g all-purpose)",
            "75 g all-purpose flour",
            "110 g cool water (120 g warm water for same-day AP)",
            "3 g salt (1/2 tsp)",
            "1.5 g instant yeast (1/2 tsp)",
            "5 g olive oil (1 tsp)",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            { text: "Stir together flour, salt, yeast, water, and oil for ~60 seconds until cohesive. Do not knead." },
            { text: "Cover tightly and refrigerate 12–24 hours." },
            { text: "Preheat oven to 475°F–500°F with stone or heavy sheet pan for 45 minutes; pull dough 45–60 min ahead." },
            { text: "Press thin onto parchment, top, and bake 10–12 minutes until golden and bubbling." },
          ],
        },
        {
          label: "Freezer Instructions",
          steps: [
            { text: "Dock shaped dough rounds with a fork and par-bake at 475°F for 4–5 minutes until firm but pale." },
            { text: "Cool completely, add sauce/cheese/dry toppings, and flash-freeze flat for 1–2 hours." },
            { text: "Wrap tightly in plastic + foil. Bake straight from frozen at 450°F–475°F for 10–12 minutes." },
          ],
        },
      ],
      notes: "Recipe easily doubles, triples, or bulk-scales for multiple pizzas.",
    },
    {
      id: "brown-butter-oat-pancakes",
      title: "Brown Butter Oat Pancakes",
      subtitle: "Nutty, tender griddle cakes — fun for weekends or breakfast-for-dinner",
      tags: ["Breakfast", "Freezer-Friendly"],
      showOnMenu: true,
      illustration: "pancakes",
      meta: {
        prepTime: "10 min",
        cookTime: "15 min",
        yield: "10–12 pancakes",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "",
          items: [
            "1 cup old-fashioned rolled oats",
            "1.25 cups buttermilk",
            "1 cup all-purpose flour",
            "3 tbsp unsalted butter, browned",
            "2 large eggs & 2 tbsp maple syrup",
            "1.5 tsp baking powder & 1/2 tsp baking soda",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            { text: "Soak rolled oats in buttermilk for 10 minutes while browning butter." },
            { text: "Whisk flour, baking powder, baking soda, and salt in a mixing bowl." },
            { text: "Stir eggs, maple syrup, and warm brown butter into oats, then fold gently into dry ingredients." },
            { text: "Cook on a lightly buttered 350°F griddle 2–3 minutes per side." },
          ],
        },
      ],
      notes: "Extras freeze well between parchment sheets for weekday toaster mornings.",
    },
    {
      id: "taco-seasoning-sample",
      title: "Taco Seasoning",
      subtitle: "Pantry jar spice blend (hidden from Weekly Menu via showOnMenu: false)",
      tags: ["Mixes & Sauces"],
      showOnMenu: false,
      illustration: "broccoli",
      meta: {
        prepTime: "",
        cookTime: "",
        yield: "1 jar",
        sourceName: "",
        sourceUrl: "",
      },
      ingredientGroups: [
        {
          label: "",
          items: [
            "1/2 cup chili powder",
            "1/4 cup onion powder",
            "1/8 cup ground cumin",
            "1 Tbsp garlic powder",
            "1 Tbsp paprika",
            "1 Tbsp salt",
          ],
        },
      ],
      instructionGroups: [
        {
          label: "",
          steps: [
            { text: "Put all ingredients into a jar and shake well." },
            { text: "Use 4 Tbsp in any recipe that calls for a packet of taco seasoning." },
          ],
        },
      ],
      notes: "",
    },
  ],

  pantry: [
    { id: 1, name: "Ground Beef (85/15)", location: "Freezer", qty: "2.5 lb", status: "ok" },
    { id: 2, name: "Chicken Thighs (bone-in)", location: "Freezer", qty: "3 lb", status: "ok" },
    { id: 3, name: "Bread Flour (King Arthur)", location: "Pantry", qty: "1.5 bags", status: "ok" },
    { id: 4, name: "Crushed San Marzano Tomatoes", location: "Pantry", qty: "2 cans (28 oz)", status: "ok" },
    { id: 5, name: "Kidney & Black Beans", location: "Pantry", qty: "4 cans", status: "ok" },
    { id: 6, name: "Whole Wheat Flour", location: "Pantry", qty: "~400 g", status: "low" },
    { id: 7, name: "Smoked Paprika", location: "Spices", qty: "1/4 jar", status: "low" },
    { id: 8, name: "Buttermilk", location: "Fridge", qty: "None", status: "out" },
    { id: 9, name: "Chicken Stock", location: "Pantry", qty: "2 cartons", status: "ok" },
    { id: 10, name: "Rolled Oats", location: "Pantry", qty: "1 canister", status: "ok" },
  ],
};
