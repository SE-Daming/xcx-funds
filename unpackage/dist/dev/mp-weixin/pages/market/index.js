"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const _sfc_main = {
  data() {
    return {
      activeTab: "index",
      indexData: [],
      industryData: [],
      northboundData: {
        hgt: 0,
        sgt: 0,
        total: 0
      },
      southboundData: {
        hgt: 0,
        sgt: 0,
        total: 0
      }
    };
  },
  onLoad() {
    this.loadData();
  },
  methods: {
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === "index" && this.indexData.length === 0) {
        this.loadIndexData();
      } else if (tab === "industry" && this.industryData.length === 0) {
        this.loadIndustryData();
      } else if (tab === "northbound" && this.northboundData.total === 0) {
        this.loadNorthboundData();
      } else if (tab === "southbound" && this.southboundData.total === 0) {
        this.loadSouthboundData();
      }
    },
    async loadData() {
      await this.loadIndexData();
      await this.loadIndustryData();
      await this.loadNorthboundData();
      await this.loadSouthboundData();
    },
    async loadIndexData() {
      try {
        const indexCodes = ["1.000001", "0.399001", "0.399006", "1.000300", "1.000688"];
        const result = await utils_fundApi.getIndexData(indexCodes);
        this.indexData = result.map((item) => ({
          name: item.f14,
          value: item.f2,
          change: item.f3
        }));
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/market/index.vue:186", "获取指数数据失败:", error);
        this.indexData = [
          { name: "上证指数", value: "3050.12", change: 0.56 },
          { name: "深证成指", value: "9821.34", change: -0.23 },
          { name: "创业板指", value: "2015.67", change: 1.23 },
          { name: "沪深300", value: "3856.78", change: 0.45 },
          { name: "科创50", value: "987.23", change: -0.12 }
        ];
      }
    },
    async loadIndustryData() {
      try {
        this.industryData = [
          { name: "酿酒行业", change: 2.34 },
          { name: "医疗器械", change: 1.87 },
          { name: "软件服务", change: -0.56 },
          { name: "证券", change: 0.89 },
          { name: "银行", change: 0.34 },
          { name: "房地产", change: -1.23 }
        ];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/market/index.vue:209", "获取行业数据失败:", error);
        this.industryData = [
          { name: "酿酒行业", change: 2.34 },
          { name: "医疗器械", change: 1.87 },
          { name: "软件服务", change: -0.56 },
          { name: "证券", change: 0.89 },
          { name: "银行", change: 0.34 },
          { name: "房地产", change: -1.23 }
        ];
      }
    },
    async loadNorthboundData() {
      try {
        this.northboundData = {
          hgt: 32.45,
          sgt: 45.67,
          total: 78.12
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/market/index.vue:230", "获取北向资金数据失败:", error);
        this.northboundData = {
          hgt: 32.45,
          sgt: 45.67,
          total: 78.12
        };
      }
    },
    async loadSouthboundData() {
      try {
        this.southboundData = {
          hgt: 12.34,
          sgt: 23.56,
          total: 35.9
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/market/index.vue:249", "获取南向资金数据失败:", error);
        this.southboundData = {
          hgt: 12.34,
          sgt: 23.56,
          total: 35.9
        };
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.activeTab === "index" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchTab("index")),
    c: $data.activeTab === "industry" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchTab("industry")),
    e: $data.activeTab === "northbound" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchTab("northbound")),
    g: $data.activeTab === "southbound" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchTab("southbound")),
    i: "tab-" + $data.activeTab,
    j: $data.activeTab === "index"
  }, $data.activeTab === "index" ? {
    k: common_vendor.f($data.indexData, (index, idx, i0) => {
      return {
        a: common_vendor.t(index.name),
        b: common_vendor.t(index.value),
        c: index.change > 0 ? 1 : "",
        d: index.change < 0 ? 1 : "",
        e: common_vendor.t(index.change > 0 ? "+" : ""),
        f: common_vendor.t(index.change),
        g: index.change > 0 ? 1 : "",
        h: index.change < 0 ? 1 : "",
        i: common_vendor.t(index.change > 0 ? "↑" : "↓"),
        j: idx,
        k: index.change > 0 ? 1 : "",
        l: index.change < 0 ? 1 : ""
      };
    })
  } : {}, {
    l: $data.activeTab === "industry"
  }, $data.activeTab === "industry" ? {
    m: common_vendor.f($data.industryData, (industry, idx, i0) => {
      return {
        a: common_vendor.t(idx + 1),
        b: common_vendor.t(industry.name),
        c: common_vendor.t(industry.change > 0 ? "+" : ""),
        d: common_vendor.t(industry.change),
        e: industry.change > 0 ? 1 : "",
        f: industry.change < 0 ? 1 : "",
        g: idx
      };
    })
  } : {}, {
    n: $data.activeTab === "northbound"
  }, $data.activeTab === "northbound" ? {
    o: common_vendor.t($data.northboundData.total > 0 ? "+" : ""),
    p: common_vendor.t($data.northboundData.total),
    q: $data.northboundData.total > 0 ? 1 : "",
    r: $data.northboundData.total < 0 ? 1 : "",
    s: common_vendor.t($data.northboundData.hgt > 0 ? "+" : ""),
    t: common_vendor.t($data.northboundData.hgt),
    v: $data.northboundData.hgt > 0 ? 1 : "",
    w: $data.northboundData.hgt < 0 ? 1 : "",
    x: common_vendor.t($data.northboundData.sgt > 0 ? "+" : ""),
    y: common_vendor.t($data.northboundData.sgt),
    z: $data.northboundData.sgt > 0 ? 1 : "",
    A: $data.northboundData.sgt < 0 ? 1 : ""
  } : {}, {
    B: $data.activeTab === "southbound"
  }, $data.activeTab === "southbound" ? {
    C: common_vendor.t($data.southboundData.total > 0 ? "+" : ""),
    D: common_vendor.t($data.southboundData.total),
    E: $data.southboundData.total > 0 ? 1 : "",
    F: $data.southboundData.total < 0 ? 1 : "",
    G: common_vendor.t($data.southboundData.hgt > 0 ? "+" : ""),
    H: common_vendor.t($data.southboundData.hgt),
    I: $data.southboundData.hgt > 0 ? 1 : "",
    J: $data.southboundData.hgt < 0 ? 1 : "",
    K: common_vendor.t($data.southboundData.sgt > 0 ? "+" : ""),
    L: common_vendor.t($data.southboundData.sgt),
    M: $data.southboundData.sgt > 0 ? 1 : "",
    N: $data.southboundData.sgt < 0 ? 1 : ""
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/market/index.js.map
