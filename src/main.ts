import { API } from "../deps.ts";
import { router as authenticationRouter } from "./routers/authentication.ts";

const api = new API({ name: "test" });

api.addRouter(authenticationRouter);

await api.listen();
