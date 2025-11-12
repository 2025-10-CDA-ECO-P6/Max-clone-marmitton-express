import express from "express";
import { dbPromise } from "../index.js";
const argon2 = await import("argon2");
import jwt from "jsonwebtoken";

const { Router } = express;
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const db = await dbPromise;
  const data = req.body.data;
  const hashedPassword = await argon2.hash(data.password);
  await db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [data.username, data.email, hashedPassword]
  );
  res.json({ message: "Utilisateur enregistré" });
});

authRouter.post("/login", async (req, res) => {
  const db = await dbPromise;
  const data = req.body.data;
  const user = await db.get("SELECT * FROM users WHERE email = ?", [
    data.email,
  ]);

  if (!user) {
    return res
      .status(400)
      .json({ message: "Utilisateur ou mot de passe incorrect" });
  }

  const validPassword = await argon2.verify(user.password, data.password);
  if (!validPassword) {
    return res
      .status(400)
      .json({ message: "Utilisateur ou mot de passe incorrect" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Connexion réussie", token });
});
