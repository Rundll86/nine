import { defineConfig } from "tsup";

export default defineConfig(options => {
    const isDevelopment = options.env?.NODE_ENV === "development";
    console.log(options.env?.NODE_ENV, isDevelopment);

    return {
        entry: ["src/index.ts", ...isDevelopment ? ["src/test.ts"] : []],
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