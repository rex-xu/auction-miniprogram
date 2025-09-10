// auction-detail.js
const app = getApp();

Page({
  data: {
    auctionItem: {},
    bidHistory: [],
    bidPrice: '',
    quickBidOptions: [],
    hasPaidDeposit: false,
    canBid: true,
    submittingBid: false,
    itemId: null,
    currentSwiperIndex: 0,
    isLoggedIn: false, // 添加用于WXML模板的登录状态标记
    refreshFlag: false // 用于强制刷新UI的标记位
  },

  onLoad(options) {

    console.log(">>>>>> unload : ", app.globalData.token);

    if (options.id) {
      this.setData({ 
        itemId: options.id,
        isLoggedIn: !!app.globalData.token // 初始化登录状态
      });
      this.loadAuctionDetail();
      this.loadBidHistory();
      
      // 设置定时器，实时更新倒计时
      this.timer = setInterval(() => {
        this.updateCountdown();
      }, 1000);
      
      // 只有登录后才检查保证金状态
      if (app.globalData.token) {
        this.checkDepositStatus();
      }
    }
  },

  onUnload() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  
  // 页面显示时触发（包括从登录页返回时）
  onShow() {
    console.log(">>>>>> onShow - Token in globalData:", app.globalData.token);
    console.log(">>>>>> onShow - Token in storage:", wx.getStorageSync('token'));
    console.log(">>>>>> onShow - Complete globalData:", app.globalData);
    
    // 检查是否有保证金状态变化（从deposit页面返回）
    const depositChanged = app.globalData.depositStatusChanged;
    const lastDepositItemId = app.globalData.lastDepositItemId;
    
    // 如果有保证金状态变化且是当前拍品的保证金变化，则需要特别处理
    if (depositChanged && lastDepositItemId === this.data.itemId) {
      console.log(">>>>>> 检测到当前拍品保证金状态已更新，需要强制刷新");
      // 重置全局标记，避免重复处理
      app.globalData.depositStatusChanged = false;
      app.globalData.lastDepositItemId = null;
      
      // 强制刷新页面数据
      setTimeout(() => {
        this.loadAuctionDetail();
        this.checkDepositStatus();
        this.loadBidHistory();
      }, 500); // 使用稍长延迟确保后端数据已完全更新
    } else {
      // 更新登录状态
      const isLoggedIn = !!app.globalData.token;
      this.setData({ isLoggedIn });
      
      // 重新检查登录状态和保证金状态
      if (isLoggedIn) {
        // 增加延迟以确保从其他页面返回时数据已更新
        setTimeout(() => {
          this.checkDepositStatus();
          this.loadAuctionDetail();
        }, 300);
      } else {
        // 用户未登录，设置为未缴纳保证金状态并禁用出价功能
        this.setData({ 
          hasPaidDeposit: false,
          canBid: false 
        });
        this.updateButtonText();
      }
    }
  },
  
  // 测试按钮：手动设置token
  testTokenSetting() {
    const testToken = 'test-token-' + Date.now();
    console.log('>>>>>> 手动设置测试token:', testToken);
    
    // 设置到globalData
    app.globalData.token = testToken;
    app.globalData.userInfo = {id: 1, nickname: '测试用户'};
    
    // 设置到storage
    wx.setStorageSync('token', testToken);
    wx.setStorageSync('userInfo', {id: 1, nickname: '测试用户'});
    
    wx.showToast({
      title: '已设置测试token',
      icon: 'success'
    });
    
    // 立即重新检查token状态
    setTimeout(() => {
      console.log('>>>>>> 测试设置后 - Token in globalData:', app.globalData.token);
      console.log('>>>>>> 测试设置后 - Token in storage:', wx.getStorageSync('token'));
      // 更新登录状态
      this.setData({ isLoggedIn: !!app.globalData.token });
    }, 100);
  },
  
  // 测试按钮：清除token
  clearToken() {
    console.log('>>>>>> 清除所有token');
    
    // 清除globalData
    app.globalData.token = null;
    app.globalData.userInfo = null;
    
    // 清除storage
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    wx.showToast({
      title: '已清除所有token',
      icon: 'success'
    });
    
    // 立即重新检查token状态
    setTimeout(() => {
      console.log('>>>>>> 清除后 - Token in globalData:', app.globalData.token);
      console.log('>>>>>> 清除后 - Token in storage:', wx.getStorageSync('token'));
      // 更新登录状态
      this.setData({ isLoggedIn: !!app.globalData.token });
    }, 100);
  },
  
  // 测试按钮：重新加载页面
  reloadPage() {
    console.log('>>>>>> 重新加载页面');
    wx.redirectTo({
      url: `/pages/auction-detail/auction-detail?id=${this.data.itemId}`
    });
  },

  // 加载拍卖详情 - 使用async/await语法优化异步请求处理
  async loadAuctionDetail() {
    try {
      // 注意：app.request方法已经处理了后端统一响应格式，直接返回res.data.data部分
      const auctionItemData = await app.request({
        url: `${app.globalData.baseUrl}/auction-items/${this.data.itemId}/`
      });
      
      console.log("auctionItemData : ", auctionItemData);
      // 确保auctionItemData存在
      if (!auctionItemData) {
        throw new Error('获取拍卖详情失败：数据为空');
      }
      
      const now = Date.now();
      // 根据拍卖状态计算剩余时间
      if (auctionItemData.status === 'pre_show' && auctionItemData.start_time) {
        const startTime = new Date(auctionItemData.start_time).getTime();
        auctionItemData.remaining_time = Math.max(0, startTime - now);
      } else if (auctionItemData.end_time) {
        const endTime = new Date(auctionItemData.end_time).getTime();
        auctionItemData.remaining_time = Math.max(0, endTime - now);
      }
      
      // 预处理拍卖项目数据
      const processedItem = this.processAuctionItem(auctionItemData);
      
      // 生成快速出价选项
      const currentPrice = parseFloat(processedItem.current_price);
      const increment = parseFloat(processedItem.bid_increment);
      const quickBids = [
        currentPrice + increment,
        currentPrice + increment * 2,
        currentPrice + increment * 3
      ].map(price => price.toFixed(2));
      
      // 预处理按钮文本
      const buttonText = this.data.hasPaidDeposit ? 
        (this.data.canBid ? '确认出价' : '无法出价') : '请先缴纳保证金';
      
      this.setData({
        auctionItem: processedItem,
        quickBidOptions: quickBids,
        bidPrice: (currentPrice + increment).toFixed(2),
        buttonText: buttonText
      });
    } catch (error) {
      console.error('加载拍卖详情失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  // 检查保证金状态
  checkDepositStatus() {
    const itemId = this.data.itemId;
    
    // 确保先将状态设置为未缴纳，避免初始状态显示错误
    this.setData({ hasPaidDeposit: false });
    
    console.log(`开始检查拍品 ${itemId} 的保证金状态`);
    
    // 只有登录用户才检查保证金状态
    if (app.globalData.token && itemId) {
      app.checkDeposit(itemId).then(hasPaid => {
        console.log(`拍品 ${itemId} 保证金状态检查结果: ${hasPaid ? '已缴纳' : '未缴纳'}`);
        this.setData({ 
          hasPaidDeposit: hasPaid,
          // 如果已缴纳保证金，启用出价功能（除非有其他限制）
          canBid: hasPaid
        });
        
        // 直接在setData后立即调用updateButtonText，确保UI更新
        this.updateButtonText();
        
        // 强制刷新UI显示
        this.setData({ refreshFlag: !this.data.refreshFlag });
      }).catch(error => {
        console.error(`检查拍品 ${itemId} 保证金失败:`, error);
        // 出错时确保设置为未支付状态
        this.setData({ 
          hasPaidDeposit: false,
          canBid: false // 出错时也禁用出价功能
        });
        
        // 更新按钮文本
        this.updateButtonText();
      });
    } else {
      console.log('用户未登录或无商品ID，设置为未缴纳保证金状态并禁用出价功能');
      this.setData({ canBid: false });
      
      // 更新按钮文本
      this.updateButtonText();
    }
  },
  
  // 更新按钮文本
  updateButtonText() {
    const buttonText = this.data.hasPaidDeposit ? 
      (this.data.canBid ? '确认出价' : '无法出价') : '请先缴纳保证金';
    this.setData({ buttonText });
  },
  
  // 轮播图切换时触发
  onSwiperChange(e) {
    const current = e.detail.current;
    this.setData({ currentSwiperIndex: current });
  },
  
  // 预处理拍卖项目数据
  processAuctionItem(item) {
    // 使用app.js中的getImageUrl方法获取主图URL
    item.display_image_url = app.getImageUrl(item);
    
    // 使用app.js中的getImageUrls方法获取所有图片URL数组（用于轮播图）
    item.imageUrls = app.getImageUrls(item);
    
    // 预处理状态文本和样式
    item.status_text = this.getStatusText(item.status);
    item.status_class = this.getStatusClass(item.status);
    
    // 预处理倒计时显示条件
    item.show_ongoing_countdown = item.status === 'in_progress';
    item.show_upcoming_countdown = item.status === 'pre_show' && item.remaining_time;
    
    // 预处理格式化的日期
    if (item.start_time) {
      item.formatted_start_time = this.formatDate(item.start_time);
    }
    
    // 预处理格式化时间
    if (item.remaining_time) {
      const formattedTime = this.calculateFormattedTime(item.remaining_time);
      item.formatted_hours = formattedTime.hours;
      item.formatted_minutes = formattedTime.minutes;
      item.formatted_seconds = formattedTime.seconds;
    }
    
    // 预处理描述文本
    item.display_description = item.description || '暂无描述';
    
    return item;
  },
  
  // 加载出价历史
  async loadBidHistory() {
    try {
      // 注意：app.request方法已经处理了后端统一响应格式，直接返回res.data.data部分
      const data = await app.request({
        url: `${app.globalData.baseUrl}/bid-records/`,
        data: {
          auction_item: this.data.itemId,
          ordering: '-created_at',
          page_size: 20
        }
      });
      
      console.log('出价历史数据:', data);
      
      // 确保数据格式正确
      const bidHistory = data.results || [];
      
      // 预先计算每条出价记录的格式化时间和出价者昵称
      // 添加价格字段映射，确保金额正确显示
      const processedBidHistory = bidHistory.map(record => ({
        ...record,
        price: record.bid_amount || record.price || 0, // 优先使用bid_amount字段
        formatted_created_at: this.formatDateTime(record.created_at),
        display_bidder_name: record.bidder?.nickname || '匿名用户'
      }));
      
      this.setData({ bidHistory: processedBidHistory });
    } catch (error) {
      console.error('加载出价历史失败:', error);
      wx.showToast({
        title: '加载出价历史失败',
        icon: 'none'
      });
      // 设置空数组，确保UI不会显示错误数据
      this.setData({ bidHistory: [] });
    }
  },
  
  // 更新倒计时
  updateCountdown() {
    // 处理进行中状态的项目
    if (this.data.auctionItem.status === 'in_progress' && this.data.auctionItem.end_time) {
      const now = Date.now();
      const endTime = new Date(this.data.auctionItem.end_time).getTime();
      const remainingTime = Math.max(0, endTime - now);
      
      // 预先计算并格式化时间
      const formattedTime = this.calculateFormattedTime(remainingTime);
      
      this.setData({
        'auctionItem.remaining_time': remainingTime,
        'auctionItem.formatted_hours': formattedTime.hours,
        'auctionItem.formatted_minutes': formattedTime.minutes,
        'auctionItem.formatted_seconds': formattedTime.seconds
      });
      
      // 如果拍卖结束，重新加载详情并清除定时器
      if (remainingTime === 0) {
        this.loadAuctionDetail();
        // 清除定时器，避免无限循环加载
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }
    // 处理即将开始状态的项目
    else if (this.data.auctionItem.status === 'pre_show' && this.data.auctionItem.start_time) {
      const now = Date.now();
      const startTime = new Date(this.data.auctionItem.start_time).getTime();
      const remainingTime = Math.max(0, startTime - now);
      
      // 预先计算并格式化时间
      const formattedTime = this.calculateFormattedTime(remainingTime);
      
      this.setData({
        'auctionItem.remaining_time': remainingTime,
        'auctionItem.formatted_hours': formattedTime.hours,
        'auctionItem.formatted_minutes': formattedTime.minutes,
        'auctionItem.formatted_seconds': formattedTime.seconds
      });
      
      // 如果拍卖开始，重新加载详情
      if (remainingTime === 0) {
        this.loadAuctionDetail();
      }
    }
  },
  
  // 计算格式化的时间（内部方法，不直接在WXML中使用）
  calculateFormattedTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    
    return { hours, minutes, seconds };
  },

  // 输入出价金额
  onBidInput(e) {
    const price = e.detail.value;
    this.setData({ bidPrice: price });
    this.validateBidPrice();
  },

  // 快速出价
  onQuickBid(e) {
    const price = e.currentTarget.dataset.price;
    this.setData({ bidPrice: price });
    this.validateBidPrice();
  },

  // 验证出价金额
  validateBidPrice() {
    const bidPrice = parseFloat(this.data.bidPrice);
    const currentPrice = parseFloat(this.data.auctionItem.current_price);
    const minBidPrice = currentPrice + parseFloat(this.data.auctionItem.bid_increment);
    
    const canBid = !isNaN(bidPrice) && bidPrice >= minBidPrice;
    this.setData({ canBid });
    
    // 更新按钮文本
    this.updateButtonText();
  },

  // 提交出价
  submitBid() {
    if (!this.data.hasPaidDeposit) {
      wx.showToast({
        title: '请先缴纳保证金',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.canBid) {
      wx.showToast({
        title: '出价金额过低',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submittingBid: true });
    
    // 注意：app.submitBid的参数已经更新，第二个参数现在是bidAmount
    app.submitBid(this.data.itemId, this.data.bidPrice).then(() => {
      wx.showToast({
        title: '出价成功',
        icon: 'success'
      });
      // 重新加载详情和出价历史
      this.loadAuctionDetail();
      this.loadBidHistory();
    }).catch(error => {
      wx.showToast({
        title: error.message || '出价失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ submittingBid: false });
    });
  },

  // 跳转到登录页面
  navigateToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },
  
  // 跳转到缴纳保证金页面
  navigateToDeposit() {
    wx.navigateTo({
      url: `/pages/deposit/deposit?itemId=${this.data.itemId}&amount=${this.data.auctionItem.deposit_amount}`
    });
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
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期时间
  formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
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
  }
});