// title: Controlled text
import { $route, Input } from "dreamkit";
import { createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [name, setName] = createSignal("");
  return <Input value={name()} onChange={setName} />;
});
