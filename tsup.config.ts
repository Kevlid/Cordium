import { defineConfig } from "tsup";

export default defineConfig([
    // CommonJS build - efficient and readable
    {
        entry: ["src/**/*.ts"],
        format: "cjs",
        outDir: "dist/cjs",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false, // Keep code readable
        splitting: false, // Simpler output structure
        treeshake: true,
        target: "es2020",
        keepNames: true,
    },
    // ESM build - efficient and readable
    {
        entry: ["src/**/*.ts"],
        format: "esm",
        outDir: "dist/esm",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false, // Keep code readable
        splitting: false, // Simpler output structure
        treeshake: true,
        target: "es2020",
        keepNames: true,
    },
]);
