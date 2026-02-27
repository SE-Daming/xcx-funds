<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	page {
		background-color: $page-bg;
		color: $uni-text-color;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
	
	view, text, button, input {
		box-sizing: border-box;
	}

	/* 通用涨跌色类 */
	.red {
		color: $fund-up-color !important;
	}
	
	.green {
		color: $fund-down-color !important;
	}
	
	.gray {
		color: $fund-flat-color !important;
	}
	
	/* 按钮点击效果 */
	.hover-opacity {
		opacity: 0.8;
	}
</style>
