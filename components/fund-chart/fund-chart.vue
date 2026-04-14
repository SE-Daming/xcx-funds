<template>
	<view class="chart-box">
		<canvas
			canvas-id="lineChart"
			id="lineChart"
			class="chart-canvas"
			@touchstart="onTouchStart"
			@touchmove="onTouchMove"
			@touchend="onTouchEnd"
		></canvas>
		<view class="no-data" v-if="!data || data.length === 0">
			<text>暂无走势数据</text>
		</view>
		<!-- 触摸提示 - 使用 cover-view 覆盖 canvas -->
		<cover-view class="touch-tip" v-if="showTip">
			<cover-view class="tip-content">
				<cover-view class="tip-value" :style="{ color: tipColorComputed }">{{ tipValue }}</cover-view>
				<cover-view class="tip-label">{{ tipLabel }}</cover-view>
			</cover-view>
		</cover-view>
	</view>
</template>

<script>
export default {
	name: 'FundChart',
	props: {
		data: {
			type: Array,
			default: () => []
		},
		labels: {
			type: Array,
			default: () => []
		},
		color: {
			type: String,
			default: '#2979ff'
		},
		type: {
			type: String,
			default: 'y'
		}
	},
	data() {
		return {
			ctx: null,
			width: 320,
			height: 190,
			padding: { top: 20, right: 15, bottom: 45, left: 55 },
			// 触摸相关
			showTip: false,
			tipValue: '',
			tipLabel: '',
			tipLineLeft: 0,
			tipDotLeft: 0,
			tipDotTop: 0,
			tipChange: 0,
			// 数据点坐标缓存
			pointCoords: []
		}
	},
	computed: {
		tipColorComputed() {
			// 根据当前点相对于前一个点的变化来决定颜色
			if (this.tipChange > 0) return '#f5222d'; // 红色上涨
			if (this.tipChange < 0) return '#52c41a'; // 绿色下跌
			return '#666666'; // 灰色持平
		}
	},
	mounted() {
		setTimeout(() => {
			this.initCanvas();
		}, 50);
	},
	watch: {
		data: {
			handler(newVal) {
				console.log('图表数据变化:', newVal ? newVal.length : 0);
				if (this.ctx && newVal && newVal.length > 0) {
					this.drawChart();
				}
			},
			deep: true,
			immediate: true
		}
	},
	methods: {
		initCanvas() {
			this.ctx = uni.createCanvasContext('lineChart', this);
			console.log('Canvas初始化完成, 尺寸:', this.width, this.height);
			if (this.data && this.data.length > 0) {
				this.drawChart();
			}
		},
		drawChart() {
			console.log('drawChart调用:', 'data=', this.data.length);
			if (!this.ctx || !this.data || this.data.length === 0) return;

			const { ctx, width, height, padding, data, labels } = this;
			const chartWidth = width - padding.left - padding.right;
			const chartHeight = height - padding.top - padding.bottom;

			// 计算极值
			let min = Math.min(...data);
			let max = Math.max(...data);
			let range = max - min;

			if (range === 0) {
				min -= 0.5;
				max += 0.5;
				range = 1;
			} else {
				min -= range * 0.1;
				max += range * 0.1;
				range = max - min;
			}

			// 清空画布
			ctx.clearRect(0, 0, width, height);

			// 绘制坐标轴
			ctx.setStrokeStyle('#eeeeee');
			ctx.setLineWidth(1);

			// Y轴网格线 (3条)
			ctx.beginPath();
			for (let i = 0; i <= 2; i++) {
				const y = padding.top + (chartHeight * i) / 2;
				ctx.moveTo(padding.left, y);
				ctx.lineTo(width - padding.right, y);

				const val = max - (range * i) / 2;
				ctx.setFillStyle('#999999');
				ctx.setFontSize(10);
				ctx.fillText(val.toFixed(4), 5, y + 4);
			}
			ctx.stroke();

			// X轴文字 - 显示首、中、尾三个日期
			if (labels.length > 0 && data.length > 0) {
				ctx.setFillStyle('#999999');
				ctx.setFontSize(10);

				const chartWidth = width - padding.left - padding.right;

				// 固定显示3个标签：起始、中间、结束
				const indices = [0, Math.floor((data.length - 1) / 2), data.length - 1];

				indices.forEach(dataIndex => {
					let label = labels[dataIndex] || '';

					// 如果该位置没有标签，尝试从附近查找
					if (!label) {
						for (let j = dataIndex - 1; j >= 0; j--) {
							if (labels[j]) { label = labels[j]; break; }
						}
						if (!label) {
							for (let j = dataIndex + 1; j < labels.length; j++) {
								if (labels[j]) { label = labels[j]; break; }
							}
						}
					}

					if (!label) return;

					const x = padding.left + dataIndex * (chartWidth / (data.length - 1));
					const textWidth = label.length * 6;
					const textX = Math.max(padding.left, Math.min(x - textWidth / 2, width - padding.right - textWidth));
					ctx.fillText(label, textX, height - 10);
				});
			}

			// 绘制折线并缓存坐标点
			ctx.beginPath();
			ctx.setStrokeStyle(this.color);
			ctx.setLineWidth(2);

			const xStep = chartWidth / (data.length - 1);
			this.pointCoords = [];

			data.forEach((val, index) => {
				const x = padding.left + index * xStep;
				const y = padding.top + chartHeight - ((val - min) / range) * chartHeight;

				this.pointCoords.push({ x, y, value: val, label: labels[index] || '' });

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();

			// 绘制填充区域
			ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
			ctx.lineTo(padding.left, padding.top + chartHeight);
			ctx.closePath();

			const gradient = ctx.createLinearGradient(0, 0, 0, height);
			gradient.addColorStop(0, this.hexToRgba(this.color, 0.2));
			gradient.addColorStop(1, this.hexToRgba(this.color, 0.0));
			ctx.setFillStyle(gradient);
			ctx.fill();

			ctx.draw();
			console.log('图表绘制完成');
		},
		hexToRgba(hex, alpha) {
			let r = 0, g = 0, b = 0;
			if (hex.length === 4) {
				r = parseInt(hex[1] + hex[1], 16);
				g = parseInt(hex[2] + hex[2], 16);
				b = parseInt(hex[3] + hex[3], 16);
			} else if (hex.length === 7) {
				r = parseInt(hex.substring(1, 3), 16);
				g = parseInt(hex.substring(3, 5), 16);
				b = parseInt(hex.substring(5, 7), 16);
			}
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		},
		onTouchStart(e) {
			this.updateTip(e);
		},
		onTouchMove(e) {
			this.updateTip(e);
		},
		onTouchEnd(e) {
			this.showTip = false;
		},
		updateTip(e) {
			if (!this.pointCoords.length) return;

			const touch = e.touches[0];
			if (!touch) return;

			// 小程序 touch.x/y 返回的是相对于 canvas 元素的坐标
			// 我们需要计算 canvas 实际渲染尺寸与 CSS 尺寸的缩放比例
			const canvasWidth = 320; // canvas 实际宽度
			const canvasHeight = 190; // canvas 实际高度

			// 获取 canvas 元素在页面中的实际尺寸
			const query = uni.createSelectorQuery().in(this);
			query.select('.chart-canvas').boundingClientRect(rect => {
				if (!rect) return;

				// 计算缩放比例
				const scaleX = canvasWidth / rect.width;
				const scaleY = canvasHeight / rect.height;

				// 将触摸坐标转换为 canvas 内部坐标
				const touchX = touch.x * scaleX;
				const touchY = touch.y * scaleY;

				// 找到最近的数据点
				let closestIndex = 0;
				let minDist = Infinity;
				this.pointCoords.forEach((point, index) => {
					const dist = Math.abs(point.x - touchX);
					if (dist < minDist) {
						minDist = dist;
						closestIndex = index;
					}
				});

				const padding = this.padding;

				// 只在图表区域内显示提示
				if (touchX >= padding.left && touchX <= this.width - padding.right) {
					const point = this.pointCoords[closestIndex];

					// 计算该点相对于前一个点的变化率
					let change = 0;
					if (closestIndex > 0) {
						const prevValue = this.data[closestIndex - 1];
						if (prevValue !== 0) {
							change = ((point.value - prevValue) / prevValue) * 100;
						}
					}

					// 将 canvas 内部坐标转换回 CSS 坐标用于定位提示框
					const cssX = point.x / scaleX;
					const cssY = point.y / scaleY;

					this.showTip = true;
					this.tipValue = point.value.toFixed(4);
					this.tipLabel = point.label || '';
					this.tipChange = change;
					// 提示线位置：相对于 chart-box 的左边界
					this.tipLineLeft = cssX;
					// 提示点位置
					this.tipDotLeft = cssX - 6; // 减去点半径
					this.tipDotTop = cssY - 6;
				} else {
					this.showTip = false;
				}
			}).exec();
		}
	}
}
</script>

<style lang="scss">
.chart-box {
	width: 100%;
	height: 420rpx;
	position: relative;
}

.chart-canvas {
	width: 320px;
	height: 190px;
	margin: 0 auto;
}

.no-data {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255,255,255,0.8);
	color: #999;
	font-size: 24rpx;
}

.touch-tip {
	position: absolute;
	top: 10rpx;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	pointer-events: none;

	.tip-content {
		background-color: rgba(0, 0, 0, 0.85);
		padding: 12rpx 24rpx;
		border-radius: 10rpx;
		text-align: center;

		.tip-value {
			font-size: 30rpx;
			font-weight: bold;
		}

		.tip-label {
			font-size: 24rpx;
			color: #fff;
			margin-top: 4rpx;
		}
	}
}
</style>
