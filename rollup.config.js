import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import cleanup from 'rollup-plugin-cleanup'

const globals = { 'tied-up': 'TiedUp' }
const entries = [
    ['.', 'TiedUp'],
    ['./extras', 'TiedUpExtras']
]
const commonOutOpts = {
    esModule: false,
    freeze: false,
    exports: 'named'
}
const terserOpts = {
    ecma: 6,
    compress: {
        keep_infinity: true,
        pure_getters: true,
        passes: 5
    }
}

export default entries.map(([root, name]) => ({
    input: `${root}/src/index.js`,
    external: id => id.startsWith('tied-up'),
    output: [
        {
            ...commonOutOpts,
            format: 'cjs',
            dir: `${root}/dist/cjs`,
            preserveModules: true
        },
        {
            ...commonOutOpts,
            format: 'esm',
            dir: `${root}/dist/esm`,
            preserveModules: true
        },
        {
            ...commonOutOpts,
            format: 'esm',
            file: `${root}/dist/index.min.js`,
            sourcemap: true,
            plugins: [
                terser({
                    ...terserOpts,
                    module: true,
                    toplevel: true
                })
            ]
        },
        {
            ...commonOutOpts,
            format: 'umd',
            file: `${root}/dist/index.umd.js`,
            name,
            globals,
            sourcemap: true,
            plugins: [terser(terserOpts)]
        }
    ],
    plugins: [
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
            presets: ['@babel/preset-env']
        }),
        cleanup({ maxEmptyLines: 1 })
    ],
    treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
}))
