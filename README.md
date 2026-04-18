# Bento Startup Guide (Windows)

## Daily Use (No Cursor Needed)

Open PowerShell once and run:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-bento.ps1"
```

What it does:
- Ensures PostgreSQL service is running
- Launches `app.exe` (auto-detect common paths)
- You can work in Bento immediately

If your `app.exe` is in another location:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-bento.ps1" -AppPath "D:\path\to\app.exe"
```

Optional: open pgAdmin too:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-bento.ps1" -OpenPgAdmin
```

## Owner/Admin Mode

For setup/checking data tools (pgAdmin + Prisma Studio):

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-bento-admin.ps1"
```

- This still opens Bento app
- Also opens pgAdmin4 and Prisma Studio

## Create Desktop Shortcut (Recommended)

Create a shortcut to this target:

```text
powershell.exe -ExecutionPolicy Bypass -File "D:\Bento\Bento\scripts\start-bento.ps1"
```

Then staff can just double-click one icon after boot.

## One-Click Launchers

- Staff daily use: `.\scripts\start-bento.bat`
- Admin/dev use: `.\scripts\start-bento-admin.bat`
- Thai quick guide: `.\docs\STARTUP_GUIDE_TH.md`

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
