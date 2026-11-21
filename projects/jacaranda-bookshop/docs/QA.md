# 视觉与运行验收

## 明信片界面复查

- 在本机 Chrome 桌面和 390 CSS 像素触屏模拟中核对三种时刻与两种天气。六组实渲中，题字和引句同步换色。晴朗白昼用深蓝墨色，傍晚用杏色，深夜用淡紫色，雨天根据天幕亮度微调。
- 在 320、390、590、701、768、900、1110 和 1440 CSS 像素检查版面。标题、引句与操作区保持独立，320 像素下无需横向滚动。
- 核对按钮选中线、键盘焦点、拖动环绕、触屏双指缩放、风力、飘花、动画暂停以及系统减少动态效果偏好。关闭 WebGL 后可显示静态预览和状态提示。页面运行无需外部字体请求。

[桌面明信片](milestones/back-lane-postcard.webp) · [手机单文件预览](milestones/mobile-release.webp)

## 明信片落款与后门壁灯

- 在 1440 像素桌面检查右栏版画和题签，并在 320、390、640、701 和 1024 像素验证版面与操作。窄屏将落款压缩成横排。点击 **Back lane** 进入后门取景，**Overview** 恢复初始构图。手动拖动后恢复自由取景。
- 固定后门镜头检查白昼、傍晚、深夜及深夜春雨。黄昏起，壁灯照亮侧墙、门框、门槛与近处石板。由深夜恢复白昼后，渲染帧与首次白昼逐像素一致。
- 生产构建与 Chrome WebGL 2 检查通过。窄屏使用触屏模拟，移动真机待验证。

[明信片落款实渲](milestones/back-lane-postcard.webp) · [深夜壁灯近景](milestones/back-lane-night.webp)

### 落款版画生成记录

使用内置 ImageGen 生成透明 PNG，缩放并编码为 [透明 WebP](../src/styles/jacaranda-sprig.webp)。

> A single exquisite hand engraved botanical specimen of a jacaranda blossom sprig, isolated entirely on genuine transparent background, an elegant decorative ink impression printed on the reverse of a quiet antique bookshop postcard. A slim curved stem rises on a long diagonal from bottom left to top right with a little cluster of five-lobed tubular bell-shaped jacaranda blossoms and two airy paired fern-like bipinnate leaf sprays. Antique intaglio hatching, lead-pencil hairlines and fine botanical detail softened by the age of the ink; monochrome dusty sage-gray and desaturated gray-violet ink. Sparse, linear, light, fine lines that remain distinguishable at mini size, accurate plants, gentle asymmetry. Landscape composition filling the frame with generous transparent edge clearance, open negative space between sprigs. No captions, no letters, no stamps, no drop shadow, no opaque paper, no additional subjects, no white fill between details. Transparent PNG. Professional fine-art stationery mark.

## 背景音乐复查

- Chrome 初始加载时配乐关闭，无音频文件请求。点击或用键盘开启后，从本地加载两首曲目并依次循环。暂停再开启时从原位置继续，取景、时刻、天气和动效开关可独立操作。
- 在 320、390、640、701 和 1440 像素视口验证开关和界面。模拟音频不可用时，按钮回到关闭状态，提示重试，恢复文件后可以正常播放。
- 生产构建包含两首 MP3 和可从侧栏打开的[本地署名页](../public/licenses/Soundtrack.html)。触屏验证使用 Chrome 模拟。

## 手机单文件复查

- 将约 7.3 MiB 的交付 HTML 单独复制到空目录，在 Chrome 断网状态下以本地文件打开。320×690 和 390×844 两种触屏模拟视口通过拖动、双指缩放、后门镜头、夜雨、风力和配乐切换。控制台无报错，未请求外部资源。
- 验证内嵌音乐署名、Three.js MIT 许可和两份字体许可可打开。关闭 JavaScript 或 WebGL 后，仍能看到内嵌静态封面。
- 手机真机待验证。[390 像素实渲](milestones/mobile-release.webp)
