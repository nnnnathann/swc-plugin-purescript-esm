## swc-plugin-purescript-esm

This module is experimental, just using it for some experiments
with building Purescript.

Purescript compiler doesn't currently support ESM output and
would be nice if it did for tree-shaking etc.

This plugin for SWC can take an output directory created by
Spago for instance and transpile it from the spago output
module format (commonjs with module.exports) into ESM.

This tool is very specifically focused on some anecdotal compiler
output from Purescript and definitely will not handle edge cases.

This project includes a source file from
[this repo](https://github.com/mohdovais/swc-plugin-cjs-to-esm/blob/main/plugin/visitor-cjs.js) and is subject to copyright from them!

