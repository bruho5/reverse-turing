# Run locally or deploy

[简体中文](deploy.zh-CN.md) · [Back to README](../README.md)

Use Node.js 24 or newer. Run commands from the repository root. Wrangler runs through `npx`; there are no runtime npm dependencies to install.

## Local preview

```sh
cp cloudflare/wrangler.example.jsonc wrangler.jsonc
```

For local use only, replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc` with the dummy ID `00000000-0000-4000-8000-000000000001`.

```sh
npm test
npm run build
npx wrangler d1 migrations apply DB --local
npx wrangler pages dev dist-pages
```

Open the URL printed by Wrangler. The local database lives in `.wrangler/` and is separate from the live site. Use a second browser profile to vote on a locally submitted answer.

## Cloudflare Pages

1. Run `npx wrangler login` to use your own Cloudflare account.
2. Run `npx wrangler d1 create reverse-turing` and copy the result’s database ID.
3. Copy `cloudflare/wrangler.example.jsonc` to `wrangler.jsonc` if needed. Replace the placeholder or dummy ID with your new database ID. Keep the binding named `DB`.
4. Run `npx wrangler pages project create reverse-turing --production-branch main`. If that project name isn’t available, choose a different name and update the config’s top-level `name` to match.
5. Build and apply migrations to **your new remote database**:

   ```sh
   npm test
   npm run build
   npx wrangler d1 migrations apply DB --remote
   npx wrangler pages deploy dist-pages --branch main
   ```

Use the production `pages.dev` URL, not a deployment-specific preview link. No custom domain is required. Use an incognito session to check voting in each language, public submissions, author results, and withdrawal before sharing.

The Worker bundle is in `dist-pages/_worker.js`. Uploading just the HTML won’t give you submissions or voting. Don’t commit your `wrangler.jsonc`, credentials, or database files.

[Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [D1 bindings](https://developers.cloudflare.com/pages/functions/wrangler-configuration/#d1-databases)
