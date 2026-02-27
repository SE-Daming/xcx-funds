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
					<text class="label">估算涨幅</text>
				</view>
				<view class="metric-sub">
					<text class="value">{{ fundDetail.gsz || '--' }}</text>
					<text class="label">估算净值</text>
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
					<text class="label">单位净值</text>
					<text class="value">{{ fundDetail.dwjz || '--' }}</text>
				</view>
				<view class="data-item">
					<text class="label">净值日期</text>
					<text class="value">{{ fundDetail.jzrq || '--' }}</text>
				</view>
				<view class="data-item">
					<text class="label">持有份额</text>
					<text class="value">{{ fundDetail.num || 0 }}</text>
				</view>
				<view class="data-item">
					<text class="label">持仓成本</text>
					<text class="value">{{ fundDetail.cost || 0 }}</text>
				</view>
			</view>
			
			<!-- 持仓收益计算 -->
			<view class="holding-profit" v-if="fundDetail.num > 0">
				<view class="divider"></view>
				<view class="profit-row">
					<view class="profit-item">
						<text class="label">持有金额</text>
						<text class="value">{{ (fundDetail.num * (fundDetail.jzrq === new Date().toISOString().slice(0, 10) ? (parseFloat(fundDetail.dwjz) || 0) : (parseFloat(fundDetail.gsz) || parseFloat(fundDetail.dwjz) || 0))).toFixed(2) }}</text>
					</view>
					<view class="profit-item">
						<text class="label">持有收益</text>
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
		
		<!-- 图表区域 -->
		<view class="chart-card">
			<view class="card-title">净值估算趋势</view>
			<view class="chart-container">
				<fund-chart :data="chartData" :labels="chartLabels" :color="chartColor"></fund-chart>
			</view>
		</view>
		
		<!-- 底部操作栏 -->
		<view class="bottom-actions">
			<button class="action-btn edit" @click="editFund">编辑持仓</button>
			<button class="action-btn delete" @click="deleteFund">删除自选</button>
		</view>
	</view>
</template>

<script>
import { getFundData, getFundIntradayValuation } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';
import FundChart from '@/components/fund-chart/fund-chart.vue';

console.log('fund-api exports:', { getFundData, getFundIntradayValuation });

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
				cost: 0
			},
			localFundInfo: null,
			deviceId: '',
			chartData: [],
			chartLabels: ['09:30', '11:30/13:00', '15:00']
		}
	},
	computed: {
		chartColor() {
			if (this.chartData.length > 0) {
				// 如果有数据，根据最后一个点的涨跌幅决定颜色
				const last = this.chartData[this.chartData.length - 1];
				return last >= 0 ? '#f5222d' : '#52c41a';
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
			// 假设格式为 "2023-01-01 15:00" 或 "15:00"
			if (timeStr.length > 10) {
				return timeStr.substring(11, 16);
			}
			return timeStr;
		},
		calculateProfit() {
			if (!this.fundDetail.num || !this.fundDetail.cost) return 0;
			
			// 逻辑修改：
			// 判断净值是否已更新为今日
			const todayStr = new Date().toISOString().slice(0, 10);
			const isUpdated = this.fundDetail.jzrq === todayStr;
			
			// 确定计算用的当前净值 (Current NAV)
			// 如果净值已更新为今日，则使用 dwjz；否则优先使用 gsz（盘中估值），如果没有 gsz 则回退到 dwjz
			let currentPrice = 0;
			if (isUpdated) {
				currentPrice = parseFloat(this.fundDetail.dwjz) || 0;
			} else {
				currentPrice = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
			}
			
			if (currentPrice === 0) return 0;
			
			return (currentPrice - parseFloat(this.fundDetail.cost)) * parseFloat(this.fundDetail.num);
		},
		calculateProfitRate() {
			if (!this.fundDetail.num || !this.fundDetail.cost) return '0.00';
			
			// 逻辑修改：同上
			const todayStr = new Date().toISOString().slice(0, 10);
			const isUpdated = this.fundDetail.jzrq === todayStr;
			
			let currentPrice = 0;
			if (isUpdated) {
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
						cost: this.localFundInfo ? this.localFundInfo.cost : 0
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
			try {
				const data = await getFundIntradayValuation(code);
				if (data && data.length > 0) {
					// 提取涨跌幅数据用于绘图
					this.chartData = data.map(item => item.change);
				} else {
					this.chartData = [];
				}
			} catch (e) {
				console.error('获取图表数据失败', e);
				this.chartData = [];
			}
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
			
			.value {
				font-size: 32rpx;
				font-weight: 500;
				color: $uni-text-color;
				margin-bottom: 6rpx;
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

/* Chart Placeholder */
.chart-container {
	height: 400rpx;
	background-color: #f9f9f9;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	
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

/* Bottom Actions */
.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background-color: #fff;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	display: flex;
	justify-content: space-between;
	z-index: 100;
	
	.action-btn {
		flex: 1;
		margin: 0 15rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		height: 80rpx;
		line-height: 80rpx;
		border: none;
		
		&::after {
			border: none;
		}
		
		&.edit {
			background-color: $uni-color-primary;
			color: #fff;
			box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.3);
		}
		
		&.delete {
			background-color: #fff;
			color: $uni-color-error;
			border: 2rpx solid #ffebeb;
		}
	}
}
</style>
