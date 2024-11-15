// title: Controlled checkbox
import { $route, Input } from "dreamkit";
import { createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [bool, setBool] = createSignal(false);
  return (
    <>
      <p>value: {JSON.stringify(bool())}</p>
      <Input type="checkbox" value={bool} onChange={setBool} />
    </>
  );
});
