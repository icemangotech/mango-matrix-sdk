"use strict";
const resolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const dts = require('rollup-plugin-dts').default;
const pkg = require('./package.json');

var plugins = [
    resolve(),
    replace({
        'JSENCRYPT_VERSION': JSON.stringify(pkg.version)
    })
];

console.log(dts, typeof dts, Object.keys(dts))

module.exports = [{
    input: "./src/index.js",
    plugins: plugins,
    name: "matrix",
    output: {
        file: pkg.main,
        format: 'umd',
        name: "matrix",
        exports: "named"
    },
    external: ['crypto-js']
}, {
    input: "./src/index.d.ts",
    output: {
        file: "bin/matrix.d.ts",
        format: "es",
    },
    plugins: [dts()]
}];
