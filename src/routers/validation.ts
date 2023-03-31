import { ApiRouter, validate, z } from "../../deps.ts";

const helloRouter = new ApiRouter();

helloRouter.all(
  "/",
  validate({
    schema: z.object({
      hello: z.string(),
    }),
  }),
  (ctx) => {
    ctx.response.body = {
      message: `Hello from PLATFORM-API`,
    };
  },
);

export { helloRouter };
