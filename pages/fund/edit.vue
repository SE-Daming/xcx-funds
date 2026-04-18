<template>
	<view class="edit-fund-container">
		<view class="fund-header">
			<view class="fund-name">{{ fund.name }}</view>
			<view class="fund-code">{{ fund.code }}</view>
		</view>

		<view class="form-section">
			<view class="form-item">
				<view class="label">持有数量</view>
				<input
					class="input"
					type="digit"
					placeholder="请输入持有数量"
					v-model="formData.num"
					@blur="calculateAmount"
				/>
			</view>

			<view class="form-item">
				<view class="label">入手单价</view>
				<input
					class="input"
					type="digit"
					placeholder="请输入入手单价"
					v-model="formData.cost"
					@blur="calculateHoldGains"
				/>
			</view>

			<!-- 分组选择 -->
			<view class="form-item">
				<view class="label">所属分组（可多选）</view>
				<view class="group-tags">
					<view class="group-tag" :class="{ 'active': selectedGroupIds.length === 0 }" @click="toggleGroup('')">
						<text>不选择分组</text>
					</view>
					<view class="group-tag" v-for="group in groupList" :key="group.id"
						:class="{ 'active': selectedGroupIds.includes(group.id) }" @click="toggleGroup(group.id)">
						<text>{{ group.name }}</text>
					</view>
				</view>
			</view>

			<!-- 备注 -->
			<view class="form-item remark-item">
				<view class="label">备注</view>
				<textarea
					class="textarea"
					placeholder="记录买入理由、止盈策略、定投计划等..."
					v-model="formData.remark"
					maxlength="500"
					:auto-height="true"
					:show-confirm-bar="false"
				></textarea>
				<view class="remark-count">{{ formData.remark ? formData.remark.length : 0 }}/500</view>
			</view>

			<view class="form-item" v-if="formData.num && formData.cost">
				<view class="label">持有总值</view>
				<view class="readonly-value">{{ calculatedAmount }}</view>
			</view>

			<view class="form-item" v-if="calculatedHoldGains !== null">
				<view class="label">当前变动</view>
				<view class="readonly-value" :class="{'red': calculatedHoldGains >= 0, 'green': calculatedHoldGains < 0}">
					{{ calculatedHoldGains >= 0 ? '+' : '' }}{{ calculatedHoldGains }}
				</view>
			</view>

			<!-- 显示当前净值信息 -->
			<view class="form-item" v-if="fund.gsz">
				<view class="label">当前预估单价</view>
				<view class="readonly-value">{{ fund.gsz }}</view>
			</view>

			<view class="form-item" v-if="fund.gszzl">
				<view class="label">预估波动</view>
				<view class="readonly-value" :class="{'red': fund.gszzl >= 0, 'green': fund.gszzl < 0}">
					{{ fund.gszzl >= 0 ? '+' : '' }}{{ fund.gszzl }}%
				</view>
			</view>
		</view>

		<!-- 定投计划区块 -->
		<view class="form-section invest-plan-section">
			<view class="section-header">
				<view class="section-title">定投计划</view>
				<switch :checked="investPlan.enabled" @change="onInvestPlanSwitch" color="#3498db" />
			</view>

			<!-- 定投计划已终止提示 -->
			<view class="plan-terminated-tip" v-if="investPlan.status === 'terminated'">
				<text>该定投计划已终止，份额已保留在持仓中</text>
				<view class="restart-btn" @click="restartInvestPlan">重新开启</view>
			</view>

			<!-- 定投计划表单 -->
			<view class="invest-plan-form" v-if="investPlan.enabled && investPlan.status !== 'terminated'">
				<!-- 定投周期 -->
				<view class="form-item">
					<view class="label">定投周期</view>
					<view class="cycle-options">
						<view
							v-for="item in cycleOptions"
							:key="item.value"
							class="cycle-option"
							:class="{ 'active': investPlan.cycle === item.value }"
							@click="selectCycle(item.value)"
						>{{ item.label }}</view>
					</view>
				</view>

				<!-- 每期金额 -->
				<view class="form-item">
					<view class="label">每期金额</view>
					<view class="amount-input-wrapper">
						<input
							class="input amount-input"
							type="digit"
							placeholder="请输入金额"
							v-model="investPlan.amount"
						/>
						<text class="amount-unit">元</text>
					</view>
				</view>

				<!-- 每周定投日期 -->
				<view class="form-item" v-if="investPlan.cycle === 'weekly'">
					<view class="label">定投日期</view>
					<view class="day-options">
						<view
							v-for="item in weekDayOptions"
							:key="item.value"
							class="day-option"
							:class="{ 'active': investPlan.dayOfWeek === item.value }"
							@click="investPlan.dayOfWeek = item.value"
						>{{ item.label }}</view>
					</view>
				</view>

				<!-- 每月定投日期 -->
				<view class="form-item" v-if="investPlan.cycle === 'monthly'">
					<view class="label">定投日期</view>
					<picker mode="selector" :range="monthDayOptions" range-key="label" @change="onMonthDayChange">
						<view class="picker-value">
							{{ getMonthDayLabel(investPlan.dayOfMonth) }}
							<text class="picker-arrow">▼</text>
						</view>
					</picker>
				</view>

				<!-- 开始日期 -->
				<view class="form-item">
					<view class="label">开始日期</view>
					<picker mode="date" :start="minStartDate" :end="today" :value="investPlan.startDate" @change="onStartDateChange">
						<view class="picker-value">
							{{ investPlan.startDate }}
							<text class="picker-arrow">▼</text>
						</view>
					</picker>
				</view>

				<!-- 定投统计（已有记录时显示） -->
				<view class="invest-stats" v-if="investRecords.length > 0">
					<view class="stats-row">
						<view class="stats-item">
							<text class="stats-label">已执行</text>
							<text class="stats-value">{{ investRecords.length }}期</text>
						</view>
						<view class="stats-item">
							<text class="stats-label">累计投入</text>
							<text class="stats-value">{{ totalInvestAmount }}元</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 暂停状态提示 -->
			<view class="plan-paused-tip" v-if="!investPlan.enabled && investPlan.status === 'paused' && investPlan.lastInvestDate">
				<text>定投已暂停，上次执行：{{ investPlan.lastInvestDate }}</text>
			</view>

			<!-- 终止定投按钮 -->
			<view class="terminate-btn-wrapper" v-if="investPlan.status === 'active' || (investPlan.status === 'paused' && investPlan.lastInvestDate)">
				<view class="terminate-btn" @click="terminateInvestPlan">终止定投</view>
			</view>
		</view>

		<view class="action-buttons">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="save">保存</button>
		</view>
	</view>
</template>

<script>
import { getFundData } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';
import {
	getDefaultInvestPlan,
	getOneYearAgo,
	getToday,
	CYCLE_OPTIONS,
	WEEK_DAY_OPTIONS,
	MONTH_DAY_OPTIONS
} from '@/utils/invest-plan.js';

export default {
	data() {
		return {
			fundCode: '',
			fund: {
				code: '',
				name: '',
				num: '',
				cost: '',
				dwjz: 1.0,
				gsz: null,
				gszzl: 0
			},
			formData: {
				num: '',
				cost: '',
				remark: ''
			},
			calculatedAmount: null,
			calculatedHoldGains: null,
			deviceId: '',
			groupList: [],
			selectedGroupIds: [],
			// 定投相关
			investPlan: getDefaultInvestPlan(),
			investRecords: [],
			cycleOptions: CYCLE_OPTIONS,
			weekDayOptions: WEEK_DAY_OPTIONS,
			monthDayOptions: MONTH_DAY_OPTIONS,
			minStartDate: getOneYearAgo(),
			today: getToday()
		}
	},
	computed: {
		totalInvestAmount() {
			return this.investRecords.reduce((sum, r) => sum + r.amount, 0);
		}
	},
	onLoad(options) {
		this.fundCode = options.code;
		this.loadDeviceId();
		this.loadGroupList();
		this.loadFundDetail();
	},
	methods: {
		loadGroupList() {
			this.groupList = DataManager.getGroupList();
		},
		toggleGroup(groupId) {
			if (groupId === '') {
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
			let deviceId = uni.getStorageSync('deviceId');
			if (!deviceId) {
				deviceId = this.generateUUID();
				uni.setStorageSync('deviceId', deviceId);
			}
			this.deviceId = deviceId;
		},
		generateUUID() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0;
				var v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},
		async loadFundDetail() {
			uni.showLoading({
				title: '加载中...'
			});

			try {
				const fundList = DataManager.getFundList();
				const localFund = fundList.find(item => item.code === this.fundCode);

				// 初始化分组选择
				if (localFund) {
					if (localFund.groupIds && Array.isArray(localFund.groupIds)) {
						this.selectedGroupIds = [...localFund.groupIds];
					} else if (localFund.groupId) {
						this.selectedGroupIds = [localFund.groupId];
					}

					// 初始化定投计划
					if (localFund.investPlan) {
						this.investPlan = { ...getDefaultInvestPlan(), ...localFund.investPlan };
					}

					// 初始化定投记录
					if (localFund.investRecords) {
						this.investRecords = [...localFund.investRecords];
					}
				}

				const result = await getFundData([this.fundCode], this.deviceId);
				const apiData = result.Datas || [];

				if (apiData.length > 0) {
					const apiFund = apiData[0];

					this.fund = {
						code: apiFund.fundcode,
						name: apiFund.name,
						dwjz: apiFund.dwjz,
						gsz: apiFund.gsz,
						gszzl: apiFund.gszzl,
						num: localFund ? localFund.num : '',
						cost: localFund ? localFund.cost : '',
						groupId: localFund ? localFund.groupId : ''
					};

					this.formData = {
						num: localFund ? localFund.num : '',
						cost: localFund ? localFund.cost : '',
						remark: localFund ? (localFund.remark || '') : ''
					};
				} else {
					if (localFund) {
						this.fund = localFund;
						this.formData = {
							num: localFund.num || '',
							cost: localFund.cost || '',
							remark: localFund.remark || ''
						};
					} else {
						this.fund = {
							code: this.fundCode,
							name: '未知基金',
							num: '',
							cost: '',
							dwjz: 1.0,
							gsz: null,
							gszzl: 0
						};
						this.formData = { num: '', cost: '' };
					}
				}
			} catch (error) {
				console.error('加载基金详情失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
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
		// 定投相关方法
		onInvestPlanSwitch(e) {
			const enabled = e.detail.value;
			this.investPlan.enabled = enabled;
			if (enabled) {
				// 开启定投
				if (this.investPlan.status === 'terminated') {
					// 从终止状态重新开启
					this.investPlan.status = 'active';
					this.investPlan.terminatedDate = null;
				} else {
					this.investPlan.status = 'active';
				}
			} else {
				// 暂停定投
				if (this.investPlan.status === 'active') {
					this.investPlan.status = 'paused';
				}
			}
		},
		selectCycle(cycle) {
			if (this.investPlan.cycle !== cycle) {
				this.investPlan.cycle = cycle;
			}
		},
		onMonthDayChange(e) {
			const index = e.detail.value;
			this.investPlan.dayOfMonth = this.monthDayOptions[index].value;
		},
		onStartDateChange(e) {
			this.investPlan.startDate = e.detail.value;
		},
		getMonthDayLabel(value) {
			const option = this.monthDayOptions.find(o => o.value === value);
			return option ? option.label : '1号';
		},
		restartInvestPlan() {
			uni.showModal({
				title: '重新开启定投',
				content: '确定要重新开启定投计划吗？将从上次执行日期继续。',
				success: (res) => {
					if (res.confirm) {
						this.investPlan.enabled = true;
						this.investPlan.status = 'active';
						this.investPlan.terminatedDate = null;
					}
				}
			});
		},
		terminateInvestPlan() {
			uni.showModal({
				title: '终止定投',
				content: '终止后定投计划将停止，已累积的份额会保留在持仓中。确定要终止吗？',
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (res.confirm) {
						this.investPlan.enabled = false;
						this.investPlan.status = 'terminated';
						this.investPlan.terminatedDate = getToday();
					}
				}
			});
		},
		cancel() {
			uni.navigateBack();
		},
		save() {
			if (!this.validateForm()) {
				return;
			}

			// 更新本地存储中的基金信息
			const updateData = {
				num: this.formData.num,
				cost: this.formData.cost,
				groupIds: [...this.selectedGroupIds],
				remark: this.formData.remark || '',
				investPlan: this.investPlan,
				investRecords: this.investRecords
			};

			DataManager.updateFund(this.fundCode, updateData);

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});

			uni.$emit('fundUpdated', { fundCode: this.fundCode });

			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},
		validateForm() {
			return true;
		}
	}
}
</script>

<style lang="scss">
.edit-fund-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.edit-fund-container .fund-header {
	background-color: #fff;
	padding: 30rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
	text-align: center;
}

.edit-fund-container .fund-header .fund-name {
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.edit-fund-container .fund-header .fund-code {
	color: #888;
	font-size: 28rpx;
}

.form-section {
	background-color: #fff;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.form-section .form-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
}

.form-section .form-item:last-child {
	border-bottom: none;
}

.form-section .form-item .label {
	font-size: 28rpx;
	margin-bottom: 10rpx;
	color: #333;
}

.form-section .form-item .input {
	width: 100%;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 20rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.form-section .form-item .readonly-value {
	padding: 20rpx;
	background-color: #f8f9fa;
	border-radius: 8rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.form-section .form-item .readonly-value.red {
	color: #ff4757;
}

.form-section .form-item .readonly-value.green {
	color: #2ed573;
}

/* 分组选择样式 */
.form-section .form-item .group-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;

	.group-tag {
		padding: 16rpx 28rpx;
		background-color: #f5f5f5;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: #666;
		border: 2rpx solid transparent;
		transition: all 0.2s;

		&.active {
			background-color: #e8f4fd;
			color: #3498db;
			border-color: #3498db;
		}
	}
}

.action-buttons {
	display: flex;
	gap: 20rpx;
}

.action-buttons .btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 10rpx;
	font-size: 32rpx;
}

.action-buttons .cancel-btn {
	background-color: #95a5a6;
	color: #fff;
}

.action-buttons .save-btn {
	background-color: #3498db;
	color: #fff;
}

/* 备注样式 */
.form-section .form-item.remark-item {
	.label {
		margin-bottom: 16rpx;
	}

	.textarea {
		width: 100%;
		min-height: 160rpx;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 8rpx;
		font-size: 28rpx;
		line-height: 1.6;
		background-color: #fafafa;
	}

	.remark-count {
		text-align: right;
		font-size: 22rpx;
		color: #999;
		margin-top: 10rpx;
	}
}

/* 定投计划样式 */
.invest-plan-section {
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #eee;

		.section-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
		}
	}

	.plan-terminated-tip {
		padding: 20rpx;
		background-color: #fff3cd;
		border-radius: 8rpx;
		margin-top: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;

		text {
			font-size: 26rpx;
			color: #856404;
		}

		.restart-btn {
			padding: 10rpx 20rpx;
			background-color: #3498db;
			color: #fff;
			border-radius: 20rpx;
			font-size: 24rpx;
		}
	}

	.plan-paused-tip {
		padding: 16rpx;
		background-color: #f5f5f5;
		border-radius: 8rpx;
		margin-top: 20rpx;

		text {
			font-size: 26rpx;
			color: #666;
		}
	}

	.invest-plan-form {
		.cycle-options {
			display: flex;
			gap: 16rpx;

			.cycle-option {
				flex: 1;
				padding: 16rpx 0;
				text-align: center;
				background-color: #f5f5f5;
				border-radius: 8rpx;
				font-size: 28rpx;
				color: #666;
				transition: all 0.2s;

				&.active {
					background-color: #3498db;
					color: #fff;
				}
			}
		}

		.amount-input-wrapper {
			display: flex;
			align-items: center;
			border: 1rpx solid #ddd;
			border-radius: 8rpx;
			overflow: hidden;

			.amount-input {
				flex: 1;
				border: none;
				border-radius: 0;
			}

			.amount-unit {
				padding: 0 20rpx;
				color: #999;
				font-size: 28rpx;
			}
		}

		.day-options {
			display: flex;
			gap: 12rpx;

			.day-option {
				flex: 1;
				padding: 16rpx 0;
				text-align: center;
				background-color: #f5f5f5;
				border-radius: 8rpx;
				font-size: 26rpx;
				color: #666;
				transition: all 0.2s;

				&.active {
					background-color: #3498db;
					color: #fff;
				}
			}
		}

		.picker-value {
			padding: 16rpx 20rpx;
			background-color: #f5f5f5;
			border-radius: 8rpx;
			font-size: 28rpx;
			color: #333;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.picker-arrow {
				font-size: 20rpx;
				color: #999;
			}
		}

		.invest-stats {
			margin-top: 20rpx;
			padding: 16rpx;
			background-color: #f8f9fa;
			border-radius: 8rpx;

			.stats-row {
				display: flex;
				justify-content: space-around;

				.stats-item {
					text-align: center;

					.stats-label {
						display: block;
						font-size: 24rpx;
						color: #999;
						margin-bottom: 8rpx;
					}

					.stats-value {
						display: block;
						font-size: 30rpx;
						font-weight: bold;
						color: #333;
					}
				}
			}
		}
	}

	.terminate-btn-wrapper {
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #eee;

		.terminate-btn {
			padding: 16rpx 0;
			text-align: center;
			color: #ff4d4f;
			font-size: 28rpx;
			border: 1rpx solid #ff4d4f;
			border-radius: 8rpx;
		}
	}
}
</style>
