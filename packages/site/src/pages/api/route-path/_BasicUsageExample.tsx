import { routePath } from "dreamkit";

export default function Users() {
  // @ts-expect-error
  return <a href={routePath("/users/:id", { id: 1 })}>User 1</a>;
}
