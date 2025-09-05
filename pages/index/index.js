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
        let newItems = res.data.list || [];
        const pagination = res.data.pagination || {};
        const hasMore = pagination.has_next || false;
        
        // 预处理每个拍卖项目
        newItems = newItems.map(item => {
          // 预处理状态文本和样式
          const statusText = this.getStatusText(item.status);
          const statusClass = this.getStatusClass(item.status);
          
          // 预处理图片URL
          const displayImageUrl = item.image_url || '/assets/images/default-item.png';
          
          // 预处理倒计时显示条件
          const showOngoingCountdown = item.status === 'in_progress';
          const showUpcomingCountdown = item.status === 'pre_show' && item.remaining_time;
          
          return {
            ...item,
            status_text: statusText,
            status_class: statusClass,
            display_image_url: displayImageUrl,
            show_ongoing_countdown: showOngoingCountdown,
            show_upcoming_countdown: showUpcomingCountdown
          };
        });
        
        // 预处理标签页活跃状态
        const activeTags = {
          all: this.data.activeTab === 'all' ? 'tag-active' : '',
          ongoing: this.data.activeTab === 'ongoing' ? 'tag-active' : '',
          upcoming: this.data.activeTab === 'upcoming' ? 'tag-active' : ''
        };
        
        this.setData({
          auctionItems: [...this.data.auctionItems, ...newItems],
          activeTags: activeTags,
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
      let remainingTime = 0;
      let hours = '00';
      let minutes = '00';
      let seconds = '00';
      
      if (item.status === 'in_progress' && item.end_time) {
        const endTime = new Date(item.end_time).getTime();
        remainingTime = Math.max(0, endTime - now);
        // 预先计算并格式化时间
        const formattedTime = this.calculateFormattedTime(remainingTime);
        hours = formattedTime.hours;
        minutes = formattedTime.minutes;
        seconds = formattedTime.seconds;
      }
      // 处理即将开始状态的项目
      else if (item.status === 'pre_show' && item.start_time) {
        const startTime = new Date(item.start_time).getTime();
        remainingTime = Math.max(0, startTime - now);
        // 预先计算并格式化时间
        const formattedTime = this.calculateFormattedTime(remainingTime);
        hours = formattedTime.hours;
        minutes = formattedTime.minutes;
        seconds = formattedTime.seconds;
      }
      
      return {
        ...item,
        remaining_time: remainingTime,
        formatted_hours: hours,
        formatted_minutes: minutes,
        formatted_seconds: seconds
      };
    });
    this.setData({ auctionItems: newItems });
  },
  
  // 计算格式化的时间（内部方法，不直接在WXML中使用）
  calculateFormattedTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    
    return { hours, minutes, seconds };
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