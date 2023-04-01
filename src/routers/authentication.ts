import {
  ApiRouter,
  Context,
  DBClient,
  JWT,
  Middleware,
  validate,
  z,
} from "../../deps.ts";

import { PROXY_DB } from "../config.ts";

const { users, sessions } = new DBClient({
  datasources: {
    db: { url: PROXY_DB },
  },
});

// Helper function to create a new session
async function createSession({ user }: { user: any }) {
  // Generate a random UUID for session
  const uuid = crypto.randomUUID();

  // Create JWT
  const secret = "mySuperSecret";
  const jwtKeyRaw = new TextEncoder().encode(secret); // Encode the secret key as raw data
  const jwtHeader: JWT.Header = { alg: "HS512", typ: "JWT" }; // JWT header containing algorithm and token type
  const jwtKey = await crypto.subtle.importKey(
    "raw", // Key is in raw format
    jwtKeyRaw, // Raw key data
    { name: "HMAC", hash: "SHA-512" }, // Create a new HMAC key with SHA-512 hashing algorithm
    true, // Key is extractable (can be exported)
    ["sign", "verify"], // Allow key to be used for signing and verifying
  );

  // Co-relate session and jwt
  const jwt = await JWT.create(jwtHeader, { session: { uuid }, user }, jwtKey);

  // Create session
  return sessions.create({
    data: {
      uuid,
      jwt,
      user_id: user.id,
      user_uuid: user.uuid,
    },
  });
}

// Validation Middleware
const validateUserUnique: Middleware = async (ctx: Context, next: any) => {
  const { email } = ctx.state.requestData;

  const existingUser = await users.findFirst({
    where: {
      email,
    },
  });

  if (existingUser) {
    ctx.response.status = 200;
    ctx.response.body = {
      message: "User already exists",
      ...ctx.state.requestData,
    };
    return;
  }

  await next();
};

// Validation Middleware
const validateUserExist: Middleware = async (ctx: Context, next: any) => {
  const { email } = ctx.state.requestData;

  const existingUser = await users.findFirst({
    where: {
      email,
    },
  });

  if (!existingUser) {
    ctx.response.status = 404;
    ctx.response.body = { message: "User doesn't exists", email };
    return;
  }

  await next();
};

// Validation Middleware
const validateSessionExist: Middleware = async (ctx: Context, next: any) => {
  const { jwt } = ctx.state.requestData;

  const existingSession = await sessions.findFirst({
    where: {
      jwt,
    },
  });

  if (!existingSession) {
    ctx.response.status = 404;
    ctx.response.body = { message: "Session doesn't exists", jwt };
    return;
  }

  await next();
};

// Create a new router instance
const router = new ApiRouter({
  prefix: "/authentication",
});

router.all(
  "/register",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  validateUserUnique,
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const user = await users.create({
      data: {
        email,
      },
    });

    const session = await createSession({ user });

    ctx.response.body = {
      session,
      user,
    };
  },
);

router.all(
  "/login",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  validateUserExist,
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const user = await users.findFirst({
      where: {
        email,
      },
    });

    const session = await createSession({ user });

    ctx.response.body = {
      session,
      user,
    };
  },
);

router.all(
  "/logout",
  validate({
    schema: z.object({
      jwt: z.string(), // Define validation schema for token (email?)
    }),
  }),
  validateSessionExist,
  async (ctx) => {
    const { jwt } = ctx.state.requestData; // Extract token from request data

    const session = await sessions.findFirst({
      where: {
        jwt,
      },
    });

    await sessions.delete({
      where: {
        id: session?.id,
      },
    });

    ctx.response.body = {
      message: "Session deleted",
      session,
    };
  },
);

router.all(
  "/verify",
  validate({
    schema: z.object({
      jwt: z.string(), // Define validation schema for token
    }),
  }),
  validateSessionExist,
  async (ctx) => {
    const { jwt } = ctx.state.requestData; // Extract token from request data

    const { user, ...session } = (await sessions.findFirst({
      where: {
        jwt,
      },
      include: {
        user: true,
      },
    })) ?? {};

    ctx.response.body = {
      session: session,
      user: user,
    };
  },
);

export { router }; // Export the router instance
