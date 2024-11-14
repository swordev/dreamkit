import {
  createCallChains,
  parseCallsChain,
  parseCode,
  parseFile,
} from "../../src/utils/ast.js";
import { generator, traverse } from "../../src/utils/babel.js";
import * as t from "@babel/types";
import { describe, expect, it } from "vitest";

function parseCallExpression(code: string) {
  const ast = parseFile(code);
  let call: t.CallExpression | undefined;
  traverse(ast, {
    CallExpression(path) {
      if (!call) call = path.node;
    },
  });
  if (!call) throw new Error("No call expression found");
  return call;
}

describe("parseCallsChain", () => {
  it("return the names", () => {
    const ast = parseCallExpression("$api.params(1).create(2);");
    const chain = parseCallsChain(ast);
    expect(chain.rootName).toBe("$api");
    expect(chain.calls[0].name).toBe("params");
    expect(chain.calls[1].name).toBe("create");
  });
});

describe("createCallsChain", () => {
  it("return the names", () => {
    const call = parseCallExpression("$api.params(1).create(2);");
    const chain = parseCallsChain(call);
    chain.rootName = `${chain.rootName}_0`;
    chain.calls = chain.calls.map((call, index) => ({
      ...call,
      name: `${call.name}_${index + 1}`,
    }));
    const alteredChain = createCallChains(chain);
    expect(generator(alteredChain).code).toBe("$api_0.params_1(1).create_2(2)");
  });
});
