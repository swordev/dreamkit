import { useRouteParams } from "../utils/router.js";
import { RouteBuilder, RouteData, RouteProps } from "@dreamkit/app";
import { useLocation, useParams } from "@solidjs/router";

export function useRoute<T extends RouteData>(
  route: RouteBuilder<T>,
  deps?: {
    useParams: typeof useParams;
    useLocation: typeof useLocation;
  },
): RouteProps<T> {
  const [params, setParams] = useRouteParams.bind(deps!)(
    route.options.params?.props || {},
  );
  return { params, setParams } as any;
}
