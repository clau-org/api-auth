import { ApiRouter, JWT, validate, z } from "../../deps.ts";

const router = new ApiRouter();

const jwtHeader: JWT.Header = { alg: "HS512", typ: "JWT" };
const jwtKey = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

router.all(
  "/register",
  validate({
    schema: z.object({
      email: z.string().email(),
    }),
  }),
  async (ctx) => {
    const { email } = ctx.state.requestData;

    const uuid = crypto.randomUUID();

    const jwt = await JWT.create(jwtHeader, { uuid, email }, jwtKey);

    ctx.response.body = {
      jwt,
      email,
    };
  },
);

router.all(
  "/login",
  validate({
    schema: z.object({
      email: z.string().email(),
    }),
  }),
  async (ctx) => {
    const { email } = ctx.state.requestData;

    const uuid = crypto.randomUUID();

    const jwt = await JWT.create(jwtHeader, { uuid, email }, jwtKey);

    ctx.response.body = {
      email,
      jwt,
    };
  },
);

router.all(
  "/logout",
  validate({
    schema: z.object({
      token: z.string().email(),
    }),
  }),
  (ctx) => {
    const { token } = ctx.state.requestData;

    ctx.response.body = {
      message: `logout from PLATFORM-API: ` + token,
    };
  },
);

router.all(
  "/verify",
  validate({
    schema: z.object({
      token: z.string(),
    }),
  }),
  async (ctx) => {
    const { token } = ctx.state.requestData;

    const payload = await JWT.verify(token, jwtKey);

    ctx.response.body = {
      payload,
    };
  },
);

export { router };
