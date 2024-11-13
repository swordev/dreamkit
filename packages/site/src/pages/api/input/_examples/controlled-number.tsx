// title: Controlled number
import { $route, Input } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [number, setNumber] = createSignal<number | null>(0);
  createEffect(() => console.log("number", number()));
  return (
    <Input
      type="number"
      value={number}
      onChange={(value) => {
        if (value === null || value < 10) setNumber(value);
      }}
    />
  );
});
