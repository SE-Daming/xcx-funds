<template>
	<view class="setting-container">
		<view class="setting-section">
			<view class="section-title">显示设置</view>
			<view class="setting-item">
				<view class="setting-label">显示预估单价</view>
				<switch class="setting-switch" :checked="settings.showGSZ" @change="toggleSetting('showGSZ')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示持有总值</view>
				<switch class="setting-switch" :checked="settings.showAmount" @change="toggleSetting('showAmount')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示今日变动</view>
				<switch class="setting-switch" :checked="settings.showGains" @change="toggleSetting('showGains')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示累计变动</view>
				<switch class="setting-switch" :checked="settings.showCost" @change="toggleSetting('showCost')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示持有收益率</view>
				<switch class="setting-switch" :checked="settings.showCostRate" @change="toggleSetting('showCostRate')" />
			</view>
		</view>
		
		<view class="setting-section">
			<view class="section-title">数据管理</view>
			<view class="setting-item" @click="exportData">
				<view class="setting-label">导出配置</view>
				<view class="setting-arrow">></view>
			</view>
			<view class="setting-item" @click="importData">
				<view class="setting-label">导入配置</view>
				<view class="setting-arrow">></view>
			</view>
			<view class="setting-item" @click="appendData">
				<view class="setting-label">新增配置</view>
				<view class="setting-arrow">></view>
			</view>
			<view class="setting-item" @click="goToMarket">
				<view class="setting-label">参考</view>
				<view class="setting-arrow">></view>
			</view>
		</view>
		
		<view class="logout-section">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
import { DataManager } from '@/utils/data-manager.js';

export default {
	data() {
		return {
			settings: {
				showAmount: false,
				showGains: false,
				showCost: false,
				showCostRate: false,
				showGSZ: false,
				darkMode: false
			}
		}
	},
	onLoad() {
		this.loadSettings();
	},
	methods: {
		loadSettings() {
			// 从本地存储加载设置
			const savedSettings = DataManager.getSettings();
			if (savedSettings) {
				this.settings = { ...this.settings, ...savedSettings };
			}
		},
		toggleSetting(settingName) {
			this.settings[settingName] = !this.settings[settingName];
			this.saveSettings();
		},
		saveSettings() {
			// 保存设置
			DataManager.saveSettings(this.settings);
			
			// 通知其他页面更新设置
			uni.$emit('settingsChanged', this.settings);
		},
		exportData() {
			// 导出数据逻辑
			uni.showModal({
				title: '导出配置',
				content: '确定要导出配置数据吗？',
				success: (res) => {
					if (res.confirm) {
						// 获取所有数据
						const allData = {
							settings: this.settings,
							fundList: DataManager.getFundList(),
							version: '1.0.0'
						};
						
						// 转换为JSON字符串
						const dataStr = JSON.stringify(allData, null, 2);
						
						uni.setClipboardData({
							data: dataStr,
							success: () => {
								uni.showToast({
									title: '配置已复制到剪贴板',
									icon: 'success'
								});
							}
						});
					}
				}
			});
		},
		importData() {
			// 导入数据逻辑
			uni.showModal({
				title: '导入配置',
				content: '请确保已将配置数据复制到剪贴板',
				success: (res) => {
					if (res.confirm) {
						// 从剪贴板获取数据
						uni.getClipboardData({
							success: (res) => {
								try {
									const importedData = JSON.parse(res.data);
									
									// 验证数据格式
									if (importedData.settings && importedData.fundList !== undefined) {
										// 保存导入的数据
										DataManager.saveSettings(importedData.settings);
										DataManager.saveFundList(importedData.fundList);
										
										// 更新当前设置
										this.settings = importedData.settings;
										
										uni.showToast({
											title: '导入成功',
											icon: 'success'
										});
									} else {
										throw new Error('配置格式不正确');
									}
								} catch (e) {
									console.error('导入数据失败:', e);
									uni.showToast({
										title: '导入失败：格式错误',
										icon: 'none'
									});
								}
							},
							fail: () => {
								uni.showToast({
									title: '请先复制配置数据',
									icon: 'none'
								});
							}
						});
					}
				}
			});
		},
		appendData() {
			// 新增配置逻辑（追加模式）
			uni.showModal({
				title: '新增配置',
				content: '请确保已将配置数据（JSON格式）复制到剪贴板，新数据将追加到现有列表中。',
				success: (res) => {
					if (res.confirm) {
						uni.getClipboardData({
							success: (res) => {
								try {
									let newFunds = [];
									let importedData = null;
									
									// 尝试解析JSON
									try {
										importedData = JSON.parse(res.data);
									} catch(e) {
										throw new Error('剪贴板内容不是有效的JSON格式');
									}

									// 识别数据格式
									if (Array.isArray(importedData)) {
										// 格式：[...]
										newFunds = importedData;
									} else if (importedData && Array.isArray(importedData.fundList)) {
										// 格式：{ fundList: [...], ... }
										newFunds = importedData.fundList;
									} else {
										throw new Error('未识别到有效的基金列表数据');
									}
									
									if (newFunds.length === 0) {
										uni.showToast({ title: '没有包含任何基金数据', icon: 'none' });
										return;
									}

									// 获取现有列表
									const currentFunds = DataManager.getFundList();
									const existingCodes = new Set(currentFunds.map(f => f.code));
									
									let addedCount = 0;
									let skippedCount = 0;
									
									// 遍历新数据并去重追加
									newFunds.forEach(fund => {
										if (fund && fund.code) {
											if (!existingCodes.has(fund.code)) {
												currentFunds.push(fund);
												existingCodes.add(fund.code);
												addedCount++;
											} else {
												skippedCount++;
											}
										}
									});
									
									if (addedCount > 0) {
										// 保存更新后的列表
										DataManager.saveFundList(currentFunds);
										// 通知更新
										uni.$emit('fundAdded', {}); 
										
										uni.showModal({
											title: '新增成功',
											content: `成功添加 ${addedCount} 个基金，跳过 ${skippedCount} 个已存在的基金。`,
											showCancel: false
										});
									} else {
										uni.showModal({
											title: '未添加',
											content: `所有 ${skippedCount} 个基金均已存在。`,
											showCancel: false
										});
									}
									
								} catch (e) {
									console.error('新增配置失败:', e);
									uni.showModal({
										title: '解析失败',
										content: e.message || '数据格式错误',
										showCancel: false
									});
								}
							},
							fail: () => {
								uni.showToast({
									title: '读取剪贴板失败',
									icon: 'none'
								});
							}
						});
					}
				}
			});
		},
		goToMarket() {
			uni.navigateTo({
				url: '/pages/market/index'
			});
		},
		logout() {
			uni.showModal({
				title: '退出登录',
				content: '确定要退出吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除登录状态
						uni.removeStorageSync('userToken');
						uni.showToast({
							title: '已退出',
							icon: 'success'
						});
					}
				}
			});
		}
	}
}
</script>

<style lang="scss">
.setting-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.setting-section {
	background-color: #fff;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
}

.setting-section .section-title {
	padding: 20rpx 20rpx 10rpx;
	font-size: 28rpx;
	color: #666;
	font-weight: bold;
}

.setting-section .setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	border-bottom: 1rpx solid #eee;
}

.setting-section .setting-item:last-child {
	border-bottom: none;
}

.setting-section .setting-item .setting-label {
	font-size: 30rpx;
	color: #333;
}

.setting-section .setting-item .setting-switch {
	transform: scale(0.8);
}

.setting-section .setting-item .setting-arrow {
	color: #ccc;
	font-size: 32rpx;
}

.logout-section {
	padding: 40rpx 20rpx;
	text-align: center;
}

.logout-section .logout-btn {
	background-color: #e74c3c;
	color: #fff;
	border-radius: 10rpx;
	padding: 20rpx;
	font-size: 32rpx;
	width: 100%;
	max-width: 400rpx;
	margin: 0 auto;
}
</style>
