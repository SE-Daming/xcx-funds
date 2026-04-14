"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      fundCode: "",
      fund: {
        code: "",
        name: "",
        num: "",
        cost: "",
        dwjz: 1,
        // 默认单位净值
        gsz: null,
        // 估算净值
        gszzl: 0
        // 估算涨跌幅
      },
      formData: {
        num: "",
        cost: ""
      },
      calculatedAmount: null,
      calculatedHoldGains: null,
      deviceId: "",
      groupList: [],
      selectedGroupIds: []
    };
  },
  onLoad(options) {
    this.fundCode = options.code;
    this.loadDeviceId();
    this.loadGroupList();
    this.loadFundDetail();
  },
  methods: {
    loadGroupList() {
      this.groupList = utils_dataManager.DataManager.getGroupList();
    },
    toggleGroup(groupId) {
      if (groupId === "") {
        this.selectedGroupIds = [];
      } else {
        const index = this.selectedGroupIds.indexOf(groupId);
        if (index > -1) {
          this.selectedGroupIds.splice(index, 1);
        } else {
          this.selectedGroupIds.push(groupId);
        }
      }
    },
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
    async loadFundDetail() {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      try {
        const fundList = utils_dataManager.DataManager.getFundList();
        const localFund = fundList.find((item) => item.code === this.fundCode);
        if (localFund) {
          if (localFund.groupIds && Array.isArray(localFund.groupIds)) {
            this.selectedGroupIds = [...localFund.groupIds];
          } else if (localFund.groupId) {
            this.selectedGroupIds = [localFund.groupId];
          }
        }
        const result = await utils_fundApi.getFundData([this.fundCode], this.deviceId);
        const apiData = result.Datas || [];
        if (apiData.length > 0) {
          const apiFund = apiData[0];
          this.fund = {
            code: apiFund.fundcode,
            name: apiFund.name,
            dwjz: apiFund.dwjz,
            gsz: apiFund.gsz,
            gszzl: apiFund.gszzl,
            num: localFund ? localFund.num : "",
            cost: localFund ? localFund.cost : "",
            groupId: localFund ? localFund.groupId : ""
          };
          this.formData = {
            num: localFund ? localFund.num : "",
            cost: localFund ? localFund.cost : ""
          };
        } else {
          if (localFund) {
            this.fund = localFund;
            this.formData = {
              num: localFund.num || "",
              cost: localFund.cost || ""
            };
          } else {
            this.fund = {
              code: this.fundCode,
              name: "未知基金",
              num: "",
              cost: "",
              dwjz: 1,
              gsz: null,
              gszzl: 0
            };
            this.formData = { num: "", cost: "" };
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fund/edit.vue:211", "加载基金详情失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    calculateAmount() {
      if (this.formData.num && this.fund.dwjz) {
        const amount = parseFloat(this.formData.num) * parseFloat(this.fund.dwjz);
        this.calculatedAmount = amount ? amount.toFixed(2) : null;
      }
    },
    calculateHoldGains() {
      if (this.formData.num && this.formData.cost && (this.fund.gsz || this.fund.dwjz)) {
        const currentPrice = this.fund.gsz || this.fund.dwjz || 1;
        const cost = parseFloat(this.formData.cost);
        const num = parseFloat(this.formData.num);
        if (!isNaN(currentPrice) && !isNaN(cost) && !isNaN(num)) {
          const gains = (currentPrice - cost) * num;
          this.calculatedHoldGains = gains ? gains.toFixed(2) : null;
        }
      }
    },
    cancel() {
      common_vendor.index.navigateBack();
    },
    save() {
      if (!this.validateForm()) {
        return;
      }
      const updateData = {
        num: this.formData.num,
        cost: this.formData.cost,
        groupIds: [...this.selectedGroupIds]
      };
      utils_dataManager.DataManager.updateFund(this.fundCode, updateData);
      common_vendor.index.showToast({
        title: "保存成功",
        icon: "success"
      });
      common_vendor.index.$emit("fundUpdated", { fundCode: this.fundCode });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
    },
    validateForm() {
      return true;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.fund.name),
    b: common_vendor.t($data.fund.code),
    c: common_vendor.o((...args) => $options.calculateAmount && $options.calculateAmount(...args)),
    d: $data.formData.num,
    e: common_vendor.o(($event) => $data.formData.num = $event.detail.value),
    f: common_vendor.o((...args) => $options.calculateHoldGains && $options.calculateHoldGains(...args)),
    g: $data.formData.cost,
    h: common_vendor.o(($event) => $data.formData.cost = $event.detail.value),
    i: $data.selectedGroupIds.length === 0 ? 1 : "",
    j: common_vendor.o(($event) => $options.toggleGroup("")),
    k: common_vendor.f($data.groupList, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.name),
        b: group.id,
        c: $data.selectedGroupIds.includes(group.id) ? 1 : "",
        d: common_vendor.o(($event) => $options.toggleGroup(group.id), group.id)
      };
    }),
    l: $data.formData.num && $data.formData.cost
  }, $data.formData.num && $data.formData.cost ? {
    m: common_vendor.t($data.calculatedAmount)
  } : {}, {
    n: $data.calculatedHoldGains !== null
  }, $data.calculatedHoldGains !== null ? {
    o: common_vendor.t($data.calculatedHoldGains >= 0 ? "+" : ""),
    p: common_vendor.t($data.calculatedHoldGains),
    q: $data.calculatedHoldGains >= 0 ? 1 : "",
    r: $data.calculatedHoldGains < 0 ? 1 : ""
  } : {}, {
    s: $data.fund.gsz
  }, $data.fund.gsz ? {
    t: common_vendor.t($data.fund.gsz)
  } : {}, {
    v: $data.fund.gszzl
  }, $data.fund.gszzl ? {
    w: common_vendor.t($data.fund.gszzl >= 0 ? "+" : ""),
    x: common_vendor.t($data.fund.gszzl),
    y: $data.fund.gszzl >= 0 ? 1 : "",
    z: $data.fund.gszzl < 0 ? 1 : ""
  } : {}, {
    A: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    B: common_vendor.o((...args) => $options.save && $options.save(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/fund/edit.js.map
