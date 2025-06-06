require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from React dev server origin
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// PUBLIC_INTERFACE
/**
 * POST /api/recipe
 * Expects: { ingredients: [ "egg", "tomato", ... ] }
 * Returns: { title, ingredients: [{ name, amount }], instructions: [ string, ... ] }
 */
app.post('/api/recipe', async (req, res) => {
  const { ingredients } = req.body;
  if (!Array.isArray(ingredients) || !ingredients.length) {
    return res.status(400).json({ error: 'No ingredients provided' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' });
  }

  // Compose prompt for the AI model (domain specific)
  const prompt = [
    "Suggest a detailed recipe using only these ingredients:",
    ingredients.join(", "),
    "Format output as JSON with fields: title, ingredients (array of {name, amount}), instructions (array of steps)."
  ].join(" ");

  try {
    // Call OpenAI Chat API (adjust model/parameters as needed)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful chef. Only respond with recipe JSON." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'AI API error');
    }

    // Try to find the JSON chunk in the response
    const rawText = data.choices?.[0]?.message?.content || "";
    let jsonMatch = rawText;
    // Attempt to parse only JSON object from output
    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonMatch = rawText.slice(startIdx, endIdx + 1);
    }
    let recipe;
    try {
      recipe = JSON.parse(jsonMatch);
    } catch (e) {
      return res.status(500).json({ error: 'AI returned invalid JSON format', details: rawText });
    }
    // Validate required keys
    if (!recipe || !recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions)) {
      return res.status(500).json({ error: 'Generated recipe missing required fields', recipe });
    }
    res.json(recipe);

  } catch (e) {
    res.status(500).json({ error: "Failed to generate recipe", details: e.message || e.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`SmartRecipeVault backend running on http://localhost:${PORT}`);
});
