import { transformAndGenerate } from "../../src/utils/transform.js";
import { describe, it, expect } from "vitest";

describe("replaceImportSpec", () => {
  it("rename source", () => {
    const inCode = `import { Link } from "dreamkit";`;
    const { code } = transformAndGenerate(inCode, {
      replaceImportSpec: {
        source: "dreamkit",
        newSource: "dreamkit2",
        spec: ["Link"],
      },
    });
    expect(code).toMatchInlineSnapshot(`"import { Link } from "dreamkit2";"`);
  });
  it("rename spec", () => {
    const inCode = `import { Link } from "dreamkit"; _(Link)`;
    const { code } = transformAndGenerate(inCode, {
      replaceImportSpec: {
        source: "dreamkit",
        spec: { Link: "Link2" },
      },
    });
    expect(code).toMatchInlineSnapshot(`
      "import { Link2 as _Link } from "dreamkit";
      _(_Link);"
    `);
  });

  it("rename spec and source", () => {
    const inCode = `import { Link } from "dreamkit"; _(Link)`;
    const { code } = transformAndGenerate(inCode, {
      replaceImportSpec: {
        source: "dreamkit",
        newSource: "dreamkit2",
        spec: { Link: "Link2" },
      },
    });
    expect(code).toMatchInlineSnapshot(`
      "import { Link2 as _Link } from "dreamkit2";
      _(_Link);"
    `);
  });
});
