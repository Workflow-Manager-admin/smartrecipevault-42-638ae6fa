import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * SmartRecipeVault: Save user ingredients to Supabase, generate AI-powered recipe suggestions,
 * and present a clear, modular UI for modern recipe exploration.
 *
 * - User ingredients stored in Supabase linked to authenticated user (or local fallback demo).
 * - Ingredients: add, remove, list (CRUD; persisted).
 * - Recipe suggestion: triggers API call using current saved ingredient list.
 * - Clean, sectioned layout: (1) ingredient input, (2) saved ingredients, (3) Get Recipes button, (4) generated recipe section.
 * - Handles Supabase auth, fallback to demo mode if needed.
 *
 * Fill in SUPABASE_URL and SUPABASE_ANON_KEY with your project keys!
 */

// --- SUPABASE CONFIG ---
const SUPABASE_URL = ""; // e.g. "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOiJI..."

let supabase = null;
let clientError = "";

// Try to import @supabase/supabase-js dynamically if present
try {
  // eslint-disable-next-line
  if (window && window.createClient) {
    supabase = window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    // fallback: require or import the package dynamically
    // This can be replaced with: import { createClient } from '@supabase/supabase-js';
    // supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    clientError = "Supabase JS SDK not found - run `npm install @supabase/supabase-js` in your project.";
  }
} catch (e) {
  clientError = e.message;
}

// --- AI API STUB ---
/**
 * Replace this with your actual AI recipe endpoint call (e.g., OpenAI, Cohere, or custom backend).
 * Called with the user's actual ingredient list.
 * Returns a recipe { title, ingredients, instructions }.
 */
// PUBLIC_INTERFACE
async function fetchAIRecipe(ingredients = []) {
  // -- AI recipe stub --
  await new Promise((res) => setTimeout(res, 1200));
  return {
    title: "One Pot Veggie Dinner (AI Suggestion)",
    ingredients: ingredients.map(
      (i) => ({ name: i, amount: "as needed" })
    ),
    instructions: [
      "Chop all ingredients.",
      "Heat oil, add all chopped ingredients and stir fry for 5 minutes.",
      "Season to taste and enjoy your meal!"
    ]
  };
}

// --- SUPABASE UTILS ---
// Each user gets their own row set; user_id field used for multi-tenancy.
// If not logged in, fallbacks to localStorage demo (for easier local demo).

// PUBLIC_INTERFACE
function supabaseSetup() {
  return SUPABASE_URL && SUPABASE_ANON_KEY && !!supabase;
}

// PUBLIC_INTERFACE
async function getCurrentUser() {
  if (!supabaseSetup()) return null;
  const { data: { user } = {} } = await supabase.auth.getUser();
  return user;
}

// PUBLIC_INTERFACE
async function signIn(email, password) {
  if (!supabaseSetup()) return { error: "Supabase not ready" };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
}

// PUBLIC_INTERFACE
async function signUp(email, password) {
  if (!supabaseSetup()) return { error: "Supabase not ready" };
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user, error };
}

// PUBLIC_INTERFACE
async function signOut() {
  if (!supabaseSetup()) return {};
  return supabase.auth.signOut();
}

// INGREDIENT CRUD (Supabase, or fallback to LocalStorage):
const INGREDIENT_TABLE = "ingredients";

// PUBLIC_INTERFACE
async function supaGetIngredients(userId) {
  if (!supabaseSetup()) {
    // Fallback: LocalStorage demo mode
    return JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
  }
  const { data, error } = await supabase
    .from(INGREDIENT_TABLE)
    .select("name")
    .eq("user_id", userId);
  if (error) return [];
  return data.map((row) => row.name);
}

// PUBLIC_INTERFACE
async function supaAddIngredient(userId, ingredient) {
  if (!supabaseSetup()) {
    let items = JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
    items.push(ingredient);
    localStorage.setItem("ingredients-" + userId, JSON.stringify(items));
    return true;
  }
  await supabase.from(INGREDIENT_TABLE).insert([{ name: ingredient, user_id: userId }]);
  return true;
}

// PUBLIC_INTERFACE
async function supaRemoveIngredient(userId, ingredient) {
  if (!supabaseSetup()) {
    let items = JSON.parse(localStorage.getItem("ingredients-" + userId) || "[]");
    items = items.filter((item) => item !== ingredient);
    localStorage.setItem("ingredients-" + userId, JSON.stringify(items));
    return true;
  }
  await supabase
    .from(INGREDIENT_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("name", ingredient);
  return true;
}

// --- MAIN COMPONENT ---
function SmartRecipeVault() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");

  // Ingredient state
  const [ingredients, setIngredients] = useState([]);
  const [input, setInput] = useState("");
  const [inputErr, setInputErr] = useState("");
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Recipe suggestion state
  const [fetching, setFetching] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [fetchError, setFetchError] = useState("");

  // On mount, try to detect user if session exists
  useEffect(() => {
    if (!supabaseSetup()) {
      // Demo mode: Use single static user
      setUser({ id: "demo-user" });
      return;
    }
    getCurrentUser().then((u) => {
      if (u) setUser({ id: u.id, email: u.email });
    });
  }, []);

  // Fetch ingredients AFTER user sets in state
  useEffect(() => {
    setIngredients([]);
    setRecipe(null); setFetchError("");
    if (!user?.id) return;
    setLoadingIngredients(true);
    supaGetIngredients(user.id).then((ings) => {
      setIngredients(ings || []);
      setLoadingIngredients(false);
    });
  }, [user]);

  // --- AUTH HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email || !authForm.password) {
      setAuthError("Please provide both email and password.");
      return;
    }
    if (!supabaseSetup()) {
      setUser({ id: "demo-user" });
      return;
    }
    let result;
    if (authForm.mode === "register") {
      result = await signUp(authForm.email, authForm.password);
    } else {
      result = await signIn(authForm.email, authForm.password);
    }

    if (result?.error) {
      setAuthError(typeof result.error === "string" ? result.error : (result.error.message || "Auth failed"));
      return;
    }
    if (!result?.user) {
      setAuthError("No user returned. Try again?");
      return;
    }
    setUser({ id: result.user.id, email: result.user.email || authForm.email });
    setAuthForm({ ...authForm, password: "" });
  };

  const doLogout = async () => {
    await signOut();
    setUser(null);
    setRecipe(null); setAuthError("");
    setIngredients([]);
    setAuthForm({ email: "", password: "", mode: undefined });
  };

  // --- INGREDIENT CRUD ---
  async function doAddIngredient(e) {
    e.preventDefault();
    setInputErr("");
    const val = input.trim();
    if (!val) {
      setInputErr("Enter an ingredient name.");
      return;
    }
    if (ingredients.find((i) => i.toLowerCase() === val.toLowerCase())) {
      setInputErr("You already listed this ingredient.");
      return;
    }
    await supaAddIngredient(user.id, val);
    const list = await supaGetIngredients(user.id);
    setIngredients(list);
    setInput("");
  }

  async function doRemoveIngredient(ingredient) {
    await supaRemoveIngredient(user.id, ingredient);
    const list = await supaGetIngredients(user.id);
    setIngredients(list);
  }

  // --- FETCH AI RECIPE ---
  async function getRecipeSuggestion() {
    setFetchError(""); setRecipe(null);
    setFetching(true);
    try {
      const aiRecipe = await fetchAIRecipe(ingredients);
      setRecipe(aiRecipe);
    } catch (e) {
      setFetchError("Failed to fetch recipe. Try again.");
    }
    setFetching(false);
  }

  // --- UI RENDER LOGIC ---

  // AUTH UI
  if (!user) {
    return (
      <div style={STYLES.screen}>
        <div style={STYLES.section}>
          <h2 style={{color:THEME.primary, marginBottom:10}}>SmartRecipeVault</h2>
          <form onSubmit={handleAuth} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
              style={STYLES.input}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
              style={STYLES.input}
              autoComplete="current-password"
            />
            {authError && <div style={STYLES.error}>{authError}</div>}
            <button type="submit" style={STYLES.button}>
              Login
            </button>
            <button
              type="button"
              style={{ ...STYLES.button, background: THEME.secondary, marginTop: 0 }}
              onClick={() => setAuthForm(f => ({ ...f, mode: f.mode === "register" ? undefined : "register" }))}
            >
              {authForm.mode === "register" ? "Go to Login" : "Register"}
            </button>
          </form>
          {clientError && (
            <div style={{ margin: "13px 0", color: "#a44", fontSize: 14 }}>
              {clientError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN APP UI
  return (
    <div style={STYLES.screen}>
      <div style={STYLES.headerBar}>
        <span style={{ fontWeight: 700, color: THEME.primary }}>SmartRecipeVault</span>
        <span>
          {user.email && (
            <span style={{ color: THEME.secondary, fontSize: 14, marginRight: 13 }}>{user.email}</span>
          )}
          <button style={STYLES.buttonLink} onClick={doLogout}>Logout</button>
        </span>
      </div>

      <div style={STYLES.section}>
        {/* 1. Ingredient Input */}
        <h2 style={{marginBottom:5}}>Ingredients</h2>
        <form onSubmit={doAddIngredient} style={{ display:"flex", gap:8, marginBottom:10 }}>
          <input
            type="text"
            placeholder="Enter ingredient (e.g. eggs, tomato)"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={STYLES.input}
          />
          <button type="submit" style={STYLES.button}>Save</button>
        </form>
        {inputErr && <div style={STYLES.error}>{inputErr}</div>}

        {/* 2. Saved Ingredient List */}
        <div style={{ margin: "15px 0" }}>
          <h4>Saved Ingredients:</h4>
          {loadingIngredients
            ? <span>Loading...</span>
            : (ingredients.length > 0 ? (
              <ul style={STYLES.ingredientList}>
                {ingredients.map((item, idx) => (
                  <li key={item} style={STYLES.ingredientItem}>
                    {item}
                    <button
                      style={STYLES.deleteBtn}
                      onClick={() => doRemoveIngredient(item)}
                      aria-label={"Remove " + item}
                      title="Remove"
                    >✕</button>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: "#999" }}>No ingredients saved.</span>
            ))}
        </div>

        {/* 3. 'Get Recipes' Button */}
        <div style={{ margin: "22px 0 0 0" }}>
          <button
            style={{
              ...STYLES.button,
              width: 210,
              opacity: ingredients.length ? 1 : 0.5,
              background: THEME.primary
            }}
            disabled={!ingredients.length || fetching}
            onClick={getRecipeSuggestion}
          >
            {fetching ? "Loading..." : "Get Recipes"}
          </button>
        </div>

        {/* 4. Recipe Display Section */}
        <div style={{ marginTop: 36 }}>
          {recipe && (
            <div style={STYLES.recipeBox}>
              <h3 style={{ color: THEME.secondary }}>{recipe.title}</h3>
              <div>
                <div style={{ fontWeight: 600, margin: "12px 0 5px 0" }}>Ingredients:</div>
                <ul>
                  {recipe.ingredients.map((ing, i) =>
                    <li key={i}>{ing.name} ({ing.amount})</li>
                  )}
                </ul>
                <div style={{ fontWeight: 600, margin: "17px 0 5px 0" }}>Instructions:</div>
                <ol>
                  {recipe.instructions.map((step, i) =>
                    <li key={i}>{step}</li>
                  )}
                </ol>
              </div>
            </div>
          )}
          {fetchError && (
            <div style={STYLES.error}>{fetchError}</div>
          )}
        </div>
      </div>
    </div>
  );
}


// --- STYLE OBJECTS ---
const THEME = {
  primary: "#84bd86",
  secondary: "#f2a1a1",
  accent: "#f2c98c",
  bg: "#f8fcf8",
  card: "#fff",
  text: "#202020"
};

const STYLES = {
  screen: {
    minHeight: "100vh",
    background: THEME.bg,
    fontFamily: '"Inter", Verdana, sans-serif',
    color: THEME.text
  },
  headerBar: {
    width: "100%",
    background: "#fff",
    borderBottom: "2px solid #e5f7e5",
    padding: "19px 26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 600,
    fontSize: "1.18em",
    position: "sticky", top: 0, zIndex: 99
  },
  section: {
    maxWidth: 480,
    margin: "48px auto",
    background: THEME.card,
    borderRadius: 17,
    boxShadow: "0 3px 14px 0 #dfeeea2c",
    padding: "36px 24px"
  },
  input: {
    padding: "10px 13px",
    border: `1.5px solid ${THEME.accent}`,
    borderRadius: 5,
    fontSize: 16,
    outline: "none"
  },
  button: {
    background: THEME.primary,
    color: "#fff",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    padding: "8px 18px",
    fontSize: 16,
    letterSpacing: "0.02em",
    cursor: "pointer",
    margin: 0
  },
  buttonLink: {
    background: "none",
    color: THEME.secondary,
    textDecoration: "underline",
    fontWeight: 500,
    fontSize: 15,
    border: "none",
    cursor: "pointer",
    marginLeft: 8
  },
  error: {
    color: "#b52424",
    fontSize: 15,
    margin: "6px 0"
  },
  ingredientList: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  ingredientItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
    fontSize: 16,
    background: "#f6faf6",
    borderRadius: 6,
    padding: "7px 13px"
  },
  deleteBtn: {
    background: THEME.secondary,
    border: "none",
    color: "#fff",
    borderRadius: "50%",
    width: 21,
    height: 21,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: "21px",
    display: "flex", alignItems: "center", justifyContent: "center"
  },
  recipeBox: {
    background: "#fff8f7",
    borderRadius: 15,
    boxShadow: "0 2px 13px 0 #efddd515",
    padding: "28px 22px",
    margin: "14px 0"
  }
};

export default SmartRecipeVault;
