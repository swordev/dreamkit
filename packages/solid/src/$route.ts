import { RouteDepsContext } from "./contexts/RouteDeps.js";
import { useRouteParams } from "./utils/routing.js";
import { $route as $baseRoute } from "@dreamkit/app";
import { ObjectType, Type } from "@dreamkit/schema";
import { Title } from "@solidjs/meta";
import type {
  RouteDefinition,
  useLocation,
  useNavigate,
  useParams,
} from "@solidjs/router";
import { createComponent } from "solid-js";

export const $route = /*#__PURE__*/ $baseRoute["clone"]({
  routeDefinition: (options) => {
    const def = {
      ...(options.path && {
        path: options.path,
      }),
      ...(options.params && {
        matchFilters: Object.entries(
          (options.params as ObjectType).props,
        ).reduce(
          (filters, [name, prop]) => {
            filters[name] = (input) => {
              const casted = (prop as Type).cast(input);
              return !(prop as Type).validate(casted).length;
            };
            return filters;
          },
          {} as Record<string, (input: any) => boolean>,
        ),
      }),
    } as RouteDefinition;
    return def;
  },
  createComponent: (options) => {
    const deps = (options as any).deps as any as {
      useLocation: typeof useLocation;
      useNavigate: typeof useNavigate;
      useParams: typeof useParams;
    };
    return createComponent(RouteDepsContext.Provider, {
      value: deps,
      get children() {
        return createComponent(Root, {});
      },
    });
    function Root() {
      let result: [any, any];
      const props = options.params?.props || {};
      try {
        result = useRouteParams(props);
      } catch (error) {
        const onParamsError = options.onParamsError;
        if (!onParamsError) throw error;
        if ("value" in onParamsError) {
          result = useRouteParams(props, onParamsError.value);
        } else if ("redirect" in onParamsError) {
          const nav = deps.useNavigate();
          nav(onParamsError.redirect);
          return;
        } else {
          throw error;
        }
      }
      const [params, setParams] = result;
      return [
        ...(options.title
          ? [
              createComponent(Title, {
                get children() {
                  return options.title;
                },
              }),
            ]
          : []),
        createComponent(options.component!, {
          params,
          setParams,
          api: options.api,
        } as any),
      ];
    }
  },
});
