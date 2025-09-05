// my-bids.js
const app = getApp();

Page({
  data: {
    bids: [],
    activeTab: 'all', // all, ongoing, won, lost
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onShow() {
    // 每次显示页面都重新加载数据
    this.setData({
      bids: [],
      page: 1,
      hasMore: true
    });
    this.loadMyBids();
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      bids: [],
      page: 1,
      hasMore: true
    });
    this.loadMyBids();
  },

  // 加载我的竞拍记录
  loadMyBids() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    let filters = {};
    
    // 根据当前标签页设置过滤条件
    switch (this.data.activeTab) {
      case 'ongoing':
        filters.status = 'in_progress';
        break;
      case 'won':
        filters.status = 'ended';
        filters.is_winner = true;
        break;
      case 'lost':
        filters.status = 'ended';
        filters.is_winner = false;
        break;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/user-bids/`,
      data: {
        page: this.data.page,
        page_size: this.data.pageSize,
        ...filters
      },
      success: (res) => {
        const newBids = res.results || [];
        
        // 对每条竞拍记录预先计算状态信息
        const processedBids = newBids.map(item => {
          if (item.auction_item) {
            // 处理拍卖品数据
            const processedAuctionItem = {
              ...item.auction_item,
              display_image_url: item.auction_item.image_url || '/assets/images/default-item.png'
            };
            
            return {
              ...item,
              auction_item: processedAuctionItem,
              bid_status_text: this.getBidStatusText(item.auction_item.status, item.price, item.auction_item.current_price),
              bid_status_class: this.getBidStatusClass(item.auction_item.status, item.price, item.auction_item.current_price),
              is_highest: item.price >= item.auction_item.current_price,
              is_not_highest: item.price < item.auction_item.current_price
            };
          }
          return item;
        });
        
        // 预先计算标签页的活跃状态
        const activeTags = {
          all: this.data.activeTab === 'all' ? 'tag-active' : '',
          ongoing: this.data.activeTab === 'ongoing' ? 'tag-active' : '',
          won: this.data.activeTab === 'won' ? 'tag-active' : '',
          lost: this.data.activeTab === 'lost' ? 'tag-active' : ''
        };
        
        const hasMore = newBids.length === this.data.pageSize;
        
        this.setData({
          bids: [...this.data.bids, ...processedBids],
          activeTags: activeTags,
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false
        });
      },
      fail: () => {
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
    this.loadMyBids();
  },

  // 跳转到拍卖详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/auction-detail/auction-detail?id=${id}`
    });
  },

  // 获取竞拍状态文本
  getBidStatusText(auctionStatus, myPrice, currentPrice) {
    if (auctionStatus === 'in_progress') {
      return myPrice >= currentPrice ? '领先' : '落后';
    } else if (auctionStatus === 'ended') {
      return myPrice >= currentPrice ? '已中标' : '未中标';
    }
    return '未知状态';
  },

  // 获取竞拍状态样式
  getBidStatusClass(auctionStatus, myPrice, currentPrice) {
    if (auctionStatus === 'in_progress') {
      return myPrice >= currentPrice ? 'tag-active' : 'tag-default';
    } else if (auctionStatus === 'ended') {
      return myPrice >= currentPrice ? 'tag-success' : 'tag-ended';
    }
    return '';
  }
});