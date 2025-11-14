import express from "express";
import { dbPromise } from "../index.js";
const argon2 = await import("argon2");
import jwt from "jsonwebtoken";

const { Router } = express;
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = req.body.data;

    const hashedPassword = await argon2.hash(data.password);

    await db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [data.username, data.email, hashedPassword]
    );

    res.status(201).json({ message: "Utilisateur enregistré avec succès" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'enregistrement de l'utilisateur",
      error: error.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = req.body.data;

    const user = await db.get("SELECT * FROM users WHERE email = ?", [
      data.email,
    ]);

    if (!user || !(await argon2.verify(user.password, data.password))) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      "votre_secret_jwt",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la connexion de l'utilisateur",
      error: error.message,
    });
  }
});
