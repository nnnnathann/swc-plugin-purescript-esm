import { test } from "uvu";
import * as assert from "uvu/assert";
import { transformFileSync, transformSync } from "@swc/core";
import { plugin } from "../src/index.js";

test("Should export an esm compatible file", () => {
    console.log("transpiling");
    const { code } = transformFileSync("./testdata/01input.js", {
        plugin: plugin(),
    });
    // No Requires!
    assert.not.ok(code.includes("require"));
    // Sorry, module.exports not allowed :(
    assert.not.ok(code.includes("module.exports"));
    // Also don't try to sneak an exports.value in there
    assert.not.ok(code.includes("module.exports"));
    // I guess the output should be valid...
    const result = transformSync(code);
    assert.equal(result.code, code);
});

test.run();
