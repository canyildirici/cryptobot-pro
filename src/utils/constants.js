export const COINS = [
  { sym: 'BTC',  name: 'Bitcoin',  emoji: '₿',  basePrice: 65000, change: 2.3  },
  { sym: 'ETH',  name: 'Ethereum', emoji: '⟠',  basePrice: 3200,  change: 1.8  },
  { sym: 'SOL',  name: 'Solana',   emoji: '◎',  basePrice: 180,   change: 4.2  },
  { sym: 'BNB',  name: 'BNB',      emoji: '🔶', basePrice: 580,   change: -0.5 },
  { sym: 'XRP',  name: 'XRP',      emoji: '◈',  basePrice: 0.62,  change: 3.1  },
  { sym: 'ADA',  name: 'Cardano',  emoji: '🔵', basePrice: 0.45,  change: -1.2 },
  { sym: 'AVAX', name: 'Avalanche',emoji: '🔺', basePrice: 38,    change: 5.7  },
  { sym: 'DOT',  name: 'Polkadot', emoji: '⬤',  basePrice: 8.5,   change: -2.1 },
  { sym: 'LINK', name: 'Chainlink',emoji: '⬡',  basePrice: 18,    change: 3.4  },
  { sym: 'DOGE', name: 'Dogecoin', emoji: '🐕', basePrice: 0.12,  change: 6.8  },
];

export const BOTS = [
  {
    id:          'trend',
    name:        'TrendFollower Pro',
    description: 'EMA cross + trend takibi stratejisi',
    successRate: 78,
    color:       '#0ecb81',
    risk:        'Orta',
    style:       'Swing',
  },
  {
    id:          'rsi',
    name:        'RSI Scalper',
    description: 'RSI aşırı bölge + momentum stratejisi',
    successRate: 71,
    color:       '#1890ff',
    risk:        'Düşük',
    style:       'Scalp',
  },
  {
    id:          'bb',
    name:        'Bollinger Breakout',
    description: 'Bollinger band kırılım stratejisi',
    successRate: 74,
    color:       '#ffaa00',
    risk:        'Orta',
    style:       'Breakout',
  },
  {
    id:          'hybrid',
    name:        'Hybrid AI Bot',
    description: 'Tüm indikatörleri birleştiren AI sistemi',
    successRate: 85,
    color:       '#f0b90b',
    risk:        'Yüksek',
    style:       'Multi',
  },
];

export const TIMEFRAMES = [
  { label: '1d',  value: '1d'  },
  { label: '4s',  value: '4h'  },
  { label: '1s',  value: '1h'  },
  { label: '15d', value: '15m' },
  { label: '5d',  value: '5m'  },
];