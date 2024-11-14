import { Func, FuncBuilder, FuncData } from "@dreamkit/func";
import { createKind } from "@dreamkit/kind";

export const [kindApi, isApi] = createKind<Func>("@dreamkit/app/api");

export class ApiBuilder<T extends FuncData> extends FuncBuilder<T> {
  protected override onCreate(func: Func): Func {
    kindApi(func);
    return func;
  }
}
