// title: Predefined params
import { createAction, Input } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

function remove(key: string) {
  console.log("key removed", key);
}

export default function App() {
  const [id, setKey] = createSignal("");
  const $remove = createAction(remove).with(() => id());
  createEffect(() => $remove.state === "success" && $remove.clear());
  return (
    <>
      <Input value={id} onChange={setKey} />
      <button onClick={$remove} disabled={$remove.running}>
        Remove
      </button>
    </>
  );
}
