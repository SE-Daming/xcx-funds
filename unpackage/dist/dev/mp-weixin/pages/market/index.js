"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const _sfc_main = {
  data() {
    return {
      indexData: []
    };
  },
  onLoad() {
    this.loadIndexData();
  },
  methods: {
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
        common_vendor.index.__f__("error", "at pages/market/index.vue:46", "获取指数数据失败:", error);
        this.indexData = [
          { name: "上证指数", value: "3050.12", change: 0.56 },
          { name: "深证成指", value: "9821.34", change: -0.23 },
          { name: "创业板指", value: "2015.67", change: 1.23 },
          { name: "沪深300", value: "3856.78", change: 0.45 },
          { name: "科创50", value: "987.23", change: -0.12 }
        ];
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.indexData, (index, idx, i0) => {
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
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/market/index.js.map
