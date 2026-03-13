<template>
	<view class="fund-list-container">
		<!-- 总收益概览卡片 -->
		<view class="dashboard-card" v-if="showGains">
			<view class="dashboard-header">
				<text class="title">今日变动</text>
				<view class="right-tools">
					<view class="update-badge">
						<text class="update-time">{{ lastUpdateDisplay || '--' }}</text>
					</view>
					<view class="refresh-icon" @click="refreshData">
						<text class="icon">🔄</text>
					</view>
				</view>
			</view>
			<view class="dashboard-content">
				<view class="gains-main">
					<text class="amount" :class="{ 'red': totalTodayGains >= 0, 'green': totalTodayGains < 0 }">{{ totalTodayGains > 0 ? '+' : '' }}{{ totalTodayGains.toFixed(2) }}</text>
				</view>
				
				<view class="dashboard-divider"></view>
				
				<view class="gains-grid">
					<view class="grid-item">
						<text class="label">累计变动</text>
						<text class="value" :class="{ 'red': totalHoldGains >= 0, 'green': totalHoldGains < 0 }">{{ totalHoldGains > 0 ? '+' : '' }}{{ totalHoldGains.toFixed(2) }}</text>
					</view>
					<view class="grid-item">
						<text class="label">累计变动率</text>
						<text class="value" v-if="totalCost > 0" :class="{ 'red': totalHoldGains >= 0, 'green': totalHoldGains < 0 }">{{ totalHoldGains > 0 ? '+' : '' }}{{ ((totalHoldGains / totalCost) * 100).toFixed(2) }}%</text>
						<text class="value" v-else>0.00%</text>
					</view>
					<view class="grid-item">
						<text class="label">持有总值</text>
						<text class="value">{{ totalAmount.toFixed(2) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 顶部快捷操作栏 -->
		<view class="action-bar">
			<view class="action-item" @click="goToAddFund">
				<view class="icon-box add-icon">
					<text class="icon">+</text>
				</view>
				<text class="label">添加</text>
			</view>
			<view class="action-item" @click="showImportTutorial">
				<view class="icon-box market-icon">
					<text class="icon">📥</text>
				</view>
				<text class="label">一键导入教程</text>
			</view>
			<view class="action-item" @click="toggleEditMode">
				<view class="icon-box edit-icon" :class="{ 'active': isEditMode }">
					<text class="icon">⚙️</text>
				</view>
				<text class="label">{{ isEditMode ? '完成' : '编辑' }}</text>
			</view>
			<view class="action-item" @click="goToSettings">
				<view class="icon-box setting-icon">
					<text class="icon">🔧</text>
				</view>
				<text class="label">设置</text>
			</view>
		</view>
		
		<!-- 基金列表 -->
		<view class="fund-list">
			<view class="list-header" v-if="fundList.length > 0">
				<text class="title">我的藏品</text>
				<text class="count">{{ fundList.length }}件</text>
				<view class="sort-bar">
					<picker mode="selector" :range="sortTypeRange" :value="sortTypeIndex" @change="onSortTypeChange">
						<view class="dropdown">
							<text>{{ sortTypeLabel }} ▾</text>
						</view>
					</picker>
					<view class="order-toggle" @click.stop="setOrder(sortOrder === 'desc' ? 'asc' : 'desc')">
						<text>{{ sortOrder === 'desc' ? '↓' : '↑' }}</text>
					</view>
				</view>
			</view>

			<view class="fund-card" 
				 v-for="(fund, index) in fundList" 
				 :key="fund.code"
				 @click="goToFundDetail(fund)">
				
				<view class="card-main">
					<view class="fund-info">
						<view class="fund-name-row">
							<text class="fund-name">{{ fund.name }}</text>
						</view>
						<view class="fund-code-row">
							<text class="fund-code">{{ fund.code }}</text>
							<text class="tag" v-if="fund.dwjz">价 {{ fund.dwjz }}</text>
						</view>
					</view>
					
					<view class="fund-metrics">
						<view class="metric-item primary-metric">
							<text class="metric-value" :class="{ 'red': fund.gszzl >= 0, 'green': fund.gszzl < 0 }">
								{{ fund.gszzl ? (fund.gszzl >= 0 ? '+' : '') + fund.gszzl + '%' : '--' }}
							</text>
							<text class="metric-label">预估波动</text>
						</view>
						
						<view class="metric-item secondary-metric" v-if="showGSZ">
							<text class="metric-value">{{ fund.gsz || '--' }}</text>
							<text class="metric-label">预估单价</text>
						</view>
					</view>
				</view>

				<!-- 扩展数据行 -->
				<view class="card-extra" v-if="showGains || showCost || showAmount">
					<view class="extra-item" v-if="showGains">
						<text class="label">今日</text>
						<text class="value" :class="{ 'red': fund.gains >= 0, 'green': fund.gains < 0 }">{{ fund.gains ? (fund.gains >= 0 ? '+' : '') + fund.gains.toFixed(2) : '--' }}</text>
					</view>
					<view class="extra-item" v-if="showCost">
						<text class="label">累计</text>
						<text class="value" :class="{ 'red': fund.costGains >= 0, 'green': fund.costGains < 0 }">{{ fund.costGains ? (fund.costGains >= 0 ? '+' : '') + fund.costGains.toFixed(2) : '--' }}</text>
					</view>
					<view class="extra-item" v-if="showAmount">
						<text class="label">总值</text>
						<text class="value">{{ fund.amount ? fund.amount.toFixed(2) : '--' }}</text>
					</view>
					<view class="extra-item" v-if="showCostRate">
						<text class="label">持有收益率</text>
						<text class="value" :class="{ 'red': parseFloat(fund.costGainsRate) >= 0, 'green': parseFloat(fund.costGainsRate) < 0 }">
							{{ fund.costGainsRate !== undefined ? (parseFloat(fund.costGainsRate) >= 0 ? '+' : '') + fund.costGainsRate + '%' : '--' }}
						</text>
					</view>
				</view>
				
				<!-- 编辑模式覆盖层 -->
				<view class="edit-overlay" v-if="isEditMode" @click.stop>
					<view class="edit-btn" @click.stop="editFund(fund, index)">
						<text>修改</text>
					</view>
					<view class="delete-btn" @click.stop="deleteFund(index)">
						<text>删除</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="fundList.length === 0">
				<view class="empty-icon">📈</view>
				<text class="empty-text">暂无关注的藏品</text>
				<button class="add-btn" @click="goToAddFund">添加藏品</button>
			</view>
		</view>
		
		<!-- 底部占位，防止被导航栏遮挡 -->
		<view class="footer-spacer"></view>
	</view>
</template>

<script>
import { getFundData } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';

export default {
	data() {
		return {
			title: '小蓝条',
			isEditMode: false,
			showAmount: false,
			showGains: false,
			showCost: false,
			showCostRate: false,
			showGSZ: false,
			fundList: [],
			totalTodayGains: 0,
			totalHoldGains: 0,
			totalCost: 0,
			totalAmount: 0,
			deviceId: '',
			lastUpdateDisplay: '',
			sortType: 'none',
			sortOrder: 'desc',
			sortTypeRange: ['预估收益', '持有收益', '预估收益率', '持有收益率', '持有金额'],
			sortTypeKeyRange: ['gains', 'costGains', 'gszzl', 'costGainsRate', 'amount'],
			sortOrderRange: ['降序', '升序'],
			sortOrderKeyRange: ['desc', 'asc'],
			sortTypeIndex: 0,
			sortOrderIndex: 0
		}
	},
	onLoad() {
		this.loadSettings();
		this.loadDeviceId();
		this.loadFundList();
	},
	
	onShow() {
		// 页面显示时重新加载基金列表和数据
		this.loadFundList();
	},
	
	created() {
		// 监听基金更新事件
		uni.$on('fundUpdated', (data) => {
			this.loadFundList();
		});
		
		// 监听基金添加事件
		uni.$on('fundAdded', (data) => {
			this.loadFundList();
		});
		
		// 监听基金删除事件
		uni.$on('fundDeleted', (data) => {
			this.loadFundList();
		});
		
		// 监听设置变更事件
		uni.$on('settingsChanged', (settings) => {
			this.loadSettings();
			// 重新加载数据以反映新的设置
			this.loadFundList();
		});
	},
	computed: {
		sortTypeLabel() {
			return this.sortTypeRange[this.sortTypeIndex] || '排序';
		},
		sortOrderLabel() {
			return this.sortOrderRange[this.sortOrderIndex] || '降序';
		}
	},
	
	beforeDestroy() {
		// 移除事件监听器
		uni.$off('fundUpdated');
		uni.$off('fundAdded');
		uni.$off('fundDeleted');
		uni.$off('settingsChanged');
	},
	
	methods: {
		loadDeviceId() {
			// 获取或生成设备ID
			this.deviceId = DataManager.getDeviceId();
		},
		loadSettings() {
			// 从本地存储加载设置
			const settings = DataManager.getSettings();
			this.showAmount = settings.showAmount || false;
			this.showGains = settings.showGains || false;
			this.showCost = settings.showCost || false;
			this.showCostRate = settings.showCostRate || false;
			this.showGSZ = settings.showGSZ || false;
			this.sortType = settings.sortType || 'none';
			this.sortOrder = settings.sortOrder || 'desc';
			// 同步下拉索引
			const ti = this.sortTypeKeyRange.indexOf(this.sortType);
			this.sortTypeIndex = ti >= 0 ? ti : 0;
			const oi = this.sortOrderKeyRange.indexOf(this.sortOrder);
			this.sortOrderIndex = oi >= 0 ? oi : 0;
		},
		loadFundList() {
			// 从本地存储加载基金列表
			this.fundList = DataManager.getFundList();
			
			// 即使在获取实时数据之前，也先计算并显示本地存储的收益数据
			if (this.fundList.length > 0) {
				let todayGains = 0;
				let holdGains = 0;
				let totalCost = 0;
				let totalAmount = 0;
				
				this.fundList.forEach(fund => {
					if (fund.gains) todayGains += parseFloat(fund.gains);
					if (fund.costGains) holdGains += parseFloat(fund.costGains);
					if (fund.cost && fund.num) totalCost += fund.cost * fund.num;
					if (fund.amount) totalAmount += parseFloat(fund.amount);
				});
				
				this.totalTodayGains = todayGains;
				this.totalHoldGains = holdGains;
				this.totalCost = totalCost;
				this.totalAmount = totalAmount;

				this.fetchFundData();
			} else {
				// 重置总计数据
				this.totalTodayGains = 0;
				this.totalHoldGains = 0;
				this.totalCost = 0;
				this.totalAmount = 0;
			}
			
			// 初次加载时根据设置排序
			this.applySort();
		},
		async fetchFundData() {
			if (this.fundList.length === 0) return;
			
			try {
				// 获取基金代码列表
				const fundCodes = this.fundList.map(fund => fund.code);
				
				// 调用API获取实时数据
				const result = await getFundData(fundCodes, this.deviceId);
				const apiData = result.Datas || [];
				
				// 计算并显示“更新时间”
				this.lastUpdateDisplay = this.computeLastUpdateDisplay(apiData);
				
				// 更新基金列表数据
				let todayGains = 0;
				let holdGains = 0;
				let totalCost = 0;
				let totalAmount = 0;
				
				this.fundList = this.fundList.map(localFund => {
					const apiFund = apiData.find(item => item.fundcode === localFund.code);
					if (apiFund) {
						// 扩展API数据
						const updatedFund = {
							...localFund,
							name: apiFund.name,
							gsz: apiFund.gsz, // 估算净值
							gszzl: apiFund.gszzl, // 估算涨跌幅
							dwjz: apiFund.dwjz, // 单位净值
							jzrq: apiFund.jzrq, // 净值日期
							gztime: apiFund.gztime // 估值时间
						};
						
						// 计算收益
						if (localFund.num > 0) {
							// 净值处理逻辑：
							// 1. 判断是否是交易日当天（简单判断：如果估值时间是今天）
							// 2. 如果单位净值的日期也是今天，说明今天已经收盘更新了净值，那么直接用单位净值计算今日收益（此时今日收益其实是0，因为单位净值已经是最终结果）
							//    或者说，今日收益 = (今日单位净值 - 昨日单位净值) * 份额。但我们这里没有昨日净值数据。
							//    通常API返回的 dwjz 是最近一个交易日的净值。
							
							// 修改后的逻辑：
							// 如果当前时间是交易日晚上（比如20:00后），且 dwjz 的日期是今天，说明净值已更新。
							// 此时，gsz (估算净值) 可能已经失效或不再准确，应优先使用 dwjz。
							// 但为了简化逻辑，我们主要关注“计算基准”。
							
							// 基础数据获取
							const dwjz = parseFloat(apiFund.dwjz || 0);
							const gsz = parseFloat(apiFund.gsz || 0);
							const gszzl = parseFloat(apiFund.gszzl || 0);
							
							// 判断净值是否已更新为今日
							const todayStr = new Date().toISOString().slice(0, 10);
							const isUpdated = apiFund.jzrq === todayStr;
							const day = new Date().getDay();
							const isWeekend = day === 0 || day === 6;
							const useUpdatedMode = isUpdated || isWeekend; // 周末视为已更新口径，按真实净值计算
							
							// 确定计算用的当前净值
							let currentNav = 0;
							if (useUpdatedMode) {
								currentNav = dwjz;
							} else {
								currentNav = gsz || dwjz || 0;
							}
							
							// 持有金额 = 份额 * 当前净值
							const amount = localFund.num * currentNav;
							updatedFund.amount = amount;
							totalAmount += amount;
							
							// 今日收益计算
							let gains = 0;
							if (useUpdatedMode) {
								// 如果净值已更新，今日收益 = (今日净值 - 昨日净值) * 份额
								// 昨日净值 = 今日净值 / (1 + 涨跌幅/100)
								const lastNav = currentNav / (1 + gszzl / 100);
								gains = (currentNav - lastNav) * localFund.num;
							} else {
								// 盘中估算：持有金额(基于昨日净值) * 估算涨跌幅%
								// 近似计算：当前持有金额 * 估算涨跌幅% / (1 + 估算涨跌幅%) 
								// 或者简单点：份额 * (当前估算净值 - 昨日净值)
								// 昨日净值 ≈ dwjz (如果还没更新的话)
								if (dwjz > 0) {
									gains = (currentNav - dwjz) * localFund.num;
								} else {
									gains = amount * gszzl / 100;
								}
							}
							
							updatedFund.gains = gains;
							todayGains += gains;
							
							// 持有收益 = (当前净值 - 持仓成本) * 份额
							if (localFund.cost > 0) {
								const costGains = (currentNav - localFund.cost) * localFund.num;
								updatedFund.costGains = costGains;
								holdGains += costGains;
								
								// 持有收益率
								const fundTotalCost = localFund.cost * localFund.num;
								if (fundTotalCost > 0) {
									updatedFund.costGainsRate = (costGains / fundTotalCost * 100).toFixed(2);
								}
								totalCost += fundTotalCost;
							}
						}
						
						return updatedFund;
					}
					return localFund;
				});
				
				this.totalTodayGains = todayGains;
				this.totalHoldGains = holdGains;
				this.totalCost = totalCost;
				this.totalAmount = totalAmount;

				// 保存更新后的基金列表到本地存储，以便下次进入时显示
				DataManager.saveFundList(this.fundList);
				
				// 获取到最新数据后再应用排序
				this.applySort();
				
			} catch (error) {
				console.error('获取基金数据失败:', error);
				uni.showToast({
					title: '刷新失败',
					icon: 'none'
				});
			}
		},
		computeLastUpdateDisplay(apiData) {
			if (!apiData || apiData.length === 0) return '';
			const todayStr = new Date().toISOString().slice(0, 10);
			const hasTodayNAV = apiData.some(f => f.jzrq === todayStr);
			
			// 取当日估值时间的最大值
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
			let maxStr = '';
			apiData.forEach(f => {
				if (f.gztime) {
					const ts = toTs(f.gztime);
					if (ts > maxTs) {
						maxTs = ts;
						// 标准化为 yyyy-MM-dd HH:mm
						const d = new Date(ts);
						const pad = (n) => (n < 10 ? '0' + n : '' + n);
						maxStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
					}
				}
			});
			
			if (hasTodayNAV) {
				// 当日净值已更新，优先显示“日期 净值”
				return `${todayStr} 净值`;
			}
			if (maxStr) return maxStr;
			
			// 否则显示最近的净值日期（非当日）
			let lastJz = '';
			apiData.forEach(f => {
				if (f.jzrq && (!lastJz || f.jzrq > lastJz)) lastJz = f.jzrq;
			});
			return lastJz ? `${lastJz} 净值` : '';
		},
		refreshData() {
			uni.showLoading({
				title: '刷新中...'
			});
			this.fetchFundData().finally(() => {
				uni.hideLoading();
				uni.showToast({
					title: '刷新成功',
					icon: 'success'
				});
			});
		},
		goToAddFund() {
			uni.navigateTo({
				url: '/pages/fund/add'
			});
		},
		showImportTutorial() {
			const prompt = '请识别图片中的基金持仓信息（基金代码、基金名称、持有份额、持仓成本价），并严格按以下 JSON 格式输出，不要包含任何多余文字：';
			const exampleJson = `{
  "fundList": [
    {
      "code": "000001",
      "name": "基金名称示例",
      "num": 1234.56,
      "cost": 1.0245
    }
  ]
}`;
			
			const content = '1. 截图你的基金持仓界面\n' +
						  '2. 发给豆包/DeepSeek，让它按提示词输出JSON\n' +
						  '3. 复制AI输出的JSON\n' +
						  '4. 打开“设置”→“新增/导入配置”导入\n\n' +
						  '提示：有任何问题随时联系群主';
			
			uni.showModal({
				title: '一键导入教程',
				content: content,
				showCancel: true,
				cancelText: '复制',
				confirmText: '关闭',
				success: (res) => {
					if (res.cancel) {
						const copyContent = `提示词：${prompt}\n\nJSON示例：\n${exampleJson}`;
						uni.setClipboardData({
							data: copyContent,
							success: () => {
								uni.showToast({
									title: '已复制',
									icon: 'none'
								});
							}
						});
					}
				},
				fail: (err) => {
					console.error('showModal失败:', err);
					uni.showToast({
						title: '弹窗打开失败',
						icon: 'none'
					});
				}
			});
		},
		goToFundDetail(fund) {
			if (this.isEditMode) return;
			uni.navigateTo({
				url: `/pages/fund/detail?code=${fund.code}`
			});
		},
		toggleEditMode() {
			this.isEditMode = !this.isEditMode;
		},
		goToSettings() {
			uni.navigateTo({
				url: '/pages/setting/index'
			});
		},
		editFund(fund, index) {
			uni.navigateTo({
				url: `/pages/fund/edit?code=${fund.code}`
			});
			this.isEditMode = false;
		},
		deleteFund(index) {
			const fund = this.fundList[index];
			uni.showModal({
				title: '确认删除',
				content: `确定要删除 ${fund.name} 吗？`,
				success: (res) => {
					if (res.confirm) {
						DataManager.removeFund(fund.code);
						this.fundList.splice(index, 1);
						this.loadFundList(); // 重新计算总收益
					}
				}
			});
		},
		setSort(type) {
			this.sortType = type;
			const settings = DataManager.getSettings();
			DataManager.saveSettings({ ...settings, sortType: type });
			this.applySort();
		},
		onSortTypeChange(e) {
			const idx = Number(e.detail.value);
			this.sortTypeIndex = idx;
			const type = this.sortTypeKeyRange[idx];
			this.setSort(type);
		},
		onSortOrderChange(e) {
			const idx = Number(e.detail.value);
			this.sortOrderIndex = idx;
			const order = this.sortOrderKeyRange[idx];
			this.setOrder(order);
		},
		setOrder(order) {
			this.sortOrder = order;
			const settings = DataManager.getSettings();
			DataManager.saveSettings({ ...settings, sortOrder: order });
			this.applySort();
		},
		applySort() {
			if (!this.sortType || this.sortType === 'none') return;
			const key = this.sortType;
			// 创建副本排序，避免直接改动引用造成渲染异常
			const list = [...this.fundList];
			list.sort((a, b) => {
				const av = parseFloat(a[key] || 0);
				const bv = parseFloat(b[key] || 0);
				return this.sortOrder === 'desc' ? (bv - av) : (av - bv);
			});
			this.fundList = list;
		}
	}
}
</script>

<style lang="scss">
.fund-list-container {
	padding: 20rpx;
	min-height: 100vh;
	background-color: $page-bg;
}

/* Dashboard Card */
.dashboard-card {
	background: linear-gradient(135deg, #2979ff, #4e94ff);
	border-radius: $uni-border-radius-lg;
	padding: 30rpx;
	margin-bottom: 30rpx;
	color: #fff;
	box-shadow: 0 8rpx 20rpx rgba(41, 121, 255, 0.3);
	
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
			
			.right-tools {
				display: flex;
				align-items: center;
			}
			
			.update-badge {
				background: rgba(255,255,255,0.18);
				border-radius: 20rpx;
				padding: 6rpx 16rpx;
				margin-right: 14rpx;
				box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.06);
				
				.update-time {
					font-size: 22rpx;
					color: #fff;
					opacity: 0.92;
				}
			}
		
		.title {
			font-size: 28rpx;
			opacity: 0.9;
		}
		
		.refresh-icon {
			background: rgba(255,255,255,0.2);
			border-radius: 50%;
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			&:active {
				background: rgba(255,255,255,0.3);
			}
		}
	}
	
	.dashboard-content {
		.gains-main {
			display: flex;
			align-items: baseline;
			margin-bottom: 30rpx;
			
			.amount {
				font-size: 72rpx;
				font-weight: bold;
				line-height: 1;
				color: #fff !important;
			}
		}
		
		.dashboard-divider {
			height: 1rpx;
			background-color: rgba(255,255,255,0.2);
			margin-bottom: 20rpx;
		}
		
		.gains-grid {
			display: flex;
			
			.grid-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				
				.label {
					font-size: 24rpx;
					opacity: 0.8;
					margin-bottom: 8rpx;
				}
				
				.value {
					font-size: 32rpx;
					font-weight: bold;
					color: #fff !important;
				}
			}
		}
	}
}

/* Action Bar */
.action-bar {
	display: flex;
	justify-content: space-between;
	margin-bottom: 30rpx;
	background-color: #fff;
	padding: 20rpx;
	border-radius: $uni-border-radius-lg;
	box-shadow: $card-shadow;
	
	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		
		.icon-box {
			width: 80rpx;
			height: 80rpx;
			border-radius: 24rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 10rpx;
			background-color: $uni-bg-color-grey;
			
			.icon {
				font-size: 36rpx;
			}
			
			&.active {
				background-color: rgba(41, 121, 255, 0.1);
				border: 2rpx solid $uni-color-primary;
			}
		}
		
		.label {
			font-size: 24rpx;
			color: $uni-text-color-grey;
		}
		
		&:active {
			opacity: 0.7;
		}
	}
}

/* Fund List */
.fund-list {
	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding: 0 10rpx;
		
		.title {
			font-size: 32rpx;
			font-weight: bold;
			color: $uni-color-title;
		}
		
		.count {
			font-size: 24rpx;
			color: $uni-text-color-grey;
		}
		
		.sort-bar {
			display: flex;
			align-items: center;
			margin-left: auto;
			
			.dropdown {
				padding: 8rpx 16rpx;
				margin-left: 12rpx;
				background-color: #f5f7fa;
				border-radius: 20rpx;
				font-size: 24rpx;
				color: $uni-text-color-grey;
				border: 2rpx solid transparent;
			}
			.dropdown:active {
				border-color: $uni-color-primary;
				color: $uni-color-primary;
				background-color: rgba(41, 121, 255, 0.08);
			}
			.order-toggle {
				margin-left: 12rpx;
				padding: 8rpx 16rpx;
				background-color: #f5f7fa;
				border-radius: 20rpx;
				font-size: 24rpx;
				color: $uni-text-color-grey;
			}
			.order-toggle:active {
				border: 2rpx solid $uni-color-primary;
				color: $uni-color-primary;
				background-color: rgba(41, 121, 255, 0.08);
			}
		}
	}
	
	.fund-card {
		background-color: $card-bg;
		border-radius: $uni-border-radius-lg;
		margin-bottom: 20rpx;
		box-shadow: $card-shadow;
		overflow: hidden;
		position: relative;
		transition: all 0.3s;
		
		&:active {
			transform: scale(0.99);
		}
		
		.card-main {
			padding: 24rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1rpx solid #f0f0f0;
			
			.fund-info {
				flex: 1;
				margin-right: 20rpx;
				
				.fund-name-row {
					margin-bottom: 10rpx;
					
					.fund-name {
						font-size: 30rpx;
						font-weight: 500;
						color: $uni-text-color;
						/* 限制行数 */
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 1;
						overflow: hidden;
					}
				}
				
				.fund-code-row {
					display: flex;
					align-items: center;
					
					.fund-code {
						font-size: 24rpx;
						color: $uni-text-color-grey;
						margin-right: 12rpx;
					}
					
					.tag {
						font-size: 20rpx;
						padding: 2rpx 8rpx;
						background-color: #f0f2f5;
						color: #909399;
						border-radius: 4rpx;
					}
				}
			}
			
			.fund-metrics {
				text-align: right;
				display: flex;
				
				.metric-item {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
					margin-left: 20rpx;
					
					.metric-value {
						font-size: 32rpx;
						font-weight: bold;
						margin-bottom: 4rpx;
						font-family: 'DIN Alternate', 'Roboto', sans-serif;
					}
					
					.metric-label {
						font-size: 22rpx;
						color: $uni-text-color-grey;
					}
					
					&.primary-metric {
						min-width: 120rpx;
						
						.metric-value {
							font-size: 36rpx;
						}
					}
				}
			}
		}
		
		.card-extra {
			padding: 16rpx 24rpx;
			background-color: #fafafa;
			display: flex;
			justify-content: space-between;
			
			.extra-item {
				display: flex;
				align-items: center;
				
				.label {
					font-size: 22rpx;
					color: $uni-text-color-grey;
					margin-right: 8rpx;
				}
				
				.value {
					font-size: 24rpx;
					font-weight: 500;
				}
			}
		}
		
		/* Edit Overlay */
		.edit-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(255, 255, 255, 0.9);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			backdrop-filter: blur(2px);
			
			.edit-btn, .delete-btn {
				padding: 12rpx 30rpx;
				border-radius: 30rpx;
				margin: 0 15rpx;
				font-size: 28rpx;
				font-weight: 500;
			}
			
			.edit-btn {
				background-color: $uni-color-primary;
				color: #fff;
			}
			
			.delete-btn {
				background-color: #ffebeb;
				color: $uni-color-error;
			}
		}
	}
}

/* Empty State */
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
		color: $uni-text-color-grey;
		font-size: 28rpx;
		margin-bottom: 40rpx;
	}
	
	.add-btn {
		background-color: $uni-color-primary;
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

.footer-spacer {
	height: 40rpx;
}
</style>
