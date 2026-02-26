# Shadcn-UI Template Usage Instructions

## technology stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

All shadcn/ui components have been downloaded under `@/components/ui`.

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

The `@/` path alias points to the `src/` directory

# Commands

**Install Dependencies**

```shell
pnpm i
```

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```

---

## Backend ulash (local + Netlify)

### Local (Vite proxy bilan)

`.env` (yoki `.env.example` dan nusxa):

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://10.160.30.105:8081
VITE_BACKEND_URL=http://10.160.30.105:8081
```

### Netlify (deploy)

Netlify'da Vite proxy ishlamaydi. Backend **public URL** bo'lishi kerak.

Netlify → **Site settings → Environment variables**:

```env
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
VITE_BACKEND_URL=https://YOUR_BACKEND_DOMAIN
```

> SPA routing uchun `netlify.toml` va `public/_redirects` qo'shilgan.
