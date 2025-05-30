// title: Error boundary
import { $api, $route, ActionErrorBoundary, createAction } from "dreamkit";

export const start = $api.title("Start").create(async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  throw new Error("Custom error");
});

export default $route
  .path("/")
  .api({ start })
  .create(({ api }) => {
    function Action1() {
      const start = createAction(api.start);
      return (
        <>
          <button
            onClick={start}
            disabled={start.running}
            children={start.title}
          />
          <p>{start.state}</p>
        </>
      );
    }

    function Action2() {
      const start = createAction(api.start);
      return (
        <>
          <button
            onClick={start}
            disabled={start.running}
            children={start.title}
          />
          <p>
            {start.state} ({start.error?.message})
          </p>
        </>
      );
    }

    return (
      <ActionErrorBoundary
        fallback={(props) => (
          <dialog
            open
            onClose={props.action.clear}
            ref={(dialog) => {
              dialog
                .querySelector("[aria-label=close]")
                ?.addEventListener("click", () => dialog.close());
            }}
          >
            Error: {props.error?.message} <button aria-label="close">X</button>
          </dialog>
        )}
      >
        <Action1 />
        <Action2 />
      </ActionErrorBoundary>
    );
  });
