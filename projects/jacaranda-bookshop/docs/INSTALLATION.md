# 安装与嵌入

运行源码需要 Node.js 22.12+ 和 npm。浏览器需要 WebGL 2。安装阶段需要访问 npm registry，构建后的 Demo 由本地文件组成。

在源码目录安装锁定版本并启动开发服务。

```sh
npm ci
npm run dev
```

`npm run build` 输出 `dist/`，`npm run preview` 用 HTTP 检查生产构建。可把 `dist/` 部署到静态网页服务器。

## 手机单文件

`npm run build:mobile` 生成 `release/Jacaranda-Bookshop-Mobile.html`。发送该 HTML 文件即可，接收者可以用支持本地 HTML 和 WebGL 2 的浏览器打开，旋转、缩放和打开音乐均可离线使用。

有些手机应用会先显示系统文件预览。单文件在 JavaScript 或 WebGL 不可用时会显示静态封面。需要交互时，可将文件作为普通网页通过 HTTP 提供，在手机浏览器输入网页地址。[Apple 文件预览说明](https://support.apple.com/en-euro/guide/iphone/iphe4bff8827/ios)

## 嵌入 Vite 项目

在宿主工程执行 `npm install ../little-worlds-studio/projects/jacaranda-bookshop`，路径按实际目录调整。容器需要有明确的高度。

```html
<div id="bookshop" style="width: 100%; aspect-ratio: 16 / 10"></div>
```

```js
import { createScene } from 'jacaranda-bookshop'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const bookshop = createScene(document.querySelector('#bookshop'), {
  interactive: true,
  motion: !reducedMotion,
  reducedMotion,
  maxPixelRatio: 1.5,
})

bookshop.setTimeOfDay('night')
bookshop.setWeather('rain')
bookshop.setWind(0.6)
bookshop.setView('shop')

// 在宿主移除容器时调用。
bookshop.dispose()
```

构建参数在挂载时读取，镜头、天气和动效可以通过返回的接口即时切换。组件随容器缩放重绘。嵌入方可按需启用相机交互和环境动效。若 WebGL 2 初始化失败，嵌入方可捕获初始化异常并显示静态预览。内置 Demo 使用 [暮色预览](../src/styles/twilight-poster.webp) 作为静态封面。
