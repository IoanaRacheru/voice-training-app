# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Troubleshooting

### PostCSS / Vite error when running `npm run dev`

If you encounter an error like:
[plugin:vite:css] Failed to load PostCSS config
Cannot find module '.../node_modules/util-deprecate/node.js'

This is most likely caused by a **corrupted or incomplete `node_modules` installation** inside the `web-demo` folder.

### Fix

Run the following commands inside `web-demo`:

```bash
rm -rf node_modules
npm ci
npm run dev

This will reinstall dependencies cleanly and should resolve the issue.