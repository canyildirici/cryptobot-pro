import { COINS } from '../utils/constants';

const BASE_URL = 'https://api.binance.com/api/v3';

function toBinanceSym(sym) {
  return sym.toUpperCase() + 'USDT';
}

export async function getAllPrices() {
  try {
    const symbols = COINS.map(c => `"${toBinanceSym(c.sym)}"`).join(',');
    const res = await fetch(`${BASE_URL}/ticker/price?symbols=[${symbols}]`);
    const data = await res.json();
    const prices = {};
    data.forEach(item => {
      const sym = item.symbol.replace('USDT', '');
      prices[sym] = parseFloat(item.price);
    });
    return prices;
  } catch (err) {
    console.error('Fiyat çekme hatası:', err);
    return {};
  }
}

export async function getCoinHistory(sym, timeframe = '1h') {
  try {
    const intervalMap = { '1h': '1m', '4h': '5m', '1d': '30m', '1w': '4h' };
    const countMap    = { '1h': 60,   '4h': 48,   '1d': 48,    '1w': 42   };
    const interval = intervalMap[timeframe] || '1m';
    const limit    = countMap[timeframe] || 60;
    const symbol   = toBinanceSym(sym);
    const res  = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await res.json();
    const prices = data.map(k => parseFloat(k[4]));
    const labels = data.map(k => {
      const d = new Date(k[0]);
      return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    });
    const volume = (parseFloat(data[data.length - 1][5]) / 1e6).toFixed(1) + 'M';
    return { prices, labels, volume };
  } catch (err) {
    console.error('Grafik verisi hatası:', err);
    return { prices: [], labels: [], volume: '—' };
  }
}

export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

export function calcEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return parseFloat(ema.toFixed(6));
}

export function calcMACD(prices) {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  return parseFloat((ema12 - ema26).toFixed(4));
}

export function calcBollinger(prices, period = 20) {
  if (prices.length < period) return 50;
  const slice = prices.slice(-period);
  const mean  = slice.reduce((a, b) => a + b, 0) / period;
  const std   = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const last  = prices[prices.length - 1];
  const pos   = ((last - lower) / (upper - lower)) * 100;
  return parseFloat(Math.min(100, Math.max(0, pos)).toFixed(1));
}

export function calcStochRSI(prices, period = 14) {
  if (prices.length < period * 2) return 50;
  const rsiValues = [];
  for (let i = period; i < prices.length; i++) {
    rsiValues.push(calcRSI(prices.slice(0, i + 1), period));
  }
  const lastRSI = rsiValues[rsiValues.length - 1];
  const minRSI  = Math.min(...rsiValues.slice(-period));
  const maxRSI  = Math.max(...rsiValues.slice(-period));
  if (maxRSI === minRSI) return 50;
  return parseFloat(((lastRSI - minRSI) / (maxRSI - minRSI) * 100).toFixed(2));
}

export function calcATR(prices, period = 14) {
  if (prices.length < period + 1) return 0;
  const trs = [];
  for (let i = 1; i < prices.length; i++) {
    trs.push(Math.abs(prices[i] - prices[i - 1]));
  }
  const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  return parseFloat(atr.toFixed(6));
}

export function calcSupportResistance(prices) {
  if (prices.length < 10) return { support: 0, resistance: 0 };
  const sorted     = [...prices].sort((a, b) => a - b);
  const support    = parseFloat(sorted[Math.floor(sorted.length * 0.1)].toFixed(6));
  const resistance = parseFloat(sorted[Math.floor(sorted.length * 0.9)].toFixed(6));
  return { support, resistance };
}

export async function getFearGreedIndex() {
  try {
    const res  = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await res.json();
    const val  = parseInt(data.data[0].value);
    const txt  = data.data[0].value_classification;
    return { value: val, label: txt };
  } catch {
    return { value: 50, label: 'Neutral' };
  }
}

export function findOrCreateCoin(query) {
  const q = query.trim().toUpperCase();
  const found = COINS.find(c => c.sym === q || c.name.toUpperCase().includes(q));
  if (found) return found;
  const newCoin = {
    sym: q.slice(0, 6),
    name: query,
    emoji: '🔮',
    basePrice: 0,
    change: 0,
  };
  COINS.push(newCoin);
  return newCoin;
}