<template>
	<view class="market-container">
		<view class="tabs-wrapper">
			<scroll-view scroll-x class="tabs" :scroll-into-view="'tab-' + activeTab" scroll-with-animation>
				<view class="tab-item" 
					  id="tab-index"
					  :class="{ active: activeTab === 'index' }" 
					  @click="switchTab('index')">
					主要指数
				</view>
				<view class="tab-item" 
					  id="tab-industry"
					  :class="{ active: activeTab === 'industry' }" 
					  @click="switchTab('industry')">
					行业板块
				</view>
				<view class="tab-item" 
					  id="tab-northbound"
					  :class="{ active: activeTab === 'northbound' }" 
					  @click="switchTab('northbound')">
					北向资金
				</view>
				<view class="tab-item" 
					  id="tab-southbound"
					  :class="{ active: activeTab === 'southbound' }" 
					  @click="switchTab('southbound')">
					南向资金
				</view>
			</scroll-view>
		</view>
		
		<view class="content-wrapper">
			<!-- 主要指数 -->
			<view v-if="activeTab === 'index'" class="tab-panel">
				<view class="index-grid">
					<view class="index-card" v-for="(index, idx) in indexData" :key="idx" 
						:class="{'up': index.change > 0, 'down': index.change < 0}">
						<view class="index-name">{{ index.name }}</view>
						<view class="index-value" :class="{'red': index.change > 0, 'green': index.change < 0}">
							{{ index.value }}
						</view>
						<view class="index-change-row">
							<text class="change-val" :class="{'red': index.change > 0, 'green': index.change < 0}">
								{{ index.change > 0 ? '+' : '' }}{{ index.change }}%
							</text>
							<text class="arrow">{{ index.change > 0 ? '↑' : '↓' }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 行业板块 -->
			<view v-if="activeTab === 'industry'" class="tab-panel">
				<view class="list-card">
					<view class="list-header">
						<text>板块名称</text>
						<text>涨跌幅</text>
					</view>
					<view class="list-item" v-for="(industry, idx) in industryData" :key="idx">
						<view class="item-name">
							<text class="rank">{{ idx + 1 }}</text>
							<text class="name">{{ industry.name }}</text>
						</view>
						<view class="item-value">
							<view class="change-tag" :class="{'bg-red': industry.change > 0, 'bg-green': industry.change < 0}">
								{{ industry.change > 0 ? '+' : '' }}{{ industry.change }}%
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 北向资金 -->
			<view v-if="activeTab === 'northbound'" class="tab-panel">
				<view class="capital-card">
					<view class="capital-header">
						<text class="title">北向资金净流入</text>
						<text class="total" :class="{'red': northboundData.total > 0, 'green': northboundData.total < 0}">
							{{ northboundData.total > 0 ? '+' : '' }}{{ northboundData.total }}亿
						</text>
					</view>
					<view class="capital-details">
						<view class="capital-item">
							<text class="label">沪股通</text>
							<text class="value" :class="{'red': northboundData.hgt > 0, 'green': northboundData.hgt < 0}">
								{{ northboundData.hgt > 0 ? '+' : '' }}{{ northboundData.hgt }}亿
							</text>
						</view>
						<view class="divider"></view>
						<view class="capital-item">
							<text class="label">深股通</text>
							<text class="value" :class="{'red': northboundData.sgt > 0, 'green': northboundData.sgt < 0}">
								{{ northboundData.sgt > 0 ? '+' : '' }}{{ northboundData.sgt }}亿
							</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 南向资金 -->
			<view v-if="activeTab === 'southbound'" class="tab-panel">
				<view class="capital-card">
					<view class="capital-header">
						<text class="title">南向资金净流入</text>
						<text class="total" :class="{'red': southboundData.total > 0, 'green': southboundData.total < 0}">
							{{ southboundData.total > 0 ? '+' : '' }}{{ southboundData.total }}亿
						</text>
					</view>
					<view class="capital-details">
						<view class="capital-item">
							<text class="label">港股通(沪)</text>
							<text class="value" :class="{'red': southboundData.hgt > 0, 'green': southboundData.hgt < 0}">
								{{ southboundData.hgt > 0 ? '+' : '' }}{{ southboundData.hgt }}亿
							</text>
						</view>
						<view class="divider"></view>
						<view class="capital-item">
							<text class="label">港股通(深)</text>
							<text class="value" :class="{'red': southboundData.sgt > 0, 'green': southboundData.sgt < 0}">
								{{ southboundData.sgt > 0 ? '+' : '' }}{{ southboundData.sgt }}亿
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getIndexData, getNorthboundData, getSouthboundData } from '@/utils/fund-api.js';

export default {
	data() {
		return {
			activeTab: 'index',
			indexData: [],
			industryData: [],
			northboundData: {
				hgt: 0,
				sgt: 0,
				total: 0
			},
			southboundData: {
				hgt: 0,
				sgt: 0,
				total: 0
			}
		}
	},
	onLoad() {
		this.loadData();
	},
	methods: {
		switchTab(tab) {
			this.activeTab = tab;
			// 切换标签时加载对应数据
			if (tab === 'index' && this.indexData.length === 0) {
				this.loadIndexData();
			} else if (tab === 'industry' && this.industryData.length === 0) {
				this.loadIndustryData();
			} else if (tab === 'northbound' && this.northboundData.total === 0) {
				this.loadNorthboundData();
			} else if (tab === 'southbound' && this.southboundData.total === 0) {
				this.loadSouthboundData();
			}
		},
		async loadData() {
			// 加载所有数据
			await this.loadIndexData();
			await this.loadIndustryData();
			await this.loadNorthboundData();
			await this.loadSouthboundData();
		},
		async loadIndexData() {
			try {
				// 上证指数、深证成指、创业板指、沪深300、科创50
				const indexCodes = ['1.000001', '0.399001', '0.399006', '1.000300', '1.000688'];
				const result = await getIndexData(indexCodes);
				this.indexData = result.map(item => ({
					name: item.f14,
					value: item.f2,
					change: item.f3
				}));
			} catch (error) {
				console.error('获取指数数据失败:', error);
				// 使用默认数据
				this.indexData = [
					{ name: '上证指数', value: '3050.12', change: 0.56 },
					{ name: '深证成指', value: '9821.34', change: -0.23 },
					{ name: '创业板指', value: '2015.67', change: 1.23 },
					{ name: '沪深300', value: '3856.78', change: 0.45 },
					{ name: '科创50', value: '987.23', change: -0.12 }
				];
			}
		},
		async loadIndustryData() {
			try {
				// 行业板块数据，暂时使用模拟数据
				this.industryData = [
					{ name: '酿酒行业', change: 2.34 },
					{ name: '医疗器械', change: 1.87 },
					{ name: '软件服务', change: -0.56 },
					{ name: '证券', change: 0.89 },
					{ name: '银行', change: 0.34 },
					{ name: '房地产', change: -1.23 }
				];
			} catch (error) {
				console.error('获取行业数据失败:', error);
				this.industryData = [
					{ name: '酿酒行业', change: 2.34 },
					{ name: '医疗器械', change: 1.87 },
					{ name: '软件服务', change: -0.56 },
					{ name: '证券', change: 0.89 },
					{ name: '银行', change: 0.34 },
					{ name: '房地产', change: -1.23 }
				];
			}
		},
		async loadNorthboundData() {
			try {
				// const result = await getNorthboundData();
				// this.northboundData = result;
				this.northboundData = {
					hgt: 32.45,
					sgt: 45.67,
					total: 78.12
				};
			} catch (error) {
				console.error('获取北向资金数据失败:', error);
				// 使用默认数据
				this.northboundData = {
					hgt: 32.45,
					sgt: 45.67,
					total: 78.12
				};
			}
		},
		async loadSouthboundData() {
			try {
				// const result = await getSouthboundData();
				// this.southboundData = result;
				this.southboundData = {
					hgt: 12.34,
					sgt: 23.56,
					total: 35.90
				};
			} catch (error) {
				console.error('获取南向资金数据失败:', error);
				// 使用默认数据
				this.southboundData = {
					hgt: 12.34,
					sgt: 23.56,
					total: 35.90
				};
			}
		}
	}
}
</script>

<style lang="scss">
.market-container {
	min-height: 100vh;
	background-color: $page-bg;
	display: flex;
	flex-direction: column;
}

/* Tabs */
.tabs-wrapper {
	background-color: #fff;
	padding: 20rpx 0;
	position: sticky;
	top: 0;
	z-index: 10;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
	
	.tabs {
		white-space: nowrap;
		width: 100%;
		
		.tab-item {
			display: inline-block;
			padding: 10rpx 30rpx;
			margin: 0 10rpx;
			font-size: 28rpx;
			color: $uni-text-color-grey;
			border-radius: 30rpx;
			background-color: #f5f7fa;
			transition: all 0.3s;
			
			&:first-child {
				margin-left: 20rpx;
			}
			
			&:last-child {
				margin-right: 20rpx;
			}
			
			&.active {
				background-color: $uni-color-primary;
				color: #fff;
				font-weight: 500;
				box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.3);
			}
		}
	}
}

.content-wrapper {
	padding: 20rpx;
	flex: 1;
}

/* Index Grid */
.index-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	
	.index-card {
		width: 48%;
		background-color: #fff;
		border-radius: $uni-border-radius-lg;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: $card-shadow;
		display: flex;
		flex-direction: column;
		align-items: center;
		border-top: 6rpx solid transparent;
		
		&.up {
			border-top-color: $fund-up-color;
		}
		
		&.down {
			border-top-color: $fund-down-color;
		}
		
		.index-name {
			font-size: 28rpx;
			color: $uni-text-color;
			margin-bottom: 10rpx;
		}
		
		.index-value {
			font-size: 36rpx;
			font-weight: bold;
			margin-bottom: 6rpx;
			font-family: 'DIN Alternate', 'Roboto', sans-serif;
		}
		
		.index-change-row {
			font-size: 24rpx;
			display: flex;
			align-items: center;
			
			.change-val {
				font-weight: 500;
			}
			
			.arrow {
				margin-left: 4rpx;
				font-size: 20rpx;
				color: $uni-text-color-grey;
			}
		}
	}
}

/* List Card */
.list-card {
	background-color: #fff;
	border-radius: $uni-border-radius-lg;
	overflow: hidden;
	box-shadow: $card-shadow;
	
	.list-header {
		display: flex;
		justify-content: space-between;
		padding: 20rpx 30rpx;
		background-color: #f9faff;
		font-size: 24rpx;
		color: $uni-text-color-grey;
	}
	
	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.item-name {
			display: flex;
			align-items: center;
			
			.rank {
				width: 36rpx;
				height: 36rpx;
				background-color: #f0f2f5;
				color: #909399;
				font-size: 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 6rpx;
				margin-right: 20rpx;
			}
			
			.name {
				font-size: 30rpx;
				color: $uni-text-color;
			}
		}
		
		.item-value {
			.change-tag {
				padding: 4rpx 16rpx;
				border-radius: 8rpx;
				font-size: 26rpx;
				font-weight: 500;
				
				&.bg-red {
					background-color: rgba(245, 34, 45, 0.1);
					color: $fund-up-color;
				}
				
				&.bg-green {
					background-color: rgba(82, 196, 26, 0.1);
					color: $fund-down-color;
				}
			}
		}
	}
}

/* Capital Card */
.capital-card {
	background-color: #fff;
	border-radius: $uni-border-radius-lg;
	padding: 40rpx 30rpx;
	box-shadow: $card-shadow;
	
	.capital-header {
		text-align: center;
		margin-bottom: 40rpx;
		
		.title {
			font-size: 28rpx;
			color: $uni-text-color-grey;
			margin-bottom: 10rpx;
			display: block;
		}
		
		.total {
			font-size: 48rpx;
			font-weight: bold;
			font-family: 'DIN Alternate', 'Roboto', sans-serif;
		}
	}
	
	.capital-details {
		display: flex;
		align-items: center;
		justify-content: center;
		
		.capital-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.label {
				font-size: 24rpx;
				color: $uni-text-color-grey;
				margin-bottom: 8rpx;
			}
			
			.value {
				font-size: 32rpx;
				font-weight: 500;
				font-family: 'DIN Alternate', 'Roboto', sans-serif;
			}
		}
		
		.divider {
			width: 2rpx;
			height: 60rpx;
			background-color: #f0f0f0;
			margin: 0 20rpx;
		}
	}
}
</style>
