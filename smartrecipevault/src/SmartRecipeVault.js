import React, { useState, useEffect } from "react";

/**
 * SmartRecipeVault main container.
 * Features:
 * - User registration/log in (Supabase auth)
 * - Ingredient management (add, list, remove; per-user via Supabase)
 * - Send ingredient list to AI model for recipe generation (stub provided)
 * - Save generated recipes (per-user; Supabase)
 * - View saved recipes (list, details)
 * 
 * Styles/app theme match requirements: primary: #84bd86, secondary: #f2a1a1, accent: #f2c98c, light theme
 * Integration with Supabase and AI recipe generator is via clear API stub functions, for easy replacement.
 */

// --- SUPABASE CONFIG ---

// PUBLIC_INTERFACE
// TODO: Update with your actual Supabase project URL and public anon key!
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

// -- Supabase client stub (replace with: import { createClient } from '@supabase/supabase-js' if installed)
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  // eslint-disable-next-line
  supabase = window.supabase = window.createClient
    ? window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
}

// --- AI API STUB ---

// PUBLIC_INTERFACE
async function generateRecipeFromIngredients(ingredients) {
  /**
   * Replace with your real AI API call.
   * For example: OpenAI, Cohere, or your own backend endpoint.
   * @param ingredients {string[]} List of ingredient names
   * @returns {object} Recipe object: {title, description, image, steps[]}
   */
  await new Promise((res) => setTimeout(res, 900)); // Simulate latency
  return {
    title: "AI-Generated Veggie Stir Fry",
    description:
      "A delicious veggie stir fry you can make with what you have. Fast and healthy!",
    image:
      "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?fit=crop&w=400&q=80",
    steps: [
      "Chop all vegetables.",
      "Heat oil in a wok. Add vegetables and stir fry 3–5 min.",
      "Add soy sauce, garlic, and keep cooking until tender.",
      "Serve over rice or noodles."
    ],
    usedIngredients: ingredients.slice(),
    date: new Date().toISOString(),
  };
}

// --- AUTH & DATA HELPERS ---

// PUBLIC_INTERFACE
function isSupabaseSetup() {
  // You can check here if Supabase client is available & initialized correctly.
  return !!supabase;
}

// PUBLIC_INTERFACE
async function signUp(email, password) {
  // Replace with your supabase.auth.signUp(...) logic, if using real Supabase.
  return { error: null }; // Accept all fake signups in demo mode.
}

// PUBLIC_INTERFACE
async function signIn(email, password) {
  return { error: null, user: { id: "user-demo" } };
}

// PUBLIC_INTERFACE
async function signOut() {
  // Supabase: await supabase.auth.signOut();
  return {};
}

// PUBLIC_INTERFACE
async function getIngredients(userId) {
  // Replace with: Supabase SELECT ... eq("user_id", userId), ordering, etc.
  // Demo: return from localStorage.
  let items = JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
  return items;
}

// PUBLIC_INTERFACE
async function addIngredient(userId, ingredient) {
  // Store locally for demo
  let items = JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
  items.push(ingredient);
  localStorage.setItem("ingredients-" + userId, JSON.stringify(items));
  return true;
}

// PUBLIC_INTERFACE
async function removeIngredient(userId, index) {
  let items = JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
  items.splice(index, 1);
  localStorage.setItem("ingredients-" + userId, JSON.stringify(items));
  return true;
}

// PUBLIC_INTERFACE
async function saveRecipe(userId, recipe) {
  // Save to localStorage for demo
  let recipes = JSON.parse(localStorage.getItem("recipes-" + userId) || "[]");
  recipes.unshift(recipe); // Add to start
  localStorage.setItem("recipes-" + userId, JSON.stringify(recipes));
  return true;
}

// PUBLIC_INTERFACE
async function getSavedRecipes(userId) {
  let recipes = JSON.parse(localStorage.getItem("recipes-" + userId) || "[]");
  return recipes;
}

// --- STYLES (COLOR THEME) ---
const THEME = {
  primary: "#84bd86",
  secondary: "#f2a1a1",
  accent: "#f2c98c",
  background: "#fff",
  text: "#202020",
  card: "#fafafd"
};

// --- MAIN COMPONENT ---

function SmartRecipeVault() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // or 'register'
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [ingredientText, setIngredientText] = useState("");
  const [ingredientErr, setIngredientErr] = useState("");

  // Recipe generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipe, setAiRecipe] = useState(null);

  // Recipe view/saved recipes state
  const [viewState, setViewState] = useState("ingredients"); // | "generatedRecipe" | "savedRecipes" | "recipeDetails"
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState(null);

  // --- AUTH ---

  const handleAuth = async (evt) => {
    evt.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const e = evt.target?.elements?.email?.value;
    const p = evt.target?.elements?.password?.value;
    if (!e || !p) {
      setAuthError("Provide both email and password.");
      setAuthLoading(false);
      return;
    }
    if (authMode === "register") {
      const { error } = await signUp(e, p);
      if (error) {
        setAuthError("Could not register: " + error.message);
        setAuthLoading(false);
        return;
      }
      setAuthMode("login");
      setAuthError("Registered! Please log in.");
      setAuthLoading(false);
      return;
    }
    // login
    const { error, user: userObj } = await signIn(e, p);
    if (error || !userObj) {
      setAuthError("Invalid username or password.");
      setAuthLoading(false);
      return;
    }
    setUser({ id: userObj.id, email: e });
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setIngredients([]);
    setViewState("ingredients");
    setAiRecipe(null);
  };

  // --- INGREDIENTS ---

  useEffect(() => {
    if (!user) return;
    getIngredients(user.id).then((ing) => setIngredients(ing || []));
    getSavedRecipes(user.id).then(recipes => setSavedRecipes(recipes));
    setIngredientText("");
    setAiRecipe(null);
    setViewState("ingredients");
    setSelectedRecipeIdx(null);
  }, [user]);

  const handleAddIngredient = async (evt) => {
    evt.preventDefault();
    if (!ingredientText.trim()) {
      setIngredientErr("Ingredient name can't be empty.");
      return;
    }
    if (ingredients.map((i) => i.toLowerCase()).includes(ingredientText.trim().toLowerCase())) {
      setIngredientErr("Already added.");
      return;
    }
    await addIngredient(user.id, ingredientText.trim());
    const updated = await getIngredients(user.id);
    setIngredients(updated);
    setIngredientText("");
    setIngredientErr("");
  };

  const handleRemoveIngredient = async (i) => {
    await removeIngredient(user.id, i);
    const updated = await getIngredients(user.id);
    setIngredients(updated);
  };

  // --- AI RECIPE GENERATION ---
  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) return;
    setAiLoading(true);
    setAiRecipe(null);
    try {
      const recipe = await generateRecipeFromIngredients(ingredients);
      setAiRecipe(recipe);
      setViewState("generatedRecipe");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    await saveRecipe(user.id, aiRecipe);
    const updated = await getSavedRecipes(user.id);
    setSavedRecipes(updated);
    setViewState("savedRecipes");
  };

  // --- RECIPE VIEWS ---

  const gotoIngredients = () => {
    setViewState("ingredients");
    setAiRecipe(null);
    setSelectedRecipeIdx(null);
  };

  const gotoSavedRecipes = () => {
    setViewState("savedRecipes");
    setSelectedRecipeIdx(null);
    setAiRecipe(null);
  };

  const handleViewRecipeDetails = idx => {
    setSelectedRecipeIdx(idx);
    setViewState("recipeDetails");
  };

  // --- RENDER ---

  // PRIMARY THEMING (inline for isolation)
  const themeVars = {
    "--srv-primary": THEME.primary,
    "--srv-secondary": THEME.secondary,
    "--srv-accent": THEME.accent,
    "--srv-bg": THEME.background,
    "--srv-card": THEME.card,
    "--srv-text": THEME.text
  };

  if (!user) {
    // AUTH SCREEN
    return (
      <div style={styles.screenBase(themeVars)}>
        <div style={styles.headerBar}>
          <span style={styles.logo}><span style={{ color: THEME.secondary }}>🍳</span> SmartRecipeVault</span>
        </div>
        <div style={styles.cardBox}>
          <h2>{authMode === "login" ? "Login" : "Register"}</h2>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" name="email" placeholder="Email" style={styles.input} autoComplete="username" />
            <input type="password" name="password" placeholder="Password" style={styles.input} autoComplete={authMode === "login" ? "current-password" : "new-password"} />
            {authError && <div style={styles.error}>{authError}</div>}
            <button type="submit" style={styles.btnMain} disabled={authLoading}>
              {authLoading ? "…" : (authMode === "login" ? "Login" : "Create Account")}
            </button>
          </form>
          <button
            style={styles.linkBtn}
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
          >
            {authMode === "login" ? "New? Register instead!" : "Already have an account? Log in"}
          </button>
        </div>
        <div style={{marginTop:24, fontSize:13, color:THEME.accent, opacity:0.7, textAlign:"center"}}>
          <span>Powered by Supabase (demo mode, data is only local!)</span>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={styles.screenBase(themeVars)}>
      <div style={styles.headerBar}>
        <span style={styles.logo}><span style={{ color: THEME.secondary }}>🍳</span> SmartRecipeVault</span>
        <span>
          <button style={styles.linkBtn} onClick={gotoIngredients}>
            Ingredients
          </button>
          <button style={styles.linkBtn} onClick={gotoSavedRecipes}>
            My Recipes
          </button>
          <button style={styles.linkBtn} onClick={handleLogout}>
            Logout
          </button>
        </span>
      </div>
      <div style={styles.bodyWrap}>
        {viewState === "ingredients" && (
          <div>
            <h2 style={{marginBottom:0}}>My Ingredients</h2>
            {ingredients.length > 0 ? (
              <ul style={styles.ingredientList}>
                {ingredients.map((ing, i) => (
                  <li key={i} style={styles.ingredientItem}>
                    <span>{ing}</span>
                    <button style={styles.removeBtn} onClick={() => handleRemoveIngredient(i)} title="Remove">✖</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: "#555", margin: "16px 0" }}>You don't have any ingredients saved.</div>
            )}
            <form onSubmit={handleAddIngredient} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                type="text"
                placeholder="Add ingredient (e.g. Carrot)"
                style={styles.input}
                value={ingredientText}
                onChange={e => setIngredientText(e.target.value)}
              />
              <button type="submit" style={styles.btnMain}>Add</button>
            </form>
            {ingredientErr && <div style={styles.error}>{ingredientErr}</div>}
            <div style={{ marginTop: 32 }}>
              <button
                style={{
                  ...styles.btnMain,
                  backgroundColor: THEME.primary,
                  minWidth: 220,
                  opacity: ingredients.length === 0 ? 0.6 : 1,
                  cursor: ingredients.length === 0 ? "not-allowed" : "pointer"
                }}
                onClick={handleGenerateRecipe}
                disabled={ingredients.length === 0 || aiLoading}
              >
                {aiLoading ? "Generating Recipe…" : "Get Recipe Suggestion"}
              </button>
            </div>
          </div>
        )}

        {viewState === "generatedRecipe" && aiRecipe && (
          <div style={styles.cardBox}>
            <h2>{aiRecipe.title}</h2>
            <img
              src={aiRecipe.image}
              alt={aiRecipe.title}
              style={styles.recipeImage}
            />
            <div style={{ color: "#555", fontStyle: "italic", marginBottom: 8 }}>
              {aiRecipe.description}
            </div>
            <div>
              <strong>Used Ingredients:</strong> {aiRecipe.usedIngredients.join(", ")}
            </div>
            <ol style={{ marginTop: 16, marginBottom: 12 }}>
              {aiRecipe.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={styles.btnMain} onClick={handleSaveRecipe}>Save Recipe</button>
              <button style={styles.btnSimple} onClick={gotoIngredients}>Try Again</button>
            </div>
          </div>
        )}

        {viewState === "savedRecipes" && (
          <div>
            <h2>My Generated Recipes</h2>
            {savedRecipes.length === 0 && (
              <div style={{ color: "#555" }}>No saved recipes yet.</div>
            )}
            <div style={styles.recipeGrid}>
              {savedRecipes.map((rec, i) => (
                <div
                  key={i}
                  style={styles.recipeCard}
                  onClick={() => handleViewRecipeDetails(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View recipe ${rec.title}`}
                >
                  {rec.image && (
                    <img src={rec.image} alt={rec.title} style={styles.recipeThumb} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 3 }}>{rec.title}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>
                      {rec.description}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.primary, marginTop: 3 }}>
                      {rec.usedIngredients ? "Ingredients: " + rec.usedIngredients.slice(0, 4).join(", ") : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button style={styles.btnSimple} onClick={gotoIngredients}>Back to Ingredients</button>
          </div>
        )}

        {viewState === "recipeDetails" && selectedRecipeIdx !== null && savedRecipes[selectedRecipeIdx] && (
          <div style={styles.cardBox}>
            <h2>{savedRecipes[selectedRecipeIdx].title}</h2>
            {savedRecipes[selectedRecipeIdx].image &&
              <img src={savedRecipes[selectedRecipeIdx].image} alt={savedRecipes[selectedRecipeIdx].title} style={styles.recipeImage}/>}
            <div style={{ color: "#555", fontStyle: "italic", marginBottom: 8 }}>
              {savedRecipes[selectedRecipeIdx].description}
            </div>
            <div>
              <strong>Used Ingredients:</strong>{" "}
              {savedRecipes[selectedRecipeIdx].usedIngredients?.join(", ")}
            </div>
            <ol style={{ marginTop: 16, marginBottom: 12 }}>
              {savedRecipes[selectedRecipeIdx].steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>
            <button style={styles.btnSimple} onClick={gotoSavedRecipes}>
              Back to Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- STYLE OBJECTS ---

const styles = {
  screenBase: (vars) => ({
    minHeight: "100vh",
    width: "100vw",
    background: "var(--srv-bg)",
    fontFamily: 'Inter, sans-serif',
    color: "var(--srv-text)",
    boxSizing: "border-box",
    ...vars,
    backgroundColor: vars["--srv-bg"],
    padding: 0,
    margin: 0,
  }),
  headerBar: {
    width: "100%",
    padding: "20px 0 20px 0",
    background: "#fff",
    borderBottom: "2px solid #e0ede0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 600,
    fontSize: 18,
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  logo: {
    fontSize: "1.3em",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: THEME.primary,
    display: "flex",
    alignItems: "center",
    gap: 5
  },
  bodyWrap: {
    maxWidth: 600,
    margin: "40px auto",
    padding: 16,
    minHeight: 400
  },
  cardBox: {
    background: THEME.card,
    borderRadius: 15,
    boxShadow: "0 2px 18px 0 #e0efef10",
    padding: "30px 24px 24px 24px",
    margin: "32px auto",
    maxWidth: 420,
    textAlign: "center"
  },
  input: {
    padding: "10px 13px",
    border: `1.8px solid ${THEME.accent}`,
    borderRadius: 5,
    fontSize: 16,
    outline: "none"
  },
  btnMain: {
    background: THEME.primary,
    color: "#fff",
    fontWeight: 600,
    border: "none",
    borderRadius: "5px",
    padding: "8px 24px",
    fontSize: 17,
    letterSpacing: "0.03em",
    minWidth: 96,
    cursor: "pointer",
    transition: "background .19s",
    margin: 0
  },
  btnSimple: {
    background: THEME.accent,
    color: THEME.text,
    fontWeight: 500,
    border: "none",
    borderRadius: "5px",
    padding: "8px 24px",
    fontSize: 15,
    minWidth: 56,
    margin: "0 0 0 8px",
    cursor: "pointer"
  },
  linkBtn: {
    background: "none",
    color: THEME.secondary,
    textDecoration: "underline",
    fontWeight: 500,
    fontSize: 15,
    border: "none",
    cursor: "pointer",
    marginLeft: 11
  },
  ingredientList: {
    listStyle: "none",
    padding: 0,
    margin: "16px 0 0 0"
  },
  ingredientItem: {
    background: "#f6faf6",
    color: "#333",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 15px",
    fontSize: 16,
    marginBottom: 7,
    justifyContent: "space-between"
  },
  removeBtn: {
    background: THEME.secondary,
    border: "none",
    color: "#fff",
    borderRadius: "50%",
    width: 24,
    height: 24,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7
  },
  error: {
    color: "#b52424",
    fontSize: 15,
    marginTop: 5
  },
  recipeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
    gap: 19,
    margin: "22px 0",
    alignItems: "stretch"
  },
  recipeCard: {
    background: "#fff9f6",
    borderRadius: 13,
    boxShadow: "0 4px 16px #dedede16",
    padding: 16,
    cursor: "pointer",
    transition: "box-shadow .13s, border .13s",
    border: "1.8px solid #f3e1ca",
    display: "flex",
    flexDirection: "column",
    marginBottom: 6
  },
  recipeThumb: {
    width: "100%",
    maxHeight: 115,
    objectFit: "cover",
    borderRadius: 11,
    marginBottom: 8,
    background: "#eee"
  },
  recipeImage: {
    width: "80%",
    maxWidth: 270,
    objectFit: "cover",
    borderRadius: 14,
    margin: "12px 0",
    background: "#eee"
  },
};

export default SmartRecipeVault;
