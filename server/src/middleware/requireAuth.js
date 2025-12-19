import jwt from "jsonwebtoken";
import { authJwtSecret } from "../utils/authConfig.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  let token = null;

  if (header.startsWith("Bearer ")) token = header.slice(7);
  if (!token && req.query?.token) token = String(req.query.token);

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, authJwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}