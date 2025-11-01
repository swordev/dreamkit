import { Func, FuncBuilder, FuncData } from "@dreamkit/func";
import { createKind } from "@dreamkit/kind";

export const [kindApi, isApi] = createKind<Func>("@dreamkit/app/api");

export const [kindApiBuilder, isApiBuilder] = createKind<FuncBuilder>(
  "@dreamkit/ApiBuilder",
);

export class ApiBuilder<T extends FuncData> extends FuncBuilder<T> {
  static {
    kindApiBuilder(this);
  }
}
