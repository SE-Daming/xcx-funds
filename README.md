# xcsfunds

小程序版基金助手，参考浏览器扩展版「funds」的核心逻辑，基于 uni-app 实现。

## 功能速览

- 自选基金：添加/编辑/删除持仓，展示今日收益、持有收益、金额、收益率
- 基金详情：展示估算/净值信息与更新时间，分时估值趋势（当日）
- 行情：主要指数（上证、深成、创业板、沪深300、科创50）
- 设置：显示项控制、主题、导入导出配置

## 开发环境

- 推荐：HBuilderX（4.x 及以上），开启 uni-app 支持
- 目标平台：小程序（mp-weixin）/ H5（调试用）

## 快速开始

1. 使用 HBuilderX 打开目录：`xcsfunds`
2. 运行到小程序：工具栏「运行」→「运行到小程序模拟器」→ 选择「微信开发者工具」
3. Web 调试（可选）：工具栏「运行」→「运行到浏览器」→ 选择 Chrome

发布小程序请使用 HBuilderX 的「发行」功能，按微信/抖音等官方指引完成后续流程。

## 目录结构

- 组件
  - [components/fund-chart/fund-chart.vue](./components/fund-chart/fund-chart.vue)
- 页面
  - 首页（自选列表）：[pages/index/index.vue](./pages/index/index.vue)
  - 基金详情：[pages/fund/detail.vue](./pages/fund/detail.vue)
  - 编辑持仓：[pages/fund/edit.vue](./pages/fund/edit.vue)
  - 添加基金：[pages/fund/add.vue](./pages/fund/add.vue)
  - 行情（主要指数）：[pages/market/index.vue](./pages/market/index.vue)
  - 设置：[pages/setting/index.vue](./pages/setting/index.vue)
- 工具
  - 数据接口与格式化：[utils/fund-api.js](./utils/fund-api.js)
  - 本地存储封装：[utils/data-manager.js](./utils/data-manager.js)
- 配置
  - [manifest.json](./manifest.json)
  - [pages.json](./pages.json)

## 数据口径与计算（重要）

判定：

- 当日净值已更新：`jzrq === 今天`
- 非工作日：周六/周日（法定节假日暂未接入）
- 统一开关：`useUpdatedMode = (jzrq===今天) || 周末`

规则：

- 工作日，未更新当日净值 → 估值口径（gsz、gszzl）
- 工作日，已更新当日净值 → 真实口径（dwjz、navchg）
- 非工作日（周末） → 视为真实口径（使用上一交易日 dwjz、navchg）

实现要点：

- 接口聚合层覆盖（当日已更新或周末）：
  - `gsz = dwjz`
  - `gszzl = navchg`（NAVCHGRT）
  - 位置：[utils/fund-api.js](./utils/fund-api.js)
- 首页与详情页计算：
  - 当前净值 `currentNav`：`useUpdatedMode ? dwjz : (gsz || dwjz)`
  - 今日收益（useUpdatedMode）：
    - 昨日净值 = 今日净值 / (1 + 实际涨跌幅/100)
    - 今日收益 = (今日净值 − 昨日净值) × 份额
  - 今日收益（估值口径）：≈ (gsz − dwjz) × 份额（无 gsz 时按金额 × gszzl/100 近似）
  - 参考：[pages/index/index.vue](./pages/index/index.vue) 与 [pages/fund/detail.vue](./pages/fund/detail.vue)

## 接口与文档

- 接口说明与字段映射：[dev.md](./dev.md)
- cURL 示例（工作日/非工作日/指数）：[api-curl-demo.md](./api-curl-demo.md)

核心接口：

- 基金批量信息（东财）：`FundMNewApi/FundMNFInfo`
- 估值补充（单点）：`fundgz.1234567.com.cn/js/{code}.js`
- 分时估值（当日）：`FundVarietieValuationDetail.ashx`
- 主要指数：`push2.eastmoney.com/api/qt/ulist.np/get`

## 本地存储与事件

- 存储键：
  - `fundList`（自选与持仓）
  - `fundSettings`（显示设置）
  - `deviceId`（请求设备标识）
  - 读写封装：[utils/data-manager.js](./utils/data-manager.js)
- 全局事件：
  - `fundAdded` / `fundUpdated` / `fundDeleted`（用于首页刷新）
  - `settingsChanged`（设置变更联动）

## 注意事项

- 估值接口可能在休市时返回上个交易日的旧估值；周末/已更新口径下已在接口层覆盖为真实净值与实际涨跌幅
- 主要指数为真实行情；接口异常时页面使用内置占位数据

## 贡献

欢迎提交 Issue/PR。建议在修改收益口径或接口时同步更新：

- 口径说明：[README.md](./README.md)（本文）

