import { ApiRouter, JWT, validate, z } from "../../deps.ts";

const router = new ApiRouter(); // Create a new router instance

const encoder = new TextEncoder(); // Create a new text encoder

const jwtKeyRaw = encoder.encode("mySuperSecret"); // Encode the secret key as raw data

const jwtHeader: JWT.Header = { alg: "HS512", typ: "JWT" }; // JWT header containing algorithm and token type

const jwtKey = await crypto.subtle.importKey(
  "raw", // Key is in raw format
  jwtKeyRaw, // Raw key data
  { name: "HMAC", hash: "SHA-512" }, // Create a new HMAC key with SHA-512 hashing algorithm
  true, // Key is extractable (can be exported)
  ["sign", "verify"] // Allow key to be used for signing and verifying
);

router.all(
  "/register",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const uuid = crypto.randomUUID(); // Generate a random UUID

    const jwt = await JWT.create(jwtHeader, { uuid, email }, jwtKey); // Create a new JWT with UUID, email, and HMAC key

    ctx.response.body = {
      jwt,
      email,
    };
  }
);

router.all(
  "/login",
  validate({
    schema: z.object({
      email: z.string().email(), // Define validation schema for email
    }),
  }),
  async (ctx) => {
    const { email } = ctx.state.requestData; // Extract email from request data

    const uuid = crypto.randomUUID(); // Generate a random UUID

    const jwt = await JWT.create(jwtHeader, { uuid, email }, jwtKey); // Create a new JWT with UUID, email, and HMAC key

    ctx.response.body = {
      email,
      jwt,
    };
  }
);

router.all(
  "/logout",
  validate({
    schema: z.object({
      token: z.string().email(), // Define validation schema for token (email?)
    }),
  }),
  (ctx) => {
    const { token } = ctx.state.requestData; // Extract token from request data

    ctx.response.body = {
      message: `logout from PLATFORM-API: ` + token, // Set response message with token value
    };
  }
);

router.all(
  "/verify",
  validate({
    schema: z.object({
      token: z.string(), // Define validation schema for token
    }),
  }),
  async (ctx) => {
    const { token } = ctx.state.requestData; // Extract token from request data

    const payload = await JWT.verify(token, jwtKey); // Verify the JWT and extract its payload

    ctx.response.body = {
      payload,
    };
  }
);

export { router }; // Export the router instance
