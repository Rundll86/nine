import { defineConfig } from "tsup";

export default defineConfig(options => {
    const isDevelopment = options.env?.NODE_ENV === "development";

    return {
        entry: ["src/index.ts"],
        splitting: false,
        sourcemap: isDevelopment,
        dts: true,
        clean: true,
        minify: !isDevelopment,
        loader: {
            ".svg": "dataurl"
        },
    };
});