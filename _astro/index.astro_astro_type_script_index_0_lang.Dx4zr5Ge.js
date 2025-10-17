import{o}from"./stackblitz.nq-M_OiV.js";const r=`import { $route } from "dreamkit";

export default $route.path("/").create(() => {
  return <>Hello World</>;
});
`,t=document.querySelector('a[href="#playground"]');t.addEventListener("click",e=>{e.preventDefault(),o({appCode:r})});
