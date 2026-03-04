# Chat-Application

Netlify deployment instructions

- Build the app: `npm run build`
- Netlify will publish the `build` folder (see `netlify.toml`).
- SPA routing: a `public/_redirects` file was added with `/* /index.html 200`.

Deployment options:
- Connect your repository in the Netlify dashboard and set the build command to `npm run build` and the publish directory to `build` (already configured in `netlify.toml`).
- Or manually drag-and-drop the generated `build` folder into the Netlify UI.

Troubleshooting: `Unexpected token '<'` in built JS

- Cause: the browser fetched an HTML page (usually `index.html`) instead of the JS asset. This commonly happens when asset URLs are wrong (CRA `homepage` setting) or a redirect serves `index.html` for asset requests.
- Fix: ensure `homepage` is unset or set to `.` in `package.json`, then rebuild:

```bash
npm install
npm run build
# serve the production build locally to verify
npx serve -s build
```

- After verifying locally, push and let Netlify redeploy (or drag/drop `build`). Clear browser cache if needed.
