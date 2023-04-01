import {
  ApiRouter,
  JWT,
  validate,
  z,
  DBClient,
  Context,
  Middleware,
} from "../../deps.ts";

const router = new ApiRouter({
  prefix: "/authentication",
}); // Create a new router instance

const encoder = new TextEncoder(); // Create a new text encoder

const jwtKeyRaw = encoder.encode("mySuperSecret"); // Encode the secret key as raw data

const jwtHeader: JWT.Header = { alg: "HS512", typ: "JWT" }; // JWT header containing algorithm and token type

const CLAU_PLATFORM_PROXY_DB =
  "prisma://aws-us-east-1.prisma-data.com/?api_key=mY4engKpoOtH3QVxb9NWeTZ_NWpEeoT6CcLwsDAtpsefXTby_mpAjYXQj1qLL0yF";

const dbClient = new DBClient({
  datasources: {
    db: { url: CLAU_PLATFORM_PROXY_DB },
  },
});

const { users, sessions } = dbClient;

const jwtKey = await crypto.subtle.importKey(
  "raw", // Key is in raw format
  jwtKeyRaw, // Raw key data
  { name: "HMAC", hash: "SHA-512" }, // Create a new HMAC key with SHA-512 hashing algorithm
  true, // Key is extractable (can be exported)
  ["sign", "verify"] // Allow key to be used for signing and verifying
);

const checkExistingUser: Middleware = async (ctx: Context, next: any) => {
  const { email } = ctx.state.requestData;

  const existingUser = await users.findFirst({
    where: {
      email,
    },
  });

  if (existingUser) {
    ctx.response.status = 200;
    ctx.response.body = { message: "User already exists" };
    return;
  }

  await next();
};

router.all(
  "/register",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  checkExistingUser,
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const uuid = crypto.randomUUID(); // Generate a random UUID for session

    const user = await users.create({
      data: {
        email,
      },
    });

    const jwt = await JWT.create(
      jwtHeader,
      { session: { uuid }, user },
      jwtKey
    ); // Create a new JWT with UUID, email, and HMAC key

    const session = await sessions.create({
      data: {
        uuid,
        jwt,
        user_id: user.id,
      },
    });

    ctx.response.body = {
      session,
      user,
    };
  }
);

const checkNonExistingUser: Middleware = async (ctx: Context, next: any) => {
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

router.all(
  "/login",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  checkNonExistingUser,
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const uuid = crypto.randomUUID(); // Generate a random UUID for session

    const user = await users.findFirst({
      where: {
        email,
      },
    });

    const jwt = await JWT.create(
      jwtHeader,
      { session: { uuid }, user },
      jwtKey
    ); // Create a new JWT with UUID, email, and HMAC key

    const session = await sessions.create({
      data: {
        uuid,
        jwt,
        user_id: user!.id,
      },
    });

    ctx.response.body = {
      session,
      user,
    };
  }
);

const checkNonExistingSession: Middleware = async (ctx: Context, next: any) => {
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

router.all(
  "/logout",
  validate({
    schema: z.object({
      jwt: z.string(), // Define validation schema for token (email?)
    }),
  }),
  checkNonExistingSession,
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
  }
);

router.all(
  "/verify",
  validate({
    schema: z.object({
      jwt: z.string(), // Define validation schema for token
    }),
  }),
  checkNonExistingSession,
  async (ctx) => {
    const { jwt } = ctx.state.requestData; // Extract token from request data

    const existingSession = await sessions.findFirst({
      where: {
        jwt,
      },
      include: {
        user: true,
      },
    });

    const { user, ...session } = existingSession!;

    ctx.response.body = {
      session: session,
      user: user,
    };
  }
);

export { router }; // Export the router instance
