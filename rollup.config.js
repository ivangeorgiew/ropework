import modify from "rollup-plugin-modify"
import strip from "@rollup/plugin-strip"
import { terser } from "rollup-plugin-terser"
import pkg from "./package.json"

const entries = [
    [".", "TiedUp"],
    ["./server", "TiedUpServer"],
]

const globals = {
    "tied-up": "TiedUp",
    "tied-up/server": "TiedUpServer",
}

const commonOutOpts = {
    esModule: false,
    freeze: false,
    exports: "named",
}

const makeInput = root => `${root}/src/index.js`

const external = id => id.startsWith("tied-up")

const terserOpts = {
    ecma: 6,
    format: {
        preserve_annotations: true,
        wrap_iife: true,
        wrap_func_args: true,
    },
    compress: {
        keep_infinity: true,
        pure_getters: true,
        passes: 3,
    },
}

const treeshake = {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
}

const reducer = (acc, [root, name]) =>
    acc.concat([
        {
            input: makeInput(root),
            external,
            treeshake,
            output: [
                { ...commonOutOpts, format: "cjs", file: `${root}/${pkg.main}` },
                { ...commonOutOpts, format: "esm", file: `${root}/${pkg.module}` },
            ],
            plugins: [modify({ __TEST__: false })],
        },
        {
            input: makeInput(root),
            external,
            treeshake,
            output: [
                {
                    ...commonOutOpts,
                    format: "cjs",
                    file: `${root}/${pkg.main.replace(".js", ".test.js")}`,
                },
                {
                    ...commonOutOpts,
                    format: "esm",
                    file: `${root}/${pkg.module.replace(".js", ".test.js")}`,
                },
            ],
            plugins: [modify({ __TEST__: true })],
        },
        {
            input: makeInput(root),
            external,
            treeshake,
            output: [
                {
                    ...commonOutOpts,
                    sourcemap: true,
                    format: "cjs",
                    file: `${root}/${pkg.main.replace(".js", ".min.js")}`,
                },
                {
                    ...commonOutOpts,
                    sourcemap: true,
                    format: "esm",
                    file: `${root}/${pkg.module.replace(".js", ".min.js")}`,
                },
                {
                    ...commonOutOpts,
                    sourcemap: true,
                    format: "umd",
                    file: `${root}/${pkg.unpkg}`,
                    name,
                    globals,
                },
            ],
            plugins: [
                modify({
                    "process.env.NODE_ENV": JSON.stringify("production"),
                    "__TEST__": false,
                    "find": /\[\s*(\w+Def(?:\s*,\s*|\s*))+\]/g,
                    "replace": "[]",
                }),
                strip({ functions: ["createValidateFunc", "createDef"] }),
                terser(terserOpts),
            ],
        },
    ])

export default entries.reduce(reducer, [])
