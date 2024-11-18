import { useRouteDeps } from "../contexts/RouteDeps.js";
import { RouteBuilder, RouteData, RouteProps } from "@dreamkit/app";

export function useRoute<T extends RouteData>(
  _route: RouteBuilder<T>,
): RouteProps<T> {
  const { props } = useRouteDeps();
  return props as any;
}
