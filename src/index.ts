if (window.__ENV_9__?.mode === "development") {
    console.warn("[Nine-9] Initialized in development mode.");
}

export * from "./channel";
export * from "./dom";
export * from "./util";

export * as assets from "./assets";
export { default as examples } from "./examples";
