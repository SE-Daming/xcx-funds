"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "FundChart",
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
      default: "#2979ff"
    }
  },
  data() {
    return {
      ctx: null,
      width: 300,
      height: 200,
      padding: { top: 20, right: 10, bottom: 30, left: 40 }
    };
  },
  mounted() {
    const query = common_vendor.index.createSelectorQuery().in(this);
    query.select(".chart-canvas").boundingClientRect((data) => {
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
      this.ctx = common_vendor.index.createCanvasContext("lineChart", this);
      this.drawChart();
    },
    drawChart() {
      if (!this.ctx || !this.data || this.data.length === 0)
        return;
      const { ctx, width, height, padding, data, labels } = this;
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      ctx.clearRect(0, 0, width, height);
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
      ctx.setStrokeStyle("#eeeeee");
      ctx.setLineWidth(1);
      ctx.beginPath();
      for (let i = 0; i <= 2; i++) {
        const y = padding.top + chartHeight * i / 2;
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        const val = max - range * i / 2;
        ctx.setFillStyle("#999999");
        ctx.setFontSize(10);
        ctx.fillText(val.toFixed(2) + "%", 5, y + 4);
      }
      ctx.stroke();
      if (labels.length > 0) {
        ctx.fillText(labels[0], padding.left, height - 10);
        ctx.fillText(labels[labels.length - 1], width - padding.right - 30, height - 10);
      }
      ctx.beginPath();
      ctx.setStrokeStyle(this.color);
      ctx.setLineWidth(2);
      const xStep = chartWidth / (data.length - 1);
      data.forEach((val, index) => {
        const x = padding.left + index * xStep;
        const y = padding.top + chartHeight - (val - min) / range * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, this.hexToRgba(this.color, 0.2));
      gradient.addColorStop(1, this.hexToRgba(this.color, 0));
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
    onTouchStart(e) {
    },
    onTouchMove(e) {
    },
    onTouchEnd(e) {
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onTouchStart && $options.onTouchStart(...args)),
    b: common_vendor.o((...args) => $options.onTouchMove && $options.onTouchMove(...args)),
    c: common_vendor.o((...args) => $options.onTouchEnd && $options.onTouchEnd(...args)),
    d: !$props.data || $props.data.length === 0
  }, !$props.data || $props.data.length === 0 ? {} : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fund-chart/fund-chart.js.map
