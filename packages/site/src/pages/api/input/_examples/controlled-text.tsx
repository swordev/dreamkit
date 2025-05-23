// title: Controlled text
import { $route, Input } from "dreamkit";
import { createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [name, setName] = createSignal("");
  return (
    <>
      <p>value: {name()}</p>
      <Input value={name} onChange={(value) => setName(value.toUpperCase())} />
    </>
  );
});
