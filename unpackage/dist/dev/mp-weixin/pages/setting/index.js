"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      settings: {
        showAmount: true,
        showGains: true,
        showCost: true,
        showCostRate: true,
        showGSZ: true,
        darkMode: false,
        sortType: "gszzl",
        sortOrder: "desc"
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
            const allData = utils_dataManager.DataManager.exportData();
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
                  let newFunds = [];
                  let newSettings = null;
                  let newGroups = [];
                  if (Array.isArray(importedData)) {
                    newFunds = importedData;
                  } else if (importedData && typeof importedData === "object") {
                    if (Array.isArray(importedData.fundList)) {
                      newFunds = importedData.fundList;
                    }
                    if (importedData.settings) {
                      newSettings = importedData.settings;
                    }
                    if (Array.isArray(importedData.groupList)) {
                      newGroups = importedData.groupList;
                    }
                  }
                  if (newFunds.length === 0 && !newSettings && newGroups.length === 0) {
                    throw new Error("未识别到有效的配置数据");
                  }
                  const normalizedFundList = newFunds.map((fund) => ({
                    code: String(fund.code || ""),
                    name: fund.name || "未知基金",
                    num: parseFloat(fund.num) || 0,
                    cost: parseFloat(fund.cost) || 0,
                    // 兼容新旧数据结构
                    groupIds: fund.groupIds || (fund.groupId ? [fund.groupId] : [])
                  })).filter((f) => f.code);
                  if (newSettings) {
                    utils_dataManager.DataManager.saveSettings(newSettings);
                    this.settings = newSettings;
                  }
                  if (normalizedFundList.length > 0) {
                    utils_dataManager.DataManager.saveFundList(normalizedFundList);
                  }
                  if (newGroups.length > 0) {
                    utils_dataManager.DataManager.saveGroupList(newGroups);
                  }
                  common_vendor.index.showToast({
                    title: "导入成功",
                    icon: "success"
                  });
                } catch (e) {
                  common_vendor.index.__f__("error", "at pages/setting/index.vue:168", "导入数据失败:", e);
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
                      const normalizedFund = {
                        code: String(fund.code),
                        name: fund.name || "未知基金",
                        num: parseFloat(fund.num) || 0,
                        cost: parseFloat(fund.cost) || 0,
                        // 兼容新旧数据结构
                        groupIds: fund.groupIds || (fund.groupId ? [fund.groupId] : [])
                      };
                      if (!existingCodes.has(normalizedFund.code)) {
                        currentFunds.push(normalizedFund);
                        existingCodes.add(normalizedFund.code);
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
                  common_vendor.index.__f__("error", "at pages/setting/index.vue:262", "新增配置失败:", e);
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
        content: "确定要退出吗？退出后所有本地数据将被清空。",
        success: (res) => {
          if (res.confirm) {
            const cleared = utils_dataManager.DataManager.clearAllData();
            if (cleared) {
              common_vendor.index.showToast({
                title: "数据已清空",
                icon: "success",
                duration: 1e3
              });
              common_vendor.index.$emit("fundDeleted");
              common_vendor.index.$emit("settingsChanged");
              setTimeout(() => {
                common_vendor.index.reLaunch({
                  url: "/pages/index/index"
                });
              }, 1e3);
            } else {
              common_vendor.index.showToast({
                title: "清空失败",
                icon: "none"
              });
            }
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
