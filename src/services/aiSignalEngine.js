// ─── AI SINYAL ENGİNE v2 ──────────────────────────────────────────────────
// Gelişmiş çoklu indikatör + ağırlıklı skor + güven filtresi

import { calcRSI, calcEMA, calcMACD, calcBollinger, calcStochRSI, calcATR } from './cryptoService';

function calcTrendStrength(prices) {
  if (prices.length < 20) return 0;
  const last20  = prices.slice(-20);
  const avg1    = last20.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const avg2    = last20.slice(10).reduce((a, b) => a + b, 0) / 10;
  return parseFloat(((avg2 - avg1) / avg1 * 100).toFixed(3));
}

function calcMomentum(prices, period = 10) {
  if (prices.length < period) return 0;
  const current = prices[prices.length - 1];
  const past    = prices[prices.length - period];
  return parseFloat(((current - past) / past * 100).toFixed(3));
}

function calcPriceVsEMA(prices, period) {
  const ema   = calcEMA(prices, Math.min(period, prices.length));
  const price = prices[prices.length - 1];
  return parseFloat(((price - ema) / ema * 100).toFixed(3));
}

function detectPattern(prices) {
  if (prices.length < 5) return { name: 'Yok', score: 0 };
  const [p1, p2, p3, p4, p5] = prices.slice(-5);

  if (p1 > p2 && p2 < p3 && p3 > p4 && p4 < p5 && Math.abs(p2 - p4) / p2 < 0.02)
    return { name: 'Çift Dip 📊', score: 4, type: 'buy' };
  if (p1 < p2 && p2 > p3 && p3 < p4 && p4 > p5 && Math.abs(p2 - p4) / p2 < 0.02)
    return { name: 'Çift Zirve 📊', score: -4, type: 'sell' };
  if (p5 > p3 && p3 > p1 && Math.abs(p2 - p4) / p2 < 0.01)
    return { name: 'Yükselen Üçgen 📐', score: 3, type: 'buy' };
  if (p5 < p3 && p3 < p1 && Math.abs(p2 - p4) / p2 < 0.01)
    return { name: 'Alçalan Üçgen 📐', score: -3, type: 'sell' };
  if (p5 > p4 && p4 > p3 && p3 > p2 && p2 > p1)
    return { name: 'Güçlü Yükseliş 📈', score: 2, type: 'buy' };
  if (p5 < p4 && p4 < p3 && p3 < p2 && p2 < p1)
    return { name: 'Güçlü Düşüş 📉', score: -2, type: 'sell' };
  return { name: 'Belirsiz', score: 0 };
}

function checkBreakout(prices) {
  if (prices.length < 20) return { breakout: false, score: 0 };
  const recent     = prices.slice(-20);
  const high20     = Math.max(...recent.slice(0, 19));
  const low20      = Math.min(...recent.slice(0, 19));
  const lastPrice  = prices[prices.length - 1];
  const prevPrice  = prices[prices.length - 2];

  if (lastPrice > high20 && prevPrice <= high20)
    return { breakout: true, type: 'up',   score: 5, name: 'Direnç Kırıldı ⚡' };
  if (lastPrice < low20 && prevPrice >= low20)
    return { breakout: true, type: 'down', score: -5, name: 'Destek Kırıldı ⚡' };
  return { breakout: false, score: 0 };
}

function checkDivergence(prices) {
  if (prices.length < 30) return { score: 0 };
  const recentPrices = prices.slice(-30);
  const midIdx = 15;
  const price1 = recentPrices[midIdx];
  const price2 = recentPrices[recentPrices.length - 1];
  const rsi1   = calcRSI(recentPrices.slice(0, midIdx + 1));
  const rsi2   = calcRSI(recentPrices);

  if (price2 < price1 && rsi2 > rsi1 && rsi2 < 50)
    return { score: 4, name: 'Boğa Diverjansı 🔄', type: 'buy' };
  if (price2 > price1 && rsi2 < rsi1 && rsi2 > 50)
    return { score: -4, name: 'Ayı Diverjansı 🔄', type: 'sell' };
  return { score: 0 };
}

// ── Hacim Profili (fiyat tekrar sayısı) ───────────────────────────────────
function calcVolumeProfile(prices) {
  if (prices.length < 20) return { score: 0 };
  const last20   = prices.slice(-20);
  const current  = prices[prices.length - 1];
  const avg      = last20.reduce((a, b) => a + b, 0) / last20.length;
  const pct      = (current - avg) / avg * 100;

  if (pct < -3) return { score: 2, name: 'Fiyat ortalamanın altında — alım fırsatı' };
  if (pct > 3)  return { score: -2, name: 'Fiyat ortalamanın üstünde — dikkatli ol' };
  return { score: 0 };
}

// ── Konsolidasyon tespiti ──────────────────────────────────────────────────
function detectConsolidation(prices) {
  if (prices.length < 15) return false;
  const last15  = prices.slice(-15);
  const high    = Math.max(...last15);
  const low     = Math.min(...last15);
  const range   = (high - low) / low * 100;
  return range < 2; // %2'den az hareket = konsolidasyon
}

// ── Sinyal tutarlılık kontrolü ─────────────────────────────────────────────
function checkConsistency(scores) {
  // Birden fazla indikatör aynı yönü gösteriyorsa güven artar
  const positives = scores.filter(s => s > 0).length;
  const negatives = scores.filter(s => s < 0).length;
  const total     = scores.length;

  if (positives >= total * 0.7) return { bonus: 3, consistent: true, dir: 'buy' };
  if (negatives >= total * 0.7) return { bonus: 3, consistent: true, dir: 'sell' };
  if (positives >= total * 0.6) return { bonus: 1, consistent: true, dir: 'buy' };
  if (negatives >= total * 0.6) return { bonus: 1, consistent: true, dir: 'sell' };
  return { bonus: 0, consistent: false };
}

// ── ANA AI SİNYAL FONKSİYONU ──────────────────────────────────────────────
export function aiGenerateSignal(prices, botId = 'hybrid') {
  if (!prices || prices.length < 30) {
    return {
      type: 'BEKLE', icon: '⏸', cls: 'hold',
      score: 0, successRate: 50, reason: 'Yeterli veri yok',
      details: {}
    };
  }

  let score = 0;
  const signals    = [];
  const warns      = [];
  const indScores  = []; // Tutarlılık için bireysel skorlar

  // 1. RSI
  const rsi = calcRSI(prices);
  let rsiScore = 0;
  if      (rsi <= 20) rsiScore = 6;
  else if (rsi <= 30) rsiScore = 4;
  else if (rsi <= 40) rsiScore = 2;
  else if (rsi >= 80) rsiScore = -6;
  else if (rsi >= 70) rsiScore = -4;
  else if (rsi >= 60) rsiScore = -2;
  score += rsiScore;
  indScores.push(rsiScore);
  if (rsiScore > 0) signals.push(`✅ RSI: ${rsi} — satım bölgesi`);
  if (rsiScore < 0) warns.push(`⚠️ RSI: ${rsi} — alım bölgesi`);

  // 2. Stochastic RSI
  const stochRSI = calcStochRSI(prices);
  let stochScore = 0;
  if      (stochRSI <= 15) stochScore = 4;
  else if (stochRSI <= 25) stochScore = 2;
  else if (stochRSI >= 85) stochScore = -4;
  else if (stochRSI >= 75) stochScore = -2;
  score += stochScore;
  indScores.push(stochScore);
  if (stochScore > 0) signals.push(`✅ StochRSI: ${stochRSI} — aşırı satım`);
  if (stochScore < 0) warns.push(`⚠️ StochRSI: ${stochRSI} — aşırı alım`);

  // 3. MACD
  const macd = calcMACD(prices);
  let macdScore = 0;
  if      (macd > 200)  macdScore = 5;
  else if (macd > 50)   macdScore = 3;
  else if (macd > 0)    macdScore = 1;
  else if (macd < -200) macdScore = -5;
  else if (macd < -50)  macdScore = -3;
  else if (macd < 0)    macdScore = -1;
  score += macdScore;
  indScores.push(macdScore);
  if (macdScore > 0) signals.push(`✅ MACD: +${macd} pozitif`);
  if (macdScore < 0) warns.push(`⚠️ MACD: ${macd} negatif`);

  // 4. EMA Cross
  const ema20  = calcEMA(prices, Math.min(20, prices.length));
  const ema50  = calcEMA(prices, Math.min(50, prices.length));
  const ema200 = calcEMA(prices, Math.min(200, prices.length));
  let emaScore = 0;
  if      (ema20 > ema50 && ema50 > ema200) emaScore = 4;
  else if (ema20 > ema50)                   emaScore = 2;
  else if (ema20 < ema50 && ema50 < ema200) emaScore = -4;
  else if (ema20 < ema50)                   emaScore = -2;
  score += emaScore;
  indScores.push(emaScore);
  if (emaScore > 0) signals.push('✅ EMA dizilimi yükseliş trendi gösteriyor');
  if (emaScore < 0) warns.push('⚠️ EMA dizilimi düşüş trendi gösteriyor');

  // 5. Bollinger Bands
  const bbPos = calcBollinger(prices);
  let bbScore = 0;
  if      (bbPos <= 5)  bbScore = 5;
  else if (bbPos <= 20) bbScore = 3;
  else if (bbPos <= 35) bbScore = 1;
  else if (bbPos >= 95) bbScore = -5;
  else if (bbPos >= 80) bbScore = -3;
  else if (bbPos >= 65) bbScore = -1;
  score += bbScore;
  indScores.push(bbScore);
  if (bbScore > 0) signals.push(`✅ Bollinger alt bant yakını (%${bbPos})`);
  if (bbScore < 0) warns.push(`⚠️ Bollinger üst bant yakını (%${bbPos})`);

  // 6. Trend gücü
  const trendStrength = calcTrendStrength(prices);
  let trendScore = 0;
  if      (trendStrength > 2)    trendScore = 3;
  else if (trendStrength > 0.5)  trendScore = 1;
  else if (trendStrength < -2)   trendScore = -3;
  else if (trendStrength < -0.5) trendScore = -1;
  score += trendScore;
  indScores.push(trendScore);

  // 7. Momentum
  const momentum = calcMomentum(prices);
  let momScore = 0;
  if      (momentum > 3)  momScore = 2;
  else if (momentum > 1)  momScore = 1;
  else if (momentum < -3) momScore = -2;
  else if (momentum < -1) momScore = -1;
  score += momScore;
  indScores.push(momScore);

  // 8. Fiyat paterni
  const pattern = detectPattern(prices);
  score += pattern.score;
  indScores.push(pattern.score);
  if (pattern.score > 0) signals.push(`✅ Patern: ${pattern.name}`);
  if (pattern.score < 0) warns.push(`⚠️ Patern: ${pattern.name}`);

  // 9. Kırılım
  const breakout = checkBreakout(prices);
  score += breakout.score;
  indScores.push(breakout.score);
  if (breakout.score > 0) signals.push(`✅ ${breakout.name}`);
  if (breakout.score < 0) warns.push(`⚠️ ${breakout.name}`);

  // 10. RSI Diverjansı
  const divergence = checkDivergence(prices);
  score += divergence.score;
  indScores.push(divergence.score);
  if (divergence.score > 0) signals.push(`✅ ${divergence.name}`);
  if (divergence.score < 0) warns.push(`⚠️ ${divergence.name}`);

  // 11. Hacim profili
  const volProfile = calcVolumeProfile(prices);
  score += volProfile.score;
  indScores.push(volProfile.score);

  // 12. Fiyat vs EMA50
  const priceVsEMA50 = calcPriceVsEMA(prices, 50);
  let emaPos = 0;
  if (priceVsEMA50 > 0 && priceVsEMA50 < 3)  emaPos = 1;
  if (priceVsEMA50 < 0 && priceVsEMA50 > -3) emaPos = -1;
  score += emaPos;
  indScores.push(emaPos);

  // 13. Konsolidasyon — belirsiz piyasada bekle
  const isConsolidating = detectConsolidation(prices);
  if (isConsolidating && Math.abs(score) < 8) {
    score = Math.round(score * 0.6); // Skoru zayıflat
    warns.push('⚠️ Piyasa konsolide — düşük güven');
  }

  // 14. Tutarlılık bonusu
  const consistency = checkConsistency(indScores);
  if (consistency.consistent) {
    score += consistency.bonus;
    signals.push(`✅ İndikatörler tutarlı — güven artırıldı (+${consistency.bonus})`);
  }

  // 15. Bot bonusu
  const botBonus = { trend: 2, rsi: 2, bb: 2, hybrid: 3 };
  score += (botBonus[botId] || 0);

  // ── Başarı oranı hesaplama ─────────────────────────────────────────────
  const absScore      = Math.abs(score);
  const consistBonus  = consistency.consistent ? 5 : 0;
  const hybridBonus   = botId === 'hybrid' ? 3 : 0;
  const convBonus     = isConsolidating ? -5 : 0;

  // Temel başarı oranı: güçlü sinyaller daha güvenilir
  let successRate = 55 + absScore * 1.8 + consistBonus + hybridBonus + convBonus;

  // Kırılım ve diverjans varsa ekstra güven
  if (breakout.score !== 0) successRate += 3;
  if (divergence.score !== 0) successRate += 3;

  // Sınırla: minimum 55, maksimum 91
  successRate = Math.min(91, Math.max(55, successRate));

  // ── Sinyal belirleme ───────────────────────────────────────────────────
  let type, icon, cls;
  if      (score >= 18) { type = 'GÜÇLÜ AL';  icon = '🚀'; cls = 'buy';  }
  else if (score >= 12) { type = 'AL';         icon = '📈'; cls = 'buy';  }
  else if (score >= 6)  { type = 'ZAYIF AL';   icon = '🔼'; cls = 'buy';  }
  else if (score <= -18){ type = 'GÜÇLÜ SAT';  icon = '🔻'; cls = 'sell'; }
  else if (score <= -12){ type = 'SAT';         icon = '📉'; cls = 'sell'; }
  else if (score <= -6) { type = 'ZAYIF SAT';   icon = '🔽'; cls = 'sell'; }
  else                  { type = 'BEKLE';       icon = '⏸';  cls = 'hold'; }

  return {
    type, icon, cls, score,
    successRate: Math.round(successRate),
    reason: [...signals, ...warns].join('\n'),
    details: {
      rsi, stochRSI, macd, bbPos, trendStrength,
      momentum, pattern: pattern.name,
      breakout: breakout.name || 'Yok',
      divergence: divergence.name || 'Yok',
      ema20, ema50, ema200,
      consistent: consistency.consistent,
      consolidating: isConsolidating,
    }
  };
}