/**
 * Runtime configuration.
 *
 * For a deployed frontend set this in `.env`:
 *   VITE_API_BASE_URL=https://api.example.uz
 *
 * During local Vite development the value can be omitted. Requests then use
 * the `/api` proxy from vite.config.ts and reach http://localhost:8082.
 */

type Env = Record<string, string | undefined>;

const env: Env =
typeof import.meta !== 'undefined' && (import.meta as unknown as {env?: Env;}).env || {};

export const API_BASE_URL = env.VITE_API_BASE_URL ?? '';
