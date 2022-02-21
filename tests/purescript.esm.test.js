import { test } from "uvu";
import * as assert from "uvu/assert";
import { transformFileSync, transformSync } from "@swc/core";
import { plugin } from "../src/index.js";
import { Visitor } from "@swc/core/Visitor.js";
import fs from "fs";

test("export purs generated code", () => {
    const { code } = transformFileSync("./testdata/01input.js", {
        plugin: plugin(),
    });
    // No Requires!
    assert.not.ok(code.includes("require"));
    // Sorry, module.exports not allowed :(
    assert.not.ok(code.includes("module.exports"));
    // Also don't try to sneak an exports.value in there
    assert.not.ok(code.includes("module.exports"));
    fs.writeFileSync("./testdata/01input.esm.js", code);
    // I guess the output should be valid...
    const result = transformSync(code);
    assert.equal(result.code, code);
});

test("export foreign import code", () => {
    const { code } = transformFileSync("./testdata/02foreign.js", {
        plugin: plugin(),
    });
    // No Requires!
    assert.not.ok(code.includes("require"));
    // Sorry, module.exports not allowed :(
    assert.not.ok(code.includes("module.exports"));
    // Also don't try to sneak an exports.value in there
    assert.not.ok(code.includes("module.exports"));
    fs.writeFileSync("./testdata/02foreign.esm.js", code);
    // I guess the output should be valid...
    const result = transformSync(code);
    assert.equal(result.code, code);
});

test("ast_repl", () => {
    const program = `
    module.exports = { "hello": null };
    `;
    transformSync(program, {
        plugin: (ast) => {
            fs.writeFileSync(
                "testdata/ast_repl_output.json",
                JSON.stringify(ast, null, 2)
            );
            return new Visitor().visitProgram(ast);
        },
    });
});

test.run();
