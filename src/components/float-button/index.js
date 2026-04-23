/**
 * FloatButton - 悬浮拖拽按钮组件
 */
Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },

  properties: {
    // 是否显示
    visible: {
      type: Boolean,
      value: true
    },
    // 未读消息数
    badgeCount: {
      type: Number,
      value: 0
    }
  },

  data: {
    // movable-view 的位置
    x: 0,
    y: 0,
    // movable-area 尺寸
    areaWidth: 0,
    areaHeight: 0,
    // 按钮尺寸
    btnSize: 50
  },

  lifetimes: {
    attached() {
      this._initPosition();
    }
  },

  methods: {
    /**
     * 初始化按钮位置（右下角）
     */
    _initPosition() {
      try {
        const sys = wx.getSystemInfoSync();
        this.setData({
          areaWidth: sys.windowWidth,
          areaHeight: sys.windowHeight,
          x: sys.windowWidth - this.data.btnSize - 15,
          y: sys.windowHeight - this.data.btnSize - 200
        });
      } catch (e) {
        this.setData({ x: 300, y: 500 });
      }
    },

    /**
     * 点击按钮
     */
    onTap() {
      this.triggerEvent('tap');
    }
  }
});
