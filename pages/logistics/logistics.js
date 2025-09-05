// logistics.js
const app = getApp();

Page({
  data: {
    orderNo: '',
    logisticsInfo: null,
    loading: true,
    noData: false
  },

  onLoad(options) {
    const { orderNo } = options;
    this.setData({ orderNo });
    this.loadLogisticsInfo();
  },

  // 加载物流信息
  loadLogisticsInfo() {
    const { orderNo } = this.data;
    
    this.setData({ loading: true });
    
    app.request({
      url: `${app.globalData.baseUrl}/logistics/`,
      method: 'GET',
      data: {
        order_no: orderNo
      },
      success: (res) => {
        if (res && res.traces && res.traces.length > 0) {
          // 格式化物流信息
          const logisticsInfo = res;
          // 对物流轨迹进行时间排序，最新的在前面
          logisticsInfo.traces = logisticsInfo.traces.sort((a, b) => {
            return new Date(b.time) - new Date(a.time);
          });
          
          // 预处理物流轨迹，添加激活状态标记
          logisticsInfo.traces = logisticsInfo.traces.map((trace, index) => {
            return {
              ...trace,
              isActive: index === 0
            };
          });
          
          this.setData({
            logisticsInfo,
            noData: false
          });
        } else {
          this.setData({ noData: true });
        }
      },
      fail: () => {
        wx.showToast({
          title: '加载物流信息失败',
          icon: 'none'
        });
        // 显示模拟数据
        this.setMockLogisticsInfo();
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 设置模拟物流信息（当接口调用失败时使用）
  setMockLogisticsInfo() {
    const mockData = {
      company: '顺丰速运',
      tracking_no: this.data.orderNo || 'SF1234567890',
      status: '运输中',
      traces: [
        {
          time: '2023-10-18 14:30:00',
          location: '北京市海淀区',
          description: '【北京市】快件已到达【北京朝阳集散中心】'
        },
        {
          time: '2023-10-18 10:15:00',
          location: '北京市朝阳区',
          description: '【北京市】快递员【张三（13800138000）】正在为您派送，请保持电话畅通'
        },
        {
          time: '2023-10-17 18:45:00',
          location: '上海市浦东新区',
          description: '【上海市】快件已发出，正在运往【北京】'
        },
        {
          time: '2023-10-17 16:30:00',
          location: '上海市浦东新区',
          description: '【上海市】快件已到达【上海浦东集散中心】'
        },
        {
          time: '2023-10-17 10:20:00',
          location: '上海市',
          description: '【上海市】快递员已揽收'
        }
      ]
    };
    
    // 预处理模拟物流轨迹，添加激活状态标记
    mockData.traces = mockData.traces.map((trace, index) => {
      return {
        ...trace,
        isActive: index === 0
      };
    });
    
    this.setData({
      logisticsInfo: mockData,
      noData: false
    });
  },

  // 重新加载物流信息
  reloadLogisticsInfo() {
    this.loadLogisticsInfo();
  },

  // 联系快递员
  contactCourier() {
    wx.makePhoneCall({
      phoneNumber: '13800138000', // 示例电话号码
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败', err);
      }
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '4001234567',
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败', err);
      }
    });
  }
});