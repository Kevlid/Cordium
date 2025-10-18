import { defineConfig } from "tsup";

export default defineConfig((options) => {
    const sharedOptions = {
        entry: ["src/**/*.ts"],
        sourcemap: true,
        minify: false,
        splitting: false,
        treeshake: true,
        target: "es2020",
        keepNames: true,
        skipNodeModulesBundle: true,
        clean: !options.watch,
    };

    return [
        {
            ...sharedOptions,
            outDir: "dist/cjs",
            format: ["cjs"],
        },
        {
            ...sharedOptions,
            outDir: "dist/esm",
            format: ["esm"],
        },
        {
            ...sharedOptions,
            outDir: "dist",
            dts: { only: true },
            format: undefined,
            entry: ["src/index.ts"],
        },
    ];
});
