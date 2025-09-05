// auction-list.js
const app = getApp();

Page({
  data: {
    auctionItems: [],
    categories: [],
    searchKeyword: '',
    activeFilter: 'all', // all, ongoing, upcoming, ended
    activeCategory: 'all',
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    countdownTimers: []
  },

  onLoad() {
    // 加载拍卖列表
    this.loadAuctionList();
    // 加载分类列表
    this.loadCategories();
  },

  onShow() {
    // 每次页面显示时，如果有倒计时，重新启动
    this.startAllCountdown();
  },

  onHide() {
    // 页面隐藏时，清除所有倒计时
    this.clearAllCountdown();
  },

  onUnload() {
    // 页面卸载时，清除所有倒计时
    this.clearAllCountdown();
  },

  // 加载拍卖列表
  loadAuctionList() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    const params = {
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 添加搜索关键词
    if (this.data.searchKeyword) {
      params.search = this.data.searchKeyword;
    }
    
    // 添加状态筛选
    if (this.data.activeFilter !== 'all') {
      params.status = this.data.activeFilter;
    }
    
    // 添加分类筛选
    if (this.data.activeCategory !== 'all') {
      params.category = this.data.activeCategory;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/auctions/`,
      method: 'GET',
      data: params,
      success: (res) => {
        const newItems = res.results || [];
        const allItems = [...this.data.auctionItems, ...newItems];
        
        // 为进行中的拍卖品添加倒计时
        const now = Date.now();
        newItems.forEach(item => {
          if (item.status === 'ongoing' && item.end_time) {
            const endTime = new Date(item.end_time).getTime();
            item.remaining_time = Math.max(0, endTime - now);
          }
        });
        
        this.setData({
          auctionItems: allItems,
          loading: false,
          hasMore: newItems.length === this.data.pageSize,
          page: this.data.page + 1
        });
        
        // 为进行中的拍卖品启动倒计时
        this.startCountdownForItems(newItems);
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        // 可以在这里添加请求完成后的统一处理逻辑
        // 例如：如果需要在请求完成后执行某些操作，无论成功还是失败
      }
    });
  },

  // 加载分类列表
  loadCategories() {
    app.request({
      url: `${app.globalData.baseUrl}/categories/`,
      method: 'GET',
      success: (res) => {
        this.setData({
          categories: res.results || []
        });
      },
      fail: () => {
        console.log('加载分类失败');
      }
    });
  },

  // 搜索拍卖品
  searchAuction() {
    this.resetData();
    this.loadAuctionList();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 切换筛选
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      activeFilter: filter
    });
    this.resetData();
    this.loadAuctionList();
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category
    });
    this.resetData();
    this.loadAuctionList();
  },

  // 加载更多
  loadMore() {
    this.loadAuctionList();
  },

  // 查看详情
  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/auction-detail/auction-detail?id=${id}`
    });
  },

  // 重置数据
  resetData() {
    this.setData({
      auctionItems: [],
      page: 1,
      hasMore: true
    });
    this.clearAllCountdown();
  },

  // 为拍卖品启动倒计时
  startCountdownForItems(items) {
    items.forEach(item => {
      if (item.status === 'ongoing' && item.remaining_time > 0) {
        this.startCountdown(item.id);
      }
    });
  },

  // 启动所有倒计时
  startAllCountdown() {
    this.data.auctionItems.forEach(item => {
      if (item.status === 'ongoing' && item.remaining_time > 0) {
        this.startCountdown(item.id);
      }
    });
  },

  // 启动单个倒计时
  startCountdown(itemId) {
    // 先清除已有的定时器
    this.clearCountdown(itemId);
    
    const timer = setInterval(() => {
      const items = this.data.auctionItems;
      let updated = false;
      
      items.forEach((item, index) => {
        if (item.id === itemId && item.remaining_time > 0) {
          items[index].remaining_time -= 1000;
          updated = true;
          
          // 如果时间到了，清除定时器
          if (items[index].remaining_time <= 0) {
            this.clearCountdown(itemId);
            // 重新加载该拍卖品信息
            this.loadAuctionItem(itemId, index);
          }
        }
      });
      
      if (updated) {
        this.setData({ auctionItems: items });
      }
    }, 1000);
    
    // 保存定时器引用
    this.data.countdownTimers.push({
      itemId: itemId,
      timer: timer
    });
  },

  // 清除单个倒计时
  clearCountdown(itemId) {
    this.data.countdownTimers = this.data.countdownTimers.filter(timerInfo => {
      if (timerInfo.itemId === itemId) {
        clearInterval(timerInfo.timer);
        return false;
      }
      return true;
    });
  },

  // 清除所有倒计时
  clearAllCountdown() {
    this.data.countdownTimers.forEach(timerInfo => {
      clearInterval(timerInfo.timer);
    });
    this.data.countdownTimers = [];
  },

  // 加载单个拍卖品信息
  loadAuctionItem(itemId, index) {
    app.request({
      url: `${app.globalData.baseUrl}/auctions/${itemId}/`,
      method: 'GET',
      success: (res) => {
        const items = this.data.auctionItems;
        items[index] = res;
        this.setData({ auctionItems: items });
      },
      fail: () => {
        console.log('加载拍卖品信息失败');
      }
    });
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'ongoing': '进行中',
      'upcoming': '即将开始',
      'ended': '已结束'
    };
    return statusMap[status] || status;
  },

  // 格式化倒计时
  formatCountdown(milliseconds) {
    if (!milliseconds) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
});