<template>
	<view class="fund-list-container">
		<!-- 总收益概览卡片 -->
		<view class="dashboard-card" v-if="showGains">
			<view class="dashboard-header">
				<text class="title">今日变动</text>
				<view class="right-tools">
					<view class="privacy-switch">
						<switch :checked="privacyMode" @change="togglePrivacyMode" color="#fff" />
					</view>
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
					<text class="amount" :class="{ 'red': !privacyMode && filteredTodayGains >= 0, 'green': !privacyMode && filteredTodayGains < 0 }">{{ privacyMode ? '****' : (filteredTodayGains > 0 ? '+' : '') + filteredTodayGains.toFixed(2) }}</text>
				</view>

				<view class="dashboard-divider"></view>

				<view class="gains-grid">
					<view class="grid-item">
						<text class="label">累计变动</text>
						<text class="value" :class="{ 'red': !privacyMode && filteredHoldGains >= 0, 'green': !privacyMode && filteredHoldGains < 0 }">{{ privacyMode ? '****' : (filteredHoldGains > 0 ? '+' : '') + filteredHoldGains.toFixed(2) }}</text>
					</view>
					<view class="grid-item">
						<text class="label">累计变动率</text>
						<text class="value" v-if="privacyMode">****</text>
						<text class="value" v-else-if="filteredCost > 0" :class="{ 'red': filteredHoldGains >= 0, 'green': filteredHoldGains < 0 }">{{ filteredHoldGains > 0 ? '+' : '' }}{{ ((filteredHoldGains / filteredCost) * 100).toFixed(2) }}%</text>
						<text class="value" v-else>0.00%</text>
					</view>
					<view class="grid-item">
						<text class="label">持有总值</text>
						<text class="value">{{ privacyMode ? '****' : filteredAmount.toFixed(2) }}</text>
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

		<!-- 分组管理入口 -->
		<view class="group-manage-bar" @click="goToGroupManage">
			<text class="manage-text">分组管理</text>
			<text class="manage-count">共{{ groupList.length }}个分组</text>
			<text class="arrow">›</text>
		</view>

		<!-- 分组标签栏 -->
		<scroll-view class="group-tabs" scroll-x>
			<view class="tab-item" :class="{ 'active': currentGroupId === '' }" @click="selectGroup('')">
				<text>全部</text>
				<text class="count">{{ allFundList.length }}</text>
			</view>
			<view class="tab-item" v-for="group in groupList" :key="group.id"
				:class="{ 'active': currentGroupId === group.id }" @click="selectGroup(group.id)">
				<text>{{ group.name }}</text>
				<text class="count">{{ getGroupFundCount(group.id) }}</text>
			</view>
		</scroll-view>

		<!-- 基金列表 -->
		<view class="fund-list">
			<view class="list-header" v-if="fundList.length > 0">
				<text class="title">{{ currentGroupName || '我的藏品' }}</text>
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
							<text class="group-tag" v-if="getFundGroupName(fund)">{{ getFundGroupName(fund) }}</text>
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
						<text class="value" :class="{ 'red': !privacyMode && fund.gains >= 0, 'green': !privacyMode && fund.gains < 0 }">{{ privacyMode ? '****' : (fund.gains ? (fund.gains >= 0 ? '+' : '') + fund.gains.toFixed(2) : '--') }}</text>
					</view>
					<view class="extra-item" v-if="showCost">
						<text class="label">累计</text>
						<text class="value" :class="{ 'red': !privacyMode && fund.costGains >= 0, 'green': !privacyMode && fund.costGains < 0 }">{{ privacyMode ? '****' : (fund.costGains ? (fund.costGains >= 0 ? '+' : '') + fund.costGains.toFixed(2) : '--') }}</text>
					</view>
					<view class="extra-item" v-if="showAmount">
						<text class="label">总值</text>
						<text class="value">{{ privacyMode ? '****' : (fund.amount ? fund.amount.toFixed(2) : '--') }}</text>
					</view>
					<view class="extra-item" v-if="showCostRate">
						<text class="label">持有收益率</text>
						<text class="value" :class="{ 'red': !privacyMode && parseFloat(fund.costGainsRate) >= 0, 'green': !privacyMode && parseFloat(fund.costGainsRate) < 0 }">
							{{ privacyMode ? '****' : (fund.costGainsRate !== undefined ? (parseFloat(fund.costGainsRate) >= 0 ? '+' : '') + fund.costGainsRate + '%' : '--') }}
						</text>
					</view>
				</view>

				<!-- 编辑模式覆盖层 -->
				<view class="edit-overlay" v-if="isEditMode" @click.stop>
					<view class="edit-btn" @click.stop="showMoveGroupModal(fund)">
						<text>移至分组</text>
					</view>
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
				<text class="empty-text">{{ currentGroupId ? '该分组暂无藏品' : '暂无关注的藏品' }}</text>
				<button class="add-btn" @click="goToAddFund">添加藏品</button>
			</view>
		</view>

		<!-- 底部占位，防止被导航栏遮挡 -->
		<view class="footer-spacer"></view>

		<!-- 设置分组弹窗 -->
		<view class="modal-mask" v-if="showMoveGroup" @click="closeMoveGroupModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">设置分组</view>
				<view class="modal-body">
					<view class="group-option" :class="{ 'active': moveSelectedGroupIds.length === 0 }" @click="toggleMoveGroup('')">
						<text>未分组</text>
						<text class="check" v-if="moveSelectedGroupIds.length === 0">✓</text>
					</view>
					<view class="group-option" v-for="group in groupList" :key="group.id"
						:class="{ 'active': moveSelectedGroupIds.includes(group.id) }" @click="toggleMoveGroup(group.id)">
						<text>{{ group.name }}</text>
						<text class="check" v-if="moveSelectedGroupIds.includes(group.id)">✓</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="closeMoveGroupModal">取消</button>
					<button class="modal-btn confirm" @click="confirmMoveGroup">确定</button>
				</view>
			</view>
		</view>
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
			allFundList: [],
			fundList: [],
			groupList: [],
			currentGroupId: '',
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
			sortOrderIndex: 0,
			// 隐私模式
			privacyMode: false,
			// 设置分组
			showMoveGroup: false,
			moveFund: null,
			moveSelectedGroupIds: []
		}
	},
	computed: {
		sortTypeLabel() {
			return this.sortTypeRange[this.sortTypeIndex] || '排序';
		},
		sortOrderLabel() {
			return this.sortOrderRange[this.sortOrderIndex] || '降序';
		},
		currentGroupName() {
			if (!this.currentGroupId) return '';
			const group = this.groupList.find(g => g.id === this.currentGroupId);
			return group ? group.name : '';
		},
		filteredTodayGains() {
			return this.calculateGroupGains('gains');
		},
		filteredHoldGains() {
			return this.calculateGroupGains('costGains');
		},
		filteredCost() {
			return this.calculateGroupCost();
		},
		filteredAmount() {
			return this.calculateGroupAmount();
		}
	},
	onLoad() {
		this.loadSettings();
		this.loadDeviceId();
		this.loadGroupList();
		this.loadFundList();
	},

	onShow() {
		this.loadGroupList();
		this.loadFundList();
	},

	created() {
		uni.$on('fundUpdated', () => this.loadFundList());
		uni.$on('fundAdded', () => this.loadFundList());
		uni.$on('fundDeleted', () => this.loadFundList());
		uni.$on('settingsChanged', () => {
			this.loadSettings();
			this.loadFundList();
		});
		uni.$on('groupChanged', () => this.loadGroupList());
	},

	beforeDestroy() {
		uni.$off('fundUpdated');
		uni.$off('fundAdded');
		uni.$off('fundDeleted');
		uni.$off('settingsChanged');
		uni.$off('groupChanged');
	},

	methods: {
		loadDeviceId() {
			this.deviceId = DataManager.getDeviceId();
		},
		loadGroupList() {
			this.groupList = DataManager.getGroupList();
		},
		loadSettings() {
			const settings = DataManager.getSettings();
			this.showAmount = settings.showAmount || false;
			this.showGains = settings.showGains || false;
			this.showCost = settings.showCost || false;
			this.showCostRate = settings.showCostRate || false;
			this.showGSZ = settings.showGSZ || false;
			this.sortType = settings.sortType || 'none';
			this.sortOrder = settings.sortOrder || 'desc';
			const ti = this.sortTypeKeyRange.indexOf(this.sortType);
			this.sortTypeIndex = ti >= 0 ? ti : 0;
			const oi = this.sortOrderKeyRange.indexOf(this.sortOrder);
			this.sortOrderIndex = oi >= 0 ? oi : 0;
		},
		togglePrivacyMode() {
			this.privacyMode = !this.privacyMode;
		},
		selectGroup(groupId) {
			this.currentGroupId = groupId;
			this.applyGroupFilter();
		},
		isFundInGroup(fund, groupId) {
			// 新数据结构：groupIds 数组
			if (fund.groupIds && Array.isArray(fund.groupIds)) {
				return fund.groupIds.includes(groupId);
			}
			// 兼容旧数据：groupId 字符串
			if (fund.groupId) {
				return fund.groupId === groupId;
			}
			return false;
		},
		getGroupFundCount(groupId) {
			return this.allFundList.filter(fund => this.isFundInGroup(fund, groupId)).length;
		},
		getFundGroupName(fund) {
			if (!fund) return '';
			// 新数据结构：显示所有分组名
			if (fund.groupIds && Array.isArray(fund.groupIds) && fund.groupIds.length > 0) {
				const names = fund.groupIds.map(id => {
					const group = this.groupList.find(g => g.id === id);
					return group ? group.name : '';
				}).filter(name => name);

				if (names.length === 0) return '';

				// 单个名称最多显示5个字符
				const maxLen = 5;
				const truncatedNames = names.map(name => {
					if (name.length > maxLen) {
						return name.substring(0, maxLen) + '...';
					}
					return name;
				});

				// 最多显示2个分组名
				if (truncatedNames.length <= 2) {
					return truncatedNames.join('、');
				} else {
					return truncatedNames.slice(0, 2).join('、') + '等' + truncatedNames.length + '个';
				}
			}
			// 兼容旧数据
			if (fund.groupId) {
				const group = this.groupList.find(g => g.id === fund.groupId);
				if (group) {
					const name = group.name;
					// 单个名称最多显示5个字符
					if (name.length > 5) {
						return name.substring(0, 5) + '...';
					}
					return name;
				}
			}
			return '';
		},
		goToGroupManage() {
			uni.navigateTo({ url: '/pages/group/index' });
		},
		applyGroupFilter() {
			if (!this.currentGroupId) {
				this.fundList = [...this.allFundList];
			} else {
				this.fundList = this.allFundList.filter(fund => this.isFundInGroup(fund, this.currentGroupId));
			}
			this.applySort();
		},
		calculateGroupGains(field) {
			let total = 0;
			const list = this.currentGroupId ? this.fundList : this.allFundList;
			list.forEach(fund => {
				if (fund[field]) total += parseFloat(fund[field]);
			});
			return total;
		},
		calculateGroupCost() {
			let total = 0;
			const list = this.currentGroupId ? this.fundList : this.allFundList;
			list.forEach(fund => {
				if (fund.cost && fund.num) total += fund.cost * fund.num;
			});
			return total;
		},
		calculateGroupAmount() {
			let total = 0;
			const list = this.currentGroupId ? this.fundList : this.allFundList;
			list.forEach(fund => {
				if (fund.amount) total += parseFloat(fund.amount);
			});
			return total;
		},
		loadFundList() {
			this.allFundList = DataManager.getFundList();
			this.applyGroupFilter();
			if (this.allFundList.length > 0) {
				this.fetchFundData();
			} else {
				this.totalTodayGains = 0;
				this.totalHoldGains = 0;
				this.totalCost = 0;
				this.totalAmount = 0;
			}
		},
		async fetchFundData() {
			if (this.allFundList.length === 0) return;

			try {
				const fundCodes = this.allFundList.map(fund => fund.code);
				const result = await getFundData(fundCodes, this.deviceId);
				const apiData = result.Datas || [];

				this.lastUpdateDisplay = this.computeLastUpdateDisplay(apiData);

				let todayGains = 0;
				let holdGains = 0;
				let totalCost = 0;
				let totalAmount = 0;

				this.allFundList = this.allFundList.map(localFund => {
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
							const amount = localFund.num * currentNav;
							updatedFund.amount = amount;
							totalAmount += amount;

							let gains = 0;
							if (useUpdatedMode) {
								const lastNav = currentNav / (1 + gszzl / 100);
								gains = (currentNav - lastNav) * localFund.num;
							} else {
								if (dwjz > 0) {
									gains = (currentNav - dwjz) * localFund.num;
								} else {
									gains = amount * gszzl / 100;
								}
							}

							updatedFund.gains = gains;
							todayGains += gains;

							if (localFund.cost > 0) {
								const costGains = (currentNav - localFund.cost) * localFund.num;
								updatedFund.costGains = costGains;
								holdGains += costGains;

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

				DataManager.saveFundList(this.allFundList);
				this.applyGroupFilter();

			} catch (error) {
				console.error('获取基金数据失败:', error);
				uni.showToast({ title: '刷新失败', icon: 'none' });
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
			let maxStr = '';
			apiData.forEach(f => {
				if (f.gztime) {
					const ts = toTs(f.gztime);
					if (ts > maxTs) {
						maxTs = ts;
						const d = new Date(ts);
						const pad = (n) => (n < 10 ? '0' + n : '' + n);
						maxStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
					}
				}
			});

			if (hasTodayNAV) return `${todayStr} 净值`;
			if (maxStr) return maxStr;

			let lastJz = '';
			apiData.forEach(f => {
				if (f.jzrq && (!lastJz || f.jzrq > lastJz)) lastJz = f.jzrq;
			});
			return lastJz ? `${lastJz} 净值` : '';
		},
		refreshData() {
			uni.showLoading({ title: '刷新中...' });
			this.fetchFundData().finally(() => {
				uni.hideLoading();
				uni.showToast({ title: '刷新成功', icon: 'success' });
			});
		},
		goToAddFund() {
			uni.navigateTo({ url: '/pages/fund/add' });
		},
		showImportTutorial() {
			const prompt = '请识别图片中的基金持仓信息（基金代码、基金名称、持有份额、持仓成本价），并严格按以下 JSON 格式输出，不要包含任何多余文字：';
			const exampleJson = `{"fundList":[{"code":"000001","name":"基金名称示例","num":1234.56,"cost":1.0245}]}`;
			const content = '① 截图持仓界面\n \n② 点击"复制"获取提示词\n\n③ 发送截图+提示词给豆包/DeepSeek\n\n④ 复制AI返回的JSON\n\n⑤ "设置"→"新增/导入配置"导入';

			uni.showModal({
				title: '一键导入教程',
				content: content,
				showCancel: true,
				cancelText: '复制',
				confirmText: '关闭',
				success: (res) => {
					if (res.cancel) {
						uni.setClipboardData({
							data: `提示词：${prompt}\n\nJSON示例：\n${exampleJson}`,
							success: () => uni.showToast({ title: '已复制', icon: 'none' })
						});
					}
				}
			});
		},
		goToFundDetail(fund) {
			if (this.isEditMode) return;
			uni.navigateTo({ url: `/pages/fund/detail?code=${fund.code}` });
		},
		toggleEditMode() {
			this.isEditMode = !this.isEditMode;
		},
		goToSettings() {
			uni.navigateTo({ url: '/pages/setting/index' });
		},
		editFund(fund, index) {
			uni.navigateTo({ url: `/pages/fund/edit?code=${fund.code}` });
			this.isEditMode = false;
		},
		deleteFund(index) {
			const fund = this.fundList[index];

			// 判断是否在"全部"视图
			if (!this.currentGroupId) {
				// 在"全部"中删除 = 彻底删除藏品
				uni.showModal({
					title: '确认删除',
					content: `确定要删除 ${fund.name} 吗？该藏品将从所有分组中移除。`,
					success: (res) => {
						if (res.confirm) {
							DataManager.removeFund(fund.code);
							const allIndex = this.allFundList.findIndex(f => f.code === fund.code);
							if (allIndex >= 0) this.allFundList.splice(allIndex, 1);
							this.fundList.splice(index, 1);
							uni.$emit('fundDeleted');
						}
					}
				});
			} else {
				// 在特定分组中删除 = 只从该分组移除
				uni.showModal({
					title: '移出分组',
					content: `将 ${fund.name} 从「${this.currentGroupName}」移出？藏品仍保留在其他分组中。`,
					confirmText: '移出',
					success: (res) => {
						if (res.confirm) {
							DataManager.removeFundFromGroup(fund.code, this.currentGroupId);
							this.fundList.splice(index, 1);
							// 更新 allFundList 中的分组信息
							const allFund = this.allFundList.find(f => f.code === fund.code);
							if (allFund && allFund.groupIds) {
								allFund.groupIds = allFund.groupIds.filter(id => id !== this.currentGroupId);
							}
							uni.$emit('groupChanged');
						}
					}
				});
			}
		},
		setSort(type) {
			this.sortType = type;
			const settings = DataManager.getSettings();
			DataManager.saveSettings({ ...settings, sortType: type });
			this.applySort();
		},
		onSortTypeChange(e) {
			this.sortTypeIndex = Number(e.detail.value);
			this.setSort(this.sortTypeKeyRange[this.sortTypeIndex]);
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
			const list = [...this.fundList];
			list.sort((a, b) => {
				const av = parseFloat(a[key] || 0);
				const bv = parseFloat(b[key] || 0);
				return this.sortOrder === 'desc' ? (bv - av) : (av - bv);
			});
			this.fundList = list;
		},
		// 设置分组
		showMoveGroupModal(fund) {
			this.moveFund = fund;
			// 初始化已选分组
			if (fund.groupIds && Array.isArray(fund.groupIds)) {
				this.moveSelectedGroupIds = [...fund.groupIds];
			} else if (fund.groupId) {
				this.moveSelectedGroupIds = [fund.groupId];
			} else {
				this.moveSelectedGroupIds = [];
			}
			this.showMoveGroup = true;
		},
		closeMoveGroupModal() {
			this.showMoveGroup = false;
			this.moveFund = null;
			this.moveSelectedGroupIds = [];
		},
		toggleMoveGroup(groupId) {
			if (groupId === '') {
				// 点击"未分组"，清空所有选择
				this.moveSelectedGroupIds = [];
			} else {
				const index = this.moveSelectedGroupIds.indexOf(groupId);
				if (index > -1) {
					this.moveSelectedGroupIds.splice(index, 1);
				} else {
					this.moveSelectedGroupIds.push(groupId);
				}
			}
		},
		confirmMoveGroup() {
			if (!this.moveFund) return;
			// 更新基金的分组
			const fund = this.allFundList.find(f => f.code === this.moveFund.code);
			if (fund) {
				fund.groupIds = [...this.moveSelectedGroupIds];
				// 清除旧的 groupId 字段
				delete fund.groupId;
				DataManager.saveFundList(this.allFundList);
			}
			this.applyGroupFilter();
			uni.showToast({ title: '设置成功', icon: 'success' });
			this.closeMoveGroupModal();
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

		.privacy-switch {
			margin-right: 14rpx;
			transform: scale(0.7);
		}

		.update-badge {
			background: rgba(255,255,255,0.18);
			border-radius: 20rpx;
			padding: 6rpx 16rpx;
			margin-right: 14rpx;

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

			&:active { background: rgba(255,255,255,0.3); }
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

/* 分组标签栏 */
.group-tabs {
	white-space: nowrap;
	margin-bottom: 16rpx;
	padding: 0 10rpx;

	.tab-item {
		display: inline-flex;
		align-items: center;
		padding: 12rpx 24rpx;
		margin-right: 16rpx;
		background-color: #fff;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: #666;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
		transition: all 0.3s;

		.count {
			margin-left: 8rpx;
			font-size: 22rpx;
			background-color: #f0f2f5;
			padding: 2rpx 10rpx;
			border-radius: 10rpx;
		}

		&.active {
			background: linear-gradient(135deg, #2979ff, #4e94ff);
			color: #fff;
			box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.3);

			.count {
				background-color: rgba(255,255,255,0.2);
				color: #fff;
			}
		}
	}
}

/* 分组管理入口 */
.group-manage-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #fff;
	padding: 24rpx 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);

	.manage-text {
		font-size: 30rpx;
		font-weight: 500;
		color: #333;
	}

	.manage-count {
		flex: 1;
		text-align: right;
		font-size: 26rpx;
		color: #999;
		margin-right: 16rpx;
	}

	.arrow {
		font-size: 32rpx;
		color: #ccc;
	}

	&:active {
		background-color: #f9f9f9;
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

			.icon { font-size: 36rpx; }

			&.active {
				background-color: rgba(41, 121, 255, 0.1);
				border: 2rpx solid $uni-color-primary;
			}
		}

		.label {
			font-size: 24rpx;
			color: $uni-text-color-grey;
		}

		&:active { opacity: 0.7; }
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

			.order-toggle {
				margin-left: 12rpx;
				padding: 8rpx 16rpx;
				background-color: #f5f7fa;
				border-radius: 20rpx;
				font-size: 24rpx;
				color: $uni-text-color-grey;
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

		&:active { transform: scale(0.99); }

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
					display: flex;
					align-items: center;

					.fund-name {
						font-size: 30rpx;
						font-weight: 500;
						color: $uni-text-color;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 1;
						overflow: hidden;
					}

					.group-tag {
						margin-left: 12rpx;
						font-size: 20rpx;
						padding: 2rpx 10rpx;
						background-color: #e8f4fd;
						color: #2979ff;
						border-radius: 6rpx;
						flex-shrink: 0;
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
						.metric-value { font-size: 36rpx; }
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

		.edit-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(255, 255, 255, 0.95);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			backdrop-filter: blur(2px);

			.edit-btn, .delete-btn {
				padding: 12rpx 24rpx;
				border-radius: 30rpx;
				margin: 0 10rpx;
				font-size: 26rpx;
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

		&::after { border: none; }
	}
}

.footer-spacer {
	height: 40rpx;
}

/* 弹窗样式 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	width: 600rpx;
	background-color: #fff;
	border-radius: 20rpx;
	overflow: hidden;
}

.modal-title {
	padding: 36rpx;
	text-align: center;
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	border-bottom: 1rpx solid #f0f0f0;
}

.modal-body {
	padding: 30rpx;
	max-height: 500rpx;
	overflow-y: auto;
}

.group-option {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 20rpx;
	border-radius: 12rpx;
	margin-bottom: 12rpx;
	background-color: #f8f9fa;
	font-size: 30rpx;
	color: #333;

	&:last-child { margin-bottom: 0; }

	&.active {
		background-color: #e8f4fd;
		color: #2979ff;
	}

	.check {
		color: #2979ff;
		font-weight: bold;
	}
}

.modal-footer {
	display: flex;
	border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
	flex: 1;
	height: 100rpx;
	line-height: 100rpx;
	text-align: center;
	font-size: 32rpx;
	background-color: #fff;
	border: none;
	border-radius: 0;

	&::after { border: none; }

	&.cancel {
		color: #999;
		border-right: 1rpx solid #f0f0f0;
	}

	&.confirm {
		color: #3498db;
		font-weight: 500;
	}
}
</style>
