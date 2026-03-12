"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      settings: {
        showAmount: false,
        showGains: false,
        showCost: false,
        showCostRate: false,
        showGSZ: false,
        darkMode: false
      }
    };
  },
  onLoad() {
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      const savedSettings = utils_dataManager.DataManager.getSettings();
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }
    },
    toggleSetting(settingName) {
      this.settings[settingName] = !this.settings[settingName];
      this.saveSettings();
    },
    saveSettings() {
      utils_dataManager.DataManager.saveSettings(this.settings);
      common_vendor.index.$emit("settingsChanged", this.settings);
    },
    exportData() {
      common_vendor.index.showModal({
        title: "导出配置",
        content: "确定要导出配置数据吗？",
        success: (res) => {
          if (res.confirm) {
            const allData = {
              settings: this.settings,
              fundList: utils_dataManager.DataManager.getFundList(),
              version: "1.0.0"
            };
            const dataStr = JSON.stringify(allData, null, 2);
            common_vendor.index.setClipboardData({
              data: dataStr,
              success: () => {
                common_vendor.index.showToast({
                  title: "配置已复制到剪贴板",
                  icon: "success"
                });
              }
            });
          }
        }
      });
    },
    importData() {
      common_vendor.index.showModal({
        title: "导入配置",
        content: "请确保已将配置数据复制到剪贴板",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.getClipboardData({
              success: (res2) => {
                try {
                  const importedData = JSON.parse(res2.data);
                  if (importedData.settings && importedData.fundList !== void 0) {
                    utils_dataManager.DataManager.saveSettings(importedData.settings);
                    utils_dataManager.DataManager.saveFundList(importedData.fundList);
                    this.settings = importedData.settings;
                    common_vendor.index.showToast({
                      title: "导入成功",
                      icon: "success"
                    });
                  } else {
                    throw new Error("配置格式不正确");
                  }
                } catch (e) {
                  common_vendor.index.__f__("error", "at pages/setting/index.vue:151", "导入数据失败:", e);
                  common_vendor.index.showToast({
                    title: "导入失败：格式错误",
                    icon: "none"
                  });
                }
              },
              fail: () => {
                common_vendor.index.showToast({
                  title: "请先复制配置数据",
                  icon: "none"
                });
              }
            });
          }
        }
      });
    },
    appendData() {
      common_vendor.index.showModal({
        title: "新增配置",
        content: "请确保已将配置数据（JSON格式）复制到剪贴板，新数据将追加到现有列表中。",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.getClipboardData({
              success: (res2) => {
                try {
                  let newFunds = [];
                  let importedData = null;
                  try {
                    importedData = JSON.parse(res2.data);
                  } catch (e) {
                    throw new Error("剪贴板内容不是有效的JSON格式");
                  }
                  if (Array.isArray(importedData)) {
                    newFunds = importedData;
                  } else if (importedData && Array.isArray(importedData.fundList)) {
                    newFunds = importedData.fundList;
                  } else {
                    throw new Error("未识别到有效的基金列表数据");
                  }
                  if (newFunds.length === 0) {
                    common_vendor.index.showToast({ title: "没有包含任何基金数据", icon: "none" });
                    return;
                  }
                  const currentFunds = utils_dataManager.DataManager.getFundList();
                  const existingCodes = new Set(currentFunds.map((f) => f.code));
                  let addedCount = 0;
                  let skippedCount = 0;
                  newFunds.forEach((fund) => {
                    if (fund && fund.code) {
                      if (!existingCodes.has(fund.code)) {
                        currentFunds.push(fund);
                        existingCodes.add(fund.code);
                        addedCount++;
                      } else {
                        skippedCount++;
                      }
                    }
                  });
                  if (addedCount > 0) {
                    utils_dataManager.DataManager.saveFundList(currentFunds);
                    common_vendor.index.$emit("fundAdded", {});
                    common_vendor.index.showModal({
                      title: "新增成功",
                      content: `成功添加 ${addedCount} 个基金，跳过 ${skippedCount} 个已存在的基金。`,
                      showCancel: false
                    });
                  } else {
                    common_vendor.index.showModal({
                      title: "未添加",
                      content: `所有 ${skippedCount} 个基金均已存在。`,
                      showCancel: false
                    });
                  }
                } catch (e) {
                  common_vendor.index.__f__("error", "at pages/setting/index.vue:245", "新增配置失败:", e);
                  common_vendor.index.showModal({
                    title: "解析失败",
                    content: e.message || "数据格式错误",
                    showCancel: false
                  });
                }
              },
              fail: () => {
                common_vendor.index.showToast({
                  title: "读取剪贴板失败",
                  icon: "none"
                });
              }
            });
          }
        }
      });
    },
    goToMarket() {
      common_vendor.index.navigateTo({
        url: "/pages/market/index"
      });
    },
    logout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "确定要退出吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("userToken");
            common_vendor.index.showToast({
              title: "已退出",
              icon: "success"
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.settings.showGSZ,
    b: common_vendor.o(($event) => $options.toggleSetting("showGSZ")),
    c: $data.settings.showAmount,
    d: common_vendor.o(($event) => $options.toggleSetting("showAmount")),
    e: $data.settings.showGains,
    f: common_vendor.o(($event) => $options.toggleSetting("showGains")),
    g: $data.settings.showCost,
    h: common_vendor.o(($event) => $options.toggleSetting("showCost")),
    i: $data.settings.showCostRate,
    j: common_vendor.o(($event) => $options.toggleSetting("showCostRate")),
    k: common_vendor.o((...args) => $options.exportData && $options.exportData(...args)),
    l: common_vendor.o((...args) => $options.importData && $options.importData(...args)),
    m: common_vendor.o((...args) => $options.appendData && $options.appendData(...args)),
    n: common_vendor.o((...args) => $options.goToMarket && $options.goToMarket(...args)),
    o: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/setting/index.js.map
