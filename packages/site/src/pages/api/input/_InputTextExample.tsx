import { Input } from "dreamkit";
import { createSignal } from "solid-js";

export default function InputTextExample() {
  const [name, setName] = createSignal("");
  return <Input value={name()} onChange={setName} />;
}
