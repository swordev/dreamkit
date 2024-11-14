// title: Simple server execution
import { $api, $route } from "dreamkit";
import { createResource } from "solid-js";

export const pid = $api.create(() => process.pid);

export default $route
  .api({ pid })
  .path("/")
  .create(({ api }) => {
    const [pid] = createResource(api.pid);
    return <p>Process ID: {pid()}</p>;
  });
