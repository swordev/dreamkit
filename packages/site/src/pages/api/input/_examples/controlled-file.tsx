// title: Controlled file
import { $route, Input } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

export default $route.path("/").create(() => {
  const [file, setFile] = createSignal<File | null>(new File([], "file.txt"));
  createEffect(() => console.log("file", file()));
  return (
    <>
      <p>value: {file()?.name}</p>
      <Input type="file" value={file} onChange={setFile} />
    </>
  );
});
