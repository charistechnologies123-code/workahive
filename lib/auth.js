import jwt from "jsonwebtoken";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EMAIL_VERIFICATION_ERROR = "Please verify your email before continuing.";

export function getUserFromRequest(req) {
  const { token } = req.cookies || {};
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
