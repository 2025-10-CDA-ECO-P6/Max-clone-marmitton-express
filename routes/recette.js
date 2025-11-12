import express from "express";
import { dbPromise } from "../index.js";

const { Router } = express;
export const recipesRouter = Router();

recipesRouter.get("/", async (req, res) => {
  const db = await dbPromise;
  const users = await db.all("SELECT * FROM recipes");
  res.json(users);
});

recipesRouter.get("/:id", async (req, res) => {
  const db = await dbPromise;
  const id = req.params.id;
  const recipe = await db.get("SELECT * FROM recipes WHERE id = ?", [id]);
  res.json(recipe);
});

recipesRouter.post("/", async (req, res) => {
  const db = await dbPromise;
  const data = req.body.data;

  // 1) Insert recette (⚠️ virgule retirée après "description")
  const result = await db.run(
    "INSERT INTO recipes (title, preparationTime, difficulty, budget, description) VALUES (?, ?, ?, ?, ?)",
    [
      data.title,
      data.preparationTime,
      data.difficulty,
      data.budget,
      data.description,
    ]
  );

  // 2) Lier les ingrédients existants (IDs) si fournis
  const recipeId = result.lastID;
  if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
    const stmt = await db.prepare(
      "INSERT INTO recipe_ingredients (recipe_id, ingredient_id) VALUES (?, ?)"
    );
    for (const ingredientId of data.ingredients) {
      await stmt.run(recipeId, ingredientId);
    }
    await stmt.finalize();
  }

  res.json({ message: "Recette ajoutée", recipeId });
});

recipesRouter.put("/:id", async (req, res) => {
  const db = await dbPromise;
  const id = req.params.id;
  const data = req.body.data;
  await db.run(
    "UPDATE recipes SET title = ?, preparationTime = ?, difficulty = ?, budget = ?, description = ? WHERE id = ?",
    [
      data.title,
      data.preparationTime,
      data.difficulty,
      data.budget,
      data.description,
      id,
    ]
  );
  res.json({ message: "Recette mise à jour" });
});

recipesRouter.patch("/:id", async (req, res) => {
  const db = await dbPromise;
  const id = req.params.id;
  const data = req.body.data;

  const fields = [];
  const values = [];

  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }
  values.push(id);

  const sql = `UPDATE recipes SET ${fields.join(", ")} WHERE id = ?`;
  await db.run(sql, values);
  res.json({ message: "Recette partiellement mise à jour" });
});

recipesRouter.delete("/:id", async (req, res) => {
  const db = await dbPromise;
  const id = req.params.id;
  await db.run("DELETE FROM recipes WHERE id = ?", [id]);
  res.json({ message: "Recette supprimée" });
});
