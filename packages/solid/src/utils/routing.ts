import { useRouteDeps } from "../contexts/RouteDeps.js";
import { castParams } from "./params.js";
import { ObjectTypeProps, InferObjectProps, s } from "@dreamkit/schema";
import {
  createJsonSearchParams,
  prettySearchParams,
} from "@dreamkit/utils/search-params.js";
import type { NavigateOptions } from "@solidjs/router";
import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

export function usePathParams<P extends ObjectTypeProps>(
  props: P,
): InferObjectProps<P> {
  const { useParams } = useRouteDeps();
  const params = useParams() as any;
  return s.object(props).cast(params) as any;
}

export type SetSearchParams<P extends ObjectTypeProps> = (
  params: InferObjectProps<P>,
  options?: Partial<NavigateOptions>,
) => void;

export function useRouteParams<P extends ObjectTypeProps>(
  props: P,
  initialParams?: InferObjectProps<P>,
): [InferObjectProps<P>, (params: P) => void] {
  const { useLocation } = useRouteDeps();
  const routeParams = usePathParams(props);
  const location = useLocation();
  if (!initialParams)
    initialParams = castParams(props, routeParams, location.search);
  const assertParams = (value: any) => s.object(props).assert(value);
  assertParams(initialParams);
  const [params, setParamsState] = createStore(initialParams);
  const setParams: SetSearchParams<P> = (params: any) => {
    assertParams(params);
    const searchString = createJsonSearchParams(params).toString();
    const path = prettySearchParams(
      location.pathname + (searchString.length ? `?${searchString}` : ""),
    );
    history.pushState({}, "", path);
    setParamsState(params);
  };

  if (!isServer) {
    const onNewSearch = () => {
      const newParams = castParams(props, routeParams, location.search);
      for (const key in params) {
        if (!(key in newParams)) {
          newParams[key] = undefined;
        }
      }
      setParamsState(newParams);
    };
    addEventListener("popstate", onNewSearch);
    onCleanup(() => removeEventListener("popstate", onNewSearch));
  }
  return [params, setParams] as any;
}
