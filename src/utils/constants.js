export const COINS = [
  // Büyük Coinler
  { sym: 'BTC',   name: 'Bitcoin',       emoji: '₿',  basePrice: 65000,  change: 2.3  },
  { sym: 'ETH',   name: 'Ethereum',      emoji: '⟠',  basePrice: 3200,   change: 1.8  },
  { sym: 'BNB',   name: 'BNB',           emoji: '🔶', basePrice: 580,    change: -0.5 },
  { sym: 'SOL',   name: 'Solana',        emoji: '◎',  basePrice: 180,    change: 4.2  },
  { sym: 'XRP',   name: 'XRP',           emoji: '◈',  basePrice: 0.62,   change: 3.1  },

  // Orta Kapitalizasyon
  { sym: 'ADA',   name: 'Cardano',       emoji: '🔵', basePrice: 0.45,   change: -1.2 },
  { sym: 'AVAX',  name: 'Avalanche',     emoji: '🔺', basePrice: 38,     change: 5.7  },
  { sym: 'DOT',   name: 'Polkadot',      emoji: '⬤',  basePrice: 8.5,    change: -2.1 },
  { sym: 'LINK',  name: 'Chainlink',     emoji: '⬡',  basePrice: 18,     change: 3.4  },
  { sym: 'DOGE',  name: 'Dogecoin',      emoji: '🐕', basePrice: 0.12,   change: 6.8  },
  { sym: 'MATIC', name: 'Polygon',       emoji: '🟣', basePrice: 0.85,   change: 2.1  },
  { sym: 'UNI',   name: 'Uniswap',       emoji: '🦄', basePrice: 10,     change: -1.5 },
  { sym: 'ATOM',  name: 'Cosmos',        emoji: '⚛',  basePrice: 9,      change: 3.2  },
  { sym: 'LTC',   name: 'Litecoin',      emoji: 'Ł',  basePrice: 85,     change: 1.1  },
  { sym: 'BCH',   name: 'Bitcoin Cash',  emoji: '₿',  basePrice: 480,    change: -0.8 },

  // DeFi & Layer2
  { sym: 'ARB',   name: 'Arbitrum',      emoji: '🔷', basePrice: 1.2,    change: 4.5  },
  { sym: 'OP',    name: 'Optimism',      emoji: '🔴', basePrice: 2.8,    change: 3.1  },
  { sym: 'AAVE',  name: 'Aave',          emoji: '👻', basePrice: 120,    change: 2.7  },
  { sym: 'MKR',   name: 'Maker',         emoji: '🏦', basePrice: 2200,   change: -1.3 },
  { sym: 'SNX',   name: 'Synthetix',     emoji: '⚗',  basePrice: 3.5,    change: 1.9  },

  // Alternatif Coinler
  { sym: 'NEAR',  name: 'NEAR Protocol', emoji: '🌐', basePrice: 5.5,    change: 6.2  },
  { sym: 'FTM',   name: 'Fantom',        emoji: '👁', basePrice: 0.75,   change: 7.1  },
  { sym: 'ALGO',  name: 'Algorand',      emoji: '△',  basePrice: 0.18,   change: -0.9 },
  { sym: 'VET',   name: 'VeChain',       emoji: '✓',  basePrice: 0.04,   change: 2.4  },
  { sym: 'ICP',   name: 'Internet Comp', emoji: '∞',  basePrice: 12,     change: 3.8  },

  // Meme & Popüler
  { sym: 'SHIB',  name: 'Shiba Inu',     emoji: '🐶', basePrice: 0.000025, change: 8.5 },
  { sym: 'PEPE',  name: 'Pepe',          emoji: '🐸', basePrice: 0.000012, change: 12.3},
  { sym: 'FLOKI', name: 'Floki',         emoji: '🐕', basePrice: 0.00018,  change: 5.6 },

  // Yeni Trendler
  { sym: 'INJ',   name: 'Injective',     emoji: '💉', basePrice: 28,     change: 9.2  },
  { sym: 'SUI',   name: 'Sui',           emoji: '💧', basePrice: 1.8,    change: 11.4 },
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
  { label: '1g',  value: '1d'  },
  { label: '4s',  value: '4h'  },
  { label: '1s',  value: '1h'  },
  { label: '15d', value: '15m' },
  { label: '5d',  value: '5m'  },
];