import type { Route } from "dreamkit";

declare module "dreamkit/definitions" {
  const useRoute: (route: Route) => {
    setParams: (params: object) => void;
    params: object;
    api: Record<string, Function>;
    data: any;
  };
}
