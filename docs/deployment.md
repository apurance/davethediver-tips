# 部署指南

[返回 README](../README.md)

## 正式站点

- 访问地址：[https://davethediver-tips.pages.dev/](https://davethediver-tips.pages.dev/)
- 托管平台：Cloudflare Pages。
- 源码仓库：[apurance/davethediver-tips](https://github.com/apurance/davethediver-tips)。
- 生产分支：`main`，已启用自动部署。

推送到 `main` 后，Cloudflare 会安装依赖、构建并发布新版本，正式访问地址保持不变。若构建失败，线上继续提供上一次成功部署的版本；可在 Cloudflare 项目的部署记录中查看日志。

## Cloudflare Pages 构建配置

| 配置项 | 值 |
| --- | --- |
| 项目名称 | `davethediver-tips` |
| 生产分支 | `main` |
| 根目录 | 仓库根目录 |
| 框架预设 | 无 |
| 构建命令 | `pnpm build` |
| 构建输出目录 | `dist` |
| 环境变量 `NODE_VERSION` | `24` |
| 环境变量 `PNPM_VERSION` | `11.13.1` |

环境变量同时应用于生产和预览环境。`PNPM_VERSION` 应与 `package.json` 的 `packageManager` 保持一致；项目的 `pmOnFail: error` 会在版本不匹配时停止执行。`verifyDepsBeforeRun: false` 关闭运行脚本前的自动安装，依赖由 Pages 的安装步骤准备。

网站只使用静态资源托管，无需 Pages Functions、后端服务或数据库。首次关联仓库时，需要由仓库所有者完成 Cloudflare GitHub App 授权。

参考：[Cloudflare React 部署文档](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) · [构建环境与版本配置](https://developers.cloudflare.com/pages/configuration/build-image/)。

## 本地构建与手动发布

```sh
pnpm install
pnpm build
pnpm preview
```

将构建后的 `dist/` 内容发布到静态托管平台即可。`pnpm preview` 用于本地检查生产构建；线上无需持续运行 Node.js 或 Vite 开发服务器。

## 前端路由

项目使用 React Router 的 Browser History 路由。除了首页，还需要支持直接访问、刷新 `/maps`、`/fish/tiger-shark` 等子页面。

Cloudflare Pages 在没有顶层 `404.html` 时默认启用 SPA 回退，当前构建符合这一条件，无需添加 Functions。详情见 [Pages 的 SPA 路由说明](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering)。

其他静态服务器需要将不存在的文件路径回退到 `index.html`，同时保留真实静态资源请求。例如 Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

发布后检查首页、直接打开详情页、刷新子页面，以及带查询参数的地图链接，例如 [`/maps?type=B&layout=03`](https://davethediver-tips.pages.dev/maps?type=B&layout=03)。
