import { transformAndGenerate } from "../../src/utils/transform.js";
import { describe, it, expect } from "vitest";

describe("toSolidServerAction", () => {
  it("transform export declaration", () => {
    const inCode = `
      import { $api } from "dreamkit";
      export const login = $api.params({}).create(() => {})
    `;
    const { code } = transformAndGenerate(inCode, {
      toSolidServerAction: true,
    });
    expect(code).toMatchInlineSnapshot(`
      "import { $serverApi as _$serverApi } from "dreamkit/adapters/solid-start/import.js";
      const _base_login = _$serverApi.params({});
      let login = async params => {
        "use server";

        const _server_login = _$serverApi.clone(_base_login.options).create(() => {});
        return await _server_login(params);
      };
      const _original_login = login;
      login = _base_login.clone({
        context: null
      }).create(_original_login);
      export { login };"
    `);
  });
  it("transform variable declaration", () => {
    const inCode = `
      import { $api } from "dreamkit";
      const login = $api.params({}).create(() => {})
    `;
    const { code } = transformAndGenerate(inCode, {
      toSolidServerAction: true,
    });
    expect(code).toMatchInlineSnapshot(`
      "import { $serverApi as _$serverApi } from "dreamkit/adapters/solid-start/import.js";
      const _base_login = _$serverApi.params({});
      let login = async params => {
        "use server";

        const _server_login = _$serverApi.clone(_base_login.options).create(() => {});
        return await _server_login(params);
      };
      const _original_login = login;
      login = _base_login.clone({
        context: null
      }).create(_original_login);"
    `);
  });
});
