<template>
	<view class="fund-detail-container">
		<!-- 头部概览 -->
		<view class="fund-header-card">
			<view class="fund-title-row">
				<text class="fund-name">{{ fundDetail.name }}</text>
				<text class="fund-code">{{ fundDetail.code }}</text>
			</view>
			
			<view class="main-metrics">
				<view class="metric-main">
					<text class="value" :class="{'red': fundDetail.gszzl > 0, 'green': fundDetail.gszzl < 0}">
						{{ (fundDetail.gszzl !== null && fundDetail.gszzl !== undefined) ? (fundDetail.gszzl > 0 ? '+' : '') + fundDetail.gszzl + '%' : '--' }}
					</text>
					<text class="label">预估波动</text>
				</view>
				<view class="metric-sub">
					<text class="value">{{ fundDetail.gsz || '--' }}</text>
					<text class="label">预估单价</text>
				</view>
				<view class="metric-sub">
					<text class="value">{{ fundDetail.gztime ? formatTime(fundDetail.gztime) : '--' }}</text>
					<text class="label">更新时间</text>
				</view>
			</view>
		</view>
		
		<!-- 详细数据卡片 -->
		<view class="detail-card">
			<view class="card-title">基本信息</view>
			<view class="data-grid">
				<view class="data-item">
					<text class="label">当前单价</text>
					<text class="value">{{ fundDetail.dwjz || '--' }}</text>
				</view>
				<view class="data-item">
					<text class="label">数据日期</text>
					<text class="value">{{ fundDetail.jzrq || '--' }}</text>
				</view>
				<view class="data-item">
					<text class="label">持有数量</text>
					<text class="value">{{ fundDetail.num || 0 }}</text>
				</view>
				<view class="data-item">
					<text class="label">入手单价</text>
					<text class="value">{{ fundDetail.cost || 0 }}</text>
				</view>
			</view>
			
			<!-- 持仓收益计算 -->
			<view class="holding-profit" v-if="fundDetail.num > 0">
				<view class="divider"></view>
				<view class="profit-row">
					<view class="profit-item">
						<text class="label">持有总值</text>
						<text class="value">{{ (fundDetail.num * (fundDetail.jzrq === new Date().toISOString().slice(0, 10) ? (parseFloat(fundDetail.dwjz) || 0) : (parseFloat(fundDetail.gsz) || parseFloat(fundDetail.dwjz) || 0))).toFixed(2) }}</text>
					</view>
					<view class="profit-item">
						<text class="label">累计变动</text>
						<view class="profit-values">
							<text class="value" :class="{'red': calculateProfit() >= 0, 'green': calculateProfit() < 0}">
								{{ calculateProfit() > 0 ? '+' : '' }}{{ calculateProfit().toFixed(2) }}
							</text>
							<text class="rate" :class="{'red': calculateProfitRate() >= 0, 'green': calculateProfitRate() < 0}">
								{{ calculateProfitRate() }}%
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 备注卡片 -->
		<view class="detail-card remark-card">
			<view class="card-title">备注</view>
			<view class="remark-content" v-if="fundDetail.remark" @click="showRemarkEdit">
				<text class="remark-text">{{ fundDetail.remark }}</text>
			</view>
			<view class="remark-empty" v-else @click="showRemarkEdit">
				<text class="empty-icon">📝</text>
				<text class="empty-text">添加备注</text>
			</view>
		</view>

		<!-- 图表区域 -->
		<view class="chart-card">
			<view class="chart-header">
				<view class="card-title">价格趋势</view>
				<view class="period-tabs">
					<view
						v-for="p in chartPeriods"
						:key="p.key"
						class="period-tab"
						:class="{ active: chartPeriod === p.key }"
						@click="changeChartPeriod(p.key)"
					>{{ p.label }}</view>
				</view>
			</view>
			<view class="chart-container">
				<view class="chart-loading" v-if="chartLoading">
					<text>加载中...</text>
				</view>
				<fund-chart
					v-show="!chartLoading"
					:data="chartData"
					:labels="chartLabels"
					:color="chartColor"
					:type="chartPeriod"
				></fund-chart>
			</view>
		</view>
		
		<!-- 底部操作栏 -->
		<cover-view class="bottom-actions">
			<cover-view class="action-btn edit" @click="editFund">编辑藏品</cover-view>
			<cover-view class="action-btn delete" @click="deleteFund">删除藏品</cover-view>
		</cover-view>
	</view>
</template>

<script>
import { getFundData, getFundIntradayValuation, getFundHistoryNav } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';
import FundChart from '@/components/fund-chart/fund-chart.vue';

export default {
	components: {
		FundChart
	},
	data() {
		return {
			fundCode: '',
			fundDetail: {
				code: '',
				name: '',
				gsz: '',
				gszzl: '',
				dwjz: '',
				jzrq: '',
				gztime: '',
				num: 0,
				cost: 0,
				remark: ''
			},
			localFundInfo: null,
			deviceId: '',
			chartData: [],
			chartLabels: [],
			// 图表周期
			chartPeriod: 'y', // y=月, 3y=季, n=年
			chartPeriods: [
				{ key: 'y', label: '近1月' },
				{ key: '3y', label: '近3月' },
				{ key: 'n', label: '近1年' }
			],
			chartLoading: false
		}
	},
	computed: {
		chartColor() {
			if (this.chartData.length > 0) {
				// 如果有数据，根据最后一个点与第一个点的比较决定颜色
				const first = this.chartData[0];
				const last = this.chartData[this.chartData.length - 1];
				return last >= first ? '#f5222d' : '#52c41a';
			}
			return '#2979ff';
		}
	},
	onLoad(options) {
		// 获取传递的基金代码参数
		this.fundCode = options.code;
		this.loadDeviceId();
	},
	onShow() {
		if (this.fundCode) {
			this.loadFundDetail(this.fundCode);
			this.loadChartData(this.fundCode);
		}
	},
	methods: {
		loadDeviceId() {
			// 获取或生成设备ID
			let deviceId = uni.getStorageSync('deviceId');
			if (!deviceId) {
				deviceId = this.generateUUID();
				uni.setStorageSync('deviceId', deviceId);
			}
			this.deviceId = deviceId;
		},
		generateUUID() {
			// 生成UUID
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0;
				var v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},
		formatTime(timeStr) {
			if (!timeStr) return '--';
			const pad = (n) => (n < 10 ? '0' + n : '' + n);
			if (timeStr.length > 10) {
				const s = timeStr.replace(/-/g, '/');
				const d = new Date(s);
				if (!isNaN(d.getTime())) {
					return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
				}
				return timeStr.substring(5, 10);
			}
			const t = new Date();
			return `${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
		},
		calculateProfit() {
			if (!this.fundDetail.num || !this.fundDetail.cost) return 0;
			
			const todayStr = new Date().toISOString().slice(0, 10);
			const isUpdated = this.fundDetail.jzrq === todayStr;
			const day = new Date().getDay();
			const isWeekend = day === 0 || day === 6;
			const useUpdatedMode = isUpdated || isWeekend;
			
			let currentPrice = 0;
			if (useUpdatedMode) {
				currentPrice = parseFloat(this.fundDetail.dwjz) || 0;
			} else {
				currentPrice = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
			}
			
			if (currentPrice === 0) return 0;
			
			return (currentPrice - parseFloat(this.fundDetail.cost)) * parseFloat(this.fundDetail.num);
		},
		calculateProfitRate() {
			if (!this.fundDetail.num || !this.fundDetail.cost) return '0.00';
			
			const todayStr = new Date().toISOString().slice(0, 10);
			const isUpdated = this.fundDetail.jzrq === todayStr;
			const day = new Date().getDay();
			const isWeekend = day === 0 || day === 6;
			const useUpdatedMode = isUpdated || isWeekend;
			
			let currentPrice = 0;
			if (useUpdatedMode) {
				currentPrice = parseFloat(this.fundDetail.dwjz) || 0;
			} else {
				currentPrice = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
			}
			
			const cost = parseFloat(this.fundDetail.cost);
			if (currentPrice === 0 || cost === 0) return '0.00';
			
			const rate = (currentPrice - cost) / cost * 100;
			return (rate > 0 ? '+' : '') + rate.toFixed(2);
		},
		async loadFundDetail(code) {
			// uni.showLoading({ title: '加载中...' });
			
			try {
				// 从本地存储获取基金的持仓信息
				const fundList = DataManager.getFundList();
				this.localFundInfo = fundList.find(item => item.code === code) || null;
				
				// 从API获取基金实时数据
				const result = await getFundData([code], this.deviceId);
				const apiData = result.Datas || [];
				
				if (apiData.length > 0) {
					const apiFund = apiData[0];
					
					// 合并API数据和本地数据
					this.fundDetail = {
						code: apiFund.fundcode,
						name: apiFund.name,
						gsz: apiFund.gsz,
						gszzl: apiFund.gszzl,
						dwjz: apiFund.dwjz,
						jzrq: apiFund.jzrq,
						gztime: apiFund.gztime,
						num: this.localFundInfo ? this.localFundInfo.num : 0,
						cost: this.localFundInfo ? this.localFundInfo.cost : 0,
						remark: this.localFundInfo ? (this.localFundInfo.remark || '') : ''
					};
				} else if (this.localFundInfo) {
					// 如果API失败，至少显示本地信息
					this.fundDetail = {
						...this.localFundInfo,
						gsz: '',
						gszzl: '',
						dwjz: '',
						jzrq: '',
						gztime: ''
					};
				}
			} catch (error) {
				console.error('加载基金详情失败:', error);
			} finally {
				// uni.hideLoading();
			}
		},
		async loadChartData(code) {
			this.chartLoading = true;
			this.chartData = [];
			this.chartLabels = [];

			try {
				// 使用净值走势接口
				const data = await getFundHistoryNav(code, this.chartPeriod);
				console.log('图表数据:', data[0]?.date, '->', data[data.length-1]?.date);
				if (data && data.length > 0) {
					this.chartData = data.map(item => item.nav);
					// 均匀显示日期标签
					const step = Math.max(1, Math.floor(data.length / 4));
					this.chartLabels = data.map((item, index) => {
						if (index === 0 || index === data.length - 1 || index % step === 0) {
							return item.date.substring(5); // MM-DD
						}
						return '';
					});
				}
			} catch (e) {
				console.error('获取图表数据失败', e);
			} finally {
				this.chartLoading = false;
			}
		},
		changeChartPeriod(period) {
			if (this.chartPeriod === period) return;
			this.chartPeriod = period;
			this.loadChartData(this.fundCode);
		},
		editFund() {
			uni.navigateTo({
				url: `/pages/fund/edit?code=${this.fundCode}`
			});
		},
		deleteFund() {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除 ${this.fundDetail.name} 吗？`,
				success: (res) => {
					if (res.confirm) {
						// 从本地基金列表中删除
						DataManager.removeFund(this.fundCode);
						
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
						
						// 触发全局事件，通知主页面刷新数据
						uni.$emit('fundDeleted', { fundCode: this.fundCode });
						
						// 延迟返回上一页
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				}
			});
		},
		showRemarkEdit() {
			// 跳转到编辑页面，并标记为备注编辑模式
			uni.navigateTo({
				url: `/pages/fund/edit?code=${this.fundCode}&focus=remark`
			});
		}
	}
}
</script>

<style lang="scss">
.fund-detail-container {
	padding: 20rpx;
	padding-bottom: 120rpx; // 为底部按钮留出空间
	background-color: $page-bg;
	min-height: 100vh;
}

/* Header Card */
.fund-header-card {
	background: linear-gradient(135deg, #ffffff, #f9faff);
	border-radius: $uni-border-radius-lg;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: $card-shadow;
	border: 1rpx solid #eef0f5;
	
	.fund-title-row {
		margin-bottom: 30rpx;
		
		.fund-name {
			font-size: 34rpx;
			font-weight: bold;
			color: $uni-text-color;
			display: block;
			margin-bottom: 6rpx;
		}
		
		.fund-code {
			font-size: 26rpx;
			color: $uni-text-color-grey;
			background-color: #f0f2f5;
			padding: 2rpx 10rpx;
			border-radius: 6rpx;
		}
	}
	
	.main-metrics {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		
		.metric-main {
			display: flex;
			flex-direction: column;
			
			.value {
				font-size: 60rpx;
				font-weight: bold;
				line-height: 1.1;
				font-family: 'DIN Alternate', 'Roboto', sans-serif;
			}
			
			.label {
				font-size: 24rpx;
				color: $uni-text-color-grey;
				margin-top: 6rpx;
			}
		}
		
		.metric-sub {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			min-width: 180rpx;
			
			.value {
				font-size: 32rpx;
				font-weight: 500;
				color: $uni-text-color;
				margin-bottom: 6rpx;
				font-family: 'DIN Alternate', 'Roboto', sans-serif;
				text-align: right;
			}
			
			.label {
				font-size: 22rpx;
				color: $uni-text-color-grey;
			}
		}
	}
}

/* Common Card Style */
.detail-card, .chart-card {
	background-color: $card-bg;
	border-radius: $uni-border-radius-lg;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: $card-shadow;
	
	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: $uni-color-title;
		margin-bottom: 24rpx;
		padding-left: 16rpx;
		border-left: 6rpx solid $uni-color-primary;
		line-height: 1;
	}
}

/* Detail Grid */
.data-grid {
	display: flex;
	flex-wrap: wrap;
	
	.data-item {
		width: 50%;
		display: flex;
		flex-direction: column;
		margin-bottom: 24rpx;
		
		.label {
			font-size: 24rpx;
			color: $uni-text-color-grey;
			margin-bottom: 8rpx;
		}
		
		.value {
			font-size: 28rpx;
			color: $uni-text-color;
			font-weight: 500;
		}
	}
}

.holding-profit {
	margin-top: 10rpx;
	
	.divider {
		height: 1rpx;
		background-color: #eee;
		margin-bottom: 24rpx;
	}
	
	.profit-row {
		display: flex;
		justify-content: space-between;
		background-color: #f9faff;
		padding: 20rpx;
		border-radius: 8rpx;
		
		.profit-item {
			display: flex;
			flex-direction: column;
			
			&:last-child {
				align-items: flex-end;
			}
			
			.label {
				font-size: 22rpx;
				color: $uni-text-color-grey;
				margin-bottom: 6rpx;
			}
			
			.value {
				font-size: 30rpx;
				font-weight: bold;
			}
			
			.profit-values {
				display: flex;
				align-items: baseline;
				
				.value {
					margin-right: 10rpx;
				}
				
				.rate {
					font-size: 24rpx;
					font-weight: 500;
				}
			}
		}
	}
}

/* Chart Header */
.chart-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.period-tabs {
	display: flex;
	gap: 16rpx;
}

.period-tab {
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	color: #666;
	background-color: #f5f5f5;
	border-radius: 20rpx;
	transition: all 0.2s;

	&.active {
		background-color: #e8f4fd;
		color: #2979ff;
	}
}

/* Chart Placeholder */
.chart-container {
	height: 420rpx;
	background-color: #f9f9f9;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: visible;

	.chart-loading {
		color: #999;
		font-size: 26rpx;
	}

	.chart-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0.5;

		.icon {
			font-size: 60rpx;
			margin-bottom: 20rpx;
		}

		.text {
			font-size: 26rpx;
			color: $uni-text-color-grey;
		}
	}
}

/* Bottom Actions - 使用 cover-view 覆盖 canvas */
.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background-color: #fff;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	
	.action-btn {
		flex: 1;
		margin: 0 15rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		
		&.edit {
			background-color: #2979ff;
			color: #fff;
		}
		
		&.delete {
			background-color: #fff;
			color: #ff4d4f;
			border: 2rpx solid #ffebeb;
			box-sizing: border-box;
		}
	}
}

/* Remark Card */
.remark-card {
	.remark-content {
		background-color: #f9faff;
		border-radius: 8rpx;
		padding: 20rpx;
		font-size: 28rpx;
		color: $uni-text-color;
		line-height: 1.8;
		white-space: pre-wrap;
		word-break: break-all;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;

		.remark-text {
			flex: 1;
		}

		.remark-edit-hint {
			font-size: 22rpx;
			color: #999;
			margin-left: 16rpx;
			flex-shrink: 0;
		}
	}

	.remark-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 30rpx 20rpx;
		background-color: #f9faff;
		border-radius: 8rpx;
		border: 2rpx dashed #e0e0e0;

		.empty-icon {
			font-size: 28rpx;
			margin-right: 10rpx;
		}

		.empty-text {
			font-size: 28rpx;
			color: #999;
		}
	}
}
</style>
