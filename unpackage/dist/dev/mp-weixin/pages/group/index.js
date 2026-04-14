"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_dataManager = require("../../utils/data-manager.js");
const _sfc_main = {
  data() {
    return {
      groupList: [],
      fundList: [],
      selectedIds: [],
      showModal: false,
      editingGroup: null,
      inputGroupName: "",
      // 添加藏品相关
      showAddFundModal_: false,
      currentGroup: null,
      selectedFundCodes: [],
      // 移除藏品相关
      showRemoveFundModal_: false,
      selectedRemoveFundCodes: []
    };
  },
  computed: {
    availableFunds() {
      if (!this.currentGroup)
        return [];
      return this.fundList;
    },
    groupFunds() {
      if (!this.currentGroup)
        return [];
      return this.fundList.filter((fund) => this.isFundInGroup(fund, this.currentGroup.id));
    }
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.groupList = utils_dataManager.DataManager.getGroupList();
      this.fundList = utils_dataManager.DataManager.getFundList();
      this.selectedIds = this.selectedIds.filter(
        (id) => this.groupList.some((g) => g.id === id)
      );
    },
    getFundCount(groupId) {
      return this.fundList.filter((fund) => this.isFundInGroup(fund, groupId)).length;
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
    toggleSelect(groupId) {
      const index = this.selectedIds.indexOf(groupId);
      if (index > -1) {
        this.selectedIds.splice(index, 1);
      } else {
        this.selectedIds.push(groupId);
      }
    },
    showAddModal() {
      this.editingGroup = null;
      this.inputGroupName = "";
      this.showModal = true;
    },
    editGroup(group) {
      this.editingGroup = group;
      this.inputGroupName = group.name;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingGroup = null;
      this.inputGroupName = "";
    },
    confirmSave() {
      const name = this.inputGroupName.trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请输入分组名称", icon: "none" });
        return;
      }
      if (this.editingGroup) {
        const success = utils_dataManager.DataManager.updateGroup(this.editingGroup.id, { name });
        if (success) {
          common_vendor.index.showToast({ title: "修改成功", icon: "success" });
          this.loadData();
          common_vendor.index.$emit("groupChanged");
        }
      } else {
        const newGroup = utils_dataManager.DataManager.addGroup({ name });
        if (newGroup) {
          common_vendor.index.showToast({ title: "创建成功", icon: "success" });
          this.loadData();
          common_vendor.index.$emit("groupChanged");
          this.showAddFundModalAfterCreate(newGroup);
        }
      }
      this.closeModal();
    },
    // 创建分组后询问是否添加藏品
    showAddFundModalAfterCreate(group) {
      common_vendor.index.showModal({
        title: "添加藏品",
        content: "是否立即从现有藏品中添加到此分组？",
        confirmText: "去添加",
        cancelText: "稍后再说",
        success: (res) => {
          if (res.confirm) {
            this.showAddFundModal(group);
          }
        }
      });
    },
    // 显示添加藏品弹窗
    showAddFundModal(group) {
      this.currentGroup = group;
      this.selectedFundCodes = [];
      this.showAddFundModal_ = true;
    },
    closeAddFundModal() {
      this.showAddFundModal_ = false;
      this.currentGroup = null;
      this.selectedFundCodes = [];
    },
    toggleFundSelect(code) {
      const index = this.selectedFundCodes.indexOf(code);
      if (index > -1) {
        this.selectedFundCodes.splice(index, 1);
      } else {
        this.selectedFundCodes.push(code);
      }
    },
    confirmAddFunds() {
      if (this.selectedFundCodes.length === 0) {
        common_vendor.index.showToast({ title: "请选择藏品", icon: "none" });
        return;
      }
      this.selectedFundCodes.forEach((code) => {
        utils_dataManager.DataManager.addFundToGroup(code, this.currentGroup.id);
      });
      common_vendor.index.showToast({ title: `已添加${this.selectedFundCodes.length}件藏品`, icon: "success" });
      this.loadData();
      common_vendor.index.$emit("groupChanged");
      this.closeAddFundModal();
    },
    // 显示移除藏品弹窗
    showRemoveFundModal(group) {
      this.currentGroup = group;
      this.selectedRemoveFundCodes = [];
      this.showRemoveFundModal_ = true;
    },
    closeRemoveFundModal() {
      this.showRemoveFundModal_ = false;
      this.currentGroup = null;
      this.selectedRemoveFundCodes = [];
    },
    toggleRemoveFundSelect(code) {
      const index = this.selectedRemoveFundCodes.indexOf(code);
      if (index > -1) {
        this.selectedRemoveFundCodes.splice(index, 1);
      } else {
        this.selectedRemoveFundCodes.push(code);
      }
    },
    confirmRemoveFunds() {
      if (this.selectedRemoveFundCodes.length === 0) {
        common_vendor.index.showToast({ title: "请选择藏品", icon: "none" });
        return;
      }
      this.selectedRemoveFundCodes.forEach((code) => {
        utils_dataManager.DataManager.removeFundFromGroup(code, this.currentGroup.id);
      });
      common_vendor.index.showToast({ title: `已移除${this.selectedRemoveFundCodes.length}件藏品`, icon: "success" });
      this.loadData();
      common_vendor.index.$emit("groupChanged");
      this.closeRemoveFundModal();
    },
    batchDelete() {
      if (this.selectedIds.length === 0)
        return;
      let totalFunds = 0;
      this.selectedIds.forEach((id) => {
        totalFunds += this.getFundCount(id);
      });
      const content = totalFunds > 0 ? `确定删除${this.selectedIds.length}个分组？其中的${totalFunds}件藏品将变为未分组状态。` : `确定删除${this.selectedIds.length}个分组？`;
      common_vendor.index.showModal({
        title: "批量删除",
        content,
        confirmColor: "#e74c3c",
        success: (res) => {
          if (res.confirm) {
            this.selectedIds.forEach((id) => {
              utils_dataManager.DataManager.removeGroup(id);
            });
            this.selectedIds = [];
            common_vendor.index.showToast({ title: "删除成功", icon: "success" });
            this.loadData();
            common_vendor.index.$emit("groupChanged");
          }
        }
      });
    },
    moveUp(index) {
      if (index <= 0)
        return;
      const newList = [...this.groupList];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      utils_dataManager.DataManager.reorderGroups(newList.map((g) => g.id));
      this.loadData();
      common_vendor.index.$emit("groupChanged");
    },
    moveDown(index) {
      if (index >= this.groupList.length - 1)
        return;
      const newList = [...this.groupList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      utils_dataManager.DataManager.reorderGroups(newList.map((g) => g.id));
      this.loadData();
      common_vendor.index.$emit("groupChanged");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.groupList.length > 0
  }, $data.groupList.length > 0 ? {
    b: common_vendor.f($data.groupList, (group, index, i0) => {
      return common_vendor.e({
        a: $data.selectedIds.includes(group.id)
      }, $data.selectedIds.includes(group.id) ? {} : {}, {
        b: $data.selectedIds.includes(group.id) ? 1 : "",
        c: common_vendor.o(($event) => $options.toggleSelect(group.id), group.id),
        d: common_vendor.t(group.name),
        e: common_vendor.t($options.getFundCount(group.id)),
        f: common_vendor.o(($event) => $options.editGroup(group), group.id),
        g: $options.getFundCount(group.id) > 0
      }, $options.getFundCount(group.id) > 0 ? {
        h: common_vendor.o(($event) => $options.showRemoveFundModal(group), group.id)
      } : {}, {
        i: common_vendor.o(($event) => $options.showAddFundModal(group), group.id),
        j: index > 0
      }, index > 0 ? {
        k: common_vendor.o(($event) => $options.moveUp(index), group.id)
      } : {}, {
        l: index < $data.groupList.length - 1
      }, index < $data.groupList.length - 1 ? {
        m: common_vendor.o(($event) => $options.moveDown(index), group.id)
      } : {}, {
        n: group.id
      });
    })
  } : {}, {
    c: $data.selectedIds.length > 0
  }, $data.selectedIds.length > 0 ? {
    d: common_vendor.t($data.selectedIds.length),
    e: common_vendor.o((...args) => $options.batchDelete && $options.batchDelete(...args))
  } : {}, {
    f: common_vendor.o((...args) => $options.showAddModal && $options.showAddModal(...args)),
    g: $data.showModal
  }, $data.showModal ? {
    h: common_vendor.t($data.editingGroup ? "编辑分组" : "新建分组"),
    i: $data.inputGroupName,
    j: common_vendor.o(($event) => $data.inputGroupName = $event.detail.value),
    k: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args)),
    l: common_vendor.o((...args) => $options.confirmSave && $options.confirmSave(...args)),
    m: common_vendor.o(() => {
    }),
    n: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args))
  } : {}, {
    o: $data.showAddFundModal_
  }, $data.showAddFundModal_ ? common_vendor.e({
    p: common_vendor.t($data.currentGroup ? $data.currentGroup.name : ""),
    q: $options.availableFunds.length > 0
  }, $options.availableFunds.length > 0 ? {
    r: common_vendor.f($options.availableFunds, (fund, k0, i0) => {
      return common_vendor.e({
        a: $data.selectedFundCodes.includes(fund.code)
      }, $data.selectedFundCodes.includes(fund.code) ? {} : {}, {
        b: common_vendor.t(fund.name),
        c: common_vendor.t(fund.code),
        d: fund.code,
        e: $data.selectedFundCodes.includes(fund.code) ? 1 : "",
        f: common_vendor.o(($event) => $options.toggleFundSelect(fund.code), fund.code)
      });
    })
  } : {}, {
    s: common_vendor.o((...args) => $options.closeAddFundModal && $options.closeAddFundModal(...args)),
    t: common_vendor.t($data.selectedFundCodes.length),
    v: common_vendor.o((...args) => $options.confirmAddFunds && $options.confirmAddFunds(...args)),
    w: common_vendor.o(() => {
    }),
    x: common_vendor.o((...args) => $options.closeAddFundModal && $options.closeAddFundModal(...args))
  }) : {}, {
    y: $data.showRemoveFundModal_
  }, $data.showRemoveFundModal_ ? common_vendor.e({
    z: common_vendor.t($data.currentGroup ? $data.currentGroup.name : ""),
    A: $options.groupFunds.length > 0
  }, $options.groupFunds.length > 0 ? {
    B: common_vendor.f($options.groupFunds, (fund, k0, i0) => {
      return common_vendor.e({
        a: $data.selectedRemoveFundCodes.includes(fund.code)
      }, $data.selectedRemoveFundCodes.includes(fund.code) ? {} : {}, {
        b: common_vendor.t(fund.name),
        c: common_vendor.t(fund.code),
        d: fund.code,
        e: $data.selectedRemoveFundCodes.includes(fund.code) ? 1 : "",
        f: common_vendor.o(($event) => $options.toggleRemoveFundSelect(fund.code), fund.code)
      });
    })
  } : {}, {
    C: common_vendor.o((...args) => $options.closeRemoveFundModal && $options.closeRemoveFundModal(...args)),
    D: common_vendor.t($data.selectedRemoveFundCodes.length),
    E: common_vendor.o((...args) => $options.confirmRemoveFunds && $options.confirmRemoveFunds(...args)),
    F: common_vendor.o(() => {
    }),
    G: common_vendor.o((...args) => $options.closeRemoveFundModal && $options.closeRemoveFundModal(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/group/index.js.map
