/**
 * Centralized env access for the server.
 *
 * Reads from process.env once at module load. The `isProduction` flag is the
 * only non-trivial computation; everything else is a direct passthrough with
 * a "" default for missing values (so callers can do `if (ENV.foo)` checks
 * without explicit undefined handling).
 *
 * The standalone (self-hosted) deployment uses only a subset of these. Fields
 * that were originally wired to the Manus platform (oauth, forge, ownerOpenId)
 * have been removed in the rip-out of 2026-08-27. If you re-introduce a hosted
 * mode, add the new fields here and document the env var they read.
 */
export const ENV = {
  /** The base64url-encoded secret used to sign session JWTs. Required. */
  cookieSecret: process.env.JWT_SECRET ?? "",
  /** MySQL connection string passed to drizzle. Required. */
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** True when running the production build (NODE_ENV=production). */
  isProduction: process.env.NODE_ENV === "production",
} as const;
