// title: Controlled number
import { $route, Input } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [number, setNumber] = createSignal<number | null>(0);
  createEffect(() => console.log("number", number()));
  return (
    <>
      <p>value: {JSON.stringify(number())}</p>
      <Input
        type="number"
        value={number}
        onChange={(value) => {
          if (value === null || value < 100) setNumber(value);
        }}
      />
    </>
  );
});
