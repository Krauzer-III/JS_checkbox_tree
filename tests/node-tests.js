/* Browser smoke test: run demo/index.html for visual inspection. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("dist/tree-select.js","utf8");
assert.match(js,/class CheckboxTree/);
assert.match(js,/class RadioTree/);
assert.match(js,/setSearch\(q\)/);
assert.match(js,/selectBranch\(id/);
console.log("Source smoke tests passed");
