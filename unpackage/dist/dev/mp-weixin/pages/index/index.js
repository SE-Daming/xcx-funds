"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_fundApi = require("../../utils/fund-api.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      title: "小蓝条",
      isEditMode: false,
      showAmount: false,
      showGains: false,
      showCost: false,
      showCostRate: false,
      showGSZ: false,
      allFundList: [],
      fundList: [],
      groupList: [],
      currentGroupId: "",
      totalTodayGains: 0,
      totalHoldGains: 0,
      totalCost: 0,
      totalAmount: 0,
      deviceId: "",
      lastUpdateDisplay: "",
      sortType: "none",
      sortOrder: "desc",
      sortTypeRange: ["预估收益", "持有收益", "预估收益率", "持有收益率", "持有金额"],
      sortTypeKeyRange: ["gains", "costGains", "gszzl", "costGainsRate", "amount"],
      sortOrderRange: ["降序", "升序"],
      sortOrderKeyRange: ["desc", "asc"],
      sortTypeIndex: 0,
      sortOrderIndex: 0,
      // 设置分组
      showMoveGroup: false,
      moveFund: null,
      moveSelectedGroupIds: []
    };
  },
  computed: {
    sortTypeLabel() {
      return this.sortTypeRange[this.sortTypeIndex] || "排序";
    },
    sortOrderLabel() {
      return this.sortOrderRange[this.sortOrderIndex] || "降序";
    },
    currentGroupName() {
      if (!this.currentGroupId)
        return "";
      const group = this.groupList.find((g) => g.id === this.currentGroupId);
      return group ? group.name : "";
    },
    filteredTodayGains() {
      return this.calculateGroupGains("gains");
    },
    filteredHoldGains() {
      return this.calculateGroupGains("costGains");
    },
    filteredCost() {
      return this.calculateGroupCost();
    },
    filteredAmount() {
      return this.calculateGroupAmount();
    }
  },
  onLoad() {
    this.loadSettings();
    this.loadDeviceId();
    this.loadGroupList();
    this.loadFundList();
  },
  onShow() {
    this.loadGroupList();
    this.loadFundList();
  },
  created() {
    common_vendor.index.$on("fundUpdated", () => this.loadFundList());
    common_vendor.index.$on("fundAdded", () => this.loadFundList());
    common_vendor.index.$on("fundDeleted", () => this.loadFundList());
    common_vendor.index.$on("settingsChanged", () => {
      this.loadSettings();
      this.loadFundList();
    });
    common_vendor.index.$on("groupChanged", () => this.loadGroupList());
  },
  beforeDestroy() {
    common_vendor.index.$off("fundUpdated");
    common_vendor.index.$off("fundAdded");
    common_vendor.index.$off("fundDeleted");
    common_vendor.index.$off("settingsChanged");
    common_vendor.index.$off("groupChanged");
  },
  methods: {
    loadDeviceId() {
      this.deviceId = utils_dataManager.DataManager.getDeviceId();
    },
    loadGroupList() {
      this.groupList = utils_dataManager.DataManager.getGroupList();
    },
    loadSettings() {
      const settings = utils_dataManager.DataManager.getSettings();
      this.showAmount = settings.showAmount || false;
      this.showGains = settings.showGains || false;
      this.showCost = settings.showCost || false;
      this.showCostRate = settings.showCostRate || false;
      this.showGSZ = settings.showGSZ || false;
      this.sortType = settings.sortType || "none";
      this.sortOrder = settings.sortOrder || "desc";
      const ti = this.sortTypeKeyRange.indexOf(this.sortType);
      this.sortTypeIndex = ti >= 0 ? ti : 0;
      const oi = this.sortOrderKeyRange.indexOf(this.sortOrder);
      this.sortOrderIndex = oi >= 0 ? oi : 0;
    },
    selectGroup(groupId) {
      this.currentGroupId = groupId;
      this.applyGroupFilter();
    },
    isFundInGroup(fund, groupId) {
      if (fund.groupIds && Array.isArray(fund.groupIds)) {
        return fund.groupIds.includes(groupId);
      }
      if (fund.groupId) {
        return fund.groupId === groupId;
      }
      return false;
    },
    getGroupFundCount(groupId) {
      return this.allFundList.filter((fund) => this.isFundInGroup(fund, groupId)).length;
    },
    getFundGroupName(fund) {
      if (!fund)
        return "";
      if (fund.groupIds && Array.isArray(fund.groupIds) && fund.groupIds.length > 0) {
        const names = fund.groupIds.map((id) => {
          const group = this.groupList.find((g) => g.id === id);
          return group ? group.name : "";
        }).filter((name) => name);
        return names.join("、");
      }
      if (fund.groupId) {
        const group = this.groupList.find((g) => g.id === fund.groupId);
        return group ? group.name : "";
      }
      return "";
    },
    goToGroupManage() {
      common_vendor.index.navigateTo({ url: "/pages/group/index" });
    },
    applyGroupFilter() {
      if (!this.currentGroupId) {
        this.fundList = [...this.allFundList];
      } else {
        this.fundList = this.allFundList.filter((fund) => this.isFundInGroup(fund, this.currentGroupId));
      }
      this.applySort();
    },
    calculateGroupGains(field) {
      let total = 0;
      const list = this.currentGroupId ? this.fundList : this.allFundList;
      list.forEach((fund) => {
        if (fund[field])
          total += parseFloat(fund[field]);
      });
      return total;
    },
    calculateGroupCost() {
      let total = 0;
      const list = this.currentGroupId ? this.fundList : this.allFundList;
      list.forEach((fund) => {
        if (fund.cost && fund.num)
          total += fund.cost * fund.num;
      });
      return total;
    },
    calculateGroupAmount() {
      let total = 0;
      const list = this.currentGroupId ? this.fundList : this.allFundList;
      list.forEach((fund) => {
        if (fund.amount)
          total += parseFloat(fund.amount);
      });
      return total;
    },
    loadFundList() {
      this.allFundList = utils_dataManager.DataManager.getFundList();
      this.applyGroupFilter();
      if (this.allFundList.length > 0) {
        this.fetchFundData();
      } else {
        this.totalTodayGains = 0;
        this.totalHoldGains = 0;
        this.totalCost = 0;
        this.totalAmount = 0;
      }
    },
    async fetchFundData() {
      if (this.allFundList.length === 0)
        return;
      try {
        const fundCodes = this.allFundList.map((fund) => fund.code);
        const result = await utils_fundApi.getFundData(fundCodes, this.deviceId);
        const apiData = result.Datas || [];
        this.lastUpdateDisplay = this.computeLastUpdateDisplay(apiData);
        let todayGains = 0;
        let holdGains = 0;
        let totalCost = 0;
        let totalAmount = 0;
        this.allFundList = this.allFundList.map((localFund) => {
          const apiFund = apiData.find((item) => item.fundcode === localFund.code);
          if (apiFund) {
            const updatedFund = {
              ...localFund,
              name: apiFund.name,
              gsz: apiFund.gsz,
              gszzl: apiFund.gszzl,
              dwjz: apiFund.dwjz,
              jzrq: apiFund.jzrq,
              gztime: apiFund.gztime
            };
            if (localFund.num > 0) {
              const dwjz = parseFloat(apiFund.dwjz || 0);
              const gsz = parseFloat(apiFund.gsz || 0);
              const gszzl = parseFloat(apiFund.gszzl || 0);
              const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
              const isUpdated = apiFund.jzrq === todayStr;
              const day = (/* @__PURE__ */ new Date()).getDay();
              const isWeekend = day === 0 || day === 6;
              const useUpdatedMode = isUpdated || isWeekend;
              let currentNav = useUpdatedMode ? dwjz : gsz || dwjz || 0;
              const amount = localFund.num * currentNav;
              updatedFund.amount = amount;
              totalAmount += amount;
              let gains = 0;
              if (useUpdatedMode) {
                const lastNav = currentNav / (1 + gszzl / 100);
                gains = (currentNav - lastNav) * localFund.num;
              } else {
                if (dwjz > 0) {
                  gains = (currentNav - dwjz) * localFund.num;
                } else {
                  gains = amount * gszzl / 100;
                }
              }
              updatedFund.gains = gains;
              todayGains += gains;
              if (localFund.cost > 0) {
                const costGains = (currentNav - localFund.cost) * localFund.num;
                updatedFund.costGains = costGains;
                holdGains += costGains;
                const fundTotalCost = localFund.cost * localFund.num;
                if (fundTotalCost > 0) {
                  updatedFund.costGainsRate = (costGains / fundTotalCost * 100).toFixed(2);
                }
                totalCost += fundTotalCost;
              }
            }
            return updatedFund;
          }
          return localFund;
        });
        this.totalTodayGains = todayGains;
        this.totalHoldGains = holdGains;
        this.totalCost = totalCost;
        this.totalAmount = totalAmount;
        utils_dataManager.DataManager.saveFundList(this.allFundList);
        this.applyGroupFilter();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:492", "获取基金数据失败:", error);
        common_vendor.index.showToast({ title: "刷新失败", icon: "none" });
      }
    },
    computeLastUpdateDisplay(apiData) {
      if (!apiData || apiData.length === 0)
        return "";
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const hasTodayNAV = apiData.some((f) => f.jzrq === todayStr);
      const toTs = (t) => {
        if (!t)
          return 0;
        if (t.length > 10) {
          const s = t.replace(/-/g, "/");
          const d = new Date(s);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        if (t.length === 5) {
          const d = /* @__PURE__ */ new Date(`${todayStr} ${t}:00`);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        return 0;
      };
      let maxTs = 0;
      let maxStr = "";
      apiData.forEach((f) => {
        if (f.gztime) {
          const ts = toTs(f.gztime);
          if (ts > maxTs) {
            maxTs = ts;
            const d = new Date(ts);
            const pad = (n) => n < 10 ? "0" + n : "" + n;
            maxStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        }
      });
      if (hasTodayNAV)
        return `${todayStr} 净值`;
      if (maxStr)
        return maxStr;
      let lastJz = "";
      apiData.forEach((f) => {
        if (f.jzrq && (!lastJz || f.jzrq > lastJz))
          lastJz = f.jzrq;
      });
      return lastJz ? `${lastJz} 净值` : "";
    },
    refreshData() {
      common_vendor.index.showLoading({ title: "刷新中..." });
      this.fetchFundData().finally(() => {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "刷新成功", icon: "success" });
      });
    },
    goToAddFund() {
      common_vendor.index.navigateTo({ url: "/pages/fund/add" });
    },
    showImportTutorial() {
      const prompt = "请识别图片中的基金持仓信息（基金代码、基金名称、持有份额、持仓成本价），并严格按以下 JSON 格式输出，不要包含任何多余文字：";
      const exampleJson = `{"fundList":[{"code":"000001","name":"基金名称示例","num":1234.56,"cost":1.0245}]}`;
      const content = '1. 截图你的基金持仓界面\n2. 发给豆包/DeepSeek，让它按提示词输出JSON\n3. 复制AI输出的JSON\n4. 打开"设置"→"新增/导入配置"导入';
      common_vendor.index.showModal({
        title: "一键导入教程",
        content,
        showCancel: true,
        cancelText: "复制",
        confirmText: "关闭",
        success: (res) => {
          if (res.cancel) {
            common_vendor.index.setClipboardData({
              data: `提示词：${prompt}

JSON示例：
${exampleJson}`,
              success: () => common_vendor.index.showToast({ title: "已复制", icon: "none" })
            });
          }
        }
      });
    },
    goToFundDetail(fund) {
      if (this.isEditMode)
        return;
      common_vendor.index.navigateTo({ url: `/pages/fund/detail?code=${fund.code}` });
    },
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
    },
    goToSettings() {
      common_vendor.index.navigateTo({ url: "/pages/setting/index" });
    },
    editFund(fund, index) {
      common_vendor.index.navigateTo({ url: `/pages/fund/edit?code=${fund.code}` });
      this.isEditMode = false;
    },
    deleteFund(index) {
      const fund = this.fundList[index];
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除 ${fund.name} 吗？`,
        success: (res) => {
          if (res.confirm) {
            utils_dataManager.DataManager.removeFund(fund.code);
            const allIndex = this.allFundList.findIndex((f) => f.code === fund.code);
            if (allIndex >= 0)
              this.allFundList.splice(allIndex, 1);
            this.fundList.splice(index, 1);
          }
        }
      });
    },
    setSort(type) {
      this.sortType = type;
      const settings = utils_dataManager.DataManager.getSettings();
      utils_dataManager.DataManager.saveSettings({ ...settings, sortType: type });
      this.applySort();
    },
    onSortTypeChange(e) {
      this.sortTypeIndex = Number(e.detail.value);
      this.setSort(this.sortTypeKeyRange[this.sortTypeIndex]);
    },
    setOrder(order) {
      this.sortOrder = order;
      const settings = utils_dataManager.DataManager.getSettings();
      utils_dataManager.DataManager.saveSettings({ ...settings, sortOrder: order });
      this.applySort();
    },
    applySort() {
      if (!this.sortType || this.sortType === "none")
        return;
      const key = this.sortType;
      const list = [...this.fundList];
      list.sort((a, b) => {
        const av = parseFloat(a[key] || 0);
        const bv = parseFloat(b[key] || 0);
        return this.sortOrder === "desc" ? bv - av : av - bv;
      });
      this.fundList = list;
    },
    // 设置分组
    showMoveGroupModal(fund) {
      this.moveFund = fund;
      if (fund.groupIds && Array.isArray(fund.groupIds)) {
        this.moveSelectedGroupIds = [...fund.groupIds];
      } else if (fund.groupId) {
        this.moveSelectedGroupIds = [fund.groupId];
      } else {
        this.moveSelectedGroupIds = [];
      }
      this.showMoveGroup = true;
    },
    closeMoveGroupModal() {
      this.showMoveGroup = false;
      this.moveFund = null;
      this.moveSelectedGroupIds = [];
    },
    toggleMoveGroup(groupId) {
      if (groupId === "") {
        this.moveSelectedGroupIds = [];
      } else {
        const index = this.moveSelectedGroupIds.indexOf(groupId);
        if (index > -1) {
          this.moveSelectedGroupIds.splice(index, 1);
        } else {
          this.moveSelectedGroupIds.push(groupId);
        }
      }
    },
    confirmMoveGroup() {
      if (!this.moveFund)
        return;
      const fund = this.allFundList.find((f) => f.code === this.moveFund.code);
      if (fund) {
        fund.groupIds = [...this.moveSelectedGroupIds];
        delete fund.groupId;
        utils_dataManager.DataManager.saveFundList(this.allFundList);
      }
      this.applyGroupFilter();
      common_vendor.index.showToast({ title: "设置成功", icon: "success" });
      this.closeMoveGroupModal();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.showGains
  }, $data.showGains ? common_vendor.e({
    b: common_vendor.t($data.lastUpdateDisplay || "--"),
    c: common_vendor.o((...args) => $options.refreshData && $options.refreshData(...args)),
    d: common_vendor.t($options.filteredTodayGains > 0 ? "+" : ""),
    e: common_vendor.t($options.filteredTodayGains.toFixed(2)),
    f: $options.filteredTodayGains >= 0 ? 1 : "",
    g: $options.filteredTodayGains < 0 ? 1 : "",
    h: common_vendor.t($options.filteredHoldGains > 0 ? "+" : ""),
    i: common_vendor.t($options.filteredHoldGains.toFixed(2)),
    j: $options.filteredHoldGains >= 0 ? 1 : "",
    k: $options.filteredHoldGains < 0 ? 1 : "",
    l: $options.filteredCost > 0
  }, $options.filteredCost > 0 ? {
    m: common_vendor.t($options.filteredHoldGains > 0 ? "+" : ""),
    n: common_vendor.t(($options.filteredHoldGains / $options.filteredCost * 100).toFixed(2)),
    o: $options.filteredHoldGains >= 0 ? 1 : "",
    p: $options.filteredHoldGains < 0 ? 1 : ""
  } : {}, {
    q: common_vendor.t($options.filteredAmount.toFixed(2))
  }) : {}, {
    r: common_vendor.t($data.allFundList.length),
    s: $data.currentGroupId === "" ? 1 : "",
    t: common_vendor.o(($event) => $options.selectGroup("")),
    v: common_vendor.f($data.groupList, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.name),
        b: common_vendor.t($options.getGroupFundCount(group.id)),
        c: group.id,
        d: $data.currentGroupId === group.id ? 1 : "",
        e: common_vendor.o(($event) => $options.selectGroup(group.id), group.id)
      };
    }),
    w: common_vendor.t($data.groupList.length),
    x: common_vendor.o((...args) => $options.goToGroupManage && $options.goToGroupManage(...args)),
    y: common_vendor.o((...args) => $options.goToAddFund && $options.goToAddFund(...args)),
    z: common_vendor.o((...args) => $options.showImportTutorial && $options.showImportTutorial(...args)),
    A: $data.isEditMode ? 1 : "",
    B: common_vendor.t($data.isEditMode ? "完成" : "编辑"),
    C: common_vendor.o((...args) => $options.toggleEditMode && $options.toggleEditMode(...args)),
    D: common_vendor.o((...args) => $options.goToSettings && $options.goToSettings(...args)),
    E: $data.fundList.length > 0
  }, $data.fundList.length > 0 ? {
    F: common_vendor.t($options.currentGroupName || "我的藏品"),
    G: common_vendor.t($data.fundList.length),
    H: common_vendor.t($options.sortTypeLabel),
    I: $data.sortTypeRange,
    J: $data.sortTypeIndex,
    K: common_vendor.o((...args) => $options.onSortTypeChange && $options.onSortTypeChange(...args)),
    L: common_vendor.t($data.sortOrder === "desc" ? "↓" : "↑"),
    M: common_vendor.o(($event) => $options.setOrder($data.sortOrder === "desc" ? "asc" : "desc"))
  } : {}, {
    N: common_vendor.f($data.fundList, (fund, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(fund.name),
        b: $options.getFundGroupName(fund)
      }, $options.getFundGroupName(fund) ? {
        c: common_vendor.t($options.getFundGroupName(fund))
      } : {}, {
        d: common_vendor.t(fund.code),
        e: fund.dwjz
      }, fund.dwjz ? {
        f: common_vendor.t(fund.dwjz)
      } : {}, {
        g: common_vendor.t(fund.gszzl ? (fund.gszzl >= 0 ? "+" : "") + fund.gszzl + "%" : "--"),
        h: fund.gszzl >= 0 ? 1 : "",
        i: fund.gszzl < 0 ? 1 : ""
      }, $data.showGSZ ? {
        j: common_vendor.t(fund.gsz || "--")
      } : {}, $data.showGains || $data.showCost || $data.showAmount ? common_vendor.e({
        k: $data.showGains
      }, $data.showGains ? {
        l: common_vendor.t(fund.gains ? (fund.gains >= 0 ? "+" : "") + fund.gains.toFixed(2) : "--"),
        m: fund.gains >= 0 ? 1 : "",
        n: fund.gains < 0 ? 1 : ""
      } : {}, {
        o: $data.showCost
      }, $data.showCost ? {
        p: common_vendor.t(fund.costGains ? (fund.costGains >= 0 ? "+" : "") + fund.costGains.toFixed(2) : "--"),
        q: fund.costGains >= 0 ? 1 : "",
        r: fund.costGains < 0 ? 1 : ""
      } : {}, {
        s: $data.showAmount
      }, $data.showAmount ? {
        t: common_vendor.t(fund.amount ? fund.amount.toFixed(2) : "--")
      } : {}, {
        v: $data.showCostRate
      }, $data.showCostRate ? {
        w: common_vendor.t(fund.costGainsRate !== void 0 ? (parseFloat(fund.costGainsRate) >= 0 ? "+" : "") + fund.costGainsRate + "%" : "--"),
        x: parseFloat(fund.costGainsRate) >= 0 ? 1 : "",
        y: parseFloat(fund.costGainsRate) < 0 ? 1 : ""
      } : {}) : {}, $data.isEditMode ? {
        z: common_vendor.o(($event) => $options.showMoveGroupModal(fund), fund.code),
        A: common_vendor.o(($event) => $options.editFund(fund, index), fund.code),
        B: common_vendor.o(($event) => $options.deleteFund(index), fund.code),
        C: common_vendor.o(() => {
        }, fund.code)
      } : {}, {
        D: fund.code,
        E: common_vendor.o(($event) => $options.goToFundDetail(fund), fund.code)
      });
    }),
    O: $data.showGSZ,
    P: $data.showGains || $data.showCost || $data.showAmount,
    Q: $data.isEditMode,
    R: $data.fundList.length === 0
  }, $data.fundList.length === 0 ? {
    S: common_vendor.t($data.currentGroupId ? "该分组暂无藏品" : "暂无关注的藏品"),
    T: common_vendor.o((...args) => $options.goToAddFund && $options.goToAddFund(...args))
  } : {}, {
    U: $data.showMoveGroup
  }, $data.showMoveGroup ? common_vendor.e({
    V: $data.moveSelectedGroupIds.length === 0
  }, $data.moveSelectedGroupIds.length === 0 ? {} : {}, {
    W: $data.moveSelectedGroupIds.length === 0 ? 1 : "",
    X: common_vendor.o(($event) => $options.toggleMoveGroup("")),
    Y: common_vendor.f($data.groupList, (group, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(group.name),
        b: $data.moveSelectedGroupIds.includes(group.id)
      }, $data.moveSelectedGroupIds.includes(group.id) ? {} : {}, {
        c: group.id,
        d: $data.moveSelectedGroupIds.includes(group.id) ? 1 : "",
        e: common_vendor.o(($event) => $options.toggleMoveGroup(group.id), group.id)
      });
    }),
    Z: common_vendor.o((...args) => $options.closeMoveGroupModal && $options.closeMoveGroupModal(...args)),
    aa: common_vendor.o((...args) => $options.confirmMoveGroup && $options.confirmMoveGroup(...args)),
    ab: common_vendor.o(() => {
    }),
    ac: common_vendor.o((...args) => $options.closeMoveGroupModal && $options.closeMoveGroupModal(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
