import express from "express";
import jwt from "jsonwebtoken";

export function makeAuthRouter() {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    if (password !== process.env.AUTH_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { role: "user" },
      process.env.AUTH_JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  });

  return router;
}
