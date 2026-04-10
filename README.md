# miles.bar-

一个以 **Liquid Glass** 风格为核心的个人起始页（Start Page）项目，包含：

- 动态背景（Bing 壁纸 + 本地壁纸）
- 日历与课程表展示
- 搜索与常用入口
- 独立 API（Express）用于拉取并缓存 Bing 当日壁纸

---

## 功能概览

### 1) 视觉与交互
- 双层背景淡入淡出切换（`#bg-a` / `#bg-b`）。
- 毛玻璃卡片、环境光斑、动态光效、鼠标/触控跟随。
- 移动端陀螺仪支持（授权后驱动光效指针）。

### 2) 壁纸系统
- 默认通过 `/api/bing-wallpaper` 获取 Bing 图。
- API 失败时自动回退到 Unsplash 备用图。
- 支持“本地壁纸”弹窗选择，并将选择写入 `localStorage`（键名：`custom_wallpaper`）。
- 本地壁纸分为缩略图与原图两套资源，分别用于弹窗预览与背景切换。

### 3) 日历/课程表
- 内置按周课程渲染逻辑。
- 基于香港时区（`Asia/Hong_Kong`）计算当前日期与时间。
- 自动定位当前节次并高亮。

### 4) API 服务
- 使用 Express 提供 `/api/bing-wallpaper`。
- 服务端缓存 Bing 响应（30 分钟），降低上游请求频率。
- 对超时和上游错误做了状态区分（504 / 502）。

---

## 技术栈

- 前端：原生 HTML + CSS + JavaScript（无构建步骤）
- 动效：OGL（通过 CDN 引入）
- 后端：Node.js + Express

---

## 目录结构

```text
.
├── index.html                     # 前端主页面（主要 UI 与业务逻辑）
├── app.js                         # Express API（Bing 壁纸代理与缓存）
├── main.js                        # 额外视觉实验脚本（当前未在 index.html 引用）
├── 404.html
├── assets/
│   └── wallpapers/
│       ├── full/                  # 本地壁纸原图
│       └── thumbs/                # 本地壁纸缩略图
├── package.json
└── package-lock.json
```

---

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 启动 API 服务

```bash
node app.js
```

默认监听：`http://127.0.0.1:3000`

> 如果你通过 Nginx/Cloudflare/BaoTa 等反向代理访问，请按实际部署补充代理配置。

### 3) 访问前端页面

本项目前端是静态页面（`index.html`）。常见方式：

- 方式 A：由 Nginx 直接托管静态文件，并反代 `/api/*` 到 `app.js`。
- 方式 B：使用任意静态服务器启动根目录，并确保 `/api/bing-wallpaper` 能路由到 Node 服务。

---

## API 说明

### `GET /api/bing-wallpaper`

返回示例：

```json
{
  "url": "https://www.bing.com/xxx.jpg",
  "title": "...",
  "copyright": "...",
  "cached": false
}
```

错误返回：

- `504`：上游超时
- `502`：上游请求失败或数据异常

缓存策略：

- 服务端内存缓存：30 分钟
- 响应头浏览器缓存：`Cache-Control: public, max-age=300`

---

## 本地壁纸维护说明

新增本地壁纸时建议：

1. 原图放入 `assets/wallpapers/full/`
2. 缩略图放入 `assets/wallpapers/thumbs/`
3. 在 `index.html` 的 `customWallpapers` 数组中新增一组 `{ thumb, full }` 映射

示例：

```js
{ thumb: "assets/wallpapers/thumbs/IMG_xxx_thumb.jpeg", full: "assets/wallpapers/full/IMG_xxx.jpeg" }
```

---

## 目前可改进点（建议）

- 将 `index.html` 中超长内联脚本拆分为模块文件，降低维护成本。
- 为 Node 服务增加 `npm start` / `npm dev` 脚本。
- 增加基础自动化检查（如 ESLint / Prettier）。
- 增加 `Dockerfile` 与部署示例，统一生产环境行为。

---

## License

当前仓库未明确声明 License；如需开源发布，建议补充 `LICENSE` 文件。
