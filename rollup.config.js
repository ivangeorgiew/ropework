import replace from "@rollup/plugin-replace"
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
    sourcemap: true,
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
            plugins: [
                replace({ preventAssignment: true, __TEST__: false }),
                terser(terserOpts),
            ],
        },
        {
            input: makeInput(root),
            external,
            treeshake,
            output: [
                {
                    ...commonOutOpts,
                    format: "cjs",
                    file: `${root}/${pkg.main.replace(".js", ".prod.js")}`,
                },
                {
                    ...commonOutOpts,
                    format: "esm",
                    file: `${root}/${pkg.module.replace(".js", ".prod.js")}`,
                },
                {
                    ...commonOutOpts,
                    format: "umd",
                    file: `${root}/${pkg.unpkg}`,
                    name,
                    globals,
                },
            ],
            plugins: [
                replace({
                    "preventAssignment": true,
                    "process.env.NODE_ENV": JSON.stringify("production"),
                    "__TEST__": false,
                }),
                strip({ functions: ["orThrow", "validateArgs"] }),
                terser(terserOpts),
            ],
        },
        {
            input: makeInput(root),
            external,
            treeshake,
            output: [
                {
                    ...commonOutOpts,
                    sourcemap: false,
                    format: "cjs",
                    file: `${root}/${pkg.main.replace("index", "test")}`,
                },
                {
                    ...commonOutOpts,
                    sourcemap: false,
                    format: "esm",
                    file: `${root}/${pkg.module.replace("index", "test")}`,
                },
            ],
            plugins: [
                replace({
                    "preventAssignment": true,
                    "process.env.NODE_ENV": JSON.stringify("development"),
                    "__TEST__": true,
                }),
            ],
        },
    ])

export default entries.reduce(reducer, [])
