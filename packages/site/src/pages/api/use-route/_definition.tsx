import type { Route } from "dreamkit";

declare const useRoute: (route: Route) => {
  setParams: (params: object) => void;
  params: object;
};
