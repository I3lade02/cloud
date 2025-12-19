const DEFAULT_PASSWORD = "changeme";
const DEFAULT_SECRET = "local-dev-secret";

export const authPassword = process.env.AUTH_PASSWORD || DEFAULT_PASSWORD;
export const authJwtSecret =
  process.env.AUTH_JWT_SECRET || process.env.AUTH_PASSWORD || DEFAULT_SECRET;

if (!process.env.AUTH_PASSWORD) {
  console.warn(
    "⚠️ AUTH_PASSWORD is not set; using default password. Set AUTH_PASSWORD for production."
  );
}

if (!process.env.AUTH_JWT_SECRET) {
  console.warn(
    "⚠️ AUTH_JWT_SECRET is not set; using a fallback secret. Set AUTH_JWT_SECRET for production."
  );
}
