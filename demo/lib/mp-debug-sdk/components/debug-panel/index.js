/**
 * DebugPanel - 主调试面板组件
 * 整合悬浮按钮、Console、Network、Storage 子面板
 */
const MpDebug = require('../../core/index');
const eventBus = require('../../core/event-bus');

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },

  properties: {},

  data: {
    // SDK 是否启用
    enabled: false,
    // 面板是否打开
    panelVisible: false,
    // 当前选中的 Tab
    activeTab: 'console', // console | network | storage
    // Tab 列表
    tabs: [
      { key: 'console', label: 'Console' },
      { key: 'network', label: 'Network' },
      { key: 'storage', label: 'Storage' }
    ],
    // 未读消息计数
    badgeCount: 0,
    // 面板高度（屏幕百分比 => px）
    panelHeight: 0,
    // 动画控制
    animationClass: ''
  },

  lifetimes: {
    attached() {
      // 检查 SDK 是否启用
      if (!MpDebug.isEnabled()) {
        this.setData({ enabled: false });
        return;
      }

      this.setData({ enabled: true });

      // 计算面板高度
      try {
        const sys = wx.getSystemInfoSync();
        const config = MpDebug.getConfig();
        const heightPercent = config.panelHeight || 60;
        this.setData({
          panelHeight: Math.floor(sys.windowHeight * heightPercent / 100)
        });
      } catch (e) {
        this.setData({ panelHeight: 400 });
      }

      // 面板关闭时，新日志/请求增加 badge 计数
      this._onConsoleAdd = () => {
        if (!this.data.panelVisible) {
          this.setData({ badgeCount: this.data.badgeCount + 1 });
        }
      };
      eventBus.on('console:add', this._onConsoleAdd);

      this._onNetworkRequest = () => {
        if (!this.data.panelVisible) {
          this.setData({ badgeCount: this.data.badgeCount + 1 });
        }
      };
      eventBus.on('network:request', this._onNetworkRequest);
    },

    detached() {
      if (this._onConsoleAdd) eventBus.off('console:add', this._onConsoleAdd);
      if (this._onNetworkRequest) eventBus.off('network:request', this._onNetworkRequest);
    }
  },

  methods: {
    /**
     * 切换面板显示/隐藏
     */
    onTogglePanel() {
      if (this.data.panelVisible) {
        this.hidePanel();
      } else {
        this.showPanel();
      }
    },

    /**
     * 显示面板
     */
    showPanel() {
      this.setData({
        panelVisible: true,
        badgeCount: 0,
        animationClass: 'mp-debug-panel-slide-in'
      });
    },

    /**
     * 隐藏面板
     */
    hidePanel() {
      this.setData({
        animationClass: 'mp-debug-panel-slide-out'
      });
      // 动画结束后隐藏
      setTimeout(() => {
        this.setData({
          panelVisible: false,
          animationClass: ''
        });
      }, 200);
    },

    /**
     * 切换 Tab
     */
    onTabChange(e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({ activeTab: tab });
    },

    /**
     * 阻止面板内的触摸事件冒泡到页面
     */
    onPreventTouchMove() {
      // 空方法，仅用于 catchtouchmove 阻止冒泡
    }
  }
});
