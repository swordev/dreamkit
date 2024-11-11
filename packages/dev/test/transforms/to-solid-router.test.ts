import { toSolidRoute } from "../../src/transforms/to-solid-route.js";
import { parseFile } from "../../src/utils/ast.js";
import { generator } from "../../src/utils/babel.js";
import { describe, it, expect } from "vitest";

describe("toSolidRouter", () => {
  it("transform default call expression", () => {
    const inCode = `import { $route, s } from "dreamkit";
    export default $route
      .params({ user: s.string() })
      .create(function ({ }) {});
    `;
    const ast = parseFile(inCode);
    toSolidRoute(ast);
    const { code } = generator(ast);
    expect(code).toMatchInlineSnapshot(`
      "import * as _deps from "dreamkit/adapters/solid-deps.js";
      import { $route } from "dreamkit/adapters/solid.js";
      import { s } from "dreamkit";
      const _selfRoute = $route.params({
        user: s.string()
      });
      export const route = _selfRoute.createRouteDefinition();
      export default _selfRoute.clone({
        deps: _deps
      }).create(function ({}) {});"
    `);
  });
  it("transform default function", () => {
    const inCode = `import { $route, s, useRoute } from "dreamkit";
    export const route = $route
      .params({ user: s.string() });
    export default function() { useRoute(route); };
    `;
    const ast = parseFile(inCode);
    toSolidRoute(ast);
    const { code } = generator(ast);
    expect(code).toMatchInlineSnapshot(`
      "import * as _deps from "dreamkit/adapters/solid-deps.js";
      import { $route } from "dreamkit/adapters/solid.js";
      import { s, useRoute } from "dreamkit";
      const _selfRoute = $route.params({
        user: s.string()
      });
      export const route = _selfRoute.createRouteDefinition();
      export default _selfRoute.clone({
        deps: _deps
      }).create(function () {
        useRoute(_selfRoute);
      });
      ;"
    `);
  });
});
