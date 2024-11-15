// title: Basic usage
import { $route, context, IocClass } from "dreamkit";

abstract class ThirdModel {
  abstract fetch(): string;
}

class MyModel extends IocClass({ ThirdModel }) {
  fetch() {
    return this.thirdModel.fetch();
  }
}

export default $route.path("/").create(() => {
  class ThirdModelImpl extends ThirdModel {
    override fetch() {
      return "resolved";
    }
  }
  const manualModel = new MyModel({ thirdModel: new ThirdModelImpl() });
  const autoModel = context
    .fork()
    .register(ThirdModel, { value: new ThirdModelImpl() })
    .resolve(MyModel);
  return (
    <>
      <p>{manualModel.fetch()}</p>
      <p>{autoModel.fetch()}</p>
    </>
  );
});
