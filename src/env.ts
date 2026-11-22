import { defineEnvVars } from "@sveltejs/kit/env";

// The environment variables of the app, inlined into the bundle from the .env file at build time;
// the public ones are imported from $app/env/public, the private ones from $app/env/private
export const variables = defineEnvVars({
    PUBLIC_API_KEY: { public: true, static: true },
});
