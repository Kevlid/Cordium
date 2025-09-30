import { defineConfig } from "tsup";

export default defineConfig([
    // CommonJS build
    {
        entry: ["src/index.ts"],
        format: "cjs",
        outDir: "dist/cjs",
        dts: true,
        clean: true, // Only clean once on the first build
        sourcemap: true,
        minify: false,
    },
    // ESM build
    {
        entry: ["src/index.ts"],
        format: "esm",
        outDir: "dist/esm",
        dts: true,
        clean: false, // Don't clean again to avoid conflicts
        sourcemap: true,
        minify: false,
    },
]);
