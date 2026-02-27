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
		}
	},
	data() {
		return {
			ctx: null,
			width: 300,
			height: 200,
			padding: { top: 20, right: 10, bottom: 30, left: 40 }
		}
	},
	mounted() {
		// 获取画布尺寸
		const query = uni.createSelectorQuery().in(this);
		query.select('.chart-canvas').boundingClientRect(data => {
			if (data) {
				this.width = data.width;
				this.height = data.height;
				this.initChart();
			}
		}).exec();
	},
	watch: {
		data: {
			handler() {
				this.drawChart();
			},
			deep: true
		}
	},
	methods: {
		initChart() {
			this.ctx = uni.createCanvasContext('lineChart', this);
			this.drawChart();
		},
		drawChart() {
			if (!this.ctx || !this.data || this.data.length === 0) return;
			
			const { ctx, width, height, padding, data, labels } = this;
			const chartWidth = width - padding.left - padding.right;
			const chartHeight = height - padding.top - padding.bottom;
			
			// 清空画布
			ctx.clearRect(0, 0, width, height);
			
			// 计算极值
			let min = Math.min(...data);
			let max = Math.max(...data);
			let range = max - min;
			
			// 增加一点边距
			if (range === 0) {
				min -= 0.5;
				max += 0.5;
				range = 1;
			} else {
				min -= range * 0.1;
				max += range * 0.1;
				range = max - min;
			}
			
			// 绘制坐标轴
			ctx.setStrokeStyle('#eeeeee');
			ctx.setLineWidth(1);
			
			// Y轴网格线 (3条)
			ctx.beginPath();
			for (let i = 0; i <= 2; i++) {
				const y = padding.top + (chartHeight * i) / 2;
				ctx.moveTo(padding.left, y);
				ctx.lineTo(width - padding.right, y);
				
				// Y轴文字
				const val = max - (range * i) / 2;
				ctx.setFillStyle('#999999');
				ctx.setFontSize(10);
				ctx.fillText(val.toFixed(2) + '%', 5, y + 4);
			}
			ctx.stroke();
			
			// X轴文字 (首尾)
			if (labels.length > 0) {
				ctx.fillText(labels[0], padding.left, height - 10);
				ctx.fillText(labels[labels.length - 1], width - padding.right - 30, height - 10);
			}
			
			// 绘制折线
			ctx.beginPath();
			ctx.setStrokeStyle(this.color);
			ctx.setLineWidth(2);
			
			const xStep = chartWidth / (data.length - 1);
			
			data.forEach((val, index) => {
				const x = padding.left + index * xStep;
				const y = padding.top + chartHeight - ((val - min) / range) * chartHeight;
				
				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
			
			ctx.stroke();
			
			// 绘制填充区域 (可选)
			ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
			ctx.lineTo(padding.left, padding.top + chartHeight);
			ctx.closePath();
			
			const gradient = ctx.createLinearGradient(0, 0, 0, height);
			gradient.addColorStop(0, this.hexToRgba(this.color, 0.2));
			gradient.addColorStop(1, this.hexToRgba(this.color, 0.0));
			ctx.setFillStyle(gradient);
			ctx.fill();
			
			ctx.draw();
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
		onTouchStart(e) {},
		onTouchMove(e) {},
		onTouchEnd(e) {}
	}
}
</script>

<style lang="scss">
.chart-box {
	width: 100%;
	height: 100%;
	position: relative;
}

.chart-canvas {
	width: 100%;
	height: 100%;
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
</style>
