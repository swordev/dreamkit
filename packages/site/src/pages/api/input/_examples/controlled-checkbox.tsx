// title: Controlled number
import { $route, Input } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [bool, setBool] = createSignal(false);
  createEffect(() => console.log("bool", bool()));
  return <Input type="checkbox" value={bool} onChange={setBool} />;
});
