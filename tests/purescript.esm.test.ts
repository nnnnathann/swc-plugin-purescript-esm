import { test } from "uvu";
import * as assert from "uvu/assert";
import { transformFileSync } from "@swc/core";
import { plugin } from "../src/index";

test("Should export an esm compatible file", () => {
    const { code } = transformFileSync("./testdata/01input.js", {
        plugin: plugin(),
    });
    console.log("code: " + code);
    assert.equal(typeof code, "string");
});

test.run();
