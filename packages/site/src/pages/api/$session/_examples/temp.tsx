// title: Temporary session
import {
  $api,
  $route,
  $session,
  createAction,
  iocParam,
  s,
  SessionHandler,
} from "dreamkit";
import { createEffect, createSignal, onCleanup } from "solid-js";

class TempSession extends $session
  .name("temp")
  .params({ date: s.number() })
  .timelife({ seconds: 5 })
  .create() {}

const create = $api
  .title("Create")
  .self({ SessionHandler })
  .create(async function () {
    await this.sessionHandler.set(TempSession, { date: Date.now() });
  });

const check = $api
  .title("Check")
  .self({ TempSession: iocParam(TempSession).optional() })
  .create(function () {
    return !!this.tempSession;
  });

export default $route
  .api({ create, check })
  .path("/")
  .create(({ api }) => {
    const [cookies, setCookies] = createSignal("");
    const [counter, setCounter] = createSignal<number>();
    const create = createAction(api.create);
    const check = createAction(api.check);
    let interval: any;
    const startCounter = () => {
      setCounter(5);
      check();
      clearInterval(interval);
      interval = setInterval(() => {
        if (counter() === 0) return clearInterval(interval);
        setCounter(counter()! - 1);
        check();
      }, 1000);
    };
    createEffect(() => {
      create.state === "success" && startCounter();
    });
    createEffect(() => {
      check.state === "success" && setCookies(document.cookie);
    });
    onCleanup(() => clearInterval(interval));
    return (
      <>
        <p>timeleft: {counter()}</p>
        <p>cookies: {cookies()}</p>
        <button
          onClick={create}
          disabled={create.running}
          children={create.title}
        />
        <button
          onClick={check}
          disabled={check.running}
          children={
            <>
              {check.title}: {JSON.stringify(check.result)}
            </>
          }
        />
      </>
    );
  });
