<template>
	<view class="market-container">
		<view class="content-wrapper">
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
	</view>
</template>

<script>
import { getIndexData } from '@/utils/fund-api.js';

export default {
	data() {
		return {
			indexData: [],
		}
	},
	onLoad() {
		this.loadIndexData();
	},
	methods: {
		async loadIndexData() {
			try {
				const indexCodes = ['1.000001', '0.399001', '0.399006', '1.000300', '1.000688'];
				const result = await getIndexData(indexCodes);
				
				const nameMap = {
					'上证指数': '综合参数A',
					'深证成指': '综合参数B',
					'创业板指': '成长参数',
					'沪深300': '核心指标',
					'科创50': '创新指标'
				};
				
				this.indexData = result.map(item => ({
					name: nameMap[item.f14] || item.f14,
					value: item.f2,
					change: item.f3
				}));
			} catch (error) {
				console.error('获取参考数据失败:', error);
				this.indexData = [
					{ name: '综合参数A', value: '3050.12', change: 0.56 },
					{ name: '综合参数B', value: '9821.34', change: -0.23 },
					{ name: '成长参数', value: '2015.67', change: 1.23 },
					{ name: '核心指标', value: '3856.78', change: 0.45 },
					{ name: '创新指标', value: '987.23', change: -0.12 }
				];
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
</style>
