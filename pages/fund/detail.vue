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
		<view class="detail-card remark-card" v-if="fundDetail.remark">
			<view class="card-title">备注</view>
			<view class="remark-content">
				<text>{{ fundDetail.remark }}</text>
			</view>
		</view>

		<!-- 定投统计卡片 -->
		<view class="detail-card invest-card" v-if="hasInvestPlan">
			<view class="card-title-row">
				<view class="card-title">定投统计</view>
				<view class="invest-status" :class="investStatusClass">{{ investStatusLabel }}</view>
			</view>

			<!-- 定投汇总数据 -->
			<view class="invest-summary" v-if="investSummary">
				<view class="summary-grid">
					<view class="summary-item">
						<text class="summary-value">{{ investSummary.totalAmount }}</text>
						<text class="summary-label">累计投入(元)</text>
					</view>
					<view class="summary-item">
						<text class="summary-value">{{ investSummary.totalShares }}</text>
						<text class="summary-label">累计份额</text>
					</view>
					<view class="summary-item">
						<text class="summary-value">{{ investSummary.currentValue }}</text>
						<text class="summary-label">当前市值(元)</text>
					</view>
					<view class="summary-item">
						<text class="summary-value" :class="{'red': investSummary.profit >= 0, 'green': investSummary.profit < 0}">
							{{ investSummary.profit >= 0 ? '+' : '' }}{{ investSummary.profit }}
						</text>
						<text class="summary-label">收益(元)</text>
					</view>
				</view>
				<view class="summary-footer">
					<view class="footer-item">
						<text class="footer-label">定投均价</text>
						<text class="footer-value">{{ investSummary.avgCost }}元</text>
					</view>
					<view class="footer-item">
						<text class="footer-label">已执行</text>
						<text class="footer-value">{{ investSummary.investCount }}期</text>
					</view>
					<view class="footer-item">
						<text class="footer-label">收益率</text>
						<text class="footer-value" :class="{'red': investSummary.profitRate >= 0, 'green': investSummary.profitRate < 0}">
							{{ investSummary.profitRate >= 0 ? '+' : '' }}{{ investSummary.profitRate }}%
						</text>
					</view>
				</view>
			</view>

			<!-- 同步定投按钮 -->
			<view class="sync-btn-wrapper" v-if="investPlan.status === 'active'">
				<view class="sync-btn" :class="{ 'loading': syncLoading }" @click="onSyncBtnClick">
					<text v-if="!syncLoading">同步定投</text>
					<text v-else>同步中...</text>
				</view>
			</view>

			<!-- 调试面板 -->
			<view class="debug-panel" v-if="showDebugPanel">
				<view class="debug-header">
					<text class="debug-title">🔧 调试模式</text>
					<text class="debug-close" @click="showDebugPanel = false">✕</text>
				</view>
				<view class="debug-content">
					<view class="debug-item">
						<text class="debug-label">模拟截止日期</text>
						<picker mode="date" :value="debugEndDate" @change="onDebugEndDateChange">
							<view class="debug-picker">{{ debugEndDate }} ▼</view>
						</picker>
					</view>
					<view class="debug-item">
						<text class="debug-label">开始日期</text>
						<picker mode="date" :end="today" :value="debugStartDate" @change="onDebugStartDateChange">
							<view class="debug-picker">{{ debugStartDate }} ▼</view>
						</picker>
					</view>
					<view class="debug-item">
						<text class="debug-label">上次执行</text>
						<text class="debug-value">{{ investPlan.lastInvestDate || '无' }}</text>
					</view>
					<view class="debug-actions">
						<view class="debug-btn" @click="runDebugSync">模拟同步</view>
						<view class="debug-btn warning" @click="resetInvestPlan">重置计划</view>
					</view>
					<view class="debug-result" v-if="debugResult">
						<text class="debug-result-title">模拟结果：</text>
						<text class="debug-result-text">{{ debugResult }}</text>
					</view>
				</view>
			</view>

			<!-- 定投记录列表 -->
			<view class="invest-records" v-if="investRecords.length > 0">
				<view class="records-header" @click="toggleRecordsExpanded">
					<text class="records-title">定投记录</text>
					<view class="records-toggle">
						<text>{{ investRecords.length }}条</text>
						<text class="toggle-arrow" :class="{ 'expanded': recordsExpanded }">▼</text>
					</view>
				</view>
				<view class="records-list" v-if="recordsExpanded">
					<view class="record-item" v-for="(record, index) in displayRecords" :key="index">
						<view class="record-date">{{ record.date }}</view>
						<view class="record-info">
							<text class="record-amount">投入{{ record.amount }}元</text>
							<text class="record-shares">买入{{ record.shares.toFixed(2) }}份</text>
						</view>
						<view class="record-nav">净值 {{ record.nav }}</view>
					</view>
					<view class="load-more" v-if="hasMoreRecords" @click="loadMoreRecords">
						<text>加载更多</text>
					</view>
				</view>
			</view>

			<!-- 清空记录按钮 -->
			<view class="clear-records-btn" v-if="investRecords.length > 0" @click="clearInvestRecords">
				<text>清空定投记录</text>
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
import { getFundData, getFundHistoryNav } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';
import { executeInvestment, calculateSummary, mergeToHolding, generateInvestDates } from '@/utils/invest-plan.js';
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
			chartPeriod: 'y',
			chartPeriods: [
				{ key: 'y', label: '近1月' },
				{ key: '3y', label: '近3月' },
				{ key: 'n', label: '近1年' }
			],
			chartLoading: false,
			// 定投相关
			investPlan: null,
			investRecords: [],
			investSummary: null,
			syncLoading: false,
			recordsExpanded: false,
			recordsPageSize: 20,
			recordsCurrentPage: 1,
			// 调试相关
			showDebugPanel: false,
			debugStartDate: '',
			debugEndDate: '',
			debugResult: '',
			syncClickCount: 0,
			syncClickTimer: null,
			today: ''
		}
	},
	computed: {
		chartColor() {
			if (this.chartData.length > 0) {
				const first = this.chartData[0];
				const last = this.chartData[this.chartData.length - 1];
				return last >= first ? '#f5222d' : '#52c41a';
			}
			return '#2979ff';
		},
		hasInvestPlan() {
			return this.investPlan && this.investPlan.status !== 'terminated';
		},
		investStatusLabel() {
			if (!this.investPlan) return '';
			const statusMap = {
				'active': '进行中',
				'paused': '已暂停',
				'terminated': '已终止'
			};
			return statusMap[this.investPlan.status] || '';
		},
		investStatusClass() {
			if (!this.investPlan) return '';
			return 'status-' + this.investPlan.status;
		},
		displayRecords() {
			return this.investRecords.slice(0, this.recordsPageSize * this.recordsCurrentPage);
		},
		hasMoreRecords() {
			return this.investRecords.length > this.recordsPageSize * this.recordsCurrentPage;
		}
	},
	onLoad(options) {
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
			let deviceId = uni.getStorageSync('deviceId');
			if (!deviceId) {
				deviceId = this.generateUUID();
				uni.setStorageSync('deviceId', deviceId);
			}
			this.deviceId = deviceId;
		},
		generateUUID() {
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
			try {
				const fundList = DataManager.getFundList();
				this.localFundInfo = fundList.find(item => item.code === code) || null;

				// 加载定投计划
				if (this.localFundInfo) {
					this.investPlan = this.localFundInfo.investPlan || null;
					this.investRecords = this.localFundInfo.investRecords || [];

					// 计算定投汇总
					if (this.investRecords.length > 0) {
						this.updateInvestSummary();
					}
				}

				const result = await getFundData([code], this.deviceId);
				const apiData = result.Datas || [];

				if (apiData.length > 0) {
					const apiFund = apiData[0];

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

					// 更新定投汇总（使用最新净值）
					if (this.investRecords.length > 0) {
						this.updateInvestSummary();
					}
				} else if (this.localFundInfo) {
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
			}
		},
		updateInvestSummary() {
			if (this.investRecords.length > 0) {
				const currentNav = parseFloat(this.fundDetail.gsz) || parseFloat(this.fundDetail.dwjz) || 0;
				this.investSummary = calculateSummary(this.investRecords, currentNav);
			} else {
				this.investSummary = null;
			}
		},
		async loadChartData(code) {
			this.chartLoading = true;
			this.chartData = [];
			this.chartLabels = [];

			try {
				const data = await getFundHistoryNav(code, this.chartPeriod);
				if (data && data.length > 0) {
					this.chartData = data.map(item => item.nav);
					const step = Math.max(1, Math.floor(data.length / 4));
					this.chartLabels = data.map((item, index) => {
						if (index === 0 || index === data.length - 1 || index % step === 0) {
							return item.date.substring(5);
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
		// 定投相关方法
		onSyncBtnClick() {
			// 连击检测，5次开启调试模式
			this.syncClickCount++;
			if (this.syncClickTimer) {
				clearTimeout(this.syncClickTimer);
			}
			this.syncClickTimer = setTimeout(() => {
				if (this.syncClickCount >= 5) {
					this.showDebugPanel = true;
					this.debugStartDate = this.investPlan.startDate;
					this.debugEndDate = this.investPlan.lastInvestDate || this.investPlan.startDate;
					this.today = new Date().toISOString().slice(0, 10);
					uni.showToast({ title: '调试模式已开启', icon: 'none' });
				} else {
					this.syncInvestment();
				}
				this.syncClickCount = 0;
			}, 500);
		},
		onDebugEndDateChange(e) {
			this.debugEndDate = e.detail.value;
		},
		onDebugStartDateChange(e) {
			this.debugStartDate = e.detail.value;
		},
		async runDebugSync() {
			if (!this.investPlan) {
				uni.showToast({ title: '无定投计划', icon: 'none' });
				return;
			}

			this.debugResult = '模拟中...';

			try {
				const navHistory = await getFundHistoryNav(this.fundCode, 'n');
				if (!navHistory || navHistory.length === 0) {
					this.debugResult = '无法获取历史净值';
					return;
				}

				// 使用已导入的函数计算日期
				const tradingDays = navHistory.map(item => item.date);
				const navMap = new Map(navHistory.map(item => [item.date, item.nav]));

				// 创建模拟计划（临时修改开始日期）
				const debugPlan = { ...this.investPlan, startDate: this.debugStartDate };

				// 生成到指定日期的定投日期
				// 检查截止日期是否在净值数据范围内
				const lastNavDate = tradingDays[tradingDays.length - 1];
				const effectiveEndDate = this.debugEndDate > lastNavDate ? lastNavDate : this.debugEndDate;

				// 生成到指定日期的定投日期
				const investDates = generateInvestDates(debugPlan, effectiveEndDate, tradingDays);

				// 计算每期份额
				const investAmount = parseFloat(debugPlan.amount) || 0;
				const newRecords = [];
				for (const date of investDates) {
					const nav = navMap.get(date);
					if (!nav || nav <= 0) continue;
					const shares = parseFloat((investAmount / nav).toFixed(4));
					newRecords.push({ date, amount: investAmount, nav, shares });
				}

				// 计算汇总
				const currentNav = navMap.get(tradingDays[tradingDays - 1]) || 0;
				const summary = calculateSummary(newRecords, currentNav);


				// 控制台输出详细记录
				console.log('===== 定投模拟详细记录 =====');
				console.log('日期\t\t净值\t\t投入\t份额');
				newRecords.forEach(r => {
					console.log(`${r.date}\t${r.nav.toFixed(4)}\t${r.amount}元\t${r.shares.toFixed(4)}份`);
				});
				console.log('=============================');

				// 显示结果（显示前10条和后5条）
				const detailLines = [];
				const showFirst = 10;
				const showLast = 5;

				for (let i = 0; i < Math.min(showFirst, newRecords.length); i++) {
					const r = newRecords[i];
					detailLines.push(`${r.date} | 净值${r.nav.toFixed(4)} | 投入${r.amount}元 | 买入${r.shares.toFixed(2)}份`);
				}
				if (newRecords.length > showFirst + showLast) {
					detailLines.push(`... 省略 ${newRecords.length - showFirst - showLast} 条 ...`);
				}
				if (newRecords.length > showFirst) {
					for (let i = Math.max(showFirst, newRecords.length - showLast); i < newRecords.length; i++) {
						const r = newRecords[i];
						detailLines.push(`${r.date} | 净值${r.nav.toFixed(4)} | 投入${r.amount}元 | 买入${r.shares.toFixed(2)}份`);
					}
				}

				const resultLines = [
					`生成 ${investDates.length} 个定投日期`,
					`有效记录 ${newRecords.length} 条`,
					`累计投入 ${summary ? summary.totalAmount : 0} 元`,
					`累计份额 ${summary ? summary.totalShares.toFixed(2) : 0} 份`,
					`定投均价 ${summary ? summary.avgCost.toFixed(4) : 0} 元`,
					``,
					`【详细记录】`,
					...detailLines
				];
				this.debugResult = resultLines.join('\n');

			} catch (e) {
				console.error('调试同步失败:', e);
				this.debugResult = '模拟失败: ' + e.message;
			}
		},
		resetInvestPlan() {
			uni.showModal({
				title: '重置定投计划',
				content: '确定要重置吗？将清空 lastInvestDate 和所有记录。',
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (res.confirm) {
						this.investPlan.lastInvestDate = null;
						this.investRecords = [];
						this.investSummary = null;
						DataManager.updateInvestPlan(this.fundCode, this.investPlan);
						DataManager.updateInvestRecords(this.fundCode, []);
						uni.showToast({ title: '已重置', icon: 'success' });
						this.debugResult = '计划已重置，lastInvestDate 已清空';
					}
				}
			});
		},
		async syncInvestment() {
			if (this.syncLoading) return;

			if (!this.investPlan || this.investPlan.status !== 'active') {
				uni.showToast({ title: '定投计划未启用', icon: 'none' });
				return;
			}

			this.syncLoading = true;

			try {
				// 获取一年内历史净值数据
				const navHistory = await getFundHistoryNav(this.fundCode, 'n');

				if (!navHistory || navHistory.length === 0) {
					uni.showToast({ title: '无法获取历史净值', icon: 'none' });
					return;
				}

				// 执行定投计算
				const result = executeInvestment(this.investPlan, navHistory, this.investRecords);

				if (result.error) {
					uni.showToast({ title: result.error, icon: 'none' });
					return;
				}

				if (result.newRecords.length === 0) {
					uni.showToast({ title: '没有新的定投记录', icon: 'none' });
					return;
				}

				// 计算新增份额和金额
				const newShares = result.newRecords.reduce((sum, r) => sum + r.shares, 0);
				const newAmount = result.newRecords.reduce((sum, r) => sum + r.amount, 0);

				// 合并到持仓
				const holdingUpdate = mergeToHolding(this.fundDetail, newShares, newAmount);

				// 更新数据
				this.investRecords = result.allRecords;
				this.investPlan.lastInvestDate = result.lastInvestDate;
				this.investSummary = result.summary;

				// 保存到本地
				DataManager.updateInvestRecords(this.fundCode, this.investRecords, holdingUpdate);
				DataManager.updateInvestPlan(this.fundCode, this.investPlan);

				// 更新界面显示
				this.fundDetail.num = holdingUpdate.num;
				this.fundDetail.cost = holdingUpdate.cost;

				uni.showToast({
					title: `新增${result.newRecords.length}条记录`,
					icon: 'success'
				});
			} catch (e) {
				console.error('同步定投失败:', e);
				uni.showToast({ title: '同步失败', icon: 'none' });
			} finally {
				this.syncLoading = false;
			}
		},
		toggleRecordsExpanded() {
			this.recordsExpanded = !this.recordsExpanded;
		},
		loadMoreRecords() {
			this.recordsCurrentPage++;
		},
		clearInvestRecords() {
			uni.showModal({
				title: '清空定投记录',
				content: `确定要清空全部${this.investRecords.length}条定投记录吗？清空后份额将从持仓中扣除。`,
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (res.confirm) {
						const result = DataManager.clearInvestRecords(this.fundCode);
						if (result) {
							uni.showToast({
								title: `已扣除${result.deductedShares}份`,
								icon: 'success'
							});

							// 更新界面
							this.investRecords = [];
							this.investSummary = null;
							this.fundDetail.num = Math.max(0, this.fundDetail.num - result.deductedShares);

							uni.$emit('fundUpdated', { fundCode: this.fundCode });
						}
					}
				}
			});
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
						DataManager.removeFund(this.fundCode);

						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});

						uni.$emit('fundDeleted', { fundCode: this.fundCode });

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
	padding-bottom: 120rpx;
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

	.card-title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.card-title {
			margin-bottom: 0;
		}
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

/* Bottom Actions */
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
	}
}

/* Invest Card */
.invest-card {
	.invest-status {
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 12rpx;

		&.status-active {
			background-color: #e6f7ff;
			color: #1890ff;
		}

		&.status-paused {
			background-color: #fff7e6;
			color: #fa8c16;
		}

		&.status-terminated {
			background-color: #f5f5f5;
			color: #999;
		}
	}

	.invest-summary {
		.summary-grid {
			display: flex;
			justify-content: space-between;
			margin-bottom: 20rpx;

			.summary-item {
				flex: 1;
				text-align: center;

				.summary-value {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;

					&.red {
						color: #f5222d;
					}

					&.green {
						color: #52c41a;
					}
				}

				.summary-label {
					display: block;
					font-size: 22rpx;
					color: #999;
				}
			}
		}

		.summary-footer {
			display: flex;
			justify-content: space-around;
			padding: 16rpx;
			background-color: #f9faff;
			border-radius: 8rpx;

			.footer-item {
				text-align: center;

				.footer-label {
					display: block;
					font-size: 22rpx;
					color: #999;
					margin-bottom: 4rpx;
				}

				.footer-value {
					display: block;
					font-size: 26rpx;
					color: #333;

					&.red {
						color: #f5222d;
					}

					&.green {
						color: #52c41a;
					}
				}
			}
		}
	}

	.sync-btn-wrapper {
		margin-top: 20rpx;

		.sync-btn {
			padding: 20rpx;
			text-align: center;
			background-color: #3498db;
			color: #fff;
			border-radius: 8rpx;
			font-size: 28rpx;

			&.loading {
				background-color: #a0cfff;
			}
		}
	}

	.invest-records {
		margin-top: 20rpx;
		border-top: 1rpx solid #eee;
		padding-top: 20rpx;

		.records-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 16rpx;

			.records-title {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
			}

			.records-toggle {
				display: flex;
				align-items: center;
				gap: 8rpx;
				font-size: 24rpx;
				color: #666;

				.toggle-arrow {
					font-size: 20rpx;
					transition: transform 0.2s;

					&.expanded {
						transform: rotate(180deg);
					}
				}
			}
		}

		.records-list {
			max-height: 400rpx;
			overflow-y: auto;

			.record-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16rpx 0;
				border-bottom: 1rpx solid #f5f5f5;

				&:last-child {
					border-bottom: none;
				}

				.record-date {
					font-size: 26rpx;
					color: #333;
					width: 160rpx;
				}

				.record-info {
					flex: 1;
					display: flex;
					flex-direction: column;

					.record-amount {
						font-size: 26rpx;
						color: #333;
					}

					.record-shares {
						font-size: 22rpx;
						color: #999;
					}
				}

				.record-nav {
					font-size: 24rpx;
					color: #666;
				}
			}

			.load-more {
				padding: 16rpx;
				text-align: center;
				font-size: 26rpx;
				color: #3498db;
			}
		}
	}

	.clear-records-btn {
		margin-top: 20rpx;
		padding: 16rpx;
		text-align: center;
		color: #ff4d4f;
		font-size: 26rpx;
		border: 1rpx solid #ff4d4f;
		border-radius: 8rpx;
	}
}

/* 调试面板样式 */
.debug-panel {
	margin-top: 20rpx;
	background-color: #fffbe6;
	border: 2rpx solid #ffe58f;
	border-radius: 12rpx;
	overflow: hidden;

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 20rpx;
		background-color: #fff7e6;
		border-bottom: 1rpx solid #ffe58f;

		.debug-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #d48806;
		}

		.debug-close {
			font-size: 28rpx;
			color: #999;
			padding: 0 10rpx;
		}
	}

	.debug-content {
		padding: 20rpx;

		.debug-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12rpx 0;
			border-bottom: 1rpx solid #fff1cc;

			&:last-child {
				border-bottom: none;
			}

			.debug-label {
				font-size: 26rpx;
				color: #666;
			}

			.debug-value {
				font-size: 26rpx;
				color: #333;
				font-weight: 500;
			}

			.debug-picker {
				padding: 8rpx 16rpx;
				background-color: #fff;
				border: 1rpx solid #ddd;
				border-radius: 6rpx;
				font-size: 26rpx;
				color: #333;
			}
		}

		.debug-actions {
			display: flex;
			gap: 16rpx;
			margin-top: 20rpx;

			.debug-btn {
				flex: 1;
				padding: 16rpx;
				text-align: center;
				background-color: #3498db;
				color: #fff;
				border-radius: 8rpx;
				font-size: 26rpx;

				&.warning {
					background-color: #fff;
					color: #ff4d4f;
					border: 1rpx solid #ff4d4f;
				}
			}
		}

		.debug-result {
			margin-top: 20rpx;
			padding: 16rpx;
			background-color: #f6f6f6;
			border-radius: 8rpx;

			.debug-result-title {
				display: block;
				font-size: 24rpx;
				color: #666;
				margin-bottom: 8rpx;
			}

			.debug-result-text {
				display: block;
				font-size: 24rpx;
				color: #333;
				line-height: 1.8;
				white-space: pre-wrap;
				font-family: monospace;
			}
		}
	}
}
</style>
