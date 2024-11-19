import type { TryPick } from "@dreamkit/utils/ts.js";
import { batch, createSignal, untrack } from "solid-js";

export type ActionState = "idle" | "running" | "success" | "error";

export type BaseActionResult<
  T extends (...args: any[]) => any,
  T2 extends (...args: any[]) => any = T,
> = {
  (...args: Parameters<T>): void;
  readonly id: number;
  readonly result: Awaited<ReturnType<T>> | undefined;
  readonly running: boolean;
  readonly error: Error | undefined;
  readonly state: ActionState;
  clear: () => void;
  abort: () => void;
} & TryPick<T2, "title" | "params">;

export type ActionResult<T extends (...args: any[]) => any> =
  BaseActionResult<T> & {
    with: {
      (input: () => Parameters<T>[0]): BaseActionResult<() => ReturnType<T>, T>;
      (...args: Parameters<T>): BaseActionResult<() => ReturnType<T>, T>;
    };
  };

export function createAction<T extends (...args: any[]) => any>(
  cb: T,
): ActionResult<T> {
  const queue = new Map<number, { abortController: AbortController }>();
  const asyncAction = async (args: any[], abortController: AbortController) =>
    await cb.bind({ abortController })(...args);
  const [id, setId] = createSignal(0);
  const [result, setResult] = createSignal();
  const [state, setState] = createSignal<ActionState>("idle");
  const [progress, setProgress] = createSignal(0);
  const [error, setError] = createSignal<Error>();
  const running = () => state() === "running";
  const clear = () => setResponse(undefined, undefined, "idle");
  const setResponse = (
    result: any,
    error: Error | undefined,
    state: ActionState,
  ) => {
    batch(() => {
      setResult(result);
      setError(error);
      setState(state);
    });
  };

  const abort = () => {
    const idValue = untrack(id);
    const item = queue.get(idValue);
    if (item) {
      item.abortController.abort();
      queue.delete(idValue);
    }
    clear();
  };

  const action = (...args: any[]) => {
    if (untrack(running)) return;
    const selfId = untrack(id) + 1;
    const item = { abortController: new AbortController() };
    const next = () => queue.delete(selfId);
    queue.set(selfId, item);
    batch(() => {
      setId(selfId);
      setState("running");
    });
    asyncAction(args, item.abortController)
      .then((result) => {
        if (!next()) return;
        setResponse(result, undefined, "success");
      })
      .catch((error) => {
        if (!next()) return;
        console.error(error);
        setResponse(undefined, error, "error");
      });
  };
  Object.defineProperties(action, {
    id: { get: id },
    result: { get: result },
    running: { get: running },
    error: { get: error },
    state: { get: state },
    clear: { value: clear },
    abort: { value: abort },
    title: { get: () => (cb as any).title },
    params: { get: () => (cb as any).params },
    with: {
      value: (...args: any[]) => {
        return new Proxy(action, {
          get: (target, p) => (target as any)[p],
          apply: (target, self) => {
            const targetArgs =
              args.length === 1 && typeof args[0] === "function"
                ? [args[0]()]
                : args;
            target.bind(self)(...targetArgs);
          },
        });
      },
    },
  });
  return action as any;
}
