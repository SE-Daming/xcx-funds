"use strict";
const common_vendor = require("../common/vendor.js");
class DataManager {
  /**
   * 获取基金列表
   * @returns {Array} 基金列表
   */
  static getFundList() {
    try {
      const fundList = common_vendor.index.getStorageSync("fundList");
      return fundList || [];
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:16", "获取基金列表失败:", e);
      return [];
    }
  }
  /**
   * 保存基金列表
   * @param {Array} fundList - 基金列表
   * @returns {Boolean} 保存是否成功
   */
  static saveFundList(fundList) {
    try {
      common_vendor.index.setStorageSync("fundList", fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:31", "保存基金列表失败:", e);
      return false;
    }
  }
  /**
   * 添加基金到列表
   * @param {Object} fund - 基金对象
   * @returns {Boolean} 添加是否成功
   */
  static addFund(fund) {
    try {
      const fundList = this.getFundList();
      const exists = fundList.some((item) => item.code === fund.code);
      if (exists) {
        return false;
      }
      fundList.push(fund);
      common_vendor.index.setStorageSync("fundList", fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:55", "添加基金失败:", e);
      return false;
    }
  }
  /**
   * 更新基金信息
   * @param {string} fundCode - 基金代码
   * @param {Object} updateData - 更新的数据
   * @returns {Boolean} 更新是否成功
   */
  static updateFund(fundCode, updateData) {
    try {
      const fundList = this.getFundList();
      const fundIndex = fundList.findIndex((item) => item.code === fundCode);
      if (fundIndex === -1) {
        return false;
      }
      fundList[fundIndex] = { ...fundList[fundIndex], ...updateData };
      common_vendor.index.setStorageSync("fundList", fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:79", "更新基金失败:", e);
      return false;
    }
  }
  /**
   * 删除基金
   * @param {string} fundCode - 基金代码
   * @returns {Boolean} 删除是否成功
   */
  static removeFund(fundCode) {
    try {
      const fundList = this.getFundList();
      const filteredList = fundList.filter((item) => item.code !== fundCode);
      common_vendor.index.setStorageSync("fundList", filteredList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:97", "删除基金失败:", e);
      return false;
    }
  }
  /**
   * 获取应用设置
   * @returns {Object} 应用设置
   */
  static getSettings() {
    try {
      const settings = common_vendor.index.getStorageSync("fundSettings");
      return settings || {};
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:111", "获取设置失败:", e);
      return {};
    }
  }
  /**
   * 保存应用设置
   * @param {Object} settings - 应用设置
   * @returns {Boolean} 保存是否成功
   */
  static saveSettings(settings) {
    try {
      common_vendor.index.setStorageSync("fundSettings", settings);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:126", "保存设置失败:", e);
      return false;
    }
  }
  /**
   * 获取设备ID
   * @returns {string} 设备ID
   */
  static getDeviceId() {
    try {
      let deviceId = common_vendor.index.getStorageSync("deviceId");
      if (!deviceId) {
        deviceId = this.generateUUID();
        common_vendor.index.setStorageSync("deviceId", deviceId);
      }
      return deviceId;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:144", "获取设备ID失败:", e);
      return this.generateUUID();
    }
  }
  /**
   * 生成UUID
   * @returns {string} UUID字符串
   */
  static generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  /**
   * 导出数据
   * @returns {Object} 导出的数据对象
   */
  static exportData() {
    return {
      settings: this.getSettings(),
      fundList: this.getFundList(),
      version: "1.0.0",
      exportTime: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * 导入数据
   * @param {Object} data - 导入的数据对象
   * @returns {Boolean} 导入是否成功
   */
  static importData(data) {
    try {
      if (!data || typeof data !== "object") {
        common_vendor.index.__f__("error", "at utils/data-manager.js:182", "无效的导入数据");
        return false;
      }
      if (data.settings !== void 0) {
        this.saveSettings(data.settings);
      }
      if (data.fundList !== void 0) {
        this.saveFundList(data.fundList);
      }
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:197", "导入数据失败:", e);
      return false;
    }
  }
  /**
   * 清除所有数据
   * @returns {Boolean} 清除是否成功
   */
  static clearAllData() {
    try {
      common_vendor.index.removeStorageSync("fundList");
      common_vendor.index.removeStorageSync("fundSettings");
      common_vendor.index.removeStorageSync("deviceId");
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:213", "清除数据失败:", e);
      return false;
    }
  }
}
exports.DataManager = DataManager;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/data-manager.js.map
