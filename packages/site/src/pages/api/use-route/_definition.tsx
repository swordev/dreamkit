import type { Route } from "dreamkit";

declare module "dreamkit/definitions" {
  const useRoute: (route: Route) => {
    setParams: (params: object) => void;
    params: object;
  };
}
