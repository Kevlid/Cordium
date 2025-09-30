import { defineConfig } from "tsup";

export default defineConfig([
    // CommonJS build
    {
        entry: ["src/index.ts"],
        format: "cjs",
        outDir: "dist/cjs",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false,
    },
    // ESM build
    {
        entry: ["src/index.ts"],
        format: "esm",
        outDir: "dist/esm",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false,
    },
]);
