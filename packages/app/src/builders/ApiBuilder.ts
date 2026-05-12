import { Func, FuncBuilder, FuncData } from "@dreamkit/func";
import { createIsKind, kindTag } from "@dreamkit/kind";

const tag = "@dreamkit/ApiBuilder";
export const isApiBuilder = createIsKind<Func>(tag);

export class ApiBuilder<T extends FuncData> extends FuncBuilder<T> {
  protected static [kindTag] = tag;
}
