import { transformAndGenerate } from "../../src/utils/transform.js";
import { describe, it, expect } from "vitest";

describe("toSolidLink", () => {
  it("inject the anchor component", () => {
    const inCode = `import { Link } from "dreamkit";
    export default <Link to="/user/:user">users</Link>;
    `;
    const { code } = transformAndGenerate(inCode, {
      toSolidLink: true,
    });
    expect(code).toMatchInlineSnapshot(`
      "import { A as _A } from "@solidjs/router";
      import { Link } from "dreamkit";
      export default <Link to="/user/:user" component={_A}>users</Link>;"
    `);
  });
});
