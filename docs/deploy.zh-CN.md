# 本地运行和部署

[English](deploy.md) · [返回 README](../README.zh-CN.md)

使用 Node.js 24 或更新版本，在仓库根目录运行命令。Wrangler 通过 `npx` 启动，项目不需要预先安装 npm 运行时依赖。Windows PowerShell 可用 `Copy-Item` 代替下方的 `cp`。

## 本地试玩

```sh
cp cloudflare/wrangler.example.jsonc wrangler.jsonc
```

只在本地运行时，可以把 `wrangler.jsonc` 里的 `REPLACE_WITH_YOUR_D1_DATABASE_ID` 替换为占位 ID `00000000-0000-4000-8000-000000000001`。

```sh
npm test
npm run build
npx wrangler d1 migrations apply DB --local
npx wrangler pages dev dist-pages
```

打开 Wrangler 打印的网址。本地库保存在 `.wrangler/`，与线上库独立。用两个浏览器配置文件可以分别模拟投稿者和投票者。

## 部署到 Cloudflare Pages

1. 运行 `npx wrangler login`，用自己的 Cloudflare 账号授权。
2. 运行 `npx wrangler d1 create reverse-turing`，记下返回的数据库 ID。
3. 如未复制过，将 `cloudflare/wrangler.example.jsonc` 复制为 `wrangler.jsonc`。把数据库占位符替换成上一步生成的 ID，绑定名保留 `DB`。
4. 运行 `npx wrangler pages project create reverse-turing --production-branch main`。项目名若已被占用，另取一个名字，并同步修改配置的顶层 `name`。
5. 构建并将迁移应用到**你新建的远程数据库**：

   ```sh
   npm test
   npm run build
   npx wrangler d1 migrations apply DB --remote
   npx wrangler pages deploy dist-pages --branch main
   ```

分享正式 `pages.dev` 网址，不要分享单次部署的预览地址，不需要另买域名。公开分享前，用无痕窗口验证两种语言的投票、公开投稿、作者查看结果和撤稿。

Worker 位于 `dist-pages/_worker.js`。只上传 HTML 无法投稿或投票。不要提交 `wrangler.jsonc`、凭据或数据库文件。

[Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [D1 绑定](https://developers.cloudflare.com/pages/functions/wrangler-configuration/#d1-databases)
