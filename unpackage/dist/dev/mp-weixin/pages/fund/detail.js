"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const utils_dataManager = require("../../utils/data-manager.js");
const FundChart = () => "../../components/fund-chart/fund-chart.js";
common_vendor.index.__f__("log", "at pages/fund/detail.vue:94", "fund-api exports:", { getFundData: utils_fundApi.getFundData, getFundIntradayValuation: utils_fundApi.getFundIntradayValuation });
const _sfc_main = {
  components: {
    FundChart
  },
  data() {
    return {
      fundCode: "",
      fundDetail: {
        code: "",
        name: "",
        gsz: "",
        gszzl: "",
        dwjz: "",
        jzrq: "",
        gztime: "",
        num: 0,
        cost: 0
      },
      localFundInfo: null,
      deviceId: "",
      chartData: [],
      chartLabels: ["09:30", "11:30/13:00", "15:00"]
    };
  },
  computed: {
    chartColor() {
      if (this.chartData.length > 0) {
        const last = this.chartData[this.chartData.length - 1];
        return last >= 0 ? "#f5222d" : "#52c41a";
      }
      return "#2979ff";
    }
  },
  onLoad(options) {
    this.fundCode = options.code;
    this.loadDeviceId();
  },
  onShow() {
    if (this.fundCode) {
      this.loadFundDetail(this.fundCode);
      this.loadChartData(this.fundCode);
    }
  },
  methods: {
    loadDeviceId() {
      let deviceId = common_vendor.index.getStorageSync("deviceId");
      if (!deviceId) {
        deviceId = this.generateUUID();
        common_vendor.index.setStorageSync("deviceId", deviceId);
      }
      this.deviceId = deviceId;
    },
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    },
    formatTime(timeStr) {
      if (!timeStr)
        return "--";
      if (timeStr.length > 10) {
        return timeStr.substring(11, 16);
      }
      return timeStr;
    },
    calculateProfit() {
      if (!this.fundDetail.num || !this.fundDetail.cost)
        return 0;
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const isUpdated = this.fundDetail.jzrq === todayStr;
      let currentPrice = 0;
      if (isUpdated) {
        currentPrice = parseFloat(this.fundDetail.dwjz) || 0;
      } else {
        currentPrice = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
      }
      if (currentPrice === 0)
        return 0;
      return (currentPrice - parseFloat(this.fundDetail.cost)) * parseFloat(this.fundDetail.num);
    },
    calculateProfitRate() {
      if (!this.fundDetail.num || !this.fundDetail.cost)
        return "0.00";
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const isUpdated = this.fundDetail.jzrq === todayStr;
      let currentPrice = 0;
      if (isUpdated) {
        currentPrice = parseFloat(this.fundDetail.dwjz) || 0;
      } else {
        currentPrice = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
      }
      const cost = parseFloat(this.fundDetail.cost);
      if (currentPrice === 0 || cost === 0)
        return "0.00";
      const rate = (currentPrice - cost) / cost * 100;
      return (rate > 0 ? "+" : "") + rate.toFixed(2);
    },
    async loadFundDetail(code) {
      try {
        const fundList = utils_dataManager.DataManager.getFundList();
        this.localFundInfo = fundList.find((item) => item.code === code) || null;
        const result = await utils_fundApi.getFundData([code], this.deviceId);
        const apiData = result.Datas || [];
        if (apiData.length > 0) {
          const apiFund = apiData[0];
          this.fundDetail = {
            code: apiFund.fundcode,
            name: apiFund.name,
            gsz: apiFund.gsz,
            gszzl: apiFund.gszzl,
            dwjz: apiFund.dwjz,
            jzrq: apiFund.jzrq,
            gztime: apiFund.gztime,
            num: this.localFundInfo ? this.localFundInfo.num : 0,
            cost: this.localFundInfo ? this.localFundInfo.cost : 0
          };
        } else if (this.localFundInfo) {
          this.fundDetail = {
            ...this.localFundInfo,
            gsz: "",
            gszzl: "",
            dwjz: "",
            jzrq: "",
            gztime: ""
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fund/detail.vue:247", "加载基金详情失败:", error);
      } finally {
      }
    },
    async loadChartData(code) {
      try {
        const data = await utils_fundApi.getFundIntradayValuation(code);
        if (data && data.length > 0) {
          this.chartData = data.map((item) => item.change);
        } else {
          this.chartData = [];
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/fund/detail.vue:262", "获取图表数据失败", e);
        this.chartData = [];
      }
    },
    editFund() {
      common_vendor.index.navigateTo({
        url: `/pages/fund/edit?code=${this.fundCode}`
      });
    },
    deleteFund() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除 ${this.fundDetail.name} 吗？`,
        success: (res) => {
          if (res.confirm) {
            utils_dataManager.DataManager.removeFund(this.fundCode);
            common_vendor.index.showToast({
              title: "删除成功",
              icon: "success"
            });
            common_vendor.index.$emit("fundDeleted", { fundCode: this.fundCode });
            setTimeout(() => {
              common_vendor.index.navigateBack();
            }, 1500);
          }
        }
      });
    }
  }
};
if (!Array) {
  const _easycom_fund_chart2 = common_vendor.resolveComponent("fund-chart");
  _easycom_fund_chart2();
}
const _easycom_fund_chart = () => "../../components/fund-chart/fund-chart.js";
if (!Math) {
  _easycom_fund_chart();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.fundDetail.name),
    b: common_vendor.t($data.fundDetail.code),
    c: common_vendor.t($data.fundDetail.gszzl !== null && $data.fundDetail.gszzl !== void 0 ? ($data.fundDetail.gszzl > 0 ? "+" : "") + $data.fundDetail.gszzl + "%" : "--"),
    d: $data.fundDetail.gszzl > 0 ? 1 : "",
    e: $data.fundDetail.gszzl < 0 ? 1 : "",
    f: common_vendor.t($data.fundDetail.gsz || "--"),
    g: common_vendor.t($data.fundDetail.gztime ? $options.formatTime($data.fundDetail.gztime) : "--"),
    h: common_vendor.t($data.fundDetail.dwjz || "--"),
    i: common_vendor.t($data.fundDetail.jzrq || "--"),
    j: common_vendor.t($data.fundDetail.num || 0),
    k: common_vendor.t($data.fundDetail.cost || 0),
    l: $data.fundDetail.num > 0
  }, $data.fundDetail.num > 0 ? {
    m: common_vendor.t(($data.fundDetail.num * ($data.fundDetail.jzrq === (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) ? parseFloat($data.fundDetail.dwjz) || 0 : parseFloat($data.fundDetail.gsz) || parseFloat($data.fundDetail.dwjz) || 0)).toFixed(2)),
    n: common_vendor.t($options.calculateProfit() > 0 ? "+" : ""),
    o: common_vendor.t($options.calculateProfit().toFixed(2)),
    p: $options.calculateProfit() >= 0 ? 1 : "",
    q: $options.calculateProfit() < 0 ? 1 : "",
    r: common_vendor.t($options.calculateProfitRate()),
    s: $options.calculateProfitRate() >= 0 ? 1 : "",
    t: $options.calculateProfitRate() < 0 ? 1 : ""
  } : {}, {
    v: common_vendor.p({
      data: $data.chartData,
      labels: $data.chartLabels,
      color: $options.chartColor
    }),
    w: common_vendor.o((...args) => $options.editFund && $options.editFund(...args)),
    x: common_vendor.o((...args) => $options.deleteFund && $options.deleteFund(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/fund/detail.js.map
