<template>
	<view class="edit-fund-container">
		<view class="fund-header">
			<view class="fund-name">{{ fund.name }}</view>
			<view class="fund-code">{{ fund.code }}</view>
		</view>

		<view class="form-section">
			<view class="form-item">
				<view class="label">持有数量</view>
				<input
					class="input"
					type="digit"
					placeholder="请输入持有数量"
					v-model="formData.num"
					@blur="calculateAmount"
				/>
			</view>

			<view class="form-item">
				<view class="label">入手单价</view>
				<input
					class="input"
					type="digit"
					placeholder="请输入入手单价"
					v-model="formData.cost"
					@blur="calculateHoldGains"
				/>
			</view>

			<!-- 分组选择 -->
			<view class="form-item">
				<view class="label">所属分组（可多选）</view>
				<view class="group-tags">
					<view class="group-tag" :class="{ 'active': selectedGroupIds.length === 0 }" @click="toggleGroup('')">
						<text>不选择分组</text>
					</view>
					<view class="group-tag" v-for="group in groupList" :key="group.id"
						:class="{ 'active': selectedGroupIds.includes(group.id) }" @click="toggleGroup(group.id)">
						<text>{{ group.name }}</text>
					</view>
				</view>
			</view>

			<!-- 备注 -->
			<view class="form-item remark-item">
				<view class="label">备注</view>
				<textarea
					class="textarea"
					placeholder="记录买入理由、止盈策略、定投计划等..."
					v-model="formData.remark"
					maxlength="500"
					:auto-height="true"
					:show-confirm-bar="false"
				></textarea>
				<view class="remark-count">{{ formData.remark ? formData.remark.length : 0 }}/500</view>
			</view>

			<view class="form-item" v-if="formData.num && formData.cost">
				<view class="label">持有总值</view>
				<view class="readonly-value">{{ calculatedAmount }}</view>
			</view>

			<view class="form-item" v-if="calculatedHoldGains !== null">
				<view class="label">当前变动</view>
				<view class="readonly-value" :class="{'red': calculatedHoldGains >= 0, 'green': calculatedHoldGains < 0}">
					{{ calculatedHoldGains >= 0 ? '+' : '' }}{{ calculatedHoldGains }}
				</view>
			</view>

			<!-- 显示当前净值信息 -->
			<view class="form-item" v-if="fund.gsz">
				<view class="label">当前预估单价</view>
				<view class="readonly-value">{{ fund.gsz }}</view>
			</view>

			<view class="form-item" v-if="fund.gszzl">
				<view class="label">预估波动</view>
				<view class="readonly-value" :class="{'red': fund.gszzl >= 0, 'green': fund.gszzl < 0}">
					{{ fund.gszzl >= 0 ? '+' : '' }}{{ fund.gszzl }}%
				</view>
			</view>
		</view>

		<view class="action-buttons">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="save">保存</button>
		</view>
	</view>
</template>

<script>
import { getFundData } from '@/utils/fund-api.js';
import { DataManager } from '@/utils/data-manager.js';

export default {
	data() {
		return {
			fundCode: '',
			fund: {
				code: '',
				name: '',
				num: '',
				cost: '',
				dwjz: 1.0, // 默认单位净值
				gsz: null, // 估算净值
				gszzl: 0 // 估算涨跌幅
			},
			formData: {
				num: '',
				cost: '',
				remark: ''
			},
			calculatedAmount: null,
			calculatedHoldGains: null,
			deviceId: '',
			groupList: [],
			selectedGroupIds: []
		}
	},
	onLoad(options) {
		this.fundCode = options.code;
		this.loadDeviceId();
		this.loadGroupList();
		this.loadFundDetail();
	},
	methods: {
		loadGroupList() {
			this.groupList = DataManager.getGroupList();
		},
		toggleGroup(groupId) {
			if (groupId === '') {
				this.selectedGroupIds = [];
			} else {
				const index = this.selectedGroupIds.indexOf(groupId);
				if (index > -1) {
					this.selectedGroupIds.splice(index, 1);
				} else {
					this.selectedGroupIds.push(groupId);
				}
			}
		},
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
		async loadFundDetail() {
			uni.showLoading({
				title: '加载中...'
			});

			try {
				// 从本地存储获取基金详情
				const fundList = DataManager.getFundList();
				const localFund = fundList.find(item => item.code === this.fundCode);

				// 初始化分组选择
				if (localFund) {
					if (localFund.groupIds && Array.isArray(localFund.groupIds)) {
						this.selectedGroupIds = [...localFund.groupIds];
					} else if (localFund.groupId) {
						this.selectedGroupIds = [localFund.groupId];
					}
				}

				// 从API获取基金实时数据
				const result = await getFundData([this.fundCode], this.deviceId);
				const apiData = result.Datas || [];

				if (apiData.length > 0) {
					const apiFund = apiData[0];

					// 合并API数据和本地数据
					this.fund = {
						code: apiFund.fundcode,
						name: apiFund.name,
						dwjz: apiFund.dwjz,
						gsz: apiFund.gsz,
						gszzl: apiFund.gszzl,
						num: localFund ? localFund.num : '',
						cost: localFund ? localFund.cost : '',
						groupId: localFund ? localFund.groupId : ''
					};

					// 初始化表单数据
					this.formData = {
						num: localFund ? localFund.num : '',
						cost: localFund ? localFund.cost : '',
						remark: localFund ? (localFund.remark || '') : ''
					};
				} else {
					// 如果API获取失败，尝试从本地获取
					if (localFund) {
						this.fund = localFund;
						this.formData = {
							num: localFund.num || '',
							cost: localFund.cost || '',
							remark: localFund.remark || ''
						};
					} else {
						// 创建一个新的基金记录
						this.fund = {
							code: this.fundCode,
							name: '未知基金',
							num: '',
							cost: '',
							dwjz: 1.0,
							gsz: null,
							gszzl: 0
						};
						this.formData = { num: '', cost: '' };
					}
				}
			} catch (error) {
				console.error('加载基金详情失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
			}
		},
		calculateAmount() {
			if (this.formData.num && this.fund.dwjz) {
				const amount = parseFloat(this.formData.num) * parseFloat(this.fund.dwjz);
				this.calculatedAmount = amount ? amount.toFixed(2) : null;
			}
		},
		calculateHoldGains() {
			if (this.formData.num && this.formData.cost && (this.fund.gsz || this.fund.dwjz)) {
				const currentPrice = this.fund.gsz || this.fund.dwjz || 1;
				const cost = parseFloat(this.formData.cost);
				const num = parseFloat(this.formData.num);

				if (!isNaN(currentPrice) && !isNaN(cost) && !isNaN(num)) {
					const gains = (currentPrice - cost) * num;
					this.calculatedHoldGains = gains ? gains.toFixed(2) : null;
				}
			}
		},
		cancel() {
			uni.navigateBack();
		},
		save() {
			if (!this.validateForm()) {
				return;
			}

			// 更新本地存储中的基金信息
			const updateData = {
				num: this.formData.num,
				cost: this.formData.cost,
				groupIds: [...this.selectedGroupIds],
				remark: this.formData.remark || ''
			};

			DataManager.updateFund(this.fundCode, updateData);

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});

			// 触发全局事件，通知主页面刷新数据
			uni.$emit('fundUpdated', { fundCode: this.fundCode });

			// 延迟返回，让用户看到成功提示
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},
		validateForm() {
			// 可以在这里添加验证逻辑
			return true;
		}
	}
}
</script>

<style lang="scss">
.edit-fund-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.edit-fund-container .fund-header {
	background-color: #fff;
	padding: 30rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
	text-align: center;
}

.edit-fund-container .fund-header .fund-name {
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.edit-fund-container .fund-header .fund-code {
	color: #888;
	font-size: 28rpx;
}

.form-section {
	background-color: #fff;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 40rpx;
}

.form-section .form-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
}

.form-section .form-item:last-child {
	border-bottom: none;
}

.form-section .form-item .label {
	font-size: 28rpx;
	margin-bottom: 10rpx;
	color: #333;
}

.form-section .form-item .input {
	width: 100%;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 20rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.form-section .form-item .readonly-value {
	padding: 20rpx;
	background-color: #f8f9fa;
	border-radius: 8rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.form-section .form-item .readonly-value.red {
	color: #ff4757;
}

.form-section .form-item .readonly-value.green {
	color: #2ed573;
}

/* 分组选择样式 */
.form-section .form-item .group-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;

	.group-tag {
		padding: 16rpx 28rpx;
		background-color: #f5f5f5;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: #666;
		border: 2rpx solid transparent;
		transition: all 0.2s;

		&.active {
			background-color: #e8f4fd;
			color: #3498db;
			border-color: #3498db;
		}
	}
}

.action-buttons {
	display: flex;
	gap: 20rpx;
}

.action-buttons .btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 10rpx;
	font-size: 32rpx;
}

.action-buttons .cancel-btn {
	background-color: #95a5a6;
	color: #fff;
}

.action-buttons .save-btn {
	background-color: #3498db;
	color: #fff;
}

/* 备注样式 */
.form-section .form-item.remark-item {
	.label {
		margin-bottom: 16rpx;
	}

	.textarea {
		width: 100%;
		min-height: 160rpx;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 8rpx;
		font-size: 28rpx;
		line-height: 1.6;
		background-color: #fafafa;
	}

	.remark-count {
		text-align: right;
		font-size: 22rpx;
		color: #999;
		margin-top: 10rpx;
	}
}
</style>
