// title: Optional
import { IocClass, iocParam, ServiceClass } from "dreamkit";

class Child extends IocClass({}) {
  process(value: string) {
    return value;
  }
}

class Parent extends IocClass({ child: iocParam(Child).optional() }) {
  process(value: string) {
    return this.child?.process(value);
  }
}

export class TestService extends ServiceClass({}) {
  onStart() {
    const value1 = new Parent({}).process("hello");
    const value2 = new Parent({
      child: {
        process(value) {
          return value.toUpperCase();
        },
      },
    }).process("world");
    console.log([value1, value2]); // [undefined, "WORLD"]
  }
}
