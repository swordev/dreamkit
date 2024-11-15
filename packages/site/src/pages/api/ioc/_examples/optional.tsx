// title: Optional
import { context, IocClass, iocParam, ServiceClass } from "dreamkit";

class StringModel {
  toUpperCase(value: string) {
    return value.toUpperCase();
  }
}

class MyModel extends IocClass({
  string: iocParam(StringModel).optional(),
}) {
  toUpperCase(value: string) {
    return this.string?.toUpperCase(value);
  }
}

export class MyService extends ServiceClass({}) {
  onStart() {
    const model1 = new MyModel({});
    const model2 = new MyModel({
      string: {
        toUpperCase(value) {
          return value.toUpperCase();
        },
      },
    });
    const model3 = context
      .fork()
      .register(StringModel, { useFactory: () => new StringModel() })
      .resolve(MyModel);

    console.log({
      model1: model1.toUpperCase("text"), // undefined
      model2: model2.toUpperCase("text"), // "TEXT"
      model3: model3.toUpperCase("text"), // "TEXT"
    });
  }
}
