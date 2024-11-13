import { $route } from "dreamkit";

export const homeRoute = $route.path("/").create(() => {
  return <>hello world</>;
});
