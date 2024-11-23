// title: Basic usage
import { $api, $route, $service, AppContext, kind } from "dreamkit";
import { createResource } from "solid-js";

class CounterModel {
  static {
    // [important] save a kind to not break `instanceof` during development
    kind(this, "CounterModel");
  }
  value = 0;
}

export class CounterService extends $service.self({ AppContext }).create() {
  onStart() {
    const counter = new CounterModel();
    const interval = setInterval(() => {
      counter.value += 1;
    }, 1000);
    this.appContext.register(CounterModel, { value: counter });
    return () => {
      this.appContext.unregister(CounterModel);
      clearInterval(interval);
    };
  }
}

const fetchCounterValue = $api
  .self({
    CounterModel,
  })
  .create(function () {
    return this.counterModel.value;
  });

export default $route
  .path("/")
  .api({ fetchCounterValue })
  .create(({ api }) => {
    const [counterValue, { refetch }] = createResource(api.fetchCounterValue);
    return (
      <>
        <p>value: {counterValue.latest}</p>
        <p>
          <button onClick={refetch}>refetch</button>
        </p>
      </>
    );
  });
