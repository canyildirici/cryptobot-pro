import { useState, useEffect } from 'react';
import { COINS, BOTS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './Signals.module.css';

export default function Signals({ prices, onSelectCoin }) {
  const [signals, setSignals]   = useState([]);
  const [filter, setFilter]     = useState('all');
  const [isScanning, setIsScanning] = useState(false);

  const scanMarket = () => {
    setIsScanning(true);
    setTimeout(() => {
      const newSignals = COINS.map(coin => {
        const rsi      = Math.round(Math.random() * 100);
        const macd     = (Math.random() - 0.48) * 200;
        const bbPos    = Math.random() * 100;
        const emaCross = Math.random() > 0.5;

        let score = 0;
        if (rsi < 35) score += 3; else if (rsi > 65) score -= 3;
        if (macd > 0) score += 2; else score -= 2;
        if (emaCross) score += 2; else score -= 2;
        if (bbPos < 25) score += 1; else if (bbPos > 75) score -= 1;

        let type, cls, strength;
        if (score >= 5)       { type = 'GÜÇLÜ AL';  cls = 'strongBuy';  strength = 95; }
        else if (score >= 3)  { type = 'AL';         cls = 'buy';        strength = 78; }
        else if (score >= 1)  { type = 'ZAYIF AL';   cls = 'weakBuy';   strength = 62; }
        else if (score <= -5) { type = 'GÜÇLÜ SAT'; cls = 'strongSell'; strength = 95; }
        else if (score <= -3) { type = 'SAT';        cls = 'sell';       strength = 78; }
        else if (score <= -1) { type = 'ZAYIF SAT';  cls = 'weakSell';  strength = 62; }
        else                  { type = 'BEKLE';      cls = 'hold';       strength = 50; }

        return {
          id:        coin.sym + Date.now(),
          sym:       coin.sym,
          name:      coin.name,
          emoji:     coin.emoji,
          price:     prices[coin.sym] || coin.basePrice,
          change:    coin.change,
          type,
          cls,
          strength,
          rsi:       rsi.toFixed(0),
          macd:      macd.toFixed(2),
          bbPos:     bbPos.toFixed(1),
          time:      new Date().toLocaleTimeString('tr-TR'),
        };
      });
      setSignals(newSignals);
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => { scanMarket(); }, []);

  const filtered = signals.filter(s => {
    if (filter === 'all')  return true;
    if (filter === 'buy')  return s.cls.includes('buy') || s.cls.includes('Buy');
    if (filter === 'sell') return s.cls.includes('sell') || s.cls.includes('Sell');
    if (filter === 'strong') return s.cls.includes('strong');
    return true;
  });

  const buyCount    = signals.filter(s => s.cls.includes('buy') || s.cls.includes('Buy')).length;
  const sellCount   = signals.filter(s => s.cls.includes('sell') || s.cls.includes('Sell')).length;
  const strongCount = signals.filter(s => s.cls.includes('strong')).length;

  return (
    <div className={styles.page}>
      {/* Başlık */}
      <div className={styles.header}>
        <div className={styles.title}>⚡ Sinyal Tarayıcı</div>
        <button
          className={`${styles.scanBtn} ${isScanning ? styles.scanning : ''}`}
          onClick={scanMarket}
          disabled={isScanning}
        >
          {isScanning ? '🔄 Taranıyor...' : '🔍 Piyasayı Tara'}
        </button>
      </div>

      {/* Özet kartlar */}
      <div className={styles.summaryGrid}>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(14,203,129,0.3)' }}>
          <div className={styles.sumLabel}>Al Sinyali</div>
          <div className={styles.sumValue} style={{ color: 'var(--green)' }}>{buyCount}</div>
        </div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(246,70,93,0.3)' }}>
          <div className={styles.sumLabel}>Sat Sinyali</div>
          <div className={styles.sumValue} style={{ color: 'var(--red)' }}>{sellCount}</div>
        </div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(240,185,11,0.3)' }}>
          <div className={styles.sumLabel}>Güçlü Sinyal</div>
          <div className={styles.sumValue} style={{ color: 'var(--accent)' }}>{strongCount}</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Piyasa Durumu</div>
          <div className={styles.sumValue} style={{ color: buyCount > sellCount ? 'var(--green)' : 'var(--red)', fontSize: '14px' }}>
            {buyCount > sellCount ? '📈 Yükseliş' : '📉 Düşüş'}
          </div>
        </div>
      </div>

      {/* Filtre butonları */}
      <div className={styles.filters}>
        {[
          { key: 'all',    label: 'Tümü' },
          { key: 'buy',    label: '🟢 Al' },
          { key: 'sell',   label: '🔴 Sat' },
          { key: 'strong', label: '⚡ Güçlü' },
        ].map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sinyal tablosu */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Coin</th>
              <th className={styles.th}>Fiyat</th>
              <th className={styles.th}>24s</th>
              <th className={styles.th}>Sinyal</th>
              <th className={styles.th}>Güç</th>
              <th className={styles.th}>RSI</th>
              <th className={styles.th}>MACD</th>
              <th className={styles.th}>Saat</th>
              <th className={styles.th}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sig => (
              <tr key={sig.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.coinCell}>
                    <span>{sig.emoji}</span>
                    <div>
                      <div className={styles.coinSym}>{sig.sym}</div>
                      <div className={styles.coinName}>{sig.name}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.price}>{formatPrice(sig.price)}</span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.change} ${sig.change >= 0 ? styles.up : styles.down}`}>
                    {sig.change >= 0 ? '+' : ''}{sig.change.toFixed(2)}%
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.sigBadge} ${styles[sig.cls]}`}>
                    {sig.type}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{
                        width: `${sig.strength}%`,
                        background: sig.cls.includes('buy') || sig.cls.includes('Buy')
                          ? 'var(--green)' : sig.cls.includes('sell') || sig.cls.includes('Sell')
                          ? 'var(--red)' : 'var(--accent)'
                      }}
                    />
                  </div>
                  <span className={styles.strengthNum}>{sig.strength}%</span>
                </td>
                <td className={styles.td}>
                  <span style={{ color: sig.rsi < 35 ? 'var(--green)' : sig.rsi > 65 ? 'var(--red)' : 'var(--text2)', fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                    {sig.rsi}
                  </span>
                </td>
                <td className={styles.td}>
                  <span style={{ color: sig.macd > 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                    {sig.macd > 0 ? '+' : ''}{sig.macd}
                  </span>
                </td>
                <td className={styles.td}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', color: 'var(--muted)' }}>
                    {sig.time}
                  </span>
                </td>
                <td className={styles.td}>
                  <button className={styles.tradeBtn} onClick={() => onSelectCoin(sig.sym)}>
                    Analiz Et
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}