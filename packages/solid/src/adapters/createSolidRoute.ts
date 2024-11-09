import { useRouteParams } from "../utils/router.js";
import { isRoute, $route } from "@dreamkit/app";
import { Title } from "@solidjs/meta";
import { useNavigate, type useLocation, type useParams } from "@solidjs/router";
import { createComponent } from "solid-js";

export function createSolidRoute(
  input: unknown,
  deps: {
    useParams: typeof useParams;
    useLocation: typeof useLocation;
  },
) {
  return isRoute(input)
    ? $route["clone"]({
        ...input.$options,
        createComponent(options, component) {
          let result: [any, any];
          const props = options.params?.props || {};
          try {
            result = useRouteParams.bind(deps)(props);
          } catch (error) {
            const onParamsError = input.$options.onParamsError;
            if (!onParamsError) throw error;
            if ("value" in onParamsError) {
              result = useRouteParams.bind(deps)(props, onParamsError.value);
            } else if ("redirect" in onParamsError) {
              const nav = useNavigate();
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
            createComponent(component, {
              params,
              setParams,
            } as any),
          ];
        },
      }).create(input.$options.component!)
    : input;
}
