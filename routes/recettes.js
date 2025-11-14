import express from "express";
import { dbPromise } from "../index.js";

const { Router } = express;
export const recipesRouter = Router();

recipesRouter.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const recipes = await db.all("SELECT * FROM recipes");
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des recettes",
      error: error.message,
    });
  }
});

recipesRouter.get("/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;

    const recipe = await db.get("SELECT * FROM recipes WHERE id = ?", [id]);
    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    const ingredients = await db.all(
      `SELECT ingredients.* FROM ingredients
        JOIN recipe_ingredients ON ingredients.id = recipe_ingredients.ingredient_id
        WHERE recipe_ingredients.recipe_id = ?`,
      [id]
    );

    res.status(200).json({ ...recipe, ingredients });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la recette",
      error: error.message,
    });
  }
});

recipesRouter.post("/", async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'ajout de la recette",
      error: error.message,
    });
  }
});

recipesRouter.put("/:id", async (req, res) => {
  try {
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
    const recipeId = result.lastID;
    if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
      const stmt = await db.prepare(
        "INSERT INTO recipe_ingredients (recipe_id, ingredient_id) VALUES (?, ?)"
      );
      for (const ingredientId of data.ingredients) {
        await stmt.run(recipeId, ingredientId);
      }
      await stmt.finalize();
      res.json({ message: "Recette mise à jour" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour de la recette",
      error: error.message,
    });
  }
});

recipesRouter.patch("/:id", async (req, res) => {
  try {
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

    res.status(200).json({ message: "Recette mise à jour partiellement" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour partielle de la recette",
      error: error.message,
    });
  }
});

recipesRouter.delete("/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;

    await db.run("DELETE FROM recipe_ingredients WHERE recipe_id = ?", [id]);
    await db.run("DELETE FROM recipes WHERE id = ?", [id]);

    res.status(200).json({ message: "Recette supprimée" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de la recette",
      error: error.message,
    });
  }
});
