import { $route } from "dreamkit";

export default $route.path("/").create(() => {
  return <>Hello World</>;
});
