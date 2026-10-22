import test from "node:test";
import assert from "node:assert/strict";
import { starterCode, codeCommands } from "../src/shared/code-lab.js";
import { defaults } from "../src/shared/settings.js";
test("all lab starter declarations parse and validate", () => {
  for (const [lab, settings] of Object.entries(defaults))
    assert.ok(codeCommands(starterCode(lab, settings), lab).startsWith("set "));
});
test("numeric declarations accept comments and reject invalid code and values", () => {
  assert.equal(codeCommands("const confidence = .8; // experiment", "object"), "set confidence .8");
  for (const source of ["alert(1)", "const confidence = 2;", "const lives = 5;", "const confidence = .5;\nconst confidence = .8;", ""])
    assert.throws(() => codeCommands(source, "object"));
});
