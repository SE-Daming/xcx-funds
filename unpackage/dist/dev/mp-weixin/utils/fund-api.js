"use strict";
const common_vendor = require("../common/vendor.js");
const FUND_API_BASE = "https://fundmobapi.eastmoney.com";
const FUND_SEARCH_API = "https://fundsuggest.eastmoney.com";
function getFundData(fundCodes, deviceId = "") {
  if (!fundCodes || fundCodes.length === 0) {
    return Promise.resolve({ Datas: [] });
  }
  const codes = fundCodes.join(",");
  const url = `${FUND_API_BASE}/FundMNewApi/FundMNFInfo`;
  const params = {
    pageIndex: 1,
    pageSize: 200,
    plat: "Android",
    appType: "ttjj",
    product: "EFund",
    Version: 1,
    deviceid: deviceId,
    Fcodes: codes
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      data: params,
      success: async (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          const fundList = formatFundData(res.data.Datas);
          const promises = fundList.map(async (fund) => {
            const valuation = await getFundValuation(fund.fundcode);
            if (valuation) {
              if (!fund.gsz && valuation.gsz)
                fund.gsz = parseFloat(valuation.gsz);
              if ((fund.gszzl === 0 || !fund.gszzl) && valuation.gszzl)
                fund.gszzl = parseFloat(valuation.gszzl);
              if (!fund.gztime && valuation.gztime)
                fund.gztime = valuation.gztime;
            }
            return fund;
          });
          await Promise.all(promises);
          const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          for (let i = 0; i < fundList.length; i++) {
            const f = fundList[i];
            if (f && f.jzrq && f.jzrq === todayStr) {
              if (typeof f.dwjz === "number" && !isNaN(f.dwjz)) {
                f.gsz = f.dwjz;
              }
              if (typeof f.navchg === "number" && !isNaN(f.navchg)) {
                f.gszzl = f.navchg;
              }
            }
          }
          resolve({ Datas: fundList });
        } else {
          common_vendor.index.__f__("error", "at utils/fund-api.js:72", "基金数据获取失败:", res);
          resolve({ Datas: [] });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/fund-api.js:77", "请求基金数据失败:", err);
        resolve({ Datas: [] });
      }
    });
  });
}
function getFundValuation(fundCode) {
  return new Promise((resolve) => {
    common_vendor.index.request({
      url: `https://fundgz.1234567.com.cn/js/${fundCode}.js`,
      method: "GET",
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          try {
            const jsonStr = res.data.substring(8, res.data.length - 2);
            const data = JSON.parse(jsonStr);
            resolve({
              gsz: data.gsz,
              gszzl: data.gszzl,
              gztime: data.gztime
            });
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      },
      fail: () => resolve(null)
    });
  });
}
function searchFunds(keyword) {
  if (!keyword || keyword.trim() === "") {
    return Promise.resolve([]);
  }
  const url = `${FUND_SEARCH_API}/FundSearch/api/FundSearchAPI.ashx`;
  const params = {
    m: 9,
    key: keyword,
    _t: Date.now()
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      data: params,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          resolve(res.data.Datas.map((item) => ({
            code: item.CODE,
            name: item.NAME
          })));
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/fund-api.js:152", "搜索基金失败:", err);
        resolve([]);
      }
    });
  });
}
function getIndexData(indexCodes) {
  if (!indexCodes || indexCodes.length === 0) {
    return Promise.resolve([]);
  }
  const codes = indexCodes.join(",");
  const url = "https://push2.eastmoney.com/api/qt/ulist.np/get";
  const params = {
    fltt: 2,
    fields: "f1,f2,f3,f4,f12,f14",
    secids: codes,
    _: Date.now()
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      data: params,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data && res.data.data.diff) {
          resolve(formatIndexData(res.data.data.diff));
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/fund-api.js:192", "获取指数数据失败:", err);
        resolve([]);
      }
    });
  });
}
function formatFundData(rawData) {
  return rawData.map((item) => {
    var _a;
    return {
      fundcode: item.FCODE,
      // 基金代码
      name: item.SHORTNAME,
      // 基金名称
      jzrq: item.PDATE,
      // 净值日期
      dwjz: parseFloat(item.NAV) || null,
      // 单位净值
      gsz: parseFloat(item.GSZ) || null,
      // 估算净值
      gszzl: parseFloat(item.GSZZL) || 0,
      // 估算涨跌幅
      gztime: item.GZTIME,
      // 估算时间
      navchg: parseFloat(item.NAVCHGRT) || 0,
      // 日增长率
      // 计算字段
      hasActualValue: item.PDATE !== "--" && item.PDATE === ((_a = item.GZTIME) == null ? void 0 : _a.substr(0, 10))
      // 是否有实际净值
    };
  });
}
function formatIndexData(rawData) {
  return rawData.map((item) => {
    return {
      f12: item.f12,
      // 代码
      f14: item.f14,
      // 名称
      f2: item.f2,
      // 当前值
      f3: item.f3,
      // 涨跌幅
      f4: item.f4
      // 涨跌额
    };
  });
}
function getFundIntradayValuation(fundCode) {
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${fundCode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
  return new Promise((resolve) => {
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          const rawList = res.data.Datas;
          const dataList = rawList.map((item) => {
            const parts = item.split(",");
            return {
              time: parts[0],
              // 0930
              price: parseFloat(parts[1]),
              change: parseFloat(parts[2]),
              avg: parseFloat(parts[3])
            };
          });
          resolve(dataList);
        } else {
          resolve([]);
        }
      },
      fail: () => resolve([])
    });
  });
}
exports.getFundData = getFundData;
exports.getFundIntradayValuation = getFundIntradayValuation;
exports.getIndexData = getIndexData;
exports.searchFunds = searchFunds;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/fund-api.js.map
