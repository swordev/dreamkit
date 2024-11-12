import { ObjectTypeProps, s } from "@dreamkit/schema";
import { createSearchParamsRecord } from "@dreamkit/utils/search-params.js";

export function castParams(
  props: ObjectTypeProps,
  pathParams: Record<string, any>,
  searchParams: string,
): any {
  return s
    .object(props)
    .cast({ ...createSearchParamsRecord(searchParams), ...pathParams });
}
