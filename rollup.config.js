import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'source.js',
    output: [
        { file: 'cjs/tied-pants.dev.js', format: 'cjs' },
        {
            file: 'cjs/tied-pants.prod.min.js',
            format: 'cjs',
            plugins: [terser()]
        }
    ],
    plugins: [resolve()]
}
