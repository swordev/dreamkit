import { useActionManager } from "./useActionManager.js";
import { TryPick } from "@dreamkit/utils/ts.js";
import { batch, createSignal, onCleanup, onMount, untrack } from "solid-js";

export type ActionState = "idle" | "running" | "success" | "error";

export type StatedActionResult<T extends (...args: any[]) => any> =
  | {
      readonly state: "idle";
      readonly running: false;
      readonly args: undefined;
      readonly result: undefined;
      readonly error: undefined;
    }
  | {
      readonly state: "running";
      readonly running: true;
      readonly args: Parameters<T>;
      readonly result: undefined;
      readonly error: undefined;
    }
  | {
      readonly state: "success";
      readonly running: false;
      readonly args: Parameters<T>;
      readonly result: Awaited<ReturnType<T>>;
      readonly error: undefined;
    }
  | {
      readonly state: "error";
      readonly running: false;
      readonly args: Parameters<T>;
      readonly result: undefined;
      readonly error: Error;
    };

type IsAny<T> = 0 extends 1 & T ? true : false;

export type ActionResult<
  T extends (...args: any[]) => any,
  SourceT extends (...args: any[]) => any = T,
> = {
  (...args: Parameters<T>): void;
  with: {
    (
      input: () => IsAny<T> extends true ? any : Parameters<T>[0],
    ): ActionResult<() => ReturnType<T>, SourceT>;
    (...args: Parameters<T>): ActionResult<() => ReturnType<T>>;
  };
  readonly id: number;
  readonly isErrorUsed: boolean;
  readonly canRetry: boolean;
  clear: () => void;
  abort: () => void;
  retry: () => void;
  ref: {
    readonly errorWithoutUsing: Error;
  };
} & TryPick<SourceT, "title" | "params"> &
  StatedActionResult<T>;

export function createAction<T extends (...args: any[]) => any>(
  cb: T,
): ActionResult<T> {
  const context = useActionManager();
  const queue = new Map<number, { abortController: AbortController }>();
  const asyncAction = async (args: any[], abortController: AbortController) =>
    cb.bind({ abortController })(...args);
  const [id, setId] = createSignal(0);
  const [args, setArgs] = createSignal<any>([]);
  const [result, setResult] = createSignal();
  const [state, setState] = createSignal<ActionState>("idle");
  const [usedError, setUsedError] = createSignal(false);
  const [error, setError] = createSignal<Error>();
  const running = () => state() === "running";
  const clear = () => set("idle", undefined, undefined);
  const set = (state: ActionState, result: any, error: Error | undefined) => {
    batch(() => {
      setResult(result);
      setError(error);
      setState(state);
      if (state === "idle") setArgs([]);
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

  const [lastArgs, setLastArgs] = createSignal<any[]>();
  const canRetry = () => !!lastArgs();
  const retry = () => {
    const args = untrack(lastArgs);
    return action(...(args || []));
  };

  const action = (...args: any[]) => {
    if (untrack(running)) return;
    const selfId = untrack(id) + 1;
    const item = { abortController: new AbortController() };
    const next = () => queue.delete(selfId);
    queue.set(selfId, item);
    batch(() => {
      setId(selfId);
      setArgs(args);
      setState("running");
    });
    setLastArgs(args);
    asyncAction(args, item.abortController)
      .then((result) => {
        if (!next()) return;
        set("success", result, undefined);
      })
      .catch((error) => {
        if (!next()) return;
        console.error(error);
        set("error", undefined, error);
      });
  };
  Object.defineProperties(action, {
    ref: {
      value: {
        get errorWithoutUsing() {
          return error();
        },
      },
    },
    id: { get: id },
    args: { get: args },
    result: { get: result },
    running: { get: running },
    error: {
      get: () => {
        setUsedError(true);
        return error();
      },
    },
    isErrorUsed: { get: usedError },
    state: { get: state },
    clear: { value: clear },
    abort: { value: abort },
    title: { get: () => (cb as any).title },
    params: { get: () => (cb as any).params },
    retry: { value: retry },
    canRetry: { get: canRetry },
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

  if (context) {
    onMount(() => context?.add(action as any));
    onCleanup(() => context!.remove(action as any));
  }

  return action as any;
}
