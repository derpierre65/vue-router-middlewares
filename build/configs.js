const path = require('path')
const buble = require('rollup-plugin-buble')
const babel = require('@rollup/plugin-babel').babel;
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve
const replace = require('rollup-plugin-replace')
const resolve = _path => path.resolve(__dirname, '../', _path)

module.exports = [
    // browser dev
    {
        file: resolve('dist/vue-router-middlewares.js'),
        format: 'umd',
        env: 'development'
    },
    {
        file: resolve('dist/vue-router-middlewares.min.js'),
        format: 'umd',
        env: 'production',
    },
    {
        file: resolve('dist/vue-router-middlewares.common.js'),
        format: 'cjs'
    },
    {
        file: resolve('dist/vue-router-middlewares.esm.js'),
        format: 'es'
    },
    {
        file: resolve('dist/vue-router-middlewares.esm.browser.js'),
        format: 'es',
        env: 'development',
        transpile: false
    },
    {
        file: resolve('dist/vue-router-middlewares.esm.browser.min.js'),
        format: 'es',
        env: 'production',
        transpile: false
    }
].map(genConfig)

function genConfig(opts) {
    const config = {
        input: {
            input: resolve('src/index.js'),
            plugins: [
                babel({
                    exclude: 'node_modules/**', // only transpile our source code
                    babelHelpers: 'runtime',
                }),
                nodeResolve(),
                commonjs(),
            ]
        },
        output: {
            file: opts.file,
            format: opts.format,
            name: 'VueRouterMiddlewares',
            exports: 'named',
        }
    }

    if (opts.env) {
        config.input.plugins.unshift(replace({
            'process.env.NODE_ENV': JSON.stringify(opts.env)
        }))
    }

    if (opts.transpile !== false) {
        config.input.plugins.push(buble())
    }

    return config
}
