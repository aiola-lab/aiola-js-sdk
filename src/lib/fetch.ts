import { fetch } from "cross-fetch";
import { AiolaError } from "./errors";
import { DEFAULT_HEADERS } from "./constants";
import { ClientConfig } from "./types";
import { Auth } from "../clients/auth/Client";

/**
 * Creates an authenticated fetch function that automatically handles:
 * - Base URL resolution
 * - Authorization headers (Bearer token)
 * - Default headers (User-Agent, Content-Type)
 * - Error handling and response parsing
 */
export function createAuthenticatedFetch(
  options: ClientConfig,
  auth: Auth,
): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      // Resolve the full URL
      const fullUrl = url.startsWith("http")
        ? url
        : `${options.baseUrl}${url}`;

      // Get access token from auth module
      const accessToken = await auth.getAccessToken(options);

      // Prepare headers
      const headers = new Headers(init.headers);

      // Add default headers
      Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });

      // Add Authorization header
      headers.set("Authorization", `Bearer ${accessToken}`);

      // Handle Content-Type for different body types
      if (init.body && !headers.has("Content-Type")) {
        // Don't set Content-Type for FormData - let the browser/Node.js set it with boundary
        const isFormData =
          init.body instanceof FormData ||
          (typeof init.body === "object" &&
            init.body.constructor?.name === "FormData");

        if (!isFormData) {
          headers.set("Content-Type", "application/json");
        }
      }

      // Make the request
      const response = await fetch(fullUrl, {
        ...init,
        headers,
        signal: controller.signal,
      });

      // Handle errors
      if (!response.ok) {
        throw await AiolaError.fromResponse(response);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Creates a simple fetch function without authentication
 * Used for auth endpoints that don't require Bearer tokens
 */
export function createUnauthenticatedFetch(
  baseUrl: string,
): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url: string, init: RequestInit = {}) => {
    // Resolve the full URL
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    // Prepare headers
    const headers = new Headers(init.headers);

    // Add default headers
    Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    });

    // Handle Content-Type for different body types
    if (init.body && !headers.has("Content-Type")) {
      const isFormData =
        init.body instanceof FormData ||
        (typeof init.body === "object" &&
          init.body.constructor?.name === "FormData");

      if (!isFormData) {
        headers.set("Content-Type", "application/json");
      }
    }

    // Make the request
    const response = await fetch(fullUrl, {
      ...init,
      headers,
    });

    // Handle errors
    if (!response.ok) {
      throw await AiolaError.fromResponse(response);
    }

    return response;
  };
}
