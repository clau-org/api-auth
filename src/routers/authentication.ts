import { ApiRouter, validate, z } from "../../deps.ts";

const router = new ApiRouter();

router.all(
  "/register",
  validate({
    schema: z.object({
      email: z.string().email(),
    }),
  }),
  (ctx) => {
    const {email} = ctx.state.requestData
    ctx.response.body = {
      message: `register from PLATFORM-API: `+email
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
  (ctx) => {
    const {email} = ctx.state.requestData
    ctx.response.body = {
      message: `Login from PLATFORM-API: `+email
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
    const {token} = ctx.state.requestData
    ctx.response.body = {
      message: `logout from PLATFORM-API: `+token
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
  (ctx) => {
    const {token} = ctx.state.requestData
    ctx.response.body = {
      message: `verify from PLATFORM-API: `+token
    };
  },
);

export { router };
