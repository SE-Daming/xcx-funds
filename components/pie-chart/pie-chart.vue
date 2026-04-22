<template>
	<view class="pie-chart-box">
		<canvas
			canvas-id="pieChart"
			id="pieChart"
			class="pie-canvas"
			@touchstart="onTouchStart"
			@touchend="onTouchEnd"
			@touchcancel="onTouchEnd"
		></canvas>
		<!-- 图例 - 可展开/收起，按占比排序 -->
		<view class="legend-list">
			<view class="legend-item" v-for="(item, index) in displayChartData" :key="index" @click="onLegendClick(item)">
				<view class="legend-color" :style="{ backgroundColor: item.color }"></view>
				<view class="legend-info">
					<text class="legend-name">{{ item.name }}</text>
					<text class="legend-value">¥{{ item.amount.toFixed(2) }} ({{ item.percent }}%)</text>
				</view>
			</view>
		</view>
		<!-- 展开/收起按钮 -->
		<view class="expand-btn" v-if="showExpandBtn" @click="toggleExpand">
			<text>{{ expanded ? '收起' : '展开查看全部' }}</text>
			<text class="expand-icon">{{ expanded ? '▲' : '▼' }}</text>
		</view>
		<!-- 触摸提示 - 固定在饼图中间 -->
		<cover-view class="touch-tip" v-if="showTip">
			<cover-view class="tip-content">
				<cover-view class="tip-name">{{ tipName }}</cover-view>
				<cover-view class="tip-value">¥{{ tipAmount }}</cover-view>
				<cover-view class="tip-percent">{{ tipPercent }}%</cover-view>
			</cover-view>
		</cover-view>
	</view>
</template>

<script>
export default {
	name: 'PieChart',
	props: {
		data: {
			type: Array,
			default: () => [] // [{ name, amount, code }]
		}
	},
	data() {
		return {
			ctx: null,
			width: 200,
			height: 200,
			chartData: [],
			sortedChartData: [], // 按占比排序后的数据
			slices: [], // 存储扇形区域信息用于触摸检测
			// 触摸提示
			showTip: false,
			tipName: '',
			tipAmount: '',
			tipPercent: '',
			// 展开状态
			expanded: false,
			// 颜色列表
			colors: [
				'#2979ff', '#19be6b', '#ff9900', '#ed4014', '#9c27b0',
				'#00bcd4', '#ff5722', '#795548', '#607d8b', '#e91e63',
				'#3f51b5', '#009688', '#ffc107', '#03a9f4', '#8bc34a'
			]
		}
	},
	computed: {
		// 显示的图例数据（根据展开状态和排序）
		displayChartData() {
			if (this.expanded) {
				return this.sortedChartData;
			}
			return this.sortedChartData.slice(0, 5);
		},
		// 是否显示展开按钮
		showExpandBtn() {
			return this.sortedChartData.length > 5;
		}
	},
	watch: {
		data: {
			handler(newVal) {
				if (newVal && newVal.length > 0) {
					this.processData();
					this.drawChart();
				}
			},
			deep: true,
			immediate: true
		}
	},
	mounted() {
		setTimeout(() => {
			this.initCanvas();
		}, 50);
	},
	methods: {
		initCanvas() {
			this.ctx = uni.createCanvasContext('pieChart', this);
			if (this.data && this.data.length > 0) {
				this.processData();
				this.drawChart();
			}
		},
		processData() {
			// 计算总金额
			const total = this.data.reduce((sum, item) => sum + (item.amount || 0), 0);
			if (total === 0) {
				this.chartData = [];
				this.sortedChartData = [];
				return;
			}

			// 计算占比并分配颜色
			this.chartData = this.data.map((item, index) => ({
				...item,
				percent: ((item.amount / total) * 100).toFixed(1),
				color: this.colors[index % this.colors.length]
			}));

			// 按占比倒序排序（用于图例显示）
			this.sortedChartData = [...this.chartData].sort((a, b) => {
				return parseFloat(b.percent) - parseFloat(a.percent);
			});
		},
		drawChart() {
			if (!this.ctx || this.chartData.length === 0) return;

			const { ctx, width, height, chartData } = this;
			const centerX = width / 2;
			const centerY = height / 2;
			const radius = Math.min(width, height) / 2 - 10;

			// 清空画布
			ctx.clearRect(0, 0, width, height);

			// 绘制饼图
			let startAngle = -Math.PI / 2; // 从顶部开始
			this.slices = [];

			chartData.forEach((item, index) => {
				const angle = (parseFloat(item.percent) / 100) * Math.PI * 2;
				const endAngle = startAngle + angle;

				// 绘制扇形
				ctx.beginPath();
				ctx.moveTo(centerX, centerY);
				ctx.arc(centerX, centerY, radius, startAngle, endAngle);
				ctx.closePath();
				ctx.setFillStyle(item.color);
				ctx.fill();

				// 存储扇形信息用于触摸检测
				this.slices.push({
					startAngle,
					endAngle,
					data: item
				});

				startAngle = endAngle;
			});

			// 绘制中心圆（形成环形图效果）
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
			ctx.setFillStyle('#ffffff');
			ctx.fill();

			// 中心文字
			const total = chartData.reduce((sum, item) => sum + item.amount, 0);
			ctx.setFillStyle('#333333');
			ctx.setFontSize(12);
			ctx.setTextAlign('center');
			ctx.fillText('总持仓', centerX, centerY - 8);
			ctx.setFontSize(14);
			ctx.fillText('¥' + total.toFixed(0), centerX, centerY + 10);

			ctx.draw();
		},
		onTouchStart(e) {
			if (this.slices.length === 0) return;

			const touch = e.touches[0];
			if (!touch) return;

			// 计算触摸点相对于圆心的角度
			const centerX = this.width / 2;
			const centerY = this.height / 2;
			const dx = touch.x - centerX;
			const dy = touch.y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const radius = Math.min(this.width, this.height) / 2 - 10;

			// 判断是否在环形区域内
			if (distance < radius * 0.5 || distance > radius) {
				this.showTip = false;
				return;
			}

			// 计算角度
			let angle = Math.atan2(dy, dx);
			if (angle < -Math.PI / 2) {
				angle += Math.PI * 2;
			}

			// 查找对应的扇形
			for (const slice of this.slices) {
				let start = slice.startAngle;
				let end = slice.endAngle;

				// 处理角度跨越的情况
				if (end > Math.PI) {
					if (angle >= start || angle <= end - Math.PI * 2) {
						this.showTipInfo(slice.data);
						return;
					}
				} else {
					if (angle >= start && angle < end) {
						this.showTipInfo(slice.data);
						return;
					}
				}
			}

			this.showTip = false;
		},
		showTipInfo(data) {
			this.showTip = true;
			this.tipName = data.name;
			this.tipAmount = data.amount.toFixed(2);
			this.tipPercent = data.percent;
		},
		onTouchEnd() {
			this.showTip = false;
		},
		onLegendClick(item) {
			if (item.code) {
				this.$emit('click', item);
			}
		},
		toggleExpand() {
			this.expanded = !this.expanded;
		}
	}
}
</script>

<style lang="scss">
.pie-chart-box {
	width: 100%;
	padding: 20rpx 0;
	position: relative;
}

.pie-canvas {
	width: 200px;
	height: 200px;
	margin: 0 auto;
	display: block;
}

.legend-list {
	margin-top: 20rpx;
	padding: 0 20rpx;
}

.legend-item {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background-color: #f9f9f9;
	}
}

.legend-color {
	width: 24rpx;
	height: 24rpx;
	border-radius: 4rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.legend-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.legend-name {
	font-size: 28rpx;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-bottom: 4rpx;
}

.legend-value {
	font-size: 24rpx;
	color: #666;
}

/* 展开按钮 */
.expand-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 0;
	margin-top: 8rpx;
	border-top: 1rpx solid #f0f0f0;
	font-size: 26rpx;
	color: #2979ff;

	.expand-icon {
		margin-left: 8rpx;
		font-size: 20rpx;
	}
}

.touch-tip {
	position: absolute;
	left: 50%;
	top: 100px;
	transform: translate(-50%, -50%);
	pointer-events: none;
	z-index: 10;

	.tip-content {
		background-color: rgba(0, 0, 0, 0.85);
		padding: 16rpx 24rpx;
		border-radius: 12rpx;
		text-align: center;
		white-space: nowrap;

		.tip-name {
			font-size: 26rpx;
			color: #fff;
			margin-bottom: 6rpx;
		}

		.tip-value {
			font-size: 30rpx;
			font-weight: bold;
			color: #fff;
		}

		.tip-percent {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.8);
			margin-top: 4rpx;
		}
	}
}
</style>
