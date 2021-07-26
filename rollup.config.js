import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

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
            format: 'umd',
            file: `${root}/dist/index.umd.js`,
            name,
            globals,
            sourcemap: true,
            plugins: [
                terser({
                    ecma: 6,
                    compress: {
                        keep_infinity: true,
                        pure_getters: true,
                        passes: 5
                    }
                })
            ]
        }
    ],
    plugins: [
        babel({
            babelHelpers: 'bundled',
            babelrc: false,
            configFile: false,
            exclude: 'node_modules/**',
            presets: ['@babel/preset-env']
        })
    ],
    treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
}))
