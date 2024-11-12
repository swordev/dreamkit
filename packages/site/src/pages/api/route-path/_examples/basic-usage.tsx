// title: Basic usage
import { $route, routePath, s } from "dreamkit";

export const userRotue = $route
  .params({ id: s.number() })
  .path(({ id }) => `/users/${id}`)
  .create(({ params }) => <>{params.id}</>);

export default $route.path("/").create(() => {
  // @ts-expect-error
  return <a href={routePath("/users/:id", { id: 1 })}>User 1</a>;
});
