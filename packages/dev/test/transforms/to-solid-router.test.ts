import { transformAndGenerate } from "../../src/utils/transform.js";
import { describe, it, expect } from "vitest";

describe("toSolidRouter", () => {
  it("transform default call expression", () => {
    const inCode = `import { $route, s } from "dreamkit";
    export default $route
      .params({ user: s.string() })
      .create(function ({ }) {});
    `;
    const { code } = transformAndGenerate(inCode, {
      toSolidImport: true,
      toSolidRoute: true,
    });
    expect(code).toMatchInlineSnapshot(`
      "import { $route } from "dreamkit/solid";
      import { s } from "dreamkit";
      const _selfRoute = $route.params({
        user: s.string()
      });
      export const route = _selfRoute.createRouteDefinition();
      export default _selfRoute.create(function ({}) {});"
    `);
  });
  it("transform default function", () => {
    const inCode = `import { $route, s, useRoute } from "dreamkit";
    export const route = $route
      .params({ user: s.string() });
    export default function() { useRoute(route); };
    `;
    const { code } = transformAndGenerate(inCode, {
      toSolidImport: true,
      toSolidRoute: true,
    });
    expect(code).toMatchInlineSnapshot(`
      "import { useRoute } from "dreamkit/solid";
      import { $route } from "dreamkit/solid";
      import { s } from "dreamkit";
      const _selfRoute = $route.params({
        user: s.string()
      });
      export const route = _selfRoute.createRouteDefinition();
      export default _selfRoute.create(function () {
        useRoute(_selfRoute);
      });
      ;"
    `);
  });
});
