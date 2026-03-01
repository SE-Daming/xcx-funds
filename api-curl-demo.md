三方 API cURL 示例（基金 015790）

说明

- 以下示例展示工作日与非工作日的常用调用，均以基金代码 015790 为例。
- deviceid 可使用任意 GUID 字符串（示例使用 demo-device-id）；Fcodes 参数支持多个基金逗号分隔。

工作日·未更新当日净值（盘中估值）

- 获取盘中估值（gsz、gszzl、gztime）

```bash
curl "https://fundgz.1234567.com.cn/js/015790.js"
```

- 获取基础数据（NAV、PDATE 等）

```bash
curl "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=demo-device-id&Fcodes=015790"
```

工作日·当日净值已更新（用真实净值）

- 获取当日净值与当日实际涨跌幅（NAV、PDATE、NAVCHGRT）

```bash
curl "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=demo-device-id&Fcodes=015790"
```

- 判定口径：当返回的 PDATE 等于今天（yyyy-MM-dd）时，使用 NAV 作为当日净值、NAVCHGRT 作为实际涨跌幅。

非工作日（周末/节假日）

- 获取最近交易日净值（上一交易日的 NAV、PDATE）

```bash
curl "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=demo-device-id&Fcodes=015790"
```

- 显示口径：使用 NAV（上一交易日净值）计算持有金额/收益/收益率；不要使用 fundgz 的估值数据。

分时估值明细（可选）

- 获取估值分时明细（time, price, change, avg）

```bash
curl "https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx?FCODE=015790&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0"
```

主要指数（真实行情）

- 获取上证、深成、创业板、沪深300、科创50

```bash
curl "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f1,f2,f3,f4,f12,f14&secids=1.000001,0.399001,0.399006,1.000300,1.000688"
```

字段说明：
- f14 名称
- f2 当前值
- f3 涨跌幅（%）
- f4 涨跌额

附：字段要点

- FundMNFInfo 返回：
  - PDATE：净值日期（yyyy-MM-dd）
  - NAV：单位净值（当日已更新时为当日净值）
  - NAVCHGRT：当日实际涨跌幅（仅当日已更新时有效）
  - GSZ、GSZZL、GZTIME：估值相关（可能为空）
