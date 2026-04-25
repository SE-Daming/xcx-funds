<template>
	<view class="invest-plan-container">
		<view class="fund-header">
			<view class="fund-name">{{ fund.name }}</view>
			<view class="fund-code">{{ fundCode }}</view>
		</view>

		<!-- 定投开关 -->
		<view class="form-section">
			<view class="switch-row">
				<text class="switch-label">开启定投</text>
				<switch :checked="investPlan.enabled" @change="onInvestPlanSwitch" color="#3498db" />
			</view>
		</view>

		<!-- 定投计划表单 -->
		<view class="form-section" v-if="investPlan.enabled">
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
				<text class="date-hint">可选范围：1号至28号</text>
			</view>

			<!-- 开始日期 -->
			<view class="form-item">
				<view class="label">开始日期</view>
				<view class="readonly-value">{{ investPlan.startDate }}</view>
			</view>
		</view>

		<!-- 定投统计（已有记录时显示） -->
		<view class="form-section stats-section" v-if="investRecords.length > 0">
			<view class="section-title">定投统计</view>
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

		<!-- 操作按钮 -->
		<view class="action-buttons">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="save">保存</button>
		</view>

		<!-- 删除定投按钮 -->
		<view class="delete-btn-wrapper" v-if="hasExistingPlan">
			<view class="delete-btn" @click="deleteInvestPlan">删除定投计划</view>
		</view>
	</view>
</template>

<script>
import { DataManager } from '@/utils/data-manager.js';
import {
	getDefaultInvestPlan,
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
				name: ''
			},
			investPlan: getDefaultInvestPlan(),
			investRecords: [],
			cycleOptions: CYCLE_OPTIONS,
			weekDayOptions: WEEK_DAY_OPTIONS,
			monthDayOptions: MONTH_DAY_OPTIONS,
			hasExistingPlan: false
		}
	},
	computed: {
		totalInvestAmount() {
			return this.investRecords.reduce((sum, r) => sum + r.amount, 0);
		}
	},
	onLoad(options) {
		this.fundCode = options.code;
		this.loadFundData();
	},
	methods: {
		loadFundData() {
			const fundList = DataManager.getFundList();
			const fund = fundList.find(item => item.code === this.fundCode);

			if (fund) {
				this.fund.name = fund.name;

				// 加载定投计划
				if (fund.investPlan) {
					this.investPlan = { ...getDefaultInvestPlan(), ...fund.investPlan };
					this.hasExistingPlan = true;
				}

				// 加载定投记录
				if (fund.investRecords) {
					this.investRecords = [...fund.investRecords];
				}
			}
		},
		onInvestPlanSwitch(e) {
			this.investPlan.enabled = e.detail.value;
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
		getMonthDayLabel(value) {
			const option = this.monthDayOptions.find(o => o.value === value);
			return option ? option.label : '1号';
		},
		cancel() {
			uni.navigateBack();
		},
		save() {
			// 验证
			if (this.investPlan.enabled && !this.investPlan.amount) {
				uni.showToast({ title: '请输入每期金额', icon: 'none' });
				return;
			}

			// 如果是修改已有计划，更新开始日期为今天
			if (this.hasExistingPlan) {
				this.investPlan.startDate = getToday();
			}

			// 保存定投计划
			DataManager.updateInvestPlan(this.fundCode, this.investPlan);

			uni.showToast({ title: '保存成功', icon: 'success' });
			uni.$emit('fundUpdated', { fundCode: this.fundCode });

			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},
		deleteInvestPlan() {
			uni.showModal({
				title: '删除定投',
				content: '删除后定投计划将清空，已累积的份额和记录会保留。确定要删除吗？',
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (res.confirm) {
						DataManager.deleteInvestPlan(this.fundCode);
						uni.showToast({ title: '已删除', icon: 'success' });
						uni.$emit('fundUpdated', { fundCode: this.fundCode });

						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				}
			});
		}
	}
}
</script>

<style lang="scss">
.invest-plan-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.fund-header {
	background-color: #fff;
	padding: 30rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
	text-align: center;

	.fund-name {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}

	.fund-code {
		color: #888;
		font-size: 28rpx;
	}
}

.form-section {
	background-color: #fff;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.switch-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0;

	.switch-label {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
	}
}

.form-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;

	&:last-child {
		border-bottom: none;
	}

	.label {
		font-size: 28rpx;
		margin-bottom: 10rpx;
		color: #333;
	}

	.input {
		width: 100%;
		height: 60rpx;
		line-height: 60rpx;
		padding: 0 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 8rpx;
		font-size: 28rpx;
	}

	.readonly-value {
		padding: 20rpx;
		background-color: #f8f9fa;
		border-radius: 8rpx;
		font-size: 28rpx;
		color: #666;
	}

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

	.date-hint {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #999;
	}
}

.stats-section {
	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
	}

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

.action-buttons {
	display: flex;
	gap: 20rpx;
	margin-top: 20rpx;

	.btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 10rpx;
		font-size: 32rpx;
	}

	.cancel-btn {
		background-color: #95a5a6;
		color: #fff;
	}

	.save-btn {
		background-color: #3498db;
		color: #fff;
	}
}

.delete-btn-wrapper {
	margin-top: 40rpx;
	padding: 20rpx 0;

	.delete-btn {
		padding: 20rpx 0;
		text-align: center;
		color: #ff4d4f;
		font-size: 28rpx;
		border: 1rpx solid #ff4d4f;
		border-radius: 8rpx;
	}
}
</style>
