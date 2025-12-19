import express from "express";
import jwt from "jsonwebtoken";
import { authJwtSecret, authPassword } from "../utils/authConfig.js";

export function makeAuthRouter() {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    if (password !== authPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { role: "user" },
      authJwtSecret,
      { expiresIn: "7d" }
    );

    res.json({ token });
  });

  return router;
}
