---
"dreamkit": patch
"@dreamkit/solid": patch
"@dreamkit/app": patch
"@dreamkit/dev": patch
---

Avoid including '@solidjs/router' at the entry because it causes SSR error: Client-only API called on the server side.
