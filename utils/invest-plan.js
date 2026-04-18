/**
 * 定投功能工具函数
 * 用于计算定投日期、份额、收益等
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date
 * @returns {String}
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取日期的月份（1-12）
 * @param {Date|String} date
 * @returns {Number}
 */
export function getMonth(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getMonth() + 1;
}

/**
 * 获取日期是周几（1-5 表示周一到周五）
 * @param {String} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {Number} 1-5 表示周一到周五，0 表示周末
 */
export function getDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
  if (day === 0 || day === 6) {
    return 0; // 周末
  }
  return day; // 1-5 对应周一到周五
}

/**
 * 查找下一个交易日（顺延）
 * @param {String} dateStr - 起始日期
 * @param {Set} tradingDaySet - 交易日集合
 * @param {Number} maxAttempts - 最大尝试次数
 * @returns {String|null}
 */
export function findNextTradingDay(dateStr, tradingDaySet, maxAttempts = 10) {
  let date = new Date(dateStr);
  let attempts = 0;

  while (attempts < maxAttempts) {
    date.setDate(date.getDate() + 1);
    const formatted = formatDate(date);
    if (tradingDaySet.has(formatted)) {
      return formatted;
    }
    attempts++;
  }

  return null;
}

/**
 * 生成每日定投日期列表
 * @param {Object} plan - 定投计划
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 截止日期
 * @param {Set} tradingDaySet - 交易日集合
 * @returns {Array} 定投日期列表
 */
function generateDailyDates(plan, startDate, endDateStr, tradingDaySet) {
  const dates = [];
  const tradingDays = Array.from(tradingDaySet).sort();

  console.log('generateDailyDates 参数:', {
    startDate: plan.startDate,
    endDateStr: endDateStr,
    lastInvestDate: plan.lastInvestDate,
    tradingDaysCount: tradingDays.length,
    firstTradingDay: tradingDays[0],
    lastTradingDay: tradingDays[tradingDays.length - 1]
  });

  for (const day of tradingDays) {
    if (day >= plan.startDate && day <= endDateStr) {
      if (!plan.lastInvestDate || day > plan.lastInvestDate) {
        dates.push(day);
      }
    }
  }

  console.log('generateDailyDates 结果:', dates.length, '条');
  console.log('定投日期列表:', dates);
  return dates;
}

/**
 * 生成每周定投日期列表
 * @param {Object} plan - 定投计划
 * @param {Date} startDate - 开始日期
 * @param {String} endDateStr - 截止日期字符串 YYYY-MM-DD
 * @param {Set} tradingDaySet - 交易日集合
 * @returns {Array} 定投日期列表
 */
function generateWeeklyDates(plan, startDate, endDateStr, tradingDaySet) {
  const dates = [];
  const targetDay = plan.dayOfWeek; // 1-5 表示周一到周五
  const endDate = new Date(endDateStr);

  // 找到开始日期之后的第一个目标周几
  let current = new Date(startDate);

  // 先移动到开始日期
  while (formatDate(current) < plan.startDate) {
    current.setDate(current.getDate() + 1);
  }

  // 找到第一个目标周几
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1);
  }

  // 遍历每个目标周几
  while (current <= endDate) {
    const dateStr = formatDate(current);

    if (!plan.lastInvestDate || dateStr > plan.lastInvestDate) {
      // 检查是否为交易日
      if (tradingDaySet.has(dateStr)) {
        dates.push(dateStr);
      } else {
        // 非交易日顺延到下一个交易日
        const nextTradingDay = findNextTradingDay(dateStr, tradingDaySet);
        if (nextTradingDay && nextTradingDay <= endDateStr) {
          // 检查顺延后的日期是否已经跨到下一周（超过7天）
          const nextDate = new Date(nextTradingDay);
          const daysDiff = Math.floor((nextDate - current) / (1000 * 60 * 60 * 24));
          if (daysDiff < 7) {
            dates.push(nextTradingDay);
          }
        }
      }
    }

    // 移动到下周同一天
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

/**
 * 生成每月定投日期列表
 * @param {Object} plan - 定投计划
 * @param {Date} startDate - 开始日期
 * @param {String} endDateStr - 截止日期字符串 YYYY-MM-DD
 * @param {Set} tradingDaySet - 交易日集合
 * @returns {Array} 定投日期列表
 */
function generateMonthlyDates(plan, startDate, endDateStr, tradingDaySet) {
  const dates = [];
  const targetDay = plan.dayOfMonth; // 1-28
  const endDate = new Date(endDateStr);

  // 从开始日期的月份开始
  let year = startDate.getFullYear();
  let month = startDate.getMonth();

  // 判断是否需要从开始月份的下一个目标日开始
  const firstTargetDate = new Date(year, month, targetDay);
  if (firstTargetDate < startDate) {
    // 开始日期已过本月目标日，从下月开始
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  while (true) {
    // 创建当月目标日期
    const targetDate = new Date(year, month, targetDay);
    const dateStr = formatDate(targetDate);

    // 检查是否超出范围
    if (targetDate > endDate) break;

    if (dateStr >= plan.startDate && (!plan.lastInvestDate || dateStr > plan.lastInvestDate)) {
      // 检查是否为交易日
      if (tradingDaySet.has(dateStr)) {
        dates.push(dateStr);
      } else {
        // 非交易日顺延到下一个交易日
        const nextTradingDay = findNextTradingDay(dateStr, tradingDaySet);
        if (nextTradingDay) {
          const nextDate = new Date(nextTradingDay);
          // 检查是否跨月
          if (nextDate.getMonth() === month && nextTradingDay <= endDateStr) {
            dates.push(nextTradingDay);
          }
          // 跨月则跳过本月
        }
      }
    }

    // 移动到下个月
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return dates;
}

/**
 * 生成定投日期列表
 * @param {Object} plan - 定投计划
 * @param {String} endDate - 截止日期（通常为今天或最近交易日）
 * @param {Array} tradingDays - 交易日列表（从历史净值数据提取）
 * @returns {Array} 定投日期列表
 */
export function generateInvestDates(plan, endDate, tradingDays) {
  console.log('generateInvestDates 被调用');
  console.log('plan:', JSON.stringify(plan));
  console.log('endDate:', endDate);
  console.log('tradingDays length:', tradingDays ? tradingDays.length : 0);

  if (!plan || !plan.startDate || !tradingDays || tradingDays.length === 0) {
    console.log('generateInvestDates 参数校验失败，返回空数组');
    return [];
  }

  const tradingDaySet = new Set(tradingDays);
  const startDate = new Date(plan.startDate);

  // 确保 endDate 是字符串格式 YYYY-MM-DD
  const endStr = typeof endDate === 'string' ? endDate : formatDate(endDate);

  console.log('plan.cycle:', plan.cycle);

  // 根据周期类型生成日期
  switch (plan.cycle) {
    case 'daily':
      return generateDailyDates(plan, startDate, endStr, tradingDaySet);
    case 'weekly':
      return generateWeeklyDates(plan, startDate, endStr, tradingDaySet);
    case 'monthly':
      return generateMonthlyDates(plan, startDate, endStr, tradingDaySet);
    default:
      return [];
  }
}

/**
 * 执行定投计算
 * @param {Object} plan - 定投计划
 * @param {Array} navHistory - 历史净值列表 [{date, nav}, ...]
 * @param {Array} existingRecords - 已有定投记录
 * @returns {Object} 计算结果
 */
export function executeInvestment(plan, navHistory, existingRecords = []) {
  if (!navHistory || navHistory.length === 0) {
    return {
      newRecords: [],
      allRecords: existingRecords,
      summary: null,
      lastInvestDate: plan.lastInvestDate,
      error: '无历史净值数据'
    };
  }

  // 提取交易日列表
  const tradingDays = navHistory.map(item => item.date);
  const navMap = new Map(navHistory.map(item => [item.date, item.nav]));

  // 获取最近有净值的交易日
  const lastTradingDay = tradingDays[tradingDays.length - 1];

  // 生成待执行定投日期
  const investDates = generateInvestDates(plan, lastTradingDay, tradingDays);

  // 计算每期份额
  const newRecords = [];
  let totalShares = 0;
  let totalAmount = 0;

  // 确保 amount 是数字类型
  const investAmount = parseFloat(plan.amount) || 0;

  for (const date of investDates) {
    const nav = navMap.get(date);
    if (!nav || nav <= 0) continue;

    // 保留4位小数存储
    const shares = parseFloat((investAmount / nav).toFixed(4));

    newRecords.push({
      date,
      amount: investAmount,
      nav: parseFloat(nav.toFixed(4)),
      shares
    });

    totalShares += shares;
    totalAmount += investAmount;
  }

  // 合并已有记录
  const allRecords = [...existingRecords, ...newRecords];

  // 计算汇总数据
  const currentNav = navMap.get(lastTradingDay) || 0;
  const summary = calculateSummary(allRecords, currentNav);

  return {
    newRecords,
    allRecords,
    summary,
    lastInvestDate: newRecords.length > 0
      ? newRecords[newRecords.length - 1].date
      : plan.lastInvestDate
  };
}

/**
 * 计算定投汇总数据
 * @param {Array} records - 定投记录
 * @param {Number} currentNav - 当前净值
 * @returns {Object|null}
 */
export function calculateSummary(records, currentNav) {
  if (!records || records.length === 0) {
    return null;
  }

  // 使用 parseFloat 确保数值类型，避免字符串累加问题
  const totalAmount = records.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalShares = records.reduce((sum, r) => sum + parseFloat(r.shares), 0);
  const currentNavNum = parseFloat(currentNav) || 0;
  const currentValue = totalShares * currentNavNum;
  const avgCost = totalShares > 0 ? totalAmount / totalShares : 0;
  const profit = currentValue - totalAmount;
  const profitRate = totalAmount > 0 ? (profit / totalAmount * 100) : 0;

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),       // 累计投入
    totalShares: parseFloat(totalShares.toFixed(2)),       // 累计份额
    currentValue: parseFloat(currentValue.toFixed(2)),     // 当前市值
    avgCost: parseFloat(avgCost.toFixed(4)),               // 定投均价
    profit: parseFloat(profit.toFixed(2)),                 // 累计收益
    profitRate: parseFloat(profitRate.toFixed(2)),         // 收益率
    investCount: records.length                            // 已执行期数
  };
}

/**
 * 合并定投份额到持仓
 * @param {Object} fund - 基金数据
 * @param {Number} newShares - 新增份额
 * @param {Number} newAmount - 新增投入
 * @returns {Object} 更新后的份额和成本
 */
export function mergeToHolding(fund, newShares, newAmount) {
  // 计算原有持仓成本
  const oldNum = parseFloat(fund.num) || 0;
  const oldCost = parseFloat(fund.cost) || 0;
  const oldAmount = oldNum * oldCost;

  // 合并计算
  const totalShares = oldNum + newShares;
  const totalAmount = oldAmount + newAmount;

  // 计算新的成本价
  const newCost = totalShares > 0 ? totalAmount / totalShares : 0;

  return {
    num: parseFloat(totalShares.toFixed(2)),
    cost: parseFloat(newCost.toFixed(4))
  };
}

/**
 * 获取一年前的日期
 * @returns {String} YYYY-MM-DD
 */
export function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return formatDate(date);
}

/**
 * 获取今天的日期
 * @returns {String} YYYY-MM-DD
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * 获取默认定投计划结构
 * @returns {Object}
 */
export function getDefaultInvestPlan() {
  return {
    enabled: false,
    status: 'paused',
    cycle: 'weekly',
    amount: 100,
    dayOfWeek: 1,      // 默认周一
    dayOfMonth: 1,     // 默认每月1号
    startDate: getToday(),
    lastInvestDate: null,
    terminatedDate: null
  };
}

/**
 * 验证定投计划
 * @param {Object} plan - 定投计划
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateInvestPlan(plan) {
  if (!plan) {
    return { valid: false, error: '定投计划为空' };
  }

  if (!plan.amount || plan.amount <= 0) {
    return { valid: false, error: '请输入有效的每期金额' };
  }

  if (!plan.startDate) {
    return { valid: false, error: '请选择开始日期' };
  }

  // 检查开始日期是否在一年内
  const oneYearAgo = getOneYearAgo();
  if (plan.startDate < oneYearAgo) {
    return { valid: false, error: '开始日期不能早于一年前' };
  }

  // 检查开始日期不能是未来
  const today = getToday();
  if (plan.startDate > today) {
    return { valid: false, error: '开始日期不能是未来日期' };
  }

  if (plan.cycle === 'weekly' && (!plan.dayOfWeek || plan.dayOfWeek < 1 || plan.dayOfWeek > 5)) {
    return { valid: false, error: '请选择每周定投日期' };
  }

  if (plan.cycle === 'monthly' && (!plan.dayOfMonth || plan.dayOfMonth < 1 || plan.dayOfMonth > 28)) {
    return { valid: false, error: '请选择每月定投日期' };
  }

  return { valid: true };
}

/**
 * 周几选项列表
 */
export const WEEK_DAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' }
];

/**
 * 每月日期选项列表（1-28号）
 */
export const MONTH_DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}号`
}));

/**
 * 定投周期选项列表
 */
export const CYCLE_OPTIONS = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' }
];
