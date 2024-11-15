import {
  addImports,
  createCallChains,
  createConst,
  defineTransform,
  getFirstChain,
  parseCallsChain,
} from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { replaceImportSpec } from "./replace-import-spec.js";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export const toSolidServerAction = defineTransform({
  onlyIf: (code) => code.includes("$api") && code.includes("dreamkit"),
  run: (ast) => {
    let apiId: string | undefined;
    let changes = replaceImportSpec(ast, {
      spec: { $api: "$serverApi" },
      source: "dreamkit",
      newSource: "dreamkit/adapters/solid.js",
      onRenameSpec(prev, next) {
        apiId = next;
      },
    });

    if (apiId) {
      let clientApiLoc: t.SourceLocation[] = [];
      traverse(ast, {
        Program(programPath) {
          const binds = programPath.scope.bindings[apiId!];
          programPath.traverse;
          binds.referencePaths.forEach((path) => {
            if (path.node.loc) clientApiLoc.push(path.node.loc);
          });
          programPath.traverse({
            VariableDeclaration(path) {
              const [dec] = path.node.declarations;
              const init = dec.init;
              if (
                path.parent.type === "Program" &&
                dec.id.type === "Identifier" &&
                init?.type === "CallExpression"
              ) {
                const first = getFirstChain(init);
                if (clientApiLoc.includes(first?.value.object.loc!)) {
                  changes++;
                  const replaced = createServerAction(
                    programPath,
                    dec.id.name,
                    init,
                    false,
                  );
                  const index = programPath.node.body.findIndex(
                    (node) => node === path.node,
                  );
                  programPath.node.body.splice(index, 1, ...replaced);
                }
              }
            },
            ExportNamedDeclaration(path) {
              if (path.node.declaration) {
                if (path.node.declaration.type === "VariableDeclaration") {
                  const [dec] = path.node.declaration.declarations;
                  const init = dec.init;
                  if (
                    dec.id.type === "Identifier" &&
                    init?.type === "CallExpression"
                  ) {
                    const first = getFirstChain(init);
                    if (clientApiLoc.includes(first?.value.object.loc!)) {
                      changes++;
                      const replaced = createServerAction(
                        programPath,
                        dec.id.name,
                        init,
                        true,
                      );
                      const index = programPath.node.body.findIndex(
                        (node) => node === path.node,
                      );
                      programPath.node.body.splice(index, 1, ...replaced);
                    }
                  }
                }
              }
            },
          });
        },
      });
    }
    return changes;
  },
});

function createServerAction(
  program: NodePath<t.Program>,
  name: string,
  call: t.CallExpression,
  exported = false,
) {
  const commonApi = program.scope.generateUid(`base_${name}`);
  const originalFunc = program.scope.generateUid(`original_${name}`);
  const serverApi = program.scope.generateUid(`server_${name}`);
  const chain = parseCallsChain(call);

  const serverMethods = ["self", "create"];
  return [
    // const baseFetchData = $api.params({});
    createConst(
      commonApi,
      createCallChains({
        ...chain,
        calls: chain.calls.filter(({ name }) => !serverMethods.includes(name)),
      }),
    ),
    t.variableDeclaration("let", [
      t.variableDeclarator(
        t.identifier(name),
        t.arrowFunctionExpression(
          [t.identifier("params")],
          t.blockStatement(
            [
              // const serverApi = $serverApi.clone(baseFetchData.options).self({}).create(() => {})
              createConst(
                serverApi,

                createCallChains({
                  ...chain,
                  calls: [
                    {
                      name: "clone",
                      arguments: [
                        t.memberExpression(
                          t.identifier(commonApi),
                          t.identifier("options"),
                        ),
                      ],
                    },
                    ...chain.calls.filter(({ name }) =>
                      serverMethods.includes(name),
                    ),
                  ],
                }),
              ),
              // return await serverApi(params);
              t.returnStatement(
                t.awaitExpression(
                  t.callExpression(t.identifier(serverApi), [
                    t.identifier("params"),
                  ]),
                ),
              ),
            ],
            [t.directive(t.directiveLiteral("use server"))],
          ),
          true,
        ),
      ),
    ]),
    // const originalFetchData = fetchData;
    createConst(originalFunc, t.identifier(name)),
    // fetchData = baseFetchData.create(originalFetchData);
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.identifier(name),
        createCallChains({
          rootName: commonApi,
          calls: [
            {
              name: "clone",
              arguments: [
                t.objectExpression([
                  t.objectProperty(t.identifier("context"), t.nullLiteral()),
                ]),
              ],
            },
            {
              name: "create",
              arguments: [t.identifier(originalFunc)],
            },
          ],
        }),
      ),
    ),
    exported &&
      t.exportNamedDeclaration(null, [
        t.exportSpecifier(t.identifier(name), t.identifier(name)),
      ]),
  ].filter((v) => !!v);
}
