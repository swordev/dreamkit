import { ObjectTypeProps, InferObjectProps, s } from "@dreamkit/schema";
import {
  createJsonSearchParams,
  createSearchParamsRecord,
  prettySearchParams,
} from "@dreamkit/utils/search-params.js";
import type {
  useParams as $useParams,
  NavigateOptions,
  useLocation,
} from "@solidjs/router";
import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

export function castRouteParams(
  props: ObjectTypeProps,
  pathParams: Record<string, any>,
  searchParams: string,
): any {
  return s
    .object(props)
    .cast({ ...createSearchParamsRecord(searchParams), ...pathParams });
}

export function usePathParams<P extends ObjectTypeProps>(
  this: { useParams: typeof $useParams },
  props: P,
): InferObjectProps<P> {
  const params = this.useParams() as any;
  return s.object(props).cast(params) as any;
}

export type SetSearchParams<P extends ObjectTypeProps> = (
  params: InferObjectProps<P>,
  options?: Partial<NavigateOptions>,
) => void;

export function useRouteParams<P extends ObjectTypeProps>(
  this: { useParams: typeof $useParams; useLocation: typeof useLocation },
  props: P,
  initialParams?: InferObjectProps<P>,
): [InferObjectProps<P>, (params: P) => void] {
  const routeParams = usePathParams.bind(this)(props);
  const location = this.useLocation();
  if (!initialParams)
    initialParams = castRouteParams(props, routeParams, location.search);
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
      const newParams = castRouteParams(props, routeParams, location.search);
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
