<template>
	<view class="group-container">
		<!-- 分组列表 -->
		<view class="group-list" v-if="groupList.length > 0">
			<view class="group-item" v-for="(group, index) in groupList" :key="group.id">
				<!-- 选择框 -->
				<view class="checkbox" :class="{ 'checked': selectedIds.includes(group.id) }" @click="toggleSelect(group.id)">
					<text v-if="selectedIds.includes(group.id)">✓</text>
				</view>
				<view class="group-info" @click="editGroup(group)">
					<text class="group-name">{{ group.name }}</text>
					<text class="group-count">{{ getFundCount(group.id) }}件藏品</text>
				</view>
				<view class="group-actions">
					<view class="action-btn remove-fund" v-if="getFundCount(group.id) > 0" @click="showRemoveFundModal(group)">
						<text>-</text>
					</view>
					<view class="action-btn add-fund" @click="showAddFundModal(group)">
						<text>+</text>
					</view>
					<view class="action-btn move-up" v-if="index > 0" @click="moveUp(index)">
						<text>↑</text>
					</view>
					<view class="action-btn move-down" v-if="index < groupList.length - 1" @click="moveDown(index)">
						<text>↓</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-text">暂无分组</text>
			<text class="empty-hint">点击下方按钮创建分组</text>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="batch-actions" v-if="selectedIds.length > 0">
				<text class="selected-count">已选 {{ selectedIds.length }} 项</text>
				<view class="btn-delete" @click="batchDelete">
					<text>删除</text>
				</view>
			</view>
			<view class="add-btn" @click="showAddModal">
				<text class="icon">+</text>
				<text>新建分组</text>
			</view>
		</view>

		<!-- 编辑/新建分组弹窗 -->
		<view class="modal-mask" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">{{ editingGroup ? '编辑分组' : '新建分组' }}</view>
				<view class="modal-body">
					<input
						class="modal-input"
						v-model="inputGroupName"
						placeholder="请输入分组名称"
						maxlength="20"
					/>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="closeModal">取消</button>
					<button class="modal-btn confirm" @click="confirmSave">确定</button>
				</view>
			</view>
		</view>

		<!-- 添加藏品到分组弹窗 -->
		<view class="modal-mask" v-if="showAddFundModal_" @click="closeAddFundModal">
			<view class="modal-content add-fund-modal" @click.stop>
				<view class="modal-title">添加藏品到「{{ currentGroup ? currentGroup.name : '' }}」</view>
				<view class="modal-body">
					<view class="fund-select-list" v-if="availableFunds.length > 0">
						<view class="fund-select-item" v-for="fund in availableFunds" :key="fund.code"
							:class="{ 'selected': selectedFundCodes.includes(fund.code) }"
							@click="toggleFundSelect(fund.code)">
							<view class="fund-checkbox">
								<text v-if="selectedFundCodes.includes(fund.code)">✓</text>
							</view>
							<view class="fund-info">
								<text class="fund-name">{{ fund.name }}</text>
								<text class="fund-code">{{ fund.code }}</text>
							</view>
						</view>
					</view>
					<view class="empty-hint" v-else>
						<text>暂无可添加的藏品</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="closeAddFundModal">取消</button>
					<button class="modal-btn confirm" @click="confirmAddFunds">
						添加({{ selectedFundCodes.length }})
					</button>
				</view>
			</view>
		</view>

		<!-- 从分组移除藏品弹窗 -->
		<view class="modal-mask" v-if="showRemoveFundModal_" @click="closeRemoveFundModal">
			<view class="modal-content add-fund-modal" @click.stop>
				<view class="modal-title">从「{{ currentGroup ? currentGroup.name : '' }}」移除藏品</view>
				<view class="modal-body">
					<view class="fund-select-list" v-if="groupFunds.length > 0">
						<view class="fund-select-item" v-for="fund in groupFunds" :key="fund.code"
							:class="{ 'selected': selectedRemoveFundCodes.includes(fund.code) }"
							@click="toggleRemoveFundSelect(fund.code)">
							<view class="fund-checkbox">
								<text v-if="selectedRemoveFundCodes.includes(fund.code)">✓</text>
							</view>
							<view class="fund-info">
								<text class="fund-name">{{ fund.name }}</text>
								<text class="fund-code">{{ fund.code }}</text>
							</view>
						</view>
					</view>
					<view class="empty-hint" v-else>
						<text>该分组暂无藏品</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="closeRemoveFundModal">取消</button>
					<button class="modal-btn confirm remove" @click="confirmRemoveFunds">
						移除({{ selectedRemoveFundCodes.length }})
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { DataManager } from '@/utils/data-manager.js';

export default {
	data() {
		return {
			groupList: [],
			fundList: [],
			selectedIds: [],
			showModal: false,
			editingGroup: null,
			inputGroupName: '',
			// 添加藏品相关
			showAddFundModal_: false,
			currentGroup: null,
			selectedFundCodes: [],
			// 移除藏品相关
			showRemoveFundModal_: false,
			selectedRemoveFundCodes: []
		}
	},
	computed: {
		availableFunds() {
			// 返回不在当前分组的藏品
			if (!this.currentGroup) return [];
			return this.fundList.filter(fund => fund.groupId !== this.currentGroup.id);
		},
		groupFunds() {
			// 返回当前分组内的藏品
			if (!this.currentGroup) return [];
			return this.fundList.filter(fund => fund.groupId === this.currentGroup.id);
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
			this.groupList = DataManager.getGroupList();
			this.fundList = DataManager.getFundList();
			this.selectedIds = this.selectedIds.filter(id =>
				this.groupList.some(g => g.id === id)
			);
		},
		getFundCount(groupId) {
			return this.fundList.filter(fund => fund.groupId === groupId).length;
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
			this.inputGroupName = '';
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
			this.inputGroupName = '';
		},
		confirmSave() {
			const name = this.inputGroupName.trim();
			if (!name) {
				uni.showToast({ title: '请输入分组名称', icon: 'none' });
				return;
			}

			if (this.editingGroup) {
				const success = DataManager.updateGroup(this.editingGroup.id, { name });
				if (success) {
					uni.showToast({ title: '修改成功', icon: 'success' });
					this.loadData();
					uni.$emit('groupChanged');
				}
			} else {
				const newGroup = DataManager.addGroup({ name });
				if (newGroup) {
					uni.showToast({ title: '创建成功', icon: 'success' });
					this.loadData();
					uni.$emit('groupChanged');
					// 创建成功后询问是否添加藏品
					this.showAddFundModalAfterCreate(newGroup);
				}
			}
			this.closeModal();
		},
		// 创建分组后询问是否添加藏品
		showAddFundModalAfterCreate(group) {
			uni.showModal({
				title: '添加藏品',
				content: '是否立即从现有藏品中添加到此分组？',
				confirmText: '去添加',
				cancelText: '稍后再说',
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
				uni.showToast({ title: '请选择藏品', icon: 'none' });
				return;
			}
			// 更新选中藏品的分组
			this.selectedFundCodes.forEach(code => {
				DataManager.updateFund(code, { groupId: this.currentGroup.id });
			});
			uni.showToast({ title: `已添加${this.selectedFundCodes.length}件藏品`, icon: 'success' });
			this.loadData();
			uni.$emit('groupChanged');
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
				uni.showToast({ title: '请选择藏品', icon: 'none' });
				return;
			}
			// 将选中藏品的分组置空
			this.selectedRemoveFundCodes.forEach(code => {
				DataManager.updateFund(code, { groupId: '' });
			});
			uni.showToast({ title: `已移除${this.selectedRemoveFundCodes.length}件藏品`, icon: 'success' });
			this.loadData();
			uni.$emit('groupChanged');
			this.closeRemoveFundModal();
		},
		batchDelete() {
			if (this.selectedIds.length === 0) return;

			let totalFunds = 0;
			this.selectedIds.forEach(id => {
				totalFunds += this.getFundCount(id);
			});

			const content = totalFunds > 0
				? `确定删除${this.selectedIds.length}个分组？其中的${totalFunds}件藏品将变为未分组状态。`
				: `确定删除${this.selectedIds.length}个分组？`;

			uni.showModal({
				title: '批量删除',
				content: content,
				confirmColor: '#e74c3c',
				success: (res) => {
					if (res.confirm) {
						this.selectedIds.forEach(id => {
							DataManager.removeGroup(id);
						});
						this.selectedIds = [];
						uni.showToast({ title: '删除成功', icon: 'success' });
						this.loadData();
						uni.$emit('groupChanged');
					}
				}
			});
		},
		moveUp(index) {
			if (index <= 0) return;
			const newList = [...this.groupList];
			[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
			DataManager.reorderGroups(newList.map(g => g.id));
			this.loadData();
			uni.$emit('groupChanged');
		},
		moveDown(index) {
			if (index >= this.groupList.length - 1) return;
			const newList = [...this.groupList];
			[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
			DataManager.reorderGroups(newList.map(g => g.id));
			this.loadData();
			uni.$emit('groupChanged');
		}
	}
}
</script>

<style lang="scss">
.group-container {
	padding: 20rpx;
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 140rpx;
}

.group-list {
	background-color: #fff;
	border-radius: 16rpx;
	overflow: hidden;
}

.group-item {
	display: flex;
	align-items: center;
	padding: 24rpx;
	border-bottom: 1rpx solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}
}

.checkbox {
	width: 44rpx;
	height: 44rpx;
	border: 2rpx solid #ddd;
	border-radius: 50%;
	margin-right: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.2s;

	&.checked {
		background-color: #e74c3c;
		border-color: #e74c3c;
		color: #fff;
		font-size: 24rpx;
	}
}

.group-info {
	flex: 1;

	.group-name {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		display: block;
		margin-bottom: 6rpx;
	}

	.group-count {
		font-size: 24rpx;
		color: #999;
	}
}

.group-actions {
	display: flex;
	align-items: center;
	gap: 12rpx;

	.action-btn {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;

		&.move-up, &.move-down {
			background-color: #f5f5f5;
			color: #666;
		}

		&.add-fund {
			background-color: #e8f4fd;
			color: #3498db;
			font-size: 32rpx;
			font-weight: bold;
		}

		&.remove-fund {
			background-color: #fef0f0;
			color: #e74c3c;
			font-size: 32rpx;
			font-weight: bold;
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;

	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 16rpx;
	}

	.empty-hint {
		font-size: 26rpx;
		color: #bbb;
	}
}

/* 底部操作栏 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	border-top: 1rpx solid #eee;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.batch-actions {
	display: flex;
	align-items: center;
	gap: 20rpx;

	.selected-count {
		font-size: 28rpx;
		color: #666;
	}

	.btn-delete {
		padding: 16rpx 32rpx;
		background-color: #e74c3c;
		color: #fff;
		border-radius: 32rpx;
		font-size: 28rpx;
	}
}

.add-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 40rpx;
	background: linear-gradient(135deg, #3498db, #2980b9);
	color: #fff;
	border-radius: 40rpx;
	font-size: 30rpx;
	margin-left: auto;

	.icon {
		font-size: 36rpx;
		margin-right: 8rpx;
	}
}

/* 弹窗样式 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	width: 600rpx;
	background-color: #fff;
	border-radius: 20rpx;
	overflow: hidden;
}

.add-fund-modal {
	width: 650rpx;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.modal-title {
	padding: 36rpx;
	text-align: center;
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	border-bottom: 1rpx solid #f0f0f0;
	flex-shrink: 0;
}

.modal-body {
	padding: 30rpx;
	flex: 1;
	overflow-y: auto;
}

.modal-input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid #ddd;
	border-radius: 12rpx;
	font-size: 30rpx;
	box-sizing: border-box;

	&:focus {
		border-color: #3498db;
	}
}

.modal-footer {
	display: flex;
	border-top: 1rpx solid #f0f0f0;
	flex-shrink: 0;
}

.modal-btn {
	flex: 1;
	height: 100rpx;
	line-height: 100rpx;
	text-align: center;
	font-size: 32rpx;
	background-color: #fff;
	border: none;
	border-radius: 0;

	&::after {
		border: none;
	}

	&.cancel {
		color: #999;
		border-right: 1rpx solid #f0f0f0;
	}

	&.confirm {
		color: #3498db;
		font-weight: 500;

		&.remove {
			color: #e74c3c;
		}
	}
}

/* 藏品选择列表 */
.fund-select-list {
	max-height: 500rpx;
	overflow-y: auto;
}

.fund-select-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 12rpx;
	background-color: #f8f9fa;
	transition: all 0.2s;

	&:last-child {
		margin-bottom: 0;
	}

	&.selected {
		background-color: #e8f4fd;

		.fund-checkbox {
			background-color: #3498db;
			border-color: #3498db;
			color: #fff;
		}
	}

	.fund-checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #ddd;
		border-radius: 50%;
		margin-right: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		flex-shrink: 0;
	}

	.fund-info {
		flex: 1;

		.fund-name {
			font-size: 28rpx;
			color: #333;
			display: block;
			margin-bottom: 4rpx;
		}

		.fund-code {
			font-size: 24rpx;
			color: #999;
		}
	}
}
</style>
