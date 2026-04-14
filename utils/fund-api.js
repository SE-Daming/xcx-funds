/**
 * 基金数据API管理模块
 */

// 东方财富基金数据API
const FUND_API_BASE = 'https://fundmobapi.eastmoney.com';
const FUND_SEARCH_API = 'https://fundsuggest.eastmoney.com';

/**
 * 获取基金实时数据
 * @param {Array} fundCodes - 基金代码数组
 * @param {String} deviceId - 设备ID
 * @returns {Promise}
 */
export function getFundData(fundCodes, deviceId = '') {
  if (!fundCodes || fundCodes.length === 0) {
    return Promise.resolve({ Datas: [] });
  }

  const codes = fundCodes.join(',');
  const url = `${FUND_API_BASE}/FundMNewApi/FundMNFInfo`;
  
  const params = {
    pageIndex: 1,
    pageSize: 200,
    plat: 'Android',
    appType: 'ttjj',
    product: 'EFund',
    Version: 1,
    deviceid: deviceId,
    Fcodes: codes
  };

  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'GET',
      data: params,
      success: async (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          const fundList = formatFundData(res.data.Datas);
          
          // 并发获取估值数据，因为 FundMNFInfo 接口不再返回实时估值
          const promises = fundList.map(async (fund) => {
            const valuation = await getFundValuation(fund.fundcode);
            if (valuation) {
              // 如果主接口没有返回估值，使用 fundgz 接口的数据
              if (!fund.gsz && valuation.gsz) fund.gsz = parseFloat(valuation.gsz);
              if ((fund.gszzl === 0 || !fund.gszzl) && valuation.gszzl) fund.gszzl = parseFloat(valuation.gszzl);
              if (!fund.gztime && valuation.gztime) fund.gztime = valuation.gztime;
            }
            return fund;
          });
          
          await Promise.all(promises);
          
          const todayStr = new Date().toISOString().slice(0, 10);
          const day = new Date().getDay();
          const isWeekend = day === 0 || day === 6;
          for (let i = 0; i < fundList.length; i++) {
            const f = fundList[i];
            if (f && f.jzrq && (f.jzrq === todayStr || isWeekend)) {
              if (typeof f.dwjz === 'number' && !isNaN(f.dwjz)) {
                f.gsz = f.dwjz;
              }
              if (typeof f.navchg === 'number' && !isNaN(f.navchg)) {
                f.gszzl = f.navchg;
              }
            }
          }
          
          resolve({ Datas: fundList });
        } else {
          console.error('基金数据获取失败:', res);
          resolve({ Datas: [] }); // 返回空数据而不是拒绝
        }
      },
      fail: (err) => {
        console.error('请求基金数据失败:', err);
        resolve({ Datas: [] }); // 发生错误时返回空数据
      }
    });
  });
}

/**
 * 获取单个基金估值数据 (从 fundgz 接口)
 * @param {String} fundCode
 * @returns {Promise}
 */
function getFundValuation(fundCode) {
  return new Promise((resolve) => {
    uni.request({
      url: `https://fundgz.1234567.com.cn/js/${fundCode}.js`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          try {
            // 解析 jsonpgz({...}); 格式
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



/**
 * 搜索基金
 * @param {String} keyword - 搜索关键词
 * @returns {Promise}
 */
export function searchFunds(keyword) {
  if (!keyword || keyword.trim() === '') {
    return Promise.resolve([]);
  }

  const url = `${FUND_SEARCH_API}/FundSearch/api/FundSearchAPI.ashx`;
  const params = {
    m: 9,
    key: keyword,
    _t: Date.now()
  };

  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          resolve(res.data.Datas.map(item => ({
            code: item.CODE,
            name: item.NAME
          })));
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        console.error('搜索基金失败:', err);
        resolve([]);
      }
    });
  });
}

/**
 * 获取指数数据
 * @param {Array} indexCodes - 指数代码数组
 * @returns {Promise}
 */
export function getIndexData(indexCodes) {
  if (!indexCodes || indexCodes.length === 0) {
    return Promise.resolve([]);
  }

  const codes = indexCodes.join(',');
  const url = 'https://push2.eastmoney.com/api/qt/ulist.np/get';
  
  const params = {
    fltt: 2,
    fields: 'f1,f2,f3,f4,f12,f14',
    secids: codes,
    _: Date.now()
  };

  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data && res.data.data.diff) {
          resolve(formatIndexData(res.data.data.diff));
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        console.error('获取指数数据失败:', err);
        resolve([]);
      }
    });
  });
}

/**
 * 格式化基金数据
 * @param {Array} rawData - 原始数据
 * @returns {Array} 格式化后的数据
 */
function formatFundData(rawData) {
  return rawData.map(item => {
    return {
      fundcode: item.FCODE,           // 基金代码
      name: item.SHORTNAME,           // 基金名称
      jzrq: item.PDATE,               // 净值日期
      dwjz: parseFloat(item.NAV) || null, // 单位净值
      gsz: parseFloat(item.GSZ) || null,  // 估算净值
      gszzl: parseFloat(item.GSZZL) || 0, // 估算涨跌幅
      gztime: item.GZTIME,            // 估算时间
      navchg: parseFloat(item.NAVCHGRT) || 0, // 日增长率
      // 计算字段
      hasActualValue: item.PDATE !== '--' && item.PDATE === item.GZTIME?.substr(0, 10) // 是否有实际净值
    };
  });
}

/**
 * 格式化指数数据
 * @param {Array} rawData - 原始数据
 * @returns {Array} 格式化后的数据
 */
function formatIndexData(rawData) {
  return rawData.map(item => {
    return {
      f12: item.f12,  // 代码
      f14: item.f14,  // 名称
      f2: item.f2,    // 当前值
      f3: item.f3,    // 涨跌幅
      f4: item.f4     // 涨跌额
    };
  });
}

/**
 * 获取北向资金数据
 * @returns {Promise}
 */
export function getNorthboundData() {
  // 模拟北向资金数据，实际应用中应调用真实API
  return Promise.resolve({
    hgt: (Math.random() * 50 + 20).toFixed(2),  // 沪股通净流入
    sgt: (Math.random() * 50 + 30).toFixed(2),  // 深股通净流入
    total: (Math.random() * 100 + 50).toFixed(2) // 北向合计净流入
  });
}

/**
 * 获取南向资金数据
 * @returns {Promise}
 */
export function getSouthboundData() {
  // 模拟南向资金数据，实际应用中应调用真实API
  return Promise.resolve({
    hgt: (Math.random() * 30 + 10).toFixed(2),   // 港股通(沪)净流入
    sgt: (Math.random() * 30 + 15).toFixed(2),   // 港股通(深)净流入
    total: (Math.random() * 60 + 25).toFixed(2)  // 南向合计净流入
  });
}

/**
 * 获取基金分时估值数据
 * @param {String} fundCode
 * @returns {Promise}
 */
export function getFundIntradayValuation(fundCode) {
  // 尝试使用 fundgz 接口获取分时数据（虽然它只返回当前点，但我们可以构造一个伪分时图或者只显示当前点）
  // 或者使用 FundVarietieValuationDetail (如果可用)
  // 这里暂时尝试 FundVarietieValuationDetail
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${fundCode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;

  return new Promise((resolve) => {
    uni.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          // 数据格式：["时间,价格,涨跌幅,平均价格", ...]
          const rawList = res.data.Datas;
          const dataList = rawList.map(item => {
            const parts = item.split(',');
            return {
              time: parts[0], // 0930
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

/**
 * 获取基金历史净值数据
 * @param {String} fundCode - 基金代码
 * @param {String} range - 时间范围 (y=月, 3y=季, 6y=半年, n=一年)
 * @returns {Promise}
 */
export function getFundHistoryNav(fundCode, range = 'y') {
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${fundCode}&RANGE=${range}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;

  console.log('请求历史净值:', url);

  return new Promise((resolve) => {
    uni.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('历史净值响应:', res);
        if (res.statusCode === 200 && res.data && res.data.Datas) {
          const list = res.data.Datas;
          // 按日期正序排列（API返回的是从新到旧，需要排序）
          const navList = [...list].sort((a, b) => new Date(a.FSRQ) - new Date(b.FSRQ)).map(item => ({
            date: item.FSRQ,           // 日期
            nav: parseFloat(item.DWJZ), // 单位净值
            accNav: parseFloat(item.LJJZ), // 累计净值
            change: parseFloat(item.JZZZL) || 0  // 日增长率
          }));
          console.log('解析后数据:', navList.length, '条, 日期范围:', navList[0]?.date, '->', navList[navList.length-1]?.date);
          resolve(navList);
        } else {
          console.log('历史净值数据为空');
          resolve([]);
        }
      },
      fail: (err) => {
        console.error('历史净值请求失败:', err);
        resolve([]);
      }
    });
  });
}
