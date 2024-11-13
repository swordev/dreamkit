type OnCall = (path: string[], args: unknown[]) => any;
type OnGet = (path: string[], name: string, next: () => any) => any;
type Options = { onCall: OnCall; onGet?: OnGet };

export function createProxy(onCall: OnCall): any;
export function createProxy(options: { onCall: OnCall; onGet?: OnGet }): any;
export function createProxy(input: OnCall | Options) {
  const options: Options =
    typeof input === "function"
      ? {
          onCall: input,
        }
      : input;
  const get = (path: string[]): any =>
    new Proxy(() => {}, {
      get: (_, name) => {
        const iterate = () => get([...path, name.toString()]);
        if (options.onGet) {
          return options.onGet(path, name.toString(), iterate);
        } else {
          return iterate();
        }
      },
      apply: (_, __, args) => options.onCall(path, args),
    });
  return get([]);
}
