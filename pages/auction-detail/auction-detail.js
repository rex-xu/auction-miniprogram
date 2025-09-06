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
    currentSwiperIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadAuctionDetail();
      this.loadBidHistory();
      
      // 设置定时器，实时更新倒计时
      this.timer = setInterval(() => {
        this.updateCountdown();
      }, 1000);
      
      // 只有登录后才检查保证金状态
      const app = getApp();
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

  // 加载拍卖详情 - 使用async/await语法优化异步请求处理
  async loadAuctionDetail() {
    try {
      const res = await app.request({
        url: `${app.globalData.baseUrl}/auction-items/${this.data.itemId}/`
      });
      
      // 后端返回的数据格式为 {code: 0, message: 'success', data: {...}}
      // 所以需要使用res.data作为auctionItem数据
      const auctionItemData = res.data;
      console.log("auctionItemData : ", auctionItemData);
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
    const app = getApp();
    const itemId = this.data.itemId;
    
    // 确保先将状态设置为未缴纳，避免初始状态显示错误
    this.setData({ hasPaidDeposit: false });
    
    console.log(`开始检查拍品 ${itemId} 的保证金状态`);
    
    // 只有登录用户才检查保证金状态
    if (app.globalData.token) {
      app.checkDeposit(itemId).then(hasPaid => {
        console.log(`拍品 ${itemId} 保证金状态检查结果: ${hasPaid ? '已缴纳' : '未缴纳'}`);
        this.setData({ hasPaidDeposit: hasPaid });
        
        // 如果未缴纳保证金，自动将canBid设置为false
        if (!hasPaid && this.data.canBid) {
          this.setData({ canBid: false });
          console.log('由于未缴纳保证金，已将出价权限设置为不可出价');
        }
        
        // 更新按钮文本
        this.updateButtonText();
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
      console.log('用户未登录，设置为未缴纳保证金状态并禁用出价功能');
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
    // 预处理图片URL - 单个主图
    let displayImageUrl = '/assets/images/default-item.png';
    
    // 预处理所有图片URL - 用于轮播图
    item.imageUrls = [];
    
    if (item.media && item.media.length > 0) {
      // 处理所有媒体文件，创建完整URL数组
      item.imageUrls = item.media.map(media => {
        let fileUrl = media.file_url;
        if (fileUrl && typeof fileUrl === 'string') {
          // 解码URL以检查原始格式
          const decodedUrl = decodeURIComponent(fileUrl);
          if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
            // 如果已经是完整URL，就直接使用它
            return decodedUrl;
          } else {
            // 否则使用全局host构建完整URL
            return `${app.globalData.host}${fileUrl}`;
          }
        }
        return '/assets/images/default-item.png';
      });
      
      // 优先找主要图片作为显示图
      const primaryMedia = item.media.find(media => media.is_primary === true);
      let fileUrl = '';
      if (primaryMedia) {
        fileUrl = primaryMedia.file_url;
      } else {
        // 否则使用第一张图片
        fileUrl = item.media[0].file_url;
      }
      
      // 处理主图URL
      if (fileUrl && typeof fileUrl === 'string') {
        // 解码URL以检查原始格式
        const decodedUrl = decodeURIComponent(fileUrl);
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          // 如果已经是完整URL，就直接使用它
          displayImageUrl = decodedUrl;
        } else {
          // 否则使用全局host构建完整URL
          displayImageUrl = `${app.globalData.host}${fileUrl}`;
        }
      }
    } else {
      // 如果没有媒体文件，添加默认图片到数组
      item.imageUrls = [displayImageUrl];
    }
    
    item.display_image_url = displayImageUrl;
    
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
  loadBidHistory() {
    app.request({
      url: `${app.globalData.baseUrl}/bid-records/`,
      data: {
        auction_item: this.data.itemId,
        ordering: '-created_at',
        page_size: 20
      },
      success: (res) => {
        // 确保使用正确的数据格式，后端返回的数据可能在res.data中
        const bidData = res.data || res;
        const bidHistory = bidData.results || [];
        
        // 预先计算每条出价记录的格式化时间和出价者昵称
        const processedBidHistory = bidHistory.map(record => ({
          ...record,
          formatted_created_at: this.formatDateTime(record.created_at),
          display_bidder_name: record.bidder?.nickname || '匿名用户'
        }));
        
        this.setData({ bidHistory: processedBidHistory });
      },
      fail: (error) => {
        console.error('加载出价历史失败:', error);
        wx.showToast({
          title: '加载出价历史失败',
          icon: 'none'
        });
        // 设置空数组，确保UI不会显示错误数据
        this.setData({ bidHistory: [] });
      },
      complete: () => {
        // 请求完成后的清理操作可以在这里添加
      }
    });
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