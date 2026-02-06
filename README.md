# halo-theme-dream2-by-Tirsenna

基于 [nineya/halo-theme-dream2.0](https://github.com/nineya/halo-theme-dream2.0) 二次开发的 Halo 2.x 博客主题，适配 Halo 2.0 及以上版本。

- **预览站点**: [https://blog.tirsenna.xyz/](https://blog.tirsenna.xyz/)
- **原主题**: [nineya/halo-theme-dream2.0](https://github.com/nineya/halo-theme-dream2.0)
- **设计参考**: [kasuie](https://kasuie.cc/)

---

## 新增功能一览

在保留原 Dream 主题能力的基础上，本仓库重点新增/改造了以下功能。

### a) 关于我页面

- **可展开信息卡片**：多张卡片（背景图 + 头像 + 标题 + 描述），点击切换展开，未展开时仅显示缩略；支持在后台配置多组「信息卡片」。
- **自述清单**：支持普通勾选图标与爱心图标两种样式，按行配置。
- **游戏/社交 ID**：展示图标、名称、服务器、ID，支持一键复制到剪贴板。
- **Link Start 联系链接**：RemixIcon 图标 + 名称 + 链接 + 描述，可配置多条。
- **「我推的老婆」角色卡片**：网格布局，每项为背景图 + 圆形头像 + 角色名。


相关文件：`templates/about.html`，配置见 `settings.yaml` 中的 `about_page` 组。

### b) 安利墙页面

- **Waifu 卡片 + 拟真 3D 光照**：鼠标移入时卡片随鼠标倾斜，并实时计算 Blinn-Phong 镜面高光、Fresnel 边缘光、漫反射与方向性明暗，通过 CSS 变量驱动边缘高光与厚度底座效果。
- **Tab 切换**：番剧 / 小说 / 游戏三个分类，每项支持封面、简介、状态、标签；长简介支持「阅读更多」折叠。
- 数据全部在主题设置中配置（老婆列表、番剧/小说/游戏列表），无需改代码。

相关文件：`templates/mylikes.html`、`templates/assets/css/like.css`、`templates/assets/js/like.js`，配置见 `settings.yaml` 中的 `likes` 组。

### c) 瞬间/碎碎念页面

- **时间轴布局**：垂直线 + 头像气泡 + 对话框式卡片，主题色描边与悬停动效。
- **自动解析 #标签**：从正文末尾解析 `#标签`，从正文中移除并在卡片底部以标签形式展示；解析失败时显示默认「碎碎念」标签。
- **交互**：点赞动画、分享（优先 Web Share API，否则复制链接）、评论区折叠展开。
- **多媒体**：支持图片、视频、音频展示。
- 时间轴线高度随内容与窗口变化自动计算，兼容 PJAX、页面可见性变化与浏览器前进/后退；含完整响应式与移动端适配。

相关文件：`templates/moments.html`。

### d) GitHub 侧边栏组件


- **GitHub 开源项目列表**：展示项目名、描述、编程语言、Star 数，点击跳转项目链接。

相关文件：`templates/widget/github_contributions.html`、`templates/widget/github_projects.html`、`templates/assets/js/github-widget.js`、`templates/assets/css/github-widget.css`，配置见 `settings.yaml` 中的 `github` 组。

### e) 增强版目录组件

- 侧边栏目录区域可滚动，最大高度适配视口；阅读文章时目录高亮与正文滚动同步。
- **自动滚动到当前项**：通过 MutationObserver 监听目录项 `is-active` 变化，将当前高亮项平滑滚动到容器中部。
- **用户操作检测**：鼠标进入/滚轮/触摸操作目录时暂停自动滚动，离开或停止操作一段时间后恢复，避免与手动浏览冲突。
- 自定义滚动条样式（Webkit + Firefox），顶部/底部渐变遮罩提示是否还有内容；高亮项带闪烁动画，支持暗色主题与打印样式，兼容 PJAX。

相关文件：`templates/assets/js/toc-enhanced.js`、`templates/assets/css/toc-enhanced.css`。

### f) 友链页面改造

在原有友链能力基础上对样式与布局做了改造，便于展示友链信息与交换说明。

相关文件：`templates/friends.html`。

### g) 卡片效果系统（拟真光照）

- 安利墙 Waifu 卡片使用的光照效果由 **like.css** 与 **like.js** 共同实现。
- **like.js**：根据鼠标位置计算卡片旋转角与表面法线，并计算漫反射、Blinn-Phong 镜面高光、Fresnel 边缘光、高光斑点位置与倾斜强度，写入 CSS 自定义属性。
- **like.css**：通过 `::before` 实现镜面高光与边缘光（conic-gradient + mask），通过 `::after` 实现厚度与边框效果，悬停时与 JS 传入的变量联动，形成拟真 3D 卡片反馈。

相关文件：`templates/assets/css/like.css`、`templates/assets/js/like.js`。

---


## 致谢

- **原主题**：[nineya/halo-theme-dream2.0](https://github.com/nineya/halo-theme-dream2.0)
- **设计参考**：[kasuie](https://kasuie.cc/)

---

## 许可证

MIT License
