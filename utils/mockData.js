// utils/mockData.js

/**
 * 生成模拟拍卖数据
 */
const mockAuctionItems = [
  {
    id: 1,
    title: '精品青花瓷花瓶',
    description: '<p>清代乾隆年间精品青花瓷花瓶，保存完好，色泽鲜艳，纹理清晰。</p><p>尺寸：高42cm，口径18cm</p><p>起拍价：10,000元</p>',
    image_url: 'https://picsum.photos/seed/vase1/800/600',
    start_price: 10000.00,
    current_price: 15600.00,
    deposit_amount: 2000.00,
    bid_increment: 200.00,
    status: 'in_progress',
    start_time: '2023-10-10T10:00:00Z',
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后结束
    bid_count: 28,
    seller: {
      id: 101,
      nickname: '古董收藏家',
      avatar: 'https://picsum.photos/seed/user101/100/100'
    }
  },
  {
    id: 2,
    title: '限量版机械手表',
    description: '<p>瑞士制造，全自动机械机芯，精钢表壳，蓝宝石镜面。</p><p>全球限量500只，编号235/500</p>',
    image_url: 'https://picsum.photos/seed/watch1/800/600',
    start_price: 5000.00,
    current_price: 8900.00,
    deposit_amount: 1000.00,
    bid_increment: 100.00,
    status: 'in_progress',
    start_time: '2023-10-10T08:00:00Z',
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4小时后结束
    bid_count: 15,
    seller: {
      id: 102,
      nickname: '钟表爱好者',
      avatar: 'https://picsum.photos/seed/user102/100/100'
    }
  },
  {
    id: 3,
    title: '名家书画作品',
    description: '<p>当代著名画家张明作品《山水清音》，宣纸原作，尺寸：138×69cm。</p><p>附带画家本人签名证书，保真。</p>',
    image_url: 'https://picsum.photos/seed/painting1/800/600',
    start_price: 8000.00,
    current_price: 12300.00,
    deposit_amount: 1500.00,
    bid_increment: 300.00,
    status: 'upcoming',
    start_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12小时后开始
    end_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 36小时后结束
    bid_count: 0,
    seller: {
      id: 103,
      nickname: '艺术画廊',
      avatar: 'https://picsum.photos/seed/user103/100/100'
    }
  },
  {
    id: 4,
    title: '复古黑胶唱片机',
    description: '<p>1970年代经典款黑胶唱片机，功能完好，音质醇厚。</p><p>附赠5张经典黑胶唱片。</p>',
    image_url: 'https://picsum.photos/seed/player1/800/600',
    start_price: 3000.00,
    current_price: 4800.00,
    deposit_amount: 500.00,
    bid_increment: 100.00,
    status: 'in_progress',
    start_time: '2023-10-09T15:00:00Z',
    end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6小时后结束
    bid_count: 12,
    seller: {
      id: 104,
      nickname: '复古收藏家',
      avatar: 'https://picsum.photos/seed/user104/100/100'
    }
  },
  {
    id: 5,
    title: '和田玉手镯',
    description: '<p>新疆和田白玉手镯，质地细腻，温润光泽，内径58mm。</p><p>附带鉴定证书，天然无优化。</p>',
    image_url: 'https://picsum.photos/seed/bracelet1/800/600',
    start_price: 6000.00,
    current_price: 9200.00,
    deposit_amount: 1000.00,
    bid_increment: 200.00,
    status: 'in_progress',
    start_time: '2023-10-10T09:00:00Z',
    end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8小时后结束
    bid_count: 18,
    seller: {
      id: 105,
      nickname: '玉器世家',
      avatar: 'https://picsum.photos/seed/user105/100/100'
    }
  },
  {
    id: 20, // 特别添加ID为20的拍卖品，对应之前的测试
    title: '虽然活动社会.',
    description: '<p>这是一个测试拍卖品，用于演示系统功能。</p>',
    image_url: 'https://picsum.photos/seed/item20/800/600',
    start_price: 1000.00,
    current_price: 1500.00,
    deposit_amount: 300.00,
    bid_increment: 50.00,
    status: 'in_progress',
    start_time: '2023-10-08T10:00:00Z',
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后结束
    bid_count: 10,
    seller: {
      id: 120,
      nickname: '测试卖家',
      avatar: 'https://picsum.photos/seed/seller20/100/100'
    }
  }
];

/**
 * 生成模拟出价记录
 */
const mockBidHistory = {
  1: [
    { id: 101, price: 15600.00, created_at: '2023-10-10T14:30:00Z', bidder: { id: 201, nickname: '竞拍者A' } },
    { id: 102, price: 15400.00, created_at: '2023-10-10T14:25:00Z', bidder: { id: 202, nickname: '竞拍者B' } },
    { id: 103, price: 15200.00, created_at: '2023-10-10T14:20:00Z', bidder: { id: 201, nickname: '竞拍者A' } },
    { id: 104, price: 15000.00, created_at: '2023-10-10T14:15:00Z', bidder: { id: 203, nickname: '竞拍者C' } },
    { id: 105, price: 14800.00, created_at: '2023-10-10T14:10:00Z', bidder: { id: 202, nickname: '竞拍者B' } }
  ],
  2: [
    { id: 201, price: 8900.00, created_at: '2023-10-10T13:45:00Z', bidder: { id: 204, nickname: '竞拍者D' } },
    { id: 202, price: 8800.00, created_at: '2023-10-10T13:40:00Z', bidder: { id: 205, nickname: '竞拍者E' } },
    { id: 203, price: 8700.00, created_at: '2023-10-10T13:35:00Z', bidder: { id: 204, nickname: '竞拍者D' } }
  ],
  20: [
    { id: 2001, price: 1500.00, created_at: '2023-10-10T15:00:00Z', bidder: { id: 206, nickname: '竞拍者F' } },
    { id: 2002, price: 1450.00, created_at: '2023-10-10T14:55:00Z', bidder: { id: 207, nickname: '竞拍者G' } },
    { id: 2003, price: 1400.00, created_at: '2023-10-10T14:50:00Z', bidder: { id: 206, nickname: '竞拍者F' } }
  ]
};

/**
 * 获取模拟的拍卖列表
 */
function getMockAuctionItems(status = '') {
  if (!status) {
    return mockAuctionItems;
  }
  return mockAuctionItems.filter(item => item.status === status);
}

/**
 * 获取模拟的拍卖详情
 */
function getMockAuctionDetail(id) {
  const item = mockAuctionItems.find(item => item.id === parseInt(id));
  if (item) {
    const now = Date.now();
    const endTime = new Date(item.end_time).getTime();
    item.remaining_time = Math.max(0, endTime - now);
    return item;
  }
  return null;
}

/**
 * 获取模拟的出价历史
 */
function getMockBidHistory(itemId) {
  return mockBidHistory[itemId] || [];
}

/**
 * 模拟用户信息
 */
const mockUserInfo = {
  id: 1,
  nickname: '测试用户',
  phone: '13800138000',
  avatar: 'https://picsum.photos/seed/user1/100/100'
};

module.exports = {
  mockAuctionItems,
  mockBidHistory,
  mockUserInfo,
  getMockAuctionItems,
  getMockAuctionDetail,
  getMockBidHistory
};