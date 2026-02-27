"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      searchKeyword: "",
      searchResults: [],
      selectedFunds: []
    };
  },
  methods: {
    async searchFunds(e) {
      const keyword = e.detail.value.trim();
      if (!keyword) {
        this.searchResults = [];
        return;
      }
      try {
        const results = await utils_fundApi.searchFunds(keyword);
        this.searchResults = results.slice(0, 10);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fund/add.vue:68", "搜索基金失败:", error);
        common_vendor.index.showToast({
          title: "搜索失败",
          icon: "none"
        });
      }
    },
    async handleSearch() {
      const keyword = this.searchKeyword.trim();
      if (!keyword)
        return;
      try {
        const results = await utils_fundApi.searchFunds(keyword);
        this.searchResults = results.slice(0, 10);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fund/add.vue:84", "搜索基金失败:", error);
        common_vendor.index.showToast({
          title: "搜索失败",
          icon: "none"
        });
      }
    },
    selectFund(fund) {
      const exists = this.selectedFunds.some((item) => item.code === fund.code);
      if (!exists) {
        this.selectedFunds.push(fund);
      } else {
        common_vendor.index.showToast({
          title: "该基金已选择",
          icon: "none"
        });
      }
    },
    removeFund(index) {
      this.selectedFunds.splice(index, 1);
    },
    addSelectedFunds() {
      if (this.selectedFunds.length === 0) {
        common_vendor.index.showToast({
          title: "请先选择基金",
          icon: "none"
        });
        return;
      }
      const existingFunds = utils_dataManager.DataManager.getFundList();
      const newFunds = [];
      this.selectedFunds.forEach((selectedFund) => {
        const exists = existingFunds.some((existingFund) => existingFund.code === selectedFund.code);
        if (!exists) {
          newFunds.push({
            code: selectedFund.code,
            name: selectedFund.name,
            num: 0,
            // 默认持有份额为0
            cost: 0
            // 默认持仓成本为0
          });
        }
      });
      if (newFunds.length === 0) {
        common_vendor.index.showToast({
          title: "所选基金已在列表中",
          icon: "none"
        });
        return;
      }
      newFunds.forEach((fund) => {
        utils_dataManager.DataManager.addFund(fund);
      });
      common_vendor.index.showLoading({
        title: "添加中..."
      });
      setTimeout(() => {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: `成功添加${newFunds.length}只基金`,
          icon: "success"
        });
        common_vendor.index.$emit("fundAdded", { count: newFunds.length });
        this.selectedFunds = [];
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }, 1e3);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.searchKeyword = $event.detail.value, (...args) => $options.searchFunds && $options.searchFunds(...args)]),
    b: common_vendor.o((...args) => $options.handleSearch && $options.handleSearch(...args)),
    c: $data.searchKeyword,
    d: common_vendor.o((...args) => $options.handleSearch && $options.handleSearch(...args)),
    e: $data.searchResults.length > 0
  }, $data.searchResults.length > 0 ? {
    f: common_vendor.f($data.searchResults, (fund, index, i0) => {
      return {
        a: common_vendor.t(fund.name),
        b: common_vendor.t(fund.code),
        c: index,
        d: common_vendor.o(($event) => $options.selectFund(fund), index)
      };
    })
  } : {}, {
    g: $data.selectedFunds.length > 0
  }, $data.selectedFunds.length > 0 ? {
    h: common_vendor.t($data.selectedFunds.length),
    i: common_vendor.f($data.selectedFunds, (fund, index, i0) => {
      return {
        a: common_vendor.t(fund.name),
        b: common_vendor.t(fund.code),
        c: common_vendor.o(($event) => $options.removeFund(index), index),
        d: index
      };
    })
  } : {}, {
    j: $data.selectedFunds.length > 0
  }, $data.selectedFunds.length > 0 ? {
    k: common_vendor.t($data.selectedFunds.length),
    l: common_vendor.o((...args) => $options.addSelectedFunds && $options.addSelectedFunds(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/fund/add.js.map
