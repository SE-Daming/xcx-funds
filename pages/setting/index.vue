<template>
	<view class="setting-container">
		<view class="setting-section">
			<view class="section-title">显示设置</view>
			<view class="setting-item">
				<view class="setting-label">显示估算净值</view>
				<switch class="setting-switch" :checked="settings.showGSZ" @change="toggleSetting('showGSZ')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示持有金额</view>
				<switch class="setting-switch" :checked="settings.showAmount" @change="toggleSetting('showAmount')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示估算收益</view>
				<switch class="setting-switch" :checked="settings.showGains" @change="toggleSetting('showGains')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示持有收益</view>
				<switch class="setting-switch" :checked="settings.showCost" @change="toggleSetting('showCost')" />
			</view>
			<view class="setting-item">
				<view class="setting-label">显示持有收益率</view>
				<switch class="setting-switch" :checked="settings.showCostRate" @change="toggleSetting('showCostRate')" />
			</view>
		</view>
		
		<view class="setting-section">
			<view class="section-title">主题设置</view>
			<view class="setting-item">
				<view class="setting-label">暗色模式</view>
				<switch class="setting-switch" :checked="settings.darkMode" @change="toggleTheme" />
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
		</view>
		
		<view class="setting-section">
			<view class="section-title">其他</view>
			<view class="setting-item" @click="showAbout">
				<view class="setting-label">关于基金助手</view>
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
			
			// 应用主题设置
			this.applyTheme();
		},
		toggleSetting(settingName) {
			this.settings[settingName] = !this.settings[settingName];
			this.saveSettings();
		},
		toggleTheme() {
			this.settings.darkMode = !this.settings.darkMode;
			this.saveSettings();
			
			// 应用主题变化
			this.applyTheme();
		},
		applyTheme() {
			// 应用主题变化
			if (this.settings.darkMode) {
				uni.setNavigationBarColor({
					frontColor: '#ffffff',
					backgroundColor: '#2c3e50'
				});
			} else {
				uni.setNavigationBarColor({
					frontColor: '#000000',
					backgroundColor: '#F8F8F8'
				});
			}
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
										
										// 应用主题设置
										this.applyTheme();
										
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
		showAbout() {
			uni.showModal({
				title: '关于基金助手',
				content: '基金助手小程序版本 v1.0.0\n帮助您实时跟踪基金投资情况\n\n韭菜计算助手团队',
				showCancel: false,
				confirmText: '确定'
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