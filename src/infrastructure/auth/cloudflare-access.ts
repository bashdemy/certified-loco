import { createRemoteJWKSet, jwtVerify } from "jose";

export type AuthRole = "admin" | "user";

export type AuthenticatedUser = {
  email: string;
  role: AuthRole;
};

export type AccessEnvironment = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  ADMIN_EMAILS?: string;
};

const jwksByDomain = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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
  if (isLocalRequest(request)) {
    return { email: "local@development", role: "admin" };
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
