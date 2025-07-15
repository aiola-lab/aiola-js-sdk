declare const EdgeRuntime: string | undefined;
declare const self: typeof globalThis.self & {
  importScripts?: unknown;
};

export const RUNTIME: Runtime = evaluateRuntime();

export interface Runtime {
  type:
    | "browser"
    | "web-worker"
    | "node"
    | "react-native"
    | "unknown"
    | "workerd"
    | "edge-runtime";
  version?: string;
  parsedVersion?: number;
}

function evaluateRuntime(): Runtime {
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";
  if (isBrowser) {
    return {
      type: "browser",
      version: window.navigator.userAgent,
    };
  }

  /**
   * https://developers.cloudflare.com/workers/runtime-apis/web-standards/#navigatoruseragent
   */
  const isCloudflare =
    typeof globalThis !== "undefined" &&
    globalThis?.navigator?.userAgent === "Cloudflare-Workers";
  if (isCloudflare) {
    return {
      type: "workerd",
    };
  }

  /**
   * https://vercel.com/docs/functions/runtimes/edge-runtime#check-if-you're-running-on-the-edge-runtime
   */
  const isEdgeRuntime = typeof EdgeRuntime === "string";
  if (isEdgeRuntime) {
    return {
      type: "edge-runtime",
    };
  }

  /**
   * A constant that indicates whether the environment the code is running is a Web Worker.
   */
  const isWebWorker =
    typeof self === "object" &&
    typeof self?.importScripts === "function" &&
    (self.constructor?.name === "DedicatedWorkerGlobalScope" ||
      self.constructor?.name === "ServiceWorkerGlobalScope" ||
      self.constructor?.name === "SharedWorkerGlobalScope");
  if (isWebWorker) {
    return {
      type: "web-worker",
    };
  }

  const isNode =
    typeof process !== "undefined" &&
    "version" in process &&
    !!process.version &&
    "versions" in process &&
    !!process.versions?.node;
  if (isNode) {
    return {
      type: "node",
      version: process.versions.node,
      parsedVersion: Number(process.versions.node.split(".")[0]),
    };
  }

  /**
   * https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Core/setUpNavigator.js
   */
  const isReactNative =
    typeof navigator !== "undefined" && navigator?.product === "ReactNative";
  if (isReactNative) {
    return {
      type: "react-native",
    };
  }

  return {
    type: "unknown",
  };
}
