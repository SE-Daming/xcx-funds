/**
 * 数据管理模块
 * 负责基金数据的本地存储和同步
 */

export class DataManager {
  /**
   * 获取基金列表
   * @returns {Array} 基金列表
   */
  static getFundList() {
    try {
      const fundList = uni.getStorageSync('fundList');
      return fundList || [];
    } catch (e) {
      console.error('获取基金列表失败:', e);
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
      uni.setStorageSync('fundList', fundList);
      return true;
    } catch (e) {
      console.error('保存基金列表失败:', e);
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
      
      // 检查是否已存在
      const exists = fundList.some(item => item.code === fund.code);
      if (exists) {
        return false; // 基金已存在
      }
      
      fundList.push(fund);
      uni.setStorageSync('fundList', fundList);
      return true;
    } catch (e) {
      console.error('添加基金失败:', e);
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
      const fundIndex = fundList.findIndex(item => item.code === fundCode);
      
      if (fundIndex === -1) {
        return false; // 基金不存在
      }
      
      fundList[fundIndex] = { ...fundList[fundIndex], ...updateData };
      uni.setStorageSync('fundList', fundList);
      return true;
    } catch (e) {
      console.error('更新基金失败:', e);
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
      const filteredList = fundList.filter(item => item.code !== fundCode);
      
      uni.setStorageSync('fundList', filteredList);
      return true;
    } catch (e) {
      console.error('删除基金失败:', e);
      return false;
    }
  }

  /**
   * 获取应用设置
   * @returns {Object} 应用设置
   */
  static getSettings() {
    try {
      const settings = uni.getStorageSync('fundSettings');
      const defaultSettings = {
        showAmount: true,
        showGains: true,
        showCost: true,
        showCostRate: true,
        showGSZ: true,
        darkMode: false,
        sortType: 'gszzl', // 默认按估算收益率排序
        sortOrder: 'desc'  // 默认降序
      };
      return settings ? { ...defaultSettings, ...settings } : defaultSettings;
    } catch (e) {
      console.error('获取设置失败:', e);
      return {
        showAmount: true,
        showGains: true,
        showCost: true,
        showCostRate: true,
        showGSZ: true,
        darkMode: false,
        sortType: 'gszzl',
        sortOrder: 'desc'
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
      uni.setStorageSync('fundSettings', settings);
      return true;
    } catch (e) {
      console.error('保存设置失败:', e);
      return false;
    }
  }

  /**
   * 获取设备ID
   * @returns {string} 设备ID
   */
  static getDeviceId() {
    try {
      let deviceId = uni.getStorageSync('deviceId');
      if (!deviceId) {
        deviceId = this.generateUUID();
        uni.setStorageSync('deviceId', deviceId);
      }
      return deviceId;
    } catch (e) {
      console.error('获取设备ID失败:', e);
      return this.generateUUID();
    }
  }

  /**
   * 生成UUID
   * @returns {string} UUID字符串
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 获取分组列表
   * @returns {Array} 分组列表
   */
  static getGroupList() {
    try {
      const groupList = uni.getStorageSync('groupList');
      return groupList || [];
    } catch (e) {
      console.error('获取分组列表失败:', e);
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
      uni.setStorageSync('groupList', groupList);
      return true;
    } catch (e) {
      console.error('保存分组列表失败:', e);
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
        id: 'group_' + Date.now(),
        name: group.name,
        order: groupList.length
      };
      groupList.push(newGroup);
      uni.setStorageSync('groupList', groupList);
      return newGroup;
    } catch (e) {
      console.error('添加分组失败:', e);
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
      const groupIndex = groupList.findIndex(item => item.id === groupId);

      if (groupIndex === -1) {
        return false;
      }

      groupList[groupIndex] = { ...groupList[groupIndex], ...updateData };
      uni.setStorageSync('groupList', groupList);
      return true;
    } catch (e) {
      console.error('更新分组失败:', e);
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
      const filteredList = groupList.filter(item => item.id !== groupId);
      uni.setStorageSync('groupList', filteredList);

      // 同时清除该分组下基金的 groupId
      const fundList = this.getFundList();
      fundList.forEach(fund => {
        if (fund.groupId === groupId) {
          fund.groupId = '';
        }
      });
      this.saveFundList(fundList);

      return true;
    } catch (e) {
      console.error('删除分组失败:', e);
      return false;
    }
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
        const group = groupList.find(g => g.id === id);
        if (group) {
          reorderedList.push({ ...group, order: index });
        }
      });
      uni.setStorageSync('groupList', reorderedList);
      return true;
    } catch (e) {
      console.error('更新分组排序失败:', e);
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
      version: '1.0.0',
      exportTime: new Date().toISOString()
    };
  }

  /**
   * 导入数据
   * @param {Object} data - 导入的数据对象
   * @returns {Boolean} 导入是否成功
   */
  static importData(data) {
    try {
      if (!data || typeof data !== 'object') {
        console.error('无效的导入数据');
        return false;
      }

      // 验证必要字段
      if (data.settings !== undefined) {
        this.saveSettings(data.settings);
      }

      if (data.fundList !== undefined) {
        this.saveFundList(data.fundList);
      }

      if (data.groupList !== undefined) {
        this.saveGroupList(data.groupList);
      }

      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  }

  /**
   * 清除所有数据
   * @returns {Boolean} 清除是否成功
   */
  static clearAllData() {
    try {
      uni.removeStorageSync('fundList');
      uni.removeStorageSync('fundSettings');
      uni.removeStorageSync('deviceId');
      uni.removeStorageSync('groupList');
      return true;
    } catch (e) {
      console.error('清除数据失败:', e);
      return false;
    }
  }
}
