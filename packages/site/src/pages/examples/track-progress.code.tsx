import { $api, s } from "dreamkit";
import { createSignal } from "solid-js";
// @ts-expect-error
import { setTimeout } from "timers/promise";

const start = $api
  // @ts-expect-error
  .params({ onProgress: s.function([s.number()]) })
  .create(async ({ onProgress }) => {
    for (let progress = 1; progress < 100; progress += 10) {
      onProgress(progress);
      await setTimeout(250);
    }
    return { message: "Finished" };
  });

export default $route.path("/").create(() => {
  const [progress, onProgress] = createSignal(0);
  const action = createAction(start).with({ onProgress });
  return (
    <div>
      <button onClick={action} disabled={action.loading}>
        start
      </button>
      <p>Progress: {progress()}%</p>
      <p>Result: {JSON.stringify(action.result)}</p>
    </div>
  );
});
