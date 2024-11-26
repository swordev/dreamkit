const $="https://stackblitz.com",b=["angular-cli","create-react-app","html","javascript","node","polymer","typescript","vue"],N=["project","search","ports","settings"],F=["light","dark"],x=["editor","preview"],j={clickToLoad:e=>l("ctl",e),devToolsHeight:e=>v("devtoolsheight",e),forceEmbedLayout:e=>l("embed",e),hideDevTools:e=>l("hidedevtools",e),hideExplorer:e=>l("hideExplorer",e),hideNavigation:e=>l("hideNavigation",e),openFile:e=>u("file",e),showSidebar:e=>A("showSidebar",e),sidebarView:e=>f("sidebarView",e,N),startScript:e=>u("startScript",e),terminalHeight:e=>v("terminalHeight",e),theme:e=>f("theme",e,F),view:e=>f("view",e,x),zenMode:e=>l("zenMode",e),organization:e=>`${u("orgName",e?.name)}&${u("orgProvider",e?.provider)}`,crossOriginIsolated:e=>l("corp",e)};function S(e={}){const t=Object.entries(e).map(([n,r])=>r!=null&&j.hasOwnProperty(n)?j[n](r):"").filter(Boolean);return t.length?`?${t.join("&")}`:""}function l(e,t){return t===!0?`${e}=1`:""}function A(e,t){return typeof t=="boolean"?`${e}=${t?"1":"0"}`:""}function v(e,t){if(typeof t=="number"&&!Number.isNaN(t)){const n=Math.min(100,Math.max(0,t));return`${e}=${encodeURIComponent(Math.round(n))}`}return""}function f(e,t="",n=[]){return n.includes(t)?`${e}=${encodeURIComponent(t)}`:""}function u(e,t){return(Array.isArray(t)?t:[t]).filter(r=>typeof r=="string"&&r.trim()!=="").map(r=>`${e}=${encodeURIComponent(r)}`).join("&")}function T(){return Math.random().toString(36).slice(2,6)+Math.random().toString(36).slice(2,6)}function g(e,t){return`${P(t)}${e}${S(t)}`}function y(e,t){const n={forceEmbedLayout:!0};return t&&typeof t=="object"&&Object.assign(n,t),`${P(n)}${e}${S(n)}`}function P(e={}){return(typeof e.origin=="string"?e.origin:$).replace(/\/$/,"")}function w(e,t,n){if(!t||!e||!e.parentNode)throw new Error("Invalid Element");e.id&&(t.id=e.id),e.className&&(t.className=e.className),C(t,n),M(e,t,n),e.replaceWith(t)}function _(e){if(typeof e=="string"){const t=document.getElementById(e);if(!t)throw new Error(`Could not find element with id '${e}'`);return t}else if(e instanceof HTMLElement)return e;throw new Error(`Invalid element: ${e}`)}function E(e){return e&&e.newWindow===!1?"_self":"_blank"}function C(e,t={}){const n=Object.hasOwnProperty.call(t,"height")?`${t.height}`:"300",r=Object.hasOwnProperty.call(t,"width")?`${t.width}`:void 0;e.setAttribute("height",n),r?e.setAttribute("width",r):e.setAttribute("style","width:100%;")}function M(e,t,n={}){const r=e.allow?.split(";")?.map(i=>i.trim())??[];n.crossOriginIsolated&&!r.includes("cross-origin-isolated")&&r.push("cross-origin-isolated"),r.length>0&&(t.allow=r.join("; "))}class O{constructor(t){this.pending={},this.port=t,this.port.onmessage=this.messageListener.bind(this)}request({type:t,payload:n}){return new Promise((r,i)=>{const o=T();this.pending[o]={resolve:r,reject:i},this.port.postMessage({type:t,payload:{...n,__reqid:o}})})}messageListener(t){if(typeof t.data.payload?.__reqid!="string")return;const{type:n,payload:r}=t.data,{__reqid:i,__success:o,__error:a}=r;this.pending[i]&&(o?this.pending[i].resolve(this.cleanResult(r)):this.pending[i].reject(a?`${n}: ${a}`:n),delete this.pending[i])}cleanResult(t){const n={...t};return delete n.__reqid,delete n.__success,delete n.__error,Object.keys(n).length?n:null}}class R{constructor(t,n){this.editor={openFile:r=>this._rdc.request({type:"SDK_OPEN_FILE",payload:{path:r}}),setCurrentFile:r=>this._rdc.request({type:"SDK_SET_CURRENT_FILE",payload:{path:r}}),setTheme:r=>this._rdc.request({type:"SDK_SET_UI_THEME",payload:{theme:r}}),setView:r=>this._rdc.request({type:"SDK_SET_UI_VIEW",payload:{view:r}}),showSidebar:(r=!0)=>this._rdc.request({type:"SDK_TOGGLE_SIDEBAR",payload:{visible:r}})},this.preview={origin:"",getUrl:()=>this._rdc.request({type:"SDK_GET_PREVIEW_URL",payload:{}}).then(r=>r?.url??null),setUrl:(r="/")=>{if(typeof r!="string"||!r.startsWith("/"))throw new Error(`Invalid argument: expected a path starting with '/', got '${r}'`);return this._rdc.request({type:"SDK_SET_PREVIEW_URL",payload:{path:r}})}},this._rdc=new O(t),Object.defineProperty(this.preview,"origin",{value:typeof n.previewOrigin=="string"?n.previewOrigin:null,writable:!1})}applyFsDiff(t){const n=r=>r!==null&&typeof r=="object";if(!n(t)||!n(t.create))throw new Error("Invalid diff object: expected diff.create to be an object.");if(!Array.isArray(t.destroy))throw new Error("Invalid diff object: expected diff.destroy to be an array.");return this._rdc.request({type:"SDK_APPLY_FS_DIFF",payload:t})}getDependencies(){return this._rdc.request({type:"SDK_GET_DEPS_SNAPSHOT",payload:{}})}getFsSnapshot(){return this._rdc.request({type:"SDK_GET_FS_SNAPSHOT",payload:{}})}}const m=[];class k{constructor(t){this.id=T(),this.element=t,this.pending=new Promise((n,r)=>{const i=({data:s,ports:c})=>{s?.action==="SDK_INIT_SUCCESS"&&s.id===this.id&&(this.vm=new R(c[0],s.payload),n(this.vm),a())},o=()=>{this.element.contentWindow?.postMessage({action:"SDK_INIT",id:this.id},"*")};function a(){window.clearInterval(p),window.removeEventListener("message",i)}window.addEventListener("message",i),o();let d=0;const p=window.setInterval(()=>{if(this.vm){a();return}if(d>=20){a(),r("Timeout: Unable to establish a connection with the StackBlitz VM"),m.forEach((s,c)=>{s.id===this.id&&m.splice(c,1)});return}d++,o()},500)}),m.push(this)}}const L=e=>{const t=e instanceof Element?"element":"id";return m.find(n=>n[t]===e)??null};function U(e,t){const n=document.createElement("input");return n.type="hidden",n.name=e,n.value=t,n}function H(e){return e.replace(/\[/g,"%5B").replace(/\]/g,"%5D")}function I({template:e,title:t,description:n,dependencies:r,files:i,settings:o}){if(!b.includes(e)){const s=b.map(c=>`'${c}'`).join(", ");console.warn(`Unsupported project.template: must be one of ${s}`)}const a=[],d=(s,c,D="")=>{a.push(U(s,typeof c=="string"?c:D))};d("project[title]",t),typeof n=="string"&&n.length>0&&d("project[description]",n),d("project[template]",e,"javascript"),r&&(e==="node"?console.warn("Invalid project.dependencies: dependencies must be provided as a 'package.json' file when using the 'node' template."):d("project[dependencies]",JSON.stringify(r))),o&&d("project[settings]",JSON.stringify(o)),Object.entries(i).forEach(([s,c])=>{d(`project[files][${H(s)}]`,c)});const p=document.createElement("form");return p.method="POST",p.setAttribute("style","display:none!important;"),p.append(...a),p}function q(e,t){const n=I(e);return n.action=y("/run",t),n.id="sb_run",`<!doctype html>
<html>
<head><title></title></head>
<body>
  ${n.outerHTML}
  <script>document.getElementById('${n.id}').submit();<\/script>
</body>
</html>`}function K(e,t){const n=I(e);n.action=g("/run",t),n.target=E(t),document.body.appendChild(n),n.submit(),document.body.removeChild(n)}function h(e){return e?.contentWindow?(L(e)??new k(e)).pending:Promise.reject("Provided element is not an iframe.")}function B(e,t){K(e,t)}function V(e,t){const n=g(`/edit/${e}`,t),r=E(t);window.open(n,r)}function W(e,t){const n=g(`/github/${e}`,t),r=E(t);window.open(n,r)}function G(e,t,n){const r=_(e),i=q(t,n),o=document.createElement("iframe");return w(r,o,n),o.contentDocument?.write(i),h(o)}function z(e,t,n){const r=_(e),i=document.createElement("iframe");return i.src=y(`/edit/${t}`,n),w(r,i,n),h(i)}function J(e,t,n){const r=_(e),i=document.createElement("iframe");return i.src=y(`/github/${t}`,n),w(r,i,n),h(i)}const X={connect:h,embedGithubProject:J,embedProject:G,embedProjectId:z,openGithubProject:W,openProject:B,openProjectId:V},Y={"src/app.tsx":`import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
`,"src/entry-client.tsx":`// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);
`,"src/entry-server.tsx":`// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
`,"src/global.d.ts":`/// <reference types="@solidjs/start/env" />
`,".gitignore":`
dist
.solid
.output
.vercel
.netlify
.vinxi
app.config.timestamp_*.js

# Environment
.env
.env*.local

# dependencies
/node_modules

# IDEs and editors
/.idea
.project
.classpath
*.launch
.settings/

# Temp
gitignore

# System Files
.DS_Store
Thumbs.db
`,".npmrc":"public-hoist-pattern[]=@dreamkit/node-app","README.md":`# SolidStart

Everything you need to build a Solid project, powered by [\`solid-start\`](https://start.solidjs.com);

## Creating a project

\`\`\`bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
\`\`\`

## Developing

Once you've created a project and installed dependencies with \`npm install\` (or \`pnpm install\` or \`yarn\`), start a development server:

\`\`\`bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
\`\`\`

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, \`npm run build\` will generate a Node app that you can run with \`npm start\`. To use a different preset, add it to the \`devDependencies\` in \`package.json\` and specify in your \`app.config.js\`.

## This project was created with the [Solid CLI](https://solid-cli.netlify.app)
`,"app.config.ts":`import { defineConfig } from "@solidjs/start/config";
import { dreamkitPlugin } from "dreamkit/dev";

export default defineConfig({
  vite: {
    plugins: [dreamkitPlugin()],
  },
});
`,"package.json":`{
  "name": "solid-start-template",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vinxi build",
    "dev": "vinxi dev",
    "start": "vinxi start",
    "version": "vinxi version"
  },
  "dependencies": {
    "@solidjs/meta": "^0.29.4",
    "@solidjs/router": "^0.15.1",
    "@solidjs/start": "^1.0.10",
    "dreamkit": "^0.0.15-next.6",
    "solid-js": "^1.9.3",
    "vinxi": "^0.4.3"
  },
  "engines": {
    "node": ">=18"
  }
}`,"tsconfig.json":`{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "types": ["vinxi/types/client"],
    "isolatedModules": true,
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
`};function Q(e){let t=e.appFile??"src/dreamkit.tsx";t.startsWith("/")&&(t=t.slice(1));const n={...Y,...e.files||{}};if(e.pkgDependencies||e.pkgDevDependencies){const r=n["package.json"]?JSON.parse(n["package.json"]):{};r.dependencies={...r.dependencies,...e.pkgDependencies},r.devDependencies={...r.devDependencies,...e.pkgDevDependencies},n[t]=e.appCode,n["package.json"]=JSON.stringify(r,null,2)}return n}function Z(e){return{template:"node",title:"Dreamkit Example",description:"Example",...e||{},files:Q(e)}}function ee(e,t={}){let n=e.appFile??"src/dreamkit.tsx";n.startsWith("/")&&(n=n.slice(1)),X.openProject(Z(e),{openFile:[n],...t||{}})}export{Q as b,ee as o};
