<template>
	<view class="profit-distribution">
		<view class="section-title">盈亏分布</view>

		<!-- Tab切换 -->
		<view class="tab-switch">
			<view class="tab-item" :class="{ active: activeTab === 'total' }" @click="activeTab = 'total'">
				<text>累计盈亏</text>
			</view>
			<view class="tab-item" :class="{ active: activeTab === 'today' }" @click="activeTab = 'today'">
				<text>今日盈亏</text>
			</view>
		</view>

		<!-- 盈利TOP -->
		<view class="profit-section" v-if="displayProfitList.length > 0">
			<view class="section-header profit-header">
				<text class="header-icon">📈</text>
				<text class="header-text">盈利贡献</text>
			</view>
			<view class="fund-item" v-for="(fund, index) in displayProfitList" :key="'profit-' + index" @click="onFundClick(fund)">
				<view class="rank-badge profit">{{ index + 1 }}</view>
				<view class="fund-info">
					<text class="fund-name">{{ fund.name }}</text>
					<view class="fund-detail">
						<text class="fund-code">{{ fund.code }}</text>
						<text class="fund-rate red">+{{ fund.costGainsRate }}%</text>
					</view>
				</view>
				<view class="fund-amount red">+{{ fund.costGains.toFixed(2) }}</view>
			</view>
		</view>

		<!-- 亏损TOP -->
		<view class="profit-section" v-if="displayLossList.length > 0">
			<view class="section-header loss-header">
				<text class="header-icon">📉</text>
				<text class="header-text">亏损拖累</text>
			</view>
			<view class="fund-item" v-for="(fund, index) in displayLossList" :key="'loss-' + index" @click="onFundClick(fund)">
				<view class="rank-badge loss">{{ index + 1 }}</view>
				<view class="fund-info">
					<text class="fund-name">{{ fund.name }}</text>
					<view class="fund-detail">
						<text class="fund-code">{{ fund.code }}</text>
						<text class="fund-rate green">{{ fund.costGainsRate }}%</text>
					</view>
				</view>
				<view class="fund-amount green">{{ fund.costGains.toFixed(2) }}</view>
			</view>
		</view>

		<!-- 展开/收起按钮 -->
		<view class="expand-btn" v-if="showExpandBtn" @click="toggleExpand">
			<text>{{ expanded ? '收起' : '展开查看全部' }}</text>
			<text class="expand-icon">{{ expanded ? '▲' : '▼' }}</text>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="displayProfitList.length === 0 && displayLossList.length === 0">
			<text class="empty-text">暂无持仓数据</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ProfitDistribution',
	props: {
		fundList: {
			type: Array,
			default: () => [] // [{ code, name, costGains, costGainsRate, amount }] 累计盈亏
		},
		fundListToday: {
			type: Array,
			default: () => [] // [{ code, name, costGains, costGainsRate, amount }] 今日盈亏
		}
	},
	data() {
		return {
			activeTab: 'total', // 'total' | 'today'
			expanded: false
		}
	},
	computed: {
		// 当前Tab对应的数据
		currentList() {
			return this.activeTab === 'total' ? this.fundList : this.fundListToday;
		},
		// 盈利列表 - 按持仓金额降序
		profitList() {
			return this.currentList
				.filter(f => f.costGains > 0)
				.sort((a, b) => (b.amount || 0) - (a.amount || 0));
		},
		// 亏损列表 - 按持仓金额降序
		lossList() {
			return this.currentList
				.filter(f => f.costGains < 0)
				.sort((a, b) => (b.amount || 0) - (a.amount || 0));
		},
		// 显示的盈利列表
		displayProfitList() {
			return this.expanded ? this.profitList : this.profitList.slice(0, 3);
		},
		// 显示的亏损列表
		displayLossList() {
			return this.expanded ? this.lossList : this.lossList.slice(0, 3);
		},
		// 是否显示展开按钮
		showExpandBtn() {
			return this.profitList.length > 3 || this.lossList.length > 3;
		}
	},
	methods: {
		toggleExpand() {
			this.expanded = !this.expanded;
		},
		onFundClick(fund) {
			this.$emit('click', fund);
		}
	}
}
</script>

<style lang="scss">
.profit-distribution {
	padding: 24rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	padding-left: 16rpx;
	border-left: 6rpx solid #2979ff;
}

/* Tab切换 */
.tab-switch {
	display: flex;
	background-color: #f5f5f5;
	border-radius: 24rpx;
	padding: 4rpx;
	margin-bottom: 24rpx;

	.tab-item {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 20rpx;
		font-size: 26rpx;
		color: #666;
		transition: all 0.2s;

		&.active {
			background-color: #fff;
			color: #2979ff;
			font-weight: 500;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.08);
		}
	}
}

.profit-section {
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.section-header {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	border-radius: 8rpx;
	margin-bottom: 16rpx;

	.header-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
	}

	.header-text {
		font-size: 26rpx;
		font-weight: 500;
	}
}

.profit-header {
	background-color: #fff1f0;

	.header-text {
		color: #f5222d;
	}
}

.loss-header {
	background-color: #f6ffed;

	.header-text {
		color: #52c41a;
	}
}

.fund-item {
	display: flex;
	align-items: center;
	padding: 20rpx 16rpx;
	background-color: #fafafa;
	border-radius: 12rpx;
	margin-bottom: 12rpx;

	&:last-child {
		margin-bottom: 0;
	}

	&:active {
		background-color: #f0f0f0;
	}
}

.rank-badge {
	width: 40rpx;
	height: 40rpx;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: bold;
	color: #fff;
	margin-right: 16rpx;
	flex-shrink: 0;

	&.profit {
		background-color: #f5222d;
	}

	&.loss {
		background-color: #52c41a;
	}
}

.fund-info {
	flex: 1;
	min-width: 0;

	.fund-name {
		font-size: 28rpx;
		color: #333;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fund-detail {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6rpx;

		.fund-code {
			font-size: 22rpx;
			color: #999;
		}

		.fund-rate {
			font-size: 22rpx;
		}
	}
}

.fund-amount {
	font-size: 32rpx;
	font-weight: bold;
	margin-left: 16rpx;
	flex-shrink: 0;
}

.red {
	color: #f5222d;
}

.green {
	color: #52c41a;
}

/* 展开按钮 */
.expand-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 0;
	margin-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
	font-size: 26rpx;
	color: #2979ff;

	.expand-icon {
		margin-left: 8rpx;
		font-size: 20rpx;
	}
}

.empty-state {
	padding: 40rpx 0;
	text-align: center;

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
}
</style>
