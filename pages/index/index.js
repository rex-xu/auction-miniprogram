// index.js
const app = getApp();

Page({
  data: {
    auctionItems: [],
    activeTab: 'all', // all, ongoing, upcoming
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadAuctionItems();
    // 设置定时器，实时更新倒计时
    this.timer = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  },

  onUnload() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log("switchTab : " + tab);
    this.setData({
      activeTab: tab,
      auctionItems: [],
      page: 1,
      hasMore: true
    });
    this.loadAuctionItems();
  },

  // 加载拍卖项目列表
  async loadAuctionItems() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    let status = '';
    switch (this.data.activeTab) {
      case 'ongoing':
        status = 'in_progress';
        break;
      case 'upcoming':
        status = 'pre_show';
        break;
      // 对于'all'标签，不设置status参数或设为空字符串
      case 'all':
        status = '';
        break;
    }
    
    console.log("home request /auction-search/");
    try {
      const res = await app.request({
        url: `${app.globalData.baseUrl}/auction-search/`,
        data: {
          page: this.data.page,
          page_size: this.data.pageSize,
          status: status
        }
      });
      
      console.log("home page success : ");
      
      // 检查是否有分页数据
      if (res.code === 0 && res.data) {
        const newItems = res.data.list || [];
        const pagination = res.data.pagination || {};
        const hasMore = pagination.has_next || false;
        
        this.setData({
          auctionItems: [...this.data.auctionItems, ...newItems],
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false
        });
      } else {
        console.log("home page data format error");
        this.setData({ loading: false });
      }
    } catch (error) {
      console.log("home page fail : " + JSON.stringify(error));
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载更多
  loadMore() {
    this.loadAuctionItems();
  },

  // 跳转到详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/auction-detail/auction-detail?id=${id}`
    });
  },

  // 更新倒计时
  updateCountdown() {
    const now = Date.now();
    const newItems = this.data.auctionItems.map(item => {
      if (item.status === 'in_progress' && item.end_time) {
        const endTime = new Date(item.end_time).getTime();
        const remainingTime = Math.max(0, endTime - now);
        return {
          ...item,
          remaining_time: remainingTime
        };
      }
      return item;
    });
    this.setData({ auctionItems: newItems });
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pre_show': '即将开始',
      'in_progress': '进行中',
      'ended': '已结束',
      'successful': '已成交',
      'failed': '流拍'
    };
    return statusMap[status] || status;
  },

  // 获取状态样式
  getStatusClass(status) {
    const classMap = {
      'pre_show': 'tag-upcoming',
      'in_progress': 'tag-active',
      'ended': 'tag-ended',
      'successful': 'tag-successful',
      'failed': 'tag-failed'
    };
    return classMap[status] || '';
  },

  // 格式化时间
  formatTime(milliseconds, type) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    
    switch (type) {
      case 'hours':
        return hours.toString().padStart(2, '0');
      case 'minutes':
        return minutes.toString().padStart(2, '0');
      case 'seconds':
        return seconds.toString().padStart(2, '0');
      default:
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
});