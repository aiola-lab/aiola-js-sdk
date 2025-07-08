import { RUNTIME } from "./runtime";

export const DEFAULT_BASE_URL = "https://dev-vp1-uw2-api.internal.aiola.ai";
export const DEFAULT_AUTH_BASE_URL = "https://dev-vp1-uw2-auth.internal.aiola.ai";

export const DEFAULT_HEADERS = {
  "User-Agent": `@aiola/aiola-js/${RUNTIME.type}/${RUNTIME.version}`,
};

export const DEFAULT_WORKFLOW_ID = "9e153c70-288b-47a5-97a7-1f91273c2420";