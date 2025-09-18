// favorite.js
const app = getApp();

Page({
  data: {
    activeTab: 'all', // all, auction, article
    favorites: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    isLoggedIn: false,
    activeTags: {
      all: 'active',
      auction: '',
      article: ''
    },
    defaultImagePaths: {
      auction: '/assets/images/default-item.png',
      article: '/assets/images/default-article.png'
    }
  },

  onShow() {
    console.log('收藏页面 onShow 被调用');
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    console.log('开始检查登录状态');
    const token = wx.getStorageSync('token');
    const isLoggedIn = !!token;
    
    console.log('登录状态：', isLoggedIn, 'token存在：', !!token);
    this.setData({ isLoggedIn });
    
    if (isLoggedIn) {
      // 已登录，加载数据
      console.log('用户已登录，准备加载收藏数据');
      this.resetData();
      this.loadFavorites();
    } else {
      // 未登录，重置加载状态
      console.log('用户未登录，显示登录提示');
      this.setData({ loading: false });
    }
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  // 重置数据
  resetData() {
    console.log('重置数据，当前activeTab：', this.data.activeTab);
    const activeTags = this.processActiveTags(this.data.activeTab);
    this.setData({
      favorites: [],
      page: 1,
      hasMore: true,
      activeTags: activeTags
    });
    console.log('数据重置完成，当前页码：', this.data.page);
  },

  // 处理激活标签状态
  processActiveTags(activeTab) {
    return {
      all: activeTab === 'all' ? 'active' : '',
      auction: activeTab === 'auction' ? 'active' : '',
      article: activeTab === 'article' ? 'active' : ''
    };
  },

  // 处理拍卖品图片URL
  processAuctionImageUrl(auctionItem) {
    if (!auctionItem) {
      return {
        display_image_url: '/assets/images/default-item.png',
        title: '未知拍卖品',
        description: '',
        current_price: 0,
        bid_count: 0
      };
    }
    return {
      ...auctionItem,
      display_image_url: auctionItem.image_url || '/assets/images/default-item.png'
    };
  },
  
  // 处理文章内容预览
  processArticlePreview(article) {
    if (!article) {
      return {
        title: '未知文章',
        cover_image: '/assets/images/default-article.png',
        content_preview: '暂无内容预览',
        category: { name: '其他' }
      };
    }
    
    // 移除HTML标签
    let plainText = article.content ? article.content.replace(/<[^>]*>/g, '') : '';
    
    // 限制内容预览长度
    if (plainText.length > 100) {
      plainText = plainText.substring(0, 100) + '...';
    }
    
    return {
      ...article,
      content_preview: plainText || '暂无内容预览',
      cover_image: article.cover_image || '/assets/images/default-article.png'
    };
  },

  // 获取拍卖品状态文本
  getStatusText(status) {
    const statusMap = {
      'ongoing': '进行中',
      'ended': '已结束',
      'upcoming': '即将开始'
    };
    return statusMap[status] || status;
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // 格式化日期时间
  formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },
  
  // 获取状态样式类名
  getStatusStyle(status) {
    const styleMap = {
      'ongoing': 'status-ongoing',
      'ended': 'status-ended',
      'upcoming': 'status-upcoming'
    };
    return styleMap[status] || '';
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换标签到：', tab);
    
    // 如果选择的是'article'标签，显示提示
    if (tab === 'article') {
      wx.showToast({
        title: '藏品资讯收藏功能尚未实现',
        icon: 'none',
        duration: 2000
      });
      // 不执行后续操作
      return;
    }
    
    const activeTags = this.processActiveTags(tab);
    this.setData({
      activeTab: tab,
      activeTags: activeTags
    });
    this.resetData();
    this.loadFavorites();
  },

  // 加载收藏列表
  loadFavorites() {
    if (this.data.loading || !this.data.hasMore) return;
    
    console.log('开始加载收藏列表，当前页码：', this.data.page);
    this.setData({ loading: true });
    
    const params = {
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 根据当前选中的标签设置过滤参数
    // 注意：由于后端UserFavorite模型目前只支持收藏拍卖品，
    // 这里只传递'auction'类型，或者在选择'all'时不传递类型参数
    if (this.data.activeTab !== 'all') {
      // 即使选择了'article'标签，也只查询'auction'类型，因为后端不支持文章收藏
      params.type = 'auction';
    }
    
    const url = `${app.globalData.baseUrl}/user-favorites`;
    console.log('准备发起收藏列表请求，URL:', url, '参数:', params);
    
    // 确保使用Promise方式处理请求
    app.request({
      url: url,
      method: 'GET',
      data: params,
      success: (res) => {
        console.log('收藏列表加载成功，返回数据：', res);
        const newFavorites = res.results || [];
        console.log('处理后的收藏数据数量：', newFavorites.length);
        
        // 对收藏的数据进行预处理
          const processedFavorites = newFavorites.map(item => {
            // 确保item有基本属性，并为所有收藏项设置默认type为'auction'
            // 添加错误处理，确保detailId始终有有效值
            const auctionItemInfo = item.auction_item_info || {};
            const safeItem = {
              ...item,
              detailId: auctionItemInfo.id || '', // 如果auction_item_info不存在或id为空，则使用空字符串
              id: item.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'auction'  // 为了兼容前端代码，所有收藏项都设置为auction类型
            };
            
            // 处理文章的格式化日期和内容预览
            if (item.type === 'article') {
              // 确保article对象存在
              const article = item.article || {};
              // 处理格式化日期
              const processedArticle = article.created_at ? {
                ...article,
                formatted_created_at: this.formatDate(article.created_at)
              } : article;
              
              // 处理内容预览
              const articleWithPreview = this.processArticlePreview(processedArticle);
              
              return {
                ...safeItem,
                article: articleWithPreview
              };
            }
            // 处理拍卖品的图片URL和状态文本
            else if (item.type === 'auction') {
              // 确保auction_item_info对象存在
              const auctionItemInfo = item.auction_item_info || {};
              // 预处理拍卖品状态文本
              const statusText = this.getStatusText(auctionItemInfo.status);
              
              // 格式化价格和时间
              const formattedStartTime = auctionItemInfo.start_time ? this.formatDateTime(auctionItemInfo.start_time) : '';
              const formattedEndTime = auctionItemInfo.end_time ? this.formatDateTime(auctionItemInfo.end_time) : '';
              // 确保价格值是数字类型后再调用toFixed()方法
              const formattedStartingPrice = auctionItemInfo.starting_price ? Number(auctionItemInfo.starting_price).toFixed(2) : '0.00';
              const formattedCurrentPrice = auctionItemInfo.current_price ? Number(auctionItemInfo.current_price).toFixed(2) : '0.00';
              const formattedIncrement = auctionItemInfo.price_increment ? Number(auctionItemInfo.price_increment).toFixed(2) : '0.00';
              
              return {
                ...safeItem,
                auction_item: {
                  ...this.processAuctionImageUrl(auctionItemInfo),
                  status_text: statusText,
                  formatted_start_time: formattedStartTime,
                  formatted_end_time: formattedEndTime,
                  formatted_starting_price: formattedStartingPrice,
                  formatted_current_price: formattedCurrentPrice,
                  formatted_increment: formattedIncrement,
                  status_style: this.getStatusStyle(auctionItemInfo.status)
                }
              };
            }
            // 处理其他类型或无效类型
            else {
              // 为未知类型创建默认的显示数据
              return {
                ...safeItem,
                type: item.type || 'unknown',
                display_title: '未知收藏项',
                display_image_url: this.data.defaultImagePaths.auction
              };
            }
          });
        
        const allFavorites = [...this.data.favorites, ...processedFavorites];
        
        this.setData({
          favorites: allFavorites,
          loading: false,
          hasMore: newFavorites.length === this.data.pageSize,
          page: this.data.page + 1
        });
      },
      fail: (err) => {
        console.error('收藏列表加载失败：', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        // 请求完成后的统一处理逻辑可以在这里添加
      }
    });
  },

  // 加载更多
  loadMore() {
    this.loadFavorites();
  },

  // 查看详情
  viewDetail(e) {
    // 从dataset中获取auctionId，这是拍卖品的实际ID
    // data-auction-id在小程序中会转换为auctionId
    const { type, auctionId } = e.currentTarget.dataset;
    
    // 使用auctionId作为详情ID
    const detailId = auctionId;
    
    // 检查detailId是否有效
    if (!detailId) {
      console.error('无效的详情ID');
      wx.showToast({
        title: '无法查看详情，ID无效',
        icon: 'none'
      });
      return;
    }
    
    if (type === 'auction') {
      wx.navigateTo({
        url: `/pages/auction-detail/auction-detail?id=${detailId}`
      });
    } else if (type === 'article') {
      wx.navigateTo({
        url: `/pages/article-detail/article-detail?id=${detailId}`
      });
    }
  },

  // 取消收藏
  unfavorite(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `${app.globalData.baseUrl}/user-favorites/${id}/`,
            method: 'DELETE',
            success: () => {
              // 从列表中移除该收藏项
              const updatedFavorites = this.data.favorites.filter(item => item.id !== id);
              this.setData({
                favorites: updatedFavorites
              });
              
              wx.showToast({
                title: '取消收藏成功',
                icon: 'success'
              });
            },
            fail: () => {
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡，避免触发viewDetail
  }
});