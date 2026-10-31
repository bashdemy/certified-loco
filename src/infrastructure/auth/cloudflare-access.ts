import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

export type AuthRole = "admin" | "user";

export type AuthenticatedUser = {
  email: string;
  role: AuthRole;
  displayName?: string;
  slot?: string;
};

export type AccessEnvironment = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  ADMIN_EMAILS?: string;
  AUTH_SECRET?: string;
};

export const SESSION_COOKIE_NAME = "cl_session";
const PBKDF2_ITERATIONS = 100_000;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const jwksByDomain = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) return new Uint8Array(new ArrayBuffer(0));
  const out = new Uint8Array(new ArrayBuffer(clean.length / 2));
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const hashBytes = new Uint8Array(derivedBits);
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hashBytes)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isInteger(iterations) || iterations < 10_000) return false;
  const salt = hexToBytes(parts[2]);
  const expectedHash = hexToBytes(parts[3]);
  if (salt.length === 0 || expectedHash.length === 0) return false;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    expectedHash.length * 8,
  );
  return timingSafeEqualBytes(new Uint8Array(derivedBits), expectedHash);
}

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: AuthenticatedUser,
  secret: string,
): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    displayName: user.displayName ?? null,
    slot: user.slot ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<AuthenticatedUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      algorithms: ["HS256"],
    });
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const role: AuthRole = payload.role === "admin" ? "admin" : "user";
    if (!email) return null;
    return {
      email,
      role,
      displayName:
        typeof payload.displayName === "string" ? payload.displayName : undefined,
      slot: typeof payload.slot === "string" ? payload.slot : undefined,
    };
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string, isSecure: boolean): string {
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (isSecure) attrs.push("Secure");
  return attrs.join("; ");
}

export function buildClearSessionCookie(isSecure: boolean): string {
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isSecure) attrs.push("Secure");
  return attrs.join("; ");
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function roleForEmail(email: string, adminEmails = ""): AuthRole {
  const admins = new Set(
    adminEmails
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  return admins.has(email.toLowerCase()) ? "admin" : "user";
}

export async function authenticateRequest(
  request: Request,
  env: AccessEnvironment,
): Promise<AuthenticatedUser | null> {
  const sessionToken = readCookie(request, SESSION_COOKIE_NAME);
  if (sessionToken && env.AUTH_SECRET) {
    const sessionUser = await verifySessionToken(sessionToken, env.AUTH_SECRET);
    if (sessionUser) {
      return sessionUser;
    }
  }

  if (isLocalRequest(request)) {
    return { email: "local@development", role: "admin", displayName: "Local Dev" };
  }

  const teamDomain = env.ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  const audience = env.ACCESS_AUDIENCE;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");

  if (!teamDomain || !audience || !token) return null;

  try {
    let jwks = jwksByDomain.get(teamDomain);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
      jwksByDomain.set(teamDomain, jwks);
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience,
    });
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

    if (!email) return null;

    return {
      email,
      role: roleForEmail(email, env.ADMIN_EMAILS),
    };
  } catch {
    return null;
  }
}
