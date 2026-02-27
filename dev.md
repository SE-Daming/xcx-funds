1.基金详情界面的持有金额应该是真实的，而不是按今日估算净值来的
2.要支持图片一键导入。（OCR引入）
3.支持持久化，也就是用户关闭app后，再次打开app，数据不丢失。
4.当日净值更新后，按照当日的净值来，就不按估算的净值了。

接口汇总

一、基金批量实时数据
- 接口：https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo
- 方法：GET
- 请求参数：
  - pageIndex、pageSize、plat、appType、product、Version、deviceid
  - Fcodes：基金代码，多个逗号分隔
- 主要返回字段（Datas 数组中每项）：
  - FCODE：基金代码
  - SHORTNAME：基金名称
  - PDATE：净值日期（yyyy-MM-dd）
  - NAV：单位净值
  - GSZ：估算净值（可能为空）
  - GSZZL：估算涨跌幅（可能为空或为 0）
  - GZTIME：估值时间（yyyy-MM-dd HH:mm）
  - NAVCHGRT：当日实际涨跌幅（净值更新后可用）
- 本地格式化映射：fundcode、name、jzrq、dwjz、gsz、gszzl、gztime、navchg

二、单只基金估值（补充）
- 接口：https://fundgz.1234567.com.cn/js/{基金代码}.js
- 方法：GET（返回 jsonpgz({...}) 文本）
- 返回字段：
  - gsz：估算净值
  - gszzl：估算涨跌幅
  - gztime：估值时间（HH:mm 或 yyyy-MM-dd HH:mm）

三、基金分时估值明细
- 接口：https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx
- 方法：GET
- 请求参数：FCODE、deviceid=Wap、plat=Wap、product=EFund、version=2.0.0
- 返回数据：Datas 数组，元素为字符串 "时间,价格,涨跌幅,平均价格"
- 解析字段：time、price、change、avg

四、基金搜索
- 接口：https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx
- 方法：GET
- 请求参数：m=9、key（关键词）、_t（时间戳）
- 返回字段（Datas 数组）：CODE、NAME
- 本地映射：code、name

五、指数列表
- 接口：https://push2.eastmoney.com/api/qt/ulist.np/get
- 方法：GET
- 请求参数：
  - fltt=2、fields=f1,f2,f3,f4,f12,f14
  - secids：指数代码（如 1.000001/0.399001 等），多个逗号分隔
  - _：时间戳
- 返回字段（data.diff 数组）：
  - f12：代码
  - f14：名称
  - f2：当前值
  - f3：涨跌幅（%）
  - f4：涨跌额

六、北向/南向资金（当前为模拟数据）
- 本地模拟返回：
  - 北向：hgt、sgt、total（单位：亿）
  - 南向：hgt、sgt、total（单位：亿）
