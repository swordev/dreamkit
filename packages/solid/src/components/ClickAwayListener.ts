import { createComponent, JSXElement, onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";

export function ClickAwayListener(props: {
  children?: JSXElement;
  onClick?: () => void;
}) {
  let element!: HTMLDivElement;
  const onClick = (event: Event) => {
    if (element && !element.contains(event.target as HTMLDivElement))
      props.onClick?.();
  };

  onMount(() => {
    document.addEventListener("mousedown", onClick);
  });
  onCleanup(() => {
    document.removeEventListener("mousedown", onClick);
  });

  return createComponent(Dynamic, {
    component: "div",
    style: { width: "100%", height: "100%" },
    get children() {
      return props.children;
    },
  });
}
