import { toSolidRoute } from "../../src/transforms/to-solid-route.js";
import { parseFile } from "../../src/utils/ast.js";
import { generator } from "../../src/utils/babel.js";
import { describe, it, expect } from "vitest";

describe("toSolidRouter", () => {
  it("transform default call expression", () => {
    const inCode = `import { $route, s } from "dreamkit";
    export default $route
      .self({ login })
      .params({ user: s.string() })
      .create(function ({ api }) {});
    `;
    const ast = parseFile(inCode);
    toSolidRoute(ast);
    const { code } = generator(ast);
    expect(code).toMatchInlineSnapshot(`
      "import { useLocation as _useLocation, useParams as _useParams } from "@solidjs/router";
      import { createSolidRoute as _createSolidRoute, createSolidRouteConfig as _createSolidRouteConfig } from "dreamkit/adapters/solid.js";
      import { $route, s } from "dreamkit";
      const _selfRoute = $route.self({
        login
      }).params({
        user: s.string()
      });
      export const route = _createSolidRouteConfig(_selfRoute);
      export default _createSolidRoute(_selfRoute.create(function ({
        api
      }) {}), {
        useLocation: _useLocation,
        useParams: _useParams
      });"
    `);
  });
  it("transform default identifier", () => {
    const inCode = `import { $route, s } from "dreamkit";
    const loginRoute = $route
      .params({ user: s.string() })
      .create(function ({ api }) {});
    export default loginRoute;
    `;
    const ast = parseFile(inCode);
    toSolidRoute(ast);
    const { code } = generator(ast);
    expect(code).toMatchInlineSnapshot(`
      "import { useLocation as _useLocation, useParams as _useParams } from "@solidjs/router";
      import { createSolidRoute as _createSolidRoute, createSolidRouteConfig as _createSolidRouteConfig } from "dreamkit/adapters/solid.js";
      import { $route, s } from "dreamkit";
      const loginRoute = $route.params({
        user: s.string()
      }).create(function ({
        api
      }) {});
      export const route = _createSolidRouteConfig(loginRoute);
      export default _createSolidRoute(loginRoute, {
        useLocation: _useLocation,
        useParams: _useParams
      });"
    `);
  });
});
