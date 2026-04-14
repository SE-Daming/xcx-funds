<template>
	<view class="analysis-container">
		<!-- 持仓概览卡片 -->
		<view class="overview-card" v-if="fundList.length > 0">
			<view class="overview-header">
				<text class="overview-title">持仓概览</text>
				<text class="update-time" v-if="lastUpdateDisplay">{{ lastUpdateDisplay }}</text>
			</view>
			<view class="overview-main">
				<view class="main-item">
					<text class="main-label">总资产</text>
					<text class="main-value">{{ privacyMode ? '****' : totalAmount.toFixed(2) }}</text>
				</view>
			</view>
			<view class="overview-grid">
				<view class="grid-item">
					<text class="grid-label">总成本</text>
					<text class="grid-value">{{ privacyMode ? '****' : totalCost.toFixed(2) }}</text>
				</view>
				<view class="grid-item">
					<text class="grid-label">累计收益</text>
					<text class="grid-value" :class="totalGains >= 0 ? 'red' : 'green'">{{ privacyMode ? '****' : (totalGains >= 0 ? '+' : '') + totalGains.toFixed(2) }}</text>
				</view>
				<view class="grid-item">
					<text class="grid-label">收益率</text>
					<text class="grid-value" :class="totalGains >= 0 ? 'red' : 'green'" v-if="totalCost > 0">{{ privacyMode ? '****' : (totalGains >= 0 ? '+' : '') + totalRate.toFixed(2) }}%</text>
					<text class="grid-value" v-else>0.00%</text>
				</view>
				<view class="grid-item">
					<text class="grid-label">今日收益</text>
					<text class="grid-value" :class="todayGains >= 0 ? 'red' : 'green'">{{ privacyMode ? '****' : (todayGains >= 0 ? '+' : '') + todayGains.toFixed(2) }}</text>
				</view>
			</view>
			<view class="privacy-toggle" @click="togglePrivacy">
				<text class="toggle-text">{{ privacyMode ? '👁 显示' : '👁 隐藏' }}</text>
			</view>
		</view>

		<!-- 持仓占比饼图 -->
		<view class="section-card" v-if="fundList.length > 0">
			<view class="section-title">
				<text class="title-text">持仓占比</text>
			</view>
			<pie-chart :data="pieChartData" @click="onPieChartClick"></pie-chart>
		</view>

		<!-- 盈亏分布 -->
		<view class="section-card" v-if="fundList.length > 0">
			<profit-distribution :fundList="fundListWithGains" :fundListToday="fundListWithTodayGains" @click="onProfitFundClick"></profit-distribution>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="!loading && fundList.length === 0">
			<text class="empty-icon">📊</text>
			<text class="empty-text">暂无持仓数据</text>
			<button class="add-btn" @click="goToAddFund">添加藏品</button>
		</view>
	</view>
</template>

<script>
import { getFundData } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';
import PieChart from '@/components/pie-chart/pie-chart.vue';
import ProfitDistribution from '@/components/profit-distribution/profit-distribution.vue';

export default {
	components: {
		PieChart,
		ProfitDistribution
	},
	data() {
		return {
			fundList: [],
			allFundList: [],
			groupId: '',
			deviceId: '',
			loading: false,
			privacyMode: false,
			lastUpdateDisplay: ''
		}
	},
	computed: {
		// 总资产
		totalAmount() {
			return this.fundList.reduce((sum, f) => sum + (f.amount || 0), 0);
		},
		// 总成本
		totalCost() {
			return this.fundList.reduce((sum, f) => sum + ((f.cost || 0) * (f.num || 0)), 0);
		},
		// 累计收益
		totalGains() {
			return this.fundList.reduce((sum, f) => sum + (f.costGains || 0), 0);
		},
		// 收益率
		totalRate() {
			if (this.totalCost === 0) return 0;
			return (this.totalGains / this.totalCost) * 100;
		},
		// 今日收益
		todayGains() {
			return this.fundList.reduce((sum, f) => sum + (f.gains || 0), 0);
		},
		// 饼图数据
		pieChartData() {
			return this.fundList
				.filter(f => f.amount && f.amount > 0)
				.map(f => ({
					name: f.name,
					amount: f.amount,
					code: f.code
				}));
		},
		// 累计盈亏数据
		fundListWithGains() {
			return this.fundList
				.filter(f => f.costGains !== undefined && f.costGains !== null)
				.map(f => ({
					code: f.code,
					name: f.name,
					costGains: f.costGains || 0,
					costGainsRate: f.costGainsRate || '0.00',
					amount: f.amount || 0
				}));
		},
		// 今日盈亏数据
		fundListWithTodayGains() {
			return this.fundList
				.filter(f => f.gains !== undefined && f.gains !== null)
				.map(f => ({
					code: f.code,
					name: f.name,
					costGains: f.gains || 0,
					costGainsRate: f.gszzl ? f.gszzl.toFixed(2) : '0.00',
					amount: f.amount || 0
				}));
		}
	},
	onLoad(options) {
		this.deviceId = DataManager.getDeviceId();
		this.groupId = options.groupId || '';
	},
	onShow() {
		this.loadFundList();
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.loadFundList().finally(() => {
			uni.stopPullDownRefresh();
		});
	},
	methods: {
		togglePrivacy() {
			this.privacyMode = !this.privacyMode;
		},
		async loadFundList() {
			this.allFundList = DataManager.getFundList();
			// 根据分组过滤
			if (this.groupId) {
				this.fundList = this.allFundList.filter(f => {
					if (f.groupIds && Array.isArray(f.groupIds)) {
						return f.groupIds.includes(this.groupId);
					}
					return f.groupId === this.groupId;
				});
			} else {
				this.fundList = [...this.allFundList];
			}
			if (this.fundList.length > 0) {
				this.loading = true;
				try {
					await this.fetchFundData();
				} finally {
					this.loading = false;
				}
			}
		},
		async fetchFundData() {
			if (this.fundList.length === 0) return;

			try {
				const fundCodes = this.fundList.map(fund => fund.code);
				const result = await getFundData(fundCodes, this.deviceId);
				const apiData = result.Datas || [];

				this.fundList = this.fundList.map(localFund => {
					const apiFund = apiData.find(item => item.fundcode === localFund.code);
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

							const todayStr = new Date().toISOString().slice(0, 10);
							const isUpdated = apiFund.jzrq === todayStr;
							const day = new Date().getDay();
							const isWeekend = day === 0 || day === 6;
							const useUpdatedMode = isUpdated || isWeekend;

							let currentNav = useUpdatedMode ? dwjz : (gsz || dwjz || 0);
							updatedFund.amount = localFund.num * currentNav;

							// 今日收益计算
							let gains = 0;
							if (useUpdatedMode) {
								const lastNav = currentNav / (1 + gszzl / 100);
								gains = (currentNav - lastNav) * localFund.num;
							} else {
								if (dwjz > 0) {
									gains = (currentNav - dwjz) * localFund.num;
								} else {
									gains = updatedFund.amount * gszzl / 100;
								}
							}
							updatedFund.gains = gains;

							// 累计收益计算
							if (localFund.cost > 0) {
								updatedFund.costGains = (currentNav - localFund.cost) * localFund.num;
								const fundTotalCost = localFund.cost * localFund.num;
								if (fundTotalCost > 0) {
									updatedFund.costGainsRate = (updatedFund.costGains / fundTotalCost * 100).toFixed(2);
								}
							}
						}

						return updatedFund;
					}
					return localFund;
				});

				// 更新时间显示
				this.lastUpdateDisplay = this.computeLastUpdateDisplay(apiData);

			} catch (error) {
				console.error('获取基金数据失败:', error);
			}
		},
		computeLastUpdateDisplay(apiData) {
			if (!apiData || apiData.length === 0) return '';
			const todayStr = new Date().toISOString().slice(0, 10);
			const hasTodayNAV = apiData.some(f => f.jzrq === todayStr);

			const toTs = (t) => {
				if (!t) return 0;
				if (t.length > 10) {
					const s = t.replace(/-/g, '/');
					const d = new Date(s);
					return isNaN(d.getTime()) ? 0 : d.getTime();
				}
				if (t.length === 5) {
					const d = new Date(`${todayStr} ${t}:00`);
					return isNaN(d.getTime()) ? 0 : d.getTime();
				}
				return 0;
			};

			let maxTs = 0;
			apiData.forEach(f => {
				if (f.gztime) {
					const ts = toTs(f.gztime);
					if (ts > maxTs) maxTs = ts;
				}
			});

			if (maxTs > 0) {
				const d = new Date(maxTs);
				const pad = (n) => (n < 10 ? '0' + n : '' + n);
				return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
			}

			return '';
		},
		onPieChartClick(item) {
			if (item && item.code) {
				uni.navigateTo({ url: `/pages/fund/detail?code=${item.code}` });
			}
		},
		onProfitFundClick(fund) {
			if (fund && fund.code) {
				uni.navigateTo({ url: `/pages/fund/detail?code=${fund.code}` });
			}
		},
		goToAddFund() {
			uni.navigateTo({ url: '/pages/fund/add' });
		}
	}
}
</script>

<style lang="scss">
.analysis-container {
	padding: 20rpx;
	min-height: 100vh;
	background-color: $page-bg;
}

/* 持仓概览卡片 */
.overview-card {
	background: linear-gradient(135deg, #2979ff, #4e94ff);
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	color: #fff;
	box-shadow: 0 8rpx 20rpx rgba(41, 121, 255, 0.3);

	.overview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.overview-title {
			font-size: 28rpx;
			opacity: 0.9;
		}

		.update-time {
			font-size: 22rpx;
			opacity: 0.7;
		}
	}

	.overview-main {
		margin-bottom: 20rpx;

		.main-item {
			.main-label {
				font-size: 24rpx;
				opacity: 0.8;
				display: block;
				margin-bottom: 8rpx;
			}

			.main-value {
				font-size: 48rpx;
				font-weight: bold;
			}
		}
	}

	.overview-grid {
		display: flex;
		flex-wrap: wrap;
		padding-top: 16rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.2);

		.grid-item {
			width: 50%;
			margin-bottom: 16rpx;
			padding-right: 10rpx;
			box-sizing: border-box;

			.grid-label {
				font-size: 24rpx;
				opacity: 0.7;
				display: block;
				margin-bottom: 6rpx;
			}

			.grid-value {
				font-size: 30rpx;
				font-weight: 500;
				word-break: break-all;

				&.red {
					color: #fff;
				}

				&.green {
					color: #90EE90;
				}
			}
		}
	}

	.privacy-toggle {
		text-align: center;
		padding-top: 16rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.2);

		.toggle-text {
			font-size: 24rpx;
			opacity: 0.8;
		}
	}
}

.section-card {
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
	overflow: hidden;
}

.section-title {
	padding: 24rpx;
	border-bottom: 1rpx solid #f0f0f0;

	.title-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding-left: 16rpx;
		border-left: 6rpx solid #2979ff;
	}
}

.loading-state {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;

	.loading-text {
		font-size: 28rpx;
		color: #999;
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;

	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 30rpx;
		opacity: 0.5;
	}

	.empty-text {
		color: #999;
		font-size: 28rpx;
		margin-bottom: 40rpx;
	}

	.add-btn {
		background-color: #2979ff;
		color: #fff;
		border-radius: 40rpx;
		padding: 0 60rpx;
		font-size: 30rpx;
		box-shadow: 0 6rpx 16rpx rgba(41, 121, 255, 0.25);

		&::after {
			border: none;
		}
	}
}
</style>
