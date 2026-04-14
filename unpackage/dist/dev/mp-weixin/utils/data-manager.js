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
      const defaultSettings = {
        showAmount: true,
        showGains: true,
        showCost: true,
        showCostRate: true,
        showGSZ: true,
        darkMode: false,
        sortType: "gszzl",
        // 默认按估算收益率排序
        sortOrder: "desc"
        // 默认降序
      };
      return settings ? { ...defaultSettings, ...settings } : defaultSettings;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:121", "获取设置失败:", e);
      return {
        showAmount: true,
        showGains: true,
        showCost: true,
        showCostRate: true,
        showGSZ: true,
        darkMode: false,
        sortType: "gszzl",
        sortOrder: "desc"
      };
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
      common_vendor.index.__f__("error", "at utils/data-manager.js:145", "保存设置失败:", e);
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
      common_vendor.index.__f__("error", "at utils/data-manager.js:163", "获取设备ID失败:", e);
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
   * 获取分组列表
   * @returns {Array} 分组列表
   */
  static getGroupList() {
    try {
      const groupList = common_vendor.index.getStorageSync("groupList");
      return groupList || [];
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:189", "获取分组列表失败:", e);
      return [];
    }
  }
  /**
   * 保存分组列表
   * @param {Array} groupList - 分组列表
   * @returns {Boolean} 保存是否成功
   */
  static saveGroupList(groupList) {
    try {
      common_vendor.index.setStorageSync("groupList", groupList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:204", "保存分组列表失败:", e);
      return false;
    }
  }
  /**
   * 添加分组
   * @param {Object} group - 分组对象 { name, order }
   * @returns {Object|null} 添加成功返回分组对象，失败返回 null
   */
  static addGroup(group) {
    try {
      const groupList = this.getGroupList();
      const newGroup = {
        id: "group_" + Date.now(),
        name: group.name,
        order: groupList.length
      };
      groupList.push(newGroup);
      common_vendor.index.setStorageSync("groupList", groupList);
      return newGroup;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:226", "添加分组失败:", e);
      return null;
    }
  }
  /**
   * 更新分组
   * @param {string} groupId - 分组ID
   * @param {Object} updateData - 更新的数据
   * @returns {Boolean} 更新是否成功
   */
  static updateGroup(groupId, updateData) {
    try {
      const groupList = this.getGroupList();
      const groupIndex = groupList.findIndex((item) => item.id === groupId);
      if (groupIndex === -1) {
        return false;
      }
      groupList[groupIndex] = { ...groupList[groupIndex], ...updateData };
      common_vendor.index.setStorageSync("groupList", groupList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:250", "更新分组失败:", e);
      return false;
    }
  }
  /**
   * 删除分组
   * @param {string} groupId - 分组ID
   * @returns {Boolean} 删除是否成功
   */
  static removeGroup(groupId) {
    try {
      const groupList = this.getGroupList();
      const filteredList = groupList.filter((item) => item.id !== groupId);
      common_vendor.index.setStorageSync("groupList", filteredList);
      const fundList = this.getFundList();
      fundList.forEach((fund) => {
        if (fund.groupIds && Array.isArray(fund.groupIds)) {
          fund.groupIds = fund.groupIds.filter((id) => id !== groupId);
        }
        if (fund.groupId === groupId) {
          fund.groupId = "";
        }
      });
      this.saveFundList(fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:281", "删除分组失败:", e);
      return false;
    }
  }
  /**
   * 将基金添加到分组
   * @param {string} fundCode - 基金代码
   * @param {string} groupId - 分组ID
   * @returns {Boolean} 添加是否成功
   */
  static addFundToGroup(fundCode, groupId) {
    try {
      const fundList = this.getFundList();
      const fundIndex = fundList.findIndex((item) => item.code === fundCode);
      if (fundIndex === -1) {
        return false;
      }
      const fund = fundList[fundIndex];
      if (!fund.groupIds) {
        fund.groupIds = fund.groupId ? [fund.groupId] : [];
        delete fund.groupId;
      }
      if (!fund.groupIds.includes(groupId)) {
        fund.groupIds.push(groupId);
      }
      common_vendor.index.setStorageSync("fundList", fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:315", "添加基金到分组失败:", e);
      return false;
    }
  }
  /**
   * 将基金从分组中移除
   * @param {string} fundCode - 基金代码
   * @param {string} groupId - 分组ID
   * @returns {Boolean} 移除是否成功
   */
  static removeFundFromGroup(fundCode, groupId) {
    try {
      const fundList = this.getFundList();
      const fundIndex = fundList.findIndex((item) => item.code === fundCode);
      if (fundIndex === -1) {
        return false;
      }
      const fund = fundList[fundIndex];
      if (!fund.groupIds) {
        fund.groupIds = fund.groupId ? [fund.groupId] : [];
        delete fund.groupId;
      }
      fund.groupIds = fund.groupIds.filter((id) => id !== groupId);
      common_vendor.index.setStorageSync("fundList", fundList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:346", "从分组移除基金失败:", e);
      return false;
    }
  }
  /**
   * 检查基金是否在指定分组中
   * @param {Object} fund - 基金对象
   * @param {string} groupId - 分组ID
   * @returns {Boolean}
   */
  static isFundInGroup(fund, groupId) {
    if (fund.groupIds && Array.isArray(fund.groupIds)) {
      return fund.groupIds.includes(groupId);
    }
    if (fund.groupId) {
      return fund.groupId === groupId;
    }
    return false;
  }
  /**
   * 更新分组排序
   * @param {Array} orderedIds - 排序后的分组ID数组
   * @returns {Boolean} 更新是否成功
   */
  static reorderGroups(orderedIds) {
    try {
      const groupList = this.getGroupList();
      const reorderedList = [];
      orderedIds.forEach((id, index) => {
        const group = groupList.find((g) => g.id === id);
        if (group) {
          reorderedList.push({ ...group, order: index });
        }
      });
      common_vendor.index.setStorageSync("groupList", reorderedList);
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:387", "更新分组排序失败:", e);
      return false;
    }
  }
  /**
   * 导出数据
   * @returns {Object} 导出的数据对象
   */
  static exportData() {
    return {
      settings: this.getSettings(),
      fundList: this.getFundList(),
      groupList: this.getGroupList(),
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
        common_vendor.index.__f__("error", "at utils/data-manager.js:414", "无效的导入数据");
        return false;
      }
      if (data.settings !== void 0) {
        this.saveSettings(data.settings);
      }
      if (data.fundList !== void 0) {
        this.saveFundList(data.fundList);
      }
      if (data.groupList !== void 0) {
        this.saveGroupList(data.groupList);
      }
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:433", "导入数据失败:", e);
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
      common_vendor.index.removeStorageSync("groupList");
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/data-manager.js:450", "清除数据失败:", e);
      return false;
    }
  }
}
exports.DataManager = DataManager;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/data-manager.js.map
