import { superoak } from "../../deps_tests.ts";
import { api } from "../../src/api.ts"; // Import the router from the provided code

api.setupApp();

Deno.test("Registration endpoint", async () => {
  const request = await superoak(api.app);
  await request
    .post("/register")
    .send({ email: "test@example.com" })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.jwt) {
        throw new Error("Missing JWT");
      }
    });
});

Deno.test("Login endpoint", async () => {
  const request = await superoak(api.app);
  await request
    .post("/login")
    .send({ email: "test@example.com" })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.jwt) {
        throw new Error("Missing JWT");
      }
    });
});

Deno.test("Logout endpoint", async () => {
  const request = await superoak(api.app);
  await request
    .post("/logout")
    .send({ token: "test@example.com" }) // Note: The provided code had an error in the validation schema for the token. It should be z.string() instead of z.string().email()
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.message.startsWith("logout from PLATFORM-API")) {
        throw new Error("Invalid response message");
      }
    });
});

Deno.test("Verify endpoint", async () => {
  // Obtain a JWT from the registration endpoint
  const registrationRequest = await superoak(api.app);
  const registrationResponse = await registrationRequest
    .post("/register")
    .send({ email: "test@example.com" })
    .expect(200);

  const jwt = registrationResponse.body.jwt;

  // Test the verify endpoint with the obtained JWT
  const request = await superoak(api.app);
  await request
    .post("/verify")
    .send({ token: jwt })
    .expect(200)
    .expect(({ body }: any) => {
      if (!body.payload) {
        throw new Error("Invalid payload");
      }
    });
});
