export function formatPrice(n) {
  if (n >= 10000) return '$' + n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  if (n >= 1)     return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}

export function rnd(min, max) {
  return Math.random() * (max - min) + min;
}

export function generatePriceData(basePrice, count = 60) {
  const data = [];
  let price = basePrice * (1 + (Math.random() - 0.5) * 0.05);
  for (let i = 0; i < count; i++) {
    price *= 1 + (Math.random() - 0.495) * 0.018;
    data.push(parseFloat(price.toFixed(6)));
  }
  return data;
}

export function generateTimeLabels(count = 60, intervalMinutes = 60) {
  const labels = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now - i * intervalMinutes * 60000);
    labels.push(
      d.getHours().toString().padStart(2, '0') + ':' +
      d.getMinutes().toString().padStart(2, '0')
    );
  }
  return labels;
}

export function calculateIndicators(prices) {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 10] || last;
  return {
    rsi:      Math.round(rnd(22, 78)),
    macd:     parseFloat((last - prev).toFixed(2)),
    emaCross: Math.random() > 0.5,
    bbPos:    parseFloat(rnd(5, 95).toFixed(1)),
    volume:   rnd(100, 999).toFixed(0) + 'M',
  };
}

// ─── GÜÇLENDİRİLMİŞ SİNYAL ALGORİTMASI ─────────────────────────────────────
export function generateSignal(indicators, botId) {
  const { rsi, macd, emaCross, bbPos } = indicators;
  let score = 0;
  const reasons = [];
  const warnings = [];

  // RSI analizi (ağırlık: 3)
  if (rsi <= 25) {
    score += 3;
    reasons.push('RSI aşırı satım bölgesinde (' + rsi + ') — güçlü alım sinyali');
  } else if (rsi <= 35) {
    score += 2;
    reasons.push('RSI satım bölgesine yakın (' + rsi + ')');
  } else if (rsi <= 45) {
    score += 1;
    reasons.push('RSI nötr-düşük bölge (' + rsi + ')');
  } else if (rsi >= 75) {
    score -= 3;
    warnings.push('RSI aşırı alım bölgesinde (' + rsi + ') — güçlü satış sinyali');
  } else if (rsi >= 65) {
    score -= 2;
    warnings.push('RSI alım bölgesine yakın (' + rsi + ')');
  } else if (rsi >= 55) {
    score -= 1;
    warnings.push('RSI nötr-yüksek bölge (' + rsi + ')');
  }

  // MACD analizi (ağırlık: 3)
  if (macd > 0) {
    score += macd > 100 ? 3 : macd > 50 ? 2 : 1;
    reasons.push('MACD pozitif kesişim (' + (macd > 0 ? '+' : '') + macd + ')');
  } else {
    score += macd < -100 ? -3 : macd < -50 ? -2 : -1;
    warnings.push('MACD negatif bölgede (' + macd + ')');
  }

  // EMA Cross analizi (ağırlık: 2)
  if (emaCross) {
    score += 2;
    reasons.push('EMA 50 > EMA 200 — Golden Cross (yükseliş trendi)');
  } else {
    score -= 2;
    warnings.push('EMA 50 < EMA 200 — Death Cross (düşüş trendi)');
  }

  // Bollinger Bands analizi (ağırlık: 2)
  if (bbPos <= 10) {
    score += 2;
    reasons.push('Bollinger alt bandına dayandı (%' + bbPos + ') — dip bölgesi');
  } else if (bbPos <= 25) {
    score += 1;
    reasons.push('Bollinger alt banda yakın (%' + bbPos + ')');
  } else if (bbPos >= 90) {
    score -= 2;
    warnings.push('Bollinger üst bandına dayandı (%' + bbPos + ') — zirve bölgesi');
  } else if (bbPos >= 75) {
    score -= 1;
    warnings.push('Bollinger üst banda yakın (%' + bbPos + ')');
  }

  // Bot bonus
  const botBonus = { trend: 0, rsi: rsi < 40 ? 1 : -1, bb: bbPos < 30 ? 1 : 0, hybrid: 1 };
  score += (botBonus[botId] || 0);

  // Başarı oranı hesapla (skora göre)
  const absScore = Math.abs(score);
  const successRate = Math.min(92, Math.max(55,
    60 + absScore * 4 + (botId === 'hybrid' ? 3 : 0)
  ));

  // Sinyal üret
  let type, icon, cls;
  if (score >= 4) {
    type = 'AL'; icon = '🚀'; cls = 'buy';
  } else if (score >= 2) {
    type = 'ZAYIF AL'; icon = '📈'; cls = 'buy';
  } else if (score <= -4) {
    type = 'SAT'; icon = '🔻'; cls = 'sell';
  } else if (score <= -2) {
    type = 'ZAYIF SAT'; icon = '📉'; cls = 'sell';
  } else {
    type = 'BEKLE'; icon = '⏸'; cls = 'hold';
  }

  const reason = [
    ...reasons.map(r => '✅ ' + r),
    ...warnings.map(w => '⚠️ ' + w),
  ].join('\n');

  return { type, icon, cls, score, reason, successRate };
}