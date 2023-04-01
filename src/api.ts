import { API } from "../deps.ts";
import { router as authenticationRouter } from "./routers/authentication.ts";

const api = new API({ name: "auth" });

api.addRouter(authenticationRouter);

export { api };
