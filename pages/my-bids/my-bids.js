// my-bids.js
const app = getApp();

Page({
  data: {
    bids: [],
    activeTab: 'all', // all, ongoing, won, lost
    activeTags: {
      all: 'tag-active',
      ongoing: '',
      won: '',
      lost: ''
    },
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    isLoggedIn: false
  },

  onShow() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!token && !!userInfo;
    
    console.log('登录状态检查:', { token: !!token, userInfo: !!userInfo, isLoggedIn });
    
    this.setData({ isLoggedIn });
    
    if (isLoggedIn) {
      console.log('用户信息:', userInfo);
      // 确保全局用户信息已设置
      app.globalData.userInfo = userInfo;
      app.globalData.token = token;
      
      // 已登录，加载数据
      this.setData({
        bids: [],
        page: 1,
        hasMore: true
      });
      this.loadMyBids();
    } else {
      console.log('未登录，清空数据');
      this.setData({
        bids: [],
        loading: false
      });
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    // 更新标签页状态
    const activeTags = {
      all: tab === 'all' ? 'tag-active' : '',
      ongoing: tab === 'ongoing' ? 'tag-active' : '',
      won: tab === 'won' ? 'tag-active' : '',
      lost: tab === 'lost' ? 'tag-active' : ''
    };
    
    this.setData({
      activeTab: tab,
      activeTags: activeTags,
      bids: [],
      page: 1,
      hasMore: true
    });
    this.loadMyBids();
  },
  
  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },
  
  // 加载我的竞拍记录
  loadMyBids() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    let filters = {};
    
    // 确保用户信息存在
    if (!app.globalData.userInfo || !app.globalData.userInfo.id) {
      console.error('用户信息不存在或用户ID为空');
      this.setData({ loading: false });
      return;
    }
    
    // 根据当前标签页设置过滤条件
    if (this.data.activeTab === 'ongoing') {
      // 进行中标签：显示竞拍状态为winning且拍卖品状态为进行中的记录
      filters.status = 'winning';
    } else if (this.data.activeTab === 'lost') {
      // 未中标标签：显示竞拍状态为lost的记录
      filters.status = 'lost';
    } else if (this.data.activeTab === 'won') {
      // 中标标签：先在API请求时设置status=winning，然后在获取数据后根据拍卖品状态进一步过滤
      filters.status = 'winning';
    }
    // all标签页不添加额外过滤条件
    
    console.log('请求参数:', {
      url: `${app.globalData.baseUrl}/bid-records/`,
      data: {
        page: this.data.page,
        page_size: this.data.pageSize,
        bidder_id: app.globalData.userInfo.id,
        ...filters
      }
    });
    
    app.request({
      url: `${app.globalData.baseUrl}/bid-records/`,
      data: {
        page: this.data.page,
        page_size: this.data.pageSize,
        bidder_id: app.globalData.userInfo.id,
        ...filters
      },
      success: (res) => {
        console.log('API响应数据:', res);
        console.log('API响应类型:', typeof res);
        console.log('API响应是否为数组:', Array.isArray(res));
        
        // Django REST Framework默认会使用分页，数据在results字段中
        let newBids = [];
        if (res && res.results && Array.isArray(res.results)) {
          // 处理分页响应
          newBids = res.results;
        } else if (Array.isArray(res)) {
          // 处理非分页的数组响应
          newBids = res;
        } else if (res && res.data) {
          // 处理统一响应格式
          newBids = res.data;
        } else {
          // 其他情况，尝试作为单个对象处理
          newBids = [res];
        }
        console.log('处理前的竞拍记录:', newBids);
        
        // 确保newBids是数组
        if (!Array.isArray(newBids)) {
          newBids = [];
        }
        
        // 过滤掉无效的竞拍记录（确保至少有bid_amount和auction_item_info）
        newBids = newBids.filter(item => item && item.bid_amount !== undefined && item.auction_item_info !== undefined);
        
        console.log('过滤后的竞拍记录:', newBids);
        
        // 如果是'won'标签页，需要额外过滤：竞拍状态为winning且拍卖品状态为ended或successful
        if (this.data.activeTab === 'won') {
          newBids = newBids.filter(item => {
            const auctionStatus = item.auction_item_info && item.auction_item_info.status;
            return item.status === 'winning' && (auctionStatus === 'ended' || auctionStatus === 'successful');
          });
          console.log('已中标标签页过滤后的竞拍记录:', newBids);
        } 
        // 如果是'ongoing'标签页，需要额外过滤：竞拍状态为winning且拍卖品状态为进行中
        else if (this.data.activeTab === 'ongoing') {
          newBids = newBids.filter(item => {
            const auctionStatus = item.auction_item_info && item.auction_item_info.status;
            return item.status === 'winning' && auctionStatus === 'in_progress';
          });
          console.log('进行中标签页过滤后的竞拍记录:', newBids);
        }
        
        // 对每条竞拍记录预先计算状态信息
        const processedBids = newBids.map(item => {
          // 提取拍卖品信息
          const auctionItemInfo = item.auction_item_info || {};
          
          // 格式化竞拍状态文本
          let bidStatusText = '';
          let bidStatusClass = '';
          
          const auctionStatus = auctionItemInfo.status;
          if (item.status === 'winning') {
            // 判断拍卖品是否已结束
            if (auctionStatus === 'ended' || auctionStatus === 'successful' || auctionStatus === 'paid' || auctionStatus === 'shipped' || auctionStatus === 'completed') {
              bidStatusText = '已中标';
              bidStatusClass = 'status-won';
            } else {
              bidStatusText = '竞拍中';
              bidStatusClass = 'status-ongoing';
            }
          } else if (item.status === 'lost') {
            bidStatusText = '未中标';
            bidStatusClass = 'status-lost';
          }
          
          // 处理拍卖品数据
          const processedAuctionItem = {
            ...auctionItemInfo,
            display_image_url: app.getImageUrl(auctionItemInfo),
            id: (auctionItemInfo && auctionItemInfo.id) || '',
            title: (auctionItemInfo && auctionItemInfo.title) || '未知拍卖品',
            current_price: (auctionItemInfo && auctionItemInfo.current_price) || 0
          };
          
          // 更准确地计算是否是最高价
          // 1. 首先根据后端状态判断
          // 2. 然后通过比较出价和当前最高价做额外验证
          const myBidAmount = item.bid_amount || 0;
          const currentPrice = auctionItemInfo.current_price || 0;
          
          // 如果状态是winning，但出价低于当前最高价，则不是最高价
          const isHighest = item.status === 'winning' && myBidAmount >= currentPrice;
          const isNotHighest = item.status === 'lost' || (item.status === 'winning' && myBidAmount < currentPrice);
          
          return {
            ...item,
            auction_item: processedAuctionItem,
            price: item.bid_amount || 0, // 确保价格字段存在
            bid_status_text: bidStatusText,
            bid_status_class: bidStatusClass,
            is_highest: isHighest,
            is_not_highest: isNotHighest
          };
        });
        
        // 预先计算标签页的活跃状态
        const activeTags = {
          all: this.data.activeTab === 'all' ? 'tag-active' : '',
          ongoing: this.data.activeTab === 'ongoing' ? 'tag-active' : '',
          won: this.data.activeTab === 'won' ? 'tag-active' : '',
          lost: this.data.activeTab === 'lost' ? 'tag-active' : ''
        };
        
        console.log('处理后的竞拍记录:', processedBids);
        const hasMore = newBids.length === this.data.pageSize;
        
        this.setData({
          bids: [...this.data.bids, ...processedBids],
          activeTags: activeTags,
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false,
          totalCount: res.total_count || this.data.bids.length + processedBids.length
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '网络异常，请重试',
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