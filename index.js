import express, { Router } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { recipesRouter } from "./routes/recettes.js";
import { ingredientsRouter } from "./routes/ingredients.js";
import { authRouter } from "./routes/auth.js";
import dotenv from "dotenv";
import { checkToken } from "./middlewares/checkToken.js";

dotenv.config();

const app = express();
app.use(express.json());

export const dbPromise = open({
  filename: "./db.db",
  driver: sqlite3.Database,
});

try {
  const db = await dbPromise;
  await db.exec(`
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  preparationTime INTEGER,
  difficulty INTEGER,
  budget INTEGER,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  quantity TEXT,
  PRIMARY KEY (recipe_id, ingredient_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

INSERT INTO ingredients (name) VALUES
('Farine'),
('Sucre'),
('Sel'),
('Beurre'),
('Oeuf'),
('Lait'),
('Huile d''olive'),
('Tomate'),
('Oignon'),
('Ail'),
('Poivre'),
('Paprika'),
('Basilic'),
('Persil'),
('Fromage râpé'),
('Chocolat'),
('Levure'),
('Eau'),
('Bouillon'),
('Miel'),
('Riz'),
('Pâtes'),
('Légumes surgelés'),
('Poulet'),
('Saumon'),
('Citron'),
('Crème fraîche'),
('Yaourt'),
('Noix'),
('Amande');
  `);
} catch (err) {
  console.error("Erreur lors de la création de la table :", err);
}

const apiRouter = Router();

apiRouter.use("/ingredients", ingredientsRouter);
apiRouter.use("/recettes", recipesRouter);
app.use("/auth", authRouter);
app.use("/api", checkToken, apiRouter);

app.listen(3000, () => {
  console.log("✅ Serveur Express connecté à SQLite sur http://localhost:3000");
});
