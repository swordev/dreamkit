declare module "dreamkit/definitions" {
  const createAction: (cb: (...args: any[]) => any) => {
    with: {
      (input: () => any): any;
      (...args: any[]): any;
    };
    readonly id: number;
    readonly result: any | undefined;
    readonly running: boolean;
    readonly error: Error | undefined;
    readonly state: "idle" | "running" | "success" | "error";
    clear: () => void;
    abort: () => void;
  };
}
