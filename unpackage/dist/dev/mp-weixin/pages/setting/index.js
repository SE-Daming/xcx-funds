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
      this.applyTheme();
    },
    toggleSetting(settingName) {
      this.settings[settingName] = !this.settings[settingName];
      this.saveSettings();
    },
    toggleTheme() {
      this.settings.darkMode = !this.settings.darkMode;
      this.saveSettings();
      this.applyTheme();
    },
    applyTheme() {
      if (this.settings.darkMode) {
        common_vendor.index.setNavigationBarColor({
          frontColor: "#ffffff",
          backgroundColor: "#2c3e50"
        });
      } else {
        common_vendor.index.setNavigationBarColor({
          frontColor: "#000000",
          backgroundColor: "#F8F8F8"
        });
      }
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
                    this.applyTheme();
                    common_vendor.index.showToast({
                      title: "导入成功",
                      icon: "success"
                    });
                  } else {
                    throw new Error("配置格式不正确");
                  }
                } catch (e) {
                  common_vendor.index.__f__("error", "at pages/setting/index.vue:186", "导入数据失败:", e);
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
    showAbout() {
      common_vendor.index.showModal({
        title: "关于基金助手",
        content: "基金助手小程序版本 v1.0.0\n帮助您实时跟踪基金投资情况\n\n韭菜计算助手团队",
        showCancel: false,
        confirmText: "确定"
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
    k: $data.settings.darkMode,
    l: common_vendor.o((...args) => $options.toggleTheme && $options.toggleTheme(...args)),
    m: common_vendor.o((...args) => $options.exportData && $options.exportData(...args)),
    n: common_vendor.o((...args) => $options.importData && $options.importData(...args)),
    o: common_vendor.o((...args) => $options.showAbout && $options.showAbout(...args)),
    p: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/setting/index.js.map
