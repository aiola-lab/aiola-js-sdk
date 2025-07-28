import { RUNTIME } from "./runtime";

export const DEFAULT_BASE_URL = "https://apis.aiola.ai";
export const DEFAULT_AUTH_BASE_URL = "https://auth.aiola.ai";

export const DEFAULT_HEADERS = {
  "User-Agent": `@aiola/aiola-js/${RUNTIME.type}/${RUNTIME.version}`,
};

export const DEFAULT_WORKFLOW_ID = "2c78fcf1-9265-408f-b8c3-d9d7e7ebc1bc";

export const DEFAULT_TIMEOUT = 150000;
