import { useRouteParams } from "../adapters/utils.js";
import { RouteBuilder, RouteData, RouteProps } from "@dreamkit/app";

export function useRoute<T extends RouteData>(
  route: RouteBuilder<T>,
): RouteProps<T> {
  const [params, setParams] = useRouteParams(route.options.params?.props || {});
  return { params, setParams } as any;
}
