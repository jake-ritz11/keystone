# @keystone-ui/ui

React components built only from [Keystone](https://github.com/jake-ritz11/keystone) design
tokens: Button, Input, Select, Dialog, Menu, Tabs, Tooltip and Toast. They're built on the
platform (`<dialog>`, `popover`, CSS anchor positioning) and tested for keyboard, focus and ARIA
behavior in Chromium, WebKit and Firefox.

## Install

```bash
npm install @keystone-ui/ui @keystone-ui/tokens
```

React 18 or later is a peer dependency.

## Use

Import the token variables and the component styles once, at your app's entry:

```tsx
import "@keystone-ui/tokens/tokens.css";
import "@keystone-ui/ui/styles.css";
```

Then use the components. Toasts need a provider near the root:

```tsx
import { Button, ToastProvider, useToast } from "@keystone-ui/ui";

function SaveButton() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save</Button>;
}

export function App() {
  return (
    <ToastProvider>
      <SaveButton />
    </ToastProvider>
  );
}
```

The bundle is marked `"use client"`, so it works from React Server Components too.

## Theming

`tokens.css` follows `prefers-color-scheme`. Pin a theme with `data-theme="light"` or
`data-theme="dark"` on `<html>`.

## Browser support

Current Chromium, Safari and Firefox. Anchor positioning falls back to a JavaScript placement
where it's missing, and Select's styled popup (`appearance: base-select`) falls back to the
system picker.

## Docs

Every component, its props, keyboard map and accessibility notes:
[github.com/jake-ritz11/keystone](https://github.com/jake-ritz11/keystone).
