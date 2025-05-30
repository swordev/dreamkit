import type { ActionResult } from "../primitives/createAction.js";
import { ActionManagerContext } from "../primitives/useActionManager.js";
import { createComponent, createMemo, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

export type ActionCollectorFallback = (props: {
  action: ActionResult<any>;
  error: Error;
}) => JSXElement;

const memo = (fn: () => any) => (isServer ? fn() : createMemo(() => fn()));

export function ActionErrorBoundary(props: {
  children: JSXElement;
  fallback: ActionCollectorFallback;
}) {
  const [actions, setActions] = createStore<ActionResult<any>[]>([]);
  const actionWithError = createMemo(() =>
    actions
      .filter((action) => !action.isErrorUsed)
      .find((action) => action.ref.errorWithoutUsing),
  );

  const Fallback: ActionCollectorFallback = (inProps) =>
    createComponent(props.fallback, inProps);

  return createComponent(ActionManagerContext.Provider, {
    value: {
      add(action) {
        setActions([...actions, action]);
      },
      remove(action) {
        setActions(actions.filter((subject) => action !== subject));
      },
    },
    get children() {
      return [
        memo(() => props.children),
        createComponent(Show, {
          keyed: true,
          get when() {
            return actionWithError();
          },
          children: ((action: ActionResult<any>) => {
            return createComponent(Fallback, {
              action,
              get error() {
                return action.ref.errorWithoutUsing;
              },
            });
          }) as any,
        }),
      ];
    },
  });
}
