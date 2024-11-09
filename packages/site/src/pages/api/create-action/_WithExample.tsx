import { createAction, Input } from "dreamkit";
import { createSignal } from "solid-js";

function remove(_key: string) {
  return true;
}

export default function App() {
  const [id, setKey] = createSignal("");
  const $remove = createAction(remove).with(() => id());
  return (
    <>
      <Input value={id} onChange={setKey} />
      <button onClick={$remove} disabled={$remove.running}>
        Remove
      </button>
    </>
  );
}
