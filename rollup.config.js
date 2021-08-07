import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const entries = [
    ['.', 'TiedUp'],
    ['./extras', 'TiedUpExtras']
]
const globals = {
    'tied-up': 'TiedUp',
    'tied-up/extras': 'TiedUpExtras'
}
const commonOutOpts = {
    esModule: false,
    freeze: false,
    exports: 'named',
    sourcemap: true
}
const terserOpts = {
    ecma: 6,
    format: {
        preserve_annotations: true,
        wrap_iife: true,
        wrap_func_args: true
    },
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
            file: `${root}/${pkg.main}`,
            plugins: [terser(terserOpts)]
        },
        {
            ...commonOutOpts,
            format: 'esm',
            file: `${root}/${pkg.module}`,
            plugins: [terser({ ...terserOpts, module: true })]
        },
        {
            ...commonOutOpts,
            format: 'umd',
            file: `${root}/${pkg.unpkg}`,
            plugins: [terser(terserOpts)],
            name,
            globals
        }
    ],
    plugins: [
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
            babelrc: false,
            configFile: false,
            presets: ['@babel/preset-env']
        })
    ],
    treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
}))
