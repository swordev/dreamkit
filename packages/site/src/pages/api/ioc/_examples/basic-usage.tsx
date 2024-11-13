// title: Basic usage
import { context, IocClass, ServiceClass } from "dreamkit";

class Child extends IocClass({}) {
  process(value: string) {
    return value;
  }
}

class CustomChild extends Child {
  override process(value: string): string {
    return value.toUpperCase();
  }
}

class Parent extends IocClass({ Child }) {
  process(value: string) {
    return this.child.process(value);
  }
}

export class TestService extends ServiceClass({ Parent }) {
  onStart() {
    const value0 = this.parent.process("hello");
    const value1 = new Parent({ child: new Child() }).process("hello");
    const value2 = context
      .fork()
      .register(Child, { useClass: CustomChild })
      .resolve(Parent)
      .process("world");
    console.log([value0, value1, value2]); // ["hello", "WORLD"]
  }
}
