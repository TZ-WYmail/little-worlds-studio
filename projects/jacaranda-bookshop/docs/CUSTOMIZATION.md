# 定制场景

`createScene(container, options)` 使用以下配置。其余参数通过工程源码调整。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `background` | `null` | 默认显示程序化暮色环境。传入 Three.js 可识别的颜色时使用纯色背景 |
| `interactive` | `false` | 启用拖动、键盘环绕及缩放 |
| `motion` | `false` | 启用飘花、枝梢摆动、云层流动和天气动画 |
| `weather` | `'clear'` | 初始天气可为 `'clear'` 或 `'rain'` |
| `timeOfDay` | `'evening'` | 初始光照时段可为 `'day'`、`'evening'` 或 `'night'` |
| `wind` | `0.42` | 风力比例 0–1 |
| `petals` | `true` | 环境动效播放时显示飘落花瓣 |
| `reducedMotion` | `false` | 关闭相机惯性和预设切换过渡 |
| `cameraPosition` | `[13, 10, 19]` | 相对于世界原点的镜头方向参考。使用非零三元向量，建议 Y 为正 |
| `framingMargin` | `1.07` | 取景边距倍率。建议 1.03–1.25，较大值留白更多 |
| `maxPixelRatio` | `1.75` | 设备像素比的上限。移动端可从 1–1.5 试起 |
| `shadowMapSize` | `1024` | 主光的阴影贴图宽高。可选 512、1024 或 2048 |
| `bookshop` | 见默认配置 | 可覆写 `position`、`width`、`depth`、`wallHeight`。建议从默认尺寸小幅调节，建筑保持两层 |
| `trees` | 三棵独立树 | 整体替换默认数组。每项可指定 `position` 和下表的树木参数 |

门前家具和路灯由街道道具模块定位，移动书店后可同步调整该模块。天光和夕照参数位于 `src/core/createLighting.js`，天幕位于 `src/core/createTwilightBackdrop.js`。店内灯光随室内模块创建，街灯的光斑和阴影配置位于街道道具模块。全场常用材质位于 `src/materials/createMaterials.js`。

## 运行中切换

- `setView('overview' | 'shop' | 'crown' | 'rear')` 切换相机预设。`rear` 对准后门壁灯。观察花冠需要至少有一棵树。
- `setTimeOfDay('day' | 'evening' | 'night')` 改变天光、阴影方向和实景灯强。白昼时室内灯、窗帘发光与街灯均关闭。留给既有嵌入方的 `'golden'` 对应傍晚，`'blue'` 对应深夜。
- `setWeather('clear' | 'rain')` 独立改变天空、湿度和雨滴。旧值 `'dusk'` 仍映射至无降水天气。
- `setWind(value)` 接收 0–1 比例，影响树冠、云带、花瓣横向漂移和雨线斜度。 `setPetals(enabled)` 控制花瓣可见性。
- `setMotion(false)` 冻结环境；该操作保留相机控制。内置 Demo 尊重浏览器的减少动态效果偏好。

`dispose()` 停止动画、移除输入监听器和画布，并释放材质和几何体。

## 单独生成蓝花楹

```js
import { createJacarandaTree, disposeAssets } from 'jacaranda-bookshop'

const tree = createJacarandaTree({
  seed: 329,
  height: 6.7,
  crownWidth: 4.95,
  branchCount: 10,
  flowerDensity: 1.24,
  lean: -0.58,
})
scene.add(tree)

// 从宿主场景移除并释放此树创建的资源。
tree.removeFromParent()
disposeAssets(tree)
```

| 树参数 | 默认值 | 调整方式 |
| --- | --- | --- |
| `seed` | 1234 | 32 位整数，同样的参数可重现形态 |
| `height` | 6 | 高度基准，实际花梢会随分枝变化 |
| `crownWidth` | 4 | 树冠宽度基准及花朵尺度的参考 |
| `branchCount` | 9 | 主枝数量，建议使用 5–12 的整数 |
| `flowerDensity` | 1 | 每簇花的密度倍率，0 隐藏花朵 |
| `flowerColor` | `'#b69bd6'` | 参与花瓣渐变的紫蓝基色 |
| `lean` | 0.18 | 树干沿 X 的偏移量 |
| `spread` | 1 | 主枝在 Z 轴方向的延展倍率 |

`disposeAssets()` 用于释放由该模型独立拥有的资源。如果手动把模型的材质或纹理共享给其他对象，应在最后一个使用者移除后释放。
