"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      title: "基金助手",
      isEditMode: false,
      showAmount: false,
      showGains: false,
      showCost: false,
      showCostRate: false,
      showGSZ: false,
      fundList: [],
      totalTodayGains: 0,
      totalHoldGains: 0,
      totalCost: 0,
      totalAmount: 0,
      deviceId: ""
    };
  },
  onLoad() {
    this.loadSettings();
    this.loadDeviceId();
    this.loadFundList();
  },
  onShow() {
    this.loadFundList();
  },
  created() {
    common_vendor.index.$on("fundUpdated", (data) => {
      this.loadFundList();
    });
    common_vendor.index.$on("fundAdded", (data) => {
      this.loadFundList();
    });
    common_vendor.index.$on("fundDeleted", (data) => {
      this.loadFundList();
    });
    common_vendor.index.$on("settingsChanged", (settings) => {
      this.loadSettings();
      this.loadFundList();
    });
  },
  beforeDestroy() {
    common_vendor.index.$off("fundUpdated");
    common_vendor.index.$off("fundAdded");
    common_vendor.index.$off("fundDeleted");
    common_vendor.index.$off("settingsChanged");
  },
  methods: {
    loadDeviceId() {
      this.deviceId = utils_dataManager.DataManager.getDeviceId();
    },
    loadSettings() {
      const settings = utils_dataManager.DataManager.getSettings();
      this.showAmount = settings.showAmount || false;
      this.showGains = settings.showGains || false;
      this.showCost = settings.showCost || false;
      this.showCostRate = settings.showCostRate || false;
      this.showGSZ = settings.showGSZ || false;
    },
    loadFundList() {
      this.fundList = utils_dataManager.DataManager.getFundList();
      if (this.fundList.length > 0) {
        let todayGains = 0;
        let holdGains = 0;
        let totalCost = 0;
        let totalAmount = 0;
        this.fundList.forEach((fund) => {
          if (fund.gains)
            todayGains += parseFloat(fund.gains);
          if (fund.costGains)
            holdGains += parseFloat(fund.costGains);
          if (fund.cost && fund.num)
            totalCost += fund.cost * fund.num;
          if (fund.amount)
            totalAmount += parseFloat(fund.amount);
        });
        this.totalTodayGains = todayGains;
        this.totalHoldGains = holdGains;
        this.totalCost = totalCost;
        this.totalAmount = totalAmount;
        this.fetchFundData();
      } else {
        this.totalTodayGains = 0;
        this.totalHoldGains = 0;
        this.totalCost = 0;
        this.totalAmount = 0;
      }
    },
    async fetchFundData() {
      if (this.fundList.length === 0)
        return;
      try {
        const fundCodes = this.fundList.map((fund) => fund.code);
        const result = await utils_fundApi.getFundData(fundCodes, this.deviceId);
        const apiData = result.Datas || [];
        let todayGains = 0;
        let holdGains = 0;
        let totalCost = 0;
        let totalAmount = 0;
        this.fundList = this.fundList.map((localFund) => {
          const apiFund = apiData.find((item) => item.fundcode === localFund.code);
          if (apiFund) {
            const updatedFund = {
              ...localFund,
              name: apiFund.name,
              gsz: apiFund.gsz,
              // 估算净值
              gszzl: apiFund.gszzl,
              // 估算涨跌幅
              dwjz: apiFund.dwjz,
              // 单位净值
              jzrq: apiFund.jzrq,
              // 净值日期
              gztime: apiFund.gztime
              // 估值时间
            };
            if (localFund.num > 0) {
              const nav = parseFloat(apiFund.dwjz || apiFund.gsz || 0);
              const amount = localFund.num * nav;
              updatedFund.amount = amount;
              totalAmount += amount;
              const gains = amount * parseFloat(apiFund.gszzl || 0) / 100;
              updatedFund.gains = gains;
              todayGains += gains;
              if (localFund.cost > 0) {
                const costGains = (nav - localFund.cost) * localFund.num;
                updatedFund.costGains = costGains;
                holdGains += costGains;
                const fundTotalCost = localFund.cost * localFund.num;
                if (fundTotalCost > 0) {
                  updatedFund.costGainsRate = (costGains / fundTotalCost * 100).toFixed(2);
                }
                totalCost += fundTotalCost;
              }
            }
            return updatedFund;
          }
          return localFund;
        });
        this.totalTodayGains = todayGains;
        this.totalHoldGains = holdGains;
        this.totalCost = totalCost;
        this.totalAmount = totalAmount;
        utils_dataManager.DataManager.saveFundList(this.fundList);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:331", "获取基金数据失败:", error);
        common_vendor.index.showToast({
          title: "刷新失败",
          icon: "none"
        });
      }
    },
    refreshData() {
      common_vendor.index.showLoading({
        title: "刷新中..."
      });
      this.fetchFundData().finally(() => {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "刷新成功",
          icon: "success"
        });
      });
    },
    goToAddFund() {
      common_vendor.index.navigateTo({
        url: "/pages/fund/add"
      });
    },
    goToFundDetail(fund) {
      if (this.isEditMode)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/fund/detail?code=${fund.code}`
      });
    },
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
    },
    goToMarket() {
      common_vendor.index.navigateTo({
        url: "/pages/market/index"
      });
    },
    goToSettings() {
      common_vendor.index.navigateTo({
        url: "/pages/setting/index"
      });
    },
    editFund(fund, index) {
      common_vendor.index.navigateTo({
        url: `/pages/fund/edit?code=${fund.code}`
      });
      this.isEditMode = false;
    },
    deleteFund(index) {
      const fund = this.fundList[index];
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除 ${fund.name} 吗？`,
        success: (res) => {
          if (res.confirm) {
            utils_dataManager.DataManager.removeFund(fund.code);
            this.fundList.splice(index, 1);
            this.loadFundList();
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.showGains
  }, $data.showGains ? common_vendor.e({
    b: common_vendor.o((...args) => $options.refreshData && $options.refreshData(...args)),
    c: common_vendor.t($data.totalTodayGains > 0 ? "+" : ""),
    d: common_vendor.t($data.totalTodayGains.toFixed(2)),
    e: $data.totalTodayGains >= 0 ? 1 : "",
    f: $data.totalTodayGains < 0 ? 1 : "",
    g: common_vendor.t($data.totalHoldGains > 0 ? "+" : ""),
    h: common_vendor.t($data.totalHoldGains.toFixed(2)),
    i: $data.totalHoldGains >= 0 ? 1 : "",
    j: $data.totalHoldGains < 0 ? 1 : "",
    k: $data.totalCost > 0
  }, $data.totalCost > 0 ? {
    l: common_vendor.t($data.totalHoldGains > 0 ? "+" : ""),
    m: common_vendor.t(($data.totalHoldGains / $data.totalCost * 100).toFixed(2)),
    n: $data.totalHoldGains >= 0 ? 1 : "",
    o: $data.totalHoldGains < 0 ? 1 : ""
  } : {}, {
    p: common_vendor.t($data.totalAmount.toFixed(2))
  }) : {}, {
    q: common_vendor.o((...args) => $options.goToAddFund && $options.goToAddFund(...args)),
    r: common_vendor.o((...args) => $options.goToMarket && $options.goToMarket(...args)),
    s: $data.isEditMode ? 1 : "",
    t: common_vendor.t($data.isEditMode ? "完成" : "编辑"),
    v: common_vendor.o((...args) => $options.toggleEditMode && $options.toggleEditMode(...args)),
    w: common_vendor.o((...args) => $options.goToSettings && $options.goToSettings(...args)),
    x: $data.fundList.length > 0
  }, $data.fundList.length > 0 ? {
    y: common_vendor.t($data.fundList.length)
  } : {}, {
    z: common_vendor.f($data.fundList, (fund, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(fund.name),
        b: common_vendor.t(fund.code),
        c: fund.dwjz
      }, fund.dwjz ? {
        d: common_vendor.t(fund.dwjz)
      } : {}, {
        e: common_vendor.t(fund.gszzl ? (fund.gszzl >= 0 ? "+" : "") + fund.gszzl + "%" : "--"),
        f: fund.gszzl >= 0 ? 1 : "",
        g: fund.gszzl < 0 ? 1 : ""
      }, $data.showGSZ ? {
        h: common_vendor.t(fund.gsz || "--")
      } : {}, $data.showGains || $data.showCost || $data.showAmount ? common_vendor.e({
        i: $data.showGains
      }, $data.showGains ? {
        j: common_vendor.t(fund.gains ? (fund.gains >= 0 ? "+" : "") + fund.gains.toFixed(2) : "--"),
        k: fund.gains >= 0 ? 1 : "",
        l: fund.gains < 0 ? 1 : ""
      } : {}, {
        m: $data.showCost
      }, $data.showCost ? {
        n: common_vendor.t(fund.costGains ? (fund.costGains >= 0 ? "+" : "") + fund.costGains.toFixed(2) : "--"),
        o: fund.costGains >= 0 ? 1 : "",
        p: fund.costGains < 0 ? 1 : ""
      } : {}, {
        q: $data.showAmount
      }, $data.showAmount ? {
        r: common_vendor.t(fund.amount ? fund.amount.toLocaleString("zh", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) : "--")
      } : {}) : {}, $data.isEditMode ? {
        s: common_vendor.o(($event) => $options.editFund(fund, index), fund.code),
        t: common_vendor.o(($event) => $options.deleteFund(index), fund.code),
        v: common_vendor.o(() => {
        }, fund.code)
      } : {}, {
        w: fund.code,
        x: common_vendor.o(($event) => $options.goToFundDetail(fund), fund.code)
      });
    }),
    A: $data.showGSZ,
    B: $data.showGains || $data.showCost || $data.showAmount,
    C: $data.isEditMode,
    D: $data.fundList.length === 0
  }, $data.fundList.length === 0 ? {
    E: common_vendor.o((...args) => $options.goToAddFund && $options.goToAddFund(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
