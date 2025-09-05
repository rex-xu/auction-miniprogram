// article-detail.js
const app = getApp();

Page({
  data: {
    article: null,
    relatedArticles: [],
    isFavorite: false,
    loading: true
  },

  onLoad(options) {
    // 获取文章ID
    this.articleId = options.id;
    // 加载文章详情
    this.loadArticleDetail();
    // 加载相关推荐
    this.loadRelatedArticles();
    // 检查是否已收藏
    this.checkFavoriteStatus();
  },

  // 加载文章详情
  loadArticleDetail() {
    this.setData({ loading: true });
    
    app.request({
      url: `${app.globalData.baseUrl}/articles/${this.articleId}/`,
      method: 'GET',
      success: (res) => {
        // 增加阅读量
        this.increaseViewCount();
        
        this.setData({
          article: res,
          loading: false
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 增加阅读量
  increaseViewCount() {
    app.request({
      url: `${app.globalData.baseUrl}/articles/${this.articleId}/increase_views/`,
      method: 'POST',
      success: () => {
        console.log('阅读量增加成功');
      },
      fail: () => {
        console.log('阅读量增加失败');
      }
    });
  },

  // 加载相关推荐
  loadRelatedArticles() {
    app.request({
      url: `${app.globalData.baseUrl}/articles/related/`,
      method: 'GET',
      data: {
        article_id: this.articleId,
        limit: 5
      },
      success: (res) => {
        this.setData({
          relatedArticles: res.results || []
        });
      },
      fail: () => {
        console.log('加载相关推荐失败');
      }
    });
  },

  // 检查是否已收藏
  checkFavoriteStatus() {
    app.request({
      url: `${app.globalData.baseUrl}/favorites/check/`,
      method: 'GET',
      data: {
        type: 'article',
        target_id: this.articleId
      },
      success: (res) => {
        this.setData({
          isFavorite: res.is_favorite
        });
      },
      fail: () => {
        console.log('检查收藏状态失败');
      }
    });
  },

  // 切换收藏状态
  toggleFavorite() {
    if (this.data.isFavorite) {
      // 取消收藏
      this.unfavoriteArticle();
    } else {
      // 添加收藏
      this.favoriteArticle();
    }
  },

  // 添加收藏
  favoriteArticle() {
    app.request({
      url: `${app.globalData.baseUrl}/favorites/`,
      method: 'POST',
      data: {
        type: 'article',
        target_id: this.articleId
      },
      success: () => {
        this.setData({ isFavorite: true });
        wx.showToast({
          title: '收藏成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '收藏失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 取消收藏
  unfavoriteArticle() {
    // 先获取收藏ID
    app.request({
      url: `${app.globalData.baseUrl}/favorites/check/`,
      method: 'GET',
      data: {
        type: 'article',
        target_id: this.articleId
      },
      success: (res) => {
        if (res.favorite_id) {
          // 删除收藏
          app.request({
            url: `${app.globalData.baseUrl}/favorites/${res.favorite_id}/`,
            method: 'DELETE',
            success: () => {
              this.setData({ isFavorite: false });
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
      },
      fail: () => {
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 分享文章
  shareArticle() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 举报文章
  reportArticle() {
    wx.showModal({
      title: '举报',
      content: '确认要举报这篇文章吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `${app.globalData.baseUrl}/articles/${this.articleId}/report/`,
            method: 'POST',
            success: () => {
              wx.showToast({
                title: '举报已提交',
                icon: 'success'
              });
            },
            fail: () => {
              wx.showToast({
                title: '举报失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 查看相关文章
  viewRelatedArticle(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    });
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

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: this.data.article?.title || '拍卖藏品资讯',
      query: `id=${this.articleId}`
    };
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: this.data.article?.title || '拍卖藏品资讯',
      path: `/pages/article-detail/article-detail?id=${this.articleId}`,
      imageUrl: this.data.article?.cover_image || ''
    };
  }
});