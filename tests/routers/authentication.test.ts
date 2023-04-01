import { superoak } from "../../deps_tests.ts";
import { api } from "../../src/api.ts"; // Import the router from the provided code

api.setupApp();

api.logger.setLevelError();

const uuid = crypto.randomUUID();
const email = `test-${uuid}@test.com`;

let session = Deno.test("Registration endpoint", async () => {
  const request = await superoak(api.app);

  await request
    .post("/authentication/register")
    .send({ email })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.session) {
        throw new Error("Missing JWT");
      }

      session = body.session;
    });
});

Deno.test("Login endpoint", async () => {
  const request = await superoak(api.app);
  await request
    .post("/authentication/login")
    .send({ email })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.session) {
        throw new Error("Missing JWT");
      }

      session = body.session;
    });
});

Deno.test("Verify endpoint", async () => {
  const { jwt } = session!;

  // Test the verify endpoint with the obtained JWT
  const request = await superoak(api.app);
  await request
    .post("/authentication/verify")
    .send({ jwt })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.session) {
        throw new Error("Invalid payload");
      }
    });
});

Deno.test("Logout endpoint", async () => {
  const { jwt } = session!;

  const request = await superoak(api.app);
  await request
    .post("/authentication/logout")
    .send({ jwt }) // Note: The provided code had an error in the validation schema for the token. It should be z.string() instead of z.string().email()
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.session) {
        throw new Error("Invalid payload");
      }
    });
});
