<template>
	<view class="add-fund-container">
		<view class="search-section">
			<view class="search-input-container">
				<input 
					class="search-input" 
					v-model="searchKeyword" 
					placeholder="请输入藏品编号或名称" 
					@input="searchFunds"
					@confirm="handleSearch"
				/>
				<button class="search-btn" @click="handleSearch">搜索</button>
			</view>
		</view>
		
		<view class="result-section" v-if="searchResults.length > 0">
			<view class="result-item" v-for="(fund, index) in searchResults" :key="index" @click="selectFund(fund)">
				<view class="fund-info">
					<view class="fund-name">{{ fund.name }}</view>
					<view class="fund-code">{{ fund.code }}</view>
				</view>
				<view class="select-btn">选择</view>
			</view>
		</view>
		
		<view class="selected-section" v-if="selectedFunds.length > 0">
			<view class="section-title">已选择 ({{ selectedFunds.length }})</view>
			<view class="selected-item" v-for="(fund, index) in selectedFunds" :key="index">
				<view class="fund-info">
					<view class="fund-name">{{ fund.name }}</view>
					<view class="fund-code">{{ fund.code }}</view>
				</view>
				<view class="remove-btn" @click="removeFund(index)">移除</view>
			</view>
		</view>
		
		<view class="action-section" v-if="selectedFunds.length > 0">
			<button class="submit-btn" @click="addSelectedFunds">添加选中藏品 ({{ selectedFunds.length }})</button>
		</view>
	</view>
</template>

<script>
import { searchFunds as searchFundsAPI } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';

export default {
	data() {
		return {
			searchKeyword: '',
			searchResults: [],
			selectedFunds: []
		}
	},
	methods: {
		async searchFunds(e) {
			const keyword = e.detail.value.trim();
			if (!keyword) {
				this.searchResults = [];
				return;
			}
			
			try {
				// 调用API搜索基金
				const results = await searchFundsAPI(keyword);
				this.searchResults = results.slice(0, 10); // 限制最多显示10个结果
			} catch (error) {
				console.error('搜索基金失败:', error);
				uni.showToast({
					title: '搜索失败',
					icon: 'none'
				});
			}
		},
		async handleSearch() {
			const keyword = this.searchKeyword.trim();
			if (!keyword) return;
			
			try {
				// 调用API搜索基金
				const results = await searchFundsAPI(keyword);
				this.searchResults = results.slice(0, 10);
			} catch (error) {
				console.error('搜索基金失败:', error);
				uni.showToast({
					title: '搜索失败',
					icon: 'none'
				});
			}
		},
		selectFund(fund) {
			// 检查是否已经选择过该基金
			const exists = this.selectedFunds.some(item => item.code === fund.code);
			if (!exists) {
				this.selectedFunds.push(fund);
			} else {
				uni.showToast({
					title: '该藏品已选择',
					icon: 'none'
				});
			}
		},
		removeFund(index) {
			this.selectedFunds.splice(index, 1);
		},
		addSelectedFunds() {
			if (this.selectedFunds.length === 0) {
				uni.showToast({
					title: '请先选择藏品',
					icon: 'none'
				});
				return;
			}
			
			// 获取现有基金列表
			const existingFunds = DataManager.getFundList();
			
			// 检查是否有重复的基金
			const newFunds = [];
			this.selectedFunds.forEach(selectedFund => {
				const exists = existingFunds.some(existingFund => existingFund.code === selectedFund.code);
				if (!exists) {
					newFunds.push({
						code: selectedFund.code,
						name: selectedFund.name,
						num: 0, // 默认持有份额为0
						cost: 0 // 默认持仓成本为0
					});
				}
			});
			
			if (newFunds.length === 0) {
				uni.showToast({
					title: '所选藏品已在列表中',
					icon: 'none'
				});
				return;
			}
			
			// 添加新基金到现有列表
			newFunds.forEach(fund => {
				DataManager.addFund(fund);
			});
			
			uni.showLoading({
				title: '添加中...'
			});
			
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({
					title: `成功添加${newFunds.length}件藏品`,
					icon: 'success'
				});
				
				// 触发全局事件，通知主页面刷新数据
				uni.$emit('fundAdded', { count: newFunds.length });
				
				// 清空已选基金
				this.selectedFunds = [];
				
				// 返回上一页
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}, 1000);
		}
	}
}
</script>

<style lang="scss">
.add-fund-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.search-section {
	background-color: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
}

.search-section .search-input-container {
	display: flex;
}

.search-section .search-input-container .search-input {
	flex: 1;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 20rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx 0 0 8rpx;
	font-size: 28rpx;
}

.search-section .search-input-container .search-btn {
	width: 120rpx;
	height: 60rpx;
	line-height: 60rpx;
	background-color: #3498db;
	color: #fff;
	border-radius: 0 8rpx 8rpx 0;
	font-size: 28rpx;
	margin-left: -1rpx;
}

.result-section {
	background-color: #fff;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
}

.result-section .result-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	border-bottom: 1rpx solid #eee;
}

.result-section .result-item:last-child {
	border-bottom: none;
}

.result-section .result-item .fund-info {
	flex: 1;
}

.result-section .result-item .fund-info .fund-name {
	font-size: 30rpx;
	font-weight: bold;
	margin-bottom: 5rpx;
}

.result-section .result-item .fund-info .fund-code {
	color: #888;
	font-size: 26rpx;
}

.result-section .result-item .select-btn {
	padding: 8rpx 20rpx;
	background-color: #3498db;
	color: #fff;
	border-radius: 5rpx;
	font-size: 26rpx;
}

.selected-section {
	background-color: #fff;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.selected-section .section-title {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
}

.selected-section .selected-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
}

.selected-section .selected-item:last-child {
	border-bottom: none;
}

.selected-section .selected-item .fund-info {
	flex: 1;
}

.selected-section .selected-item .fund-info .fund-name {
	font-size: 30rpx;
	font-weight: bold;
	margin-bottom: 5rpx;
}

.selected-section .selected-item .fund-info .fund-code {
	color: #888;
	font-size: 26rpx;
}

.selected-section .selected-item .remove-btn {
	padding: 8rpx 20rpx;
	background-color: #e74c3c;
	color: #fff;
	border-radius: 5rpx;
	font-size: 26rpx;
}

.action-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx;
	background-color: #fff;
	border-top: 1rpx solid #eee;
}

.action-section .submit-btn {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #3498db;
	color: #fff;
	border-radius: 10rpx;
	font-size: 32rpx;
}
</style>