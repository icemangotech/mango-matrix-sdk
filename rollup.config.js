"use strict";
const resolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const dts = require('rollup-plugin-dts').default;
const pkg = require('./package.json');

var plugins = [
    resolve(),
    commonjs(),
    replace({
        'MANGO_MATRIX_SDK_VERSION': JSON.stringify(pkg.version)
    })
];

console.log(dts, typeof dts, Object.keys(dts))

module.exports = [{
    input: "./src/index.js",
    plugins: plugins,
    output: {
        file: pkg.main,
        format: 'umd',
        name: "matrix",
        exports: "named",
    },
}, {
    input: "./src/index.d.ts",
    output: {
        file: pkg.types,
        format: "es",
    },
    plugins: [dts()]
}];
