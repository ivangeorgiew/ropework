import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'src/index.js',
    plugins: [
        babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-env']
        }),
        terser({
            ecma: 6,
            compress: {
                keep_infinity: true,
                pure_getters: true,
                passes: 5
            }
        })
    ],
    output: [
        { file: 'dist/index.js', format: 'cjs', sourcemap: true },
        { file: 'dist/index.esm.js', format: 'esm', sourcemap: true }
    ],
    treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
}
