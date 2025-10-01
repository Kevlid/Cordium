import { defineConfig } from "tsup";

export default defineConfig([
    {
        entry: ["src/**/*.ts"], // Build all .ts files in src
        format: "cjs",
        outDir: "dist/cjs",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false,
        splitting: false,
        treeshake: true,
        target: "es2020",
        keepNames: true,
    },
    {
        entry: ["src/**/*.ts"], // Build all .ts files in src
        format: "esm",
        outDir: "dist/esm",
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false,
        splitting: false,
        treeshake: true,
        target: "es2020",
        keepNames: true,
    },
]);
