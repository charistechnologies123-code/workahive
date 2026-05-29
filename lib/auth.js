import jwt from "jsonwebtoken";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EMAIL_VERIFICATION_ERROR = "Please verify your email before continuing.";
const AUTH_COOKIE_NAME = "token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function normalizeRememberMe(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function getAuthTokenOptions(rememberMe = false) {
  const maxAge = normalizeRememberMe(rememberMe)
    ? REMEMBER_ME_MAX_AGE_SECONDS
    : SESSION_MAX_AGE_SECONDS;

  return {
    expiresIn: `${maxAge}s`,
    maxAge,
  };
}

export function buildAuthCookie(token, rememberMe = false) {
  const { maxAge } = getAuthTokenOptions(rememberMe);
  const secure = isProduction() ? "; Secure" : "";

  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function buildClearedAuthCookie() {
  const secure = isProduction() ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getUserFromRequest(req) {
  const { [AUTH_COOKIE_NAME]: token } = req.cookies || {};
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getAuthenticatedUser(req, options = {}) {
  const {
    allowedRoles = [],
    requireVerified = true,
    allowAdminWithoutVerification = true,
  } = options;

  const jwtUser = getUserFromRequest(req);
  if (!jwtUser) {
    return {
      error: {
        status: 401,
        body: { error: "Unauthorized" },
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(jwtUser.id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return {
      error: {
        status: 401,
        body: { error: "Unauthorized" },
      },
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      error: {
        status: 403,
        body: { error: "Unauthorized" },
      },
    };
  }

  const shouldRequireVerification =
    requireVerified &&
    !(allowAdminWithoutVerification && user.role === "ADMIN");

  if (shouldRequireVerification && !user.emailVerified) {
    return {
      error: {
        status: 403,
        body: {
          error: EMAIL_VERIFICATION_ERROR,
          needsEmailVerification: true,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  return { user };
}

export function requireAuth(handler, allowedRoles = [], options = {}) {
  return async (req, res) => {
    const result = await getAuthenticatedUser(req, {
      allowedRoles,
      requireVerified: options.requireVerified !== false,
      allowAdminWithoutVerification: options.allowAdminWithoutVerification !== false,
    });

    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    req.user = result.user;
    return handler(req, res);
  };
}

export { EMAIL_VERIFICATION_ERROR };
