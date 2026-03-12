import { useState } from 'react';
import { COINS, BOTS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import { getCoinHistory } from '../services/cryptoService';
import { aiGenerateSignal } from '../services/aiSignalEngine';
import styles from './Backtest.module.css';

export default function Backtest() {
  const [sym,        setSym]        = useState('BTC');
  const [botId,      setBotId]      = useState('hybrid');
  const [leverage,   setLeverage]   = useState(1);
  const [margin,     setMargin]     = useState(1000);
  const [slPct,      setSlPct]      = useState(3);
  const [tpPct,      setTpPct]      = useState(6);
  const [isRunning,  setIsRunning]  = useState(false);
  const [result,     setResult]     = useState(null);

  const runBacktest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const history = await getCoinHistory(sym, '1h');
      const prices  = history.prices;

      let balance     = 10000;
      const startBal  = 10000;
      const trades    = [];
      let   wins = 0, losses = 0;
      let   maxDrawdown = 0;
      let   peakBalance = 10000;

      // Her 10 mumu bir pencere olarak analiz et
      for (let i = 30; i < prices.length - 1; i++) {
        const window = prices.slice(0, i + 1);
        const sig    = aiGenerateSignal(window, botId);

        if (sig.cls === 'hold') continue;
        if (sig.successRate < 60) continue;

        const entryPrice = prices[i];
        const isLong     = sig.cls === 'buy';

        // SL/TP fiyatları
        const slPrice = isLong
          ? entryPrice * (1 - slPct / 100)
          : entryPrice * (1 + slPct / 100);
        const tpPrice = isLong
          ? entryPrice * (1 + tpPct / 100)
          : entryPrice * (1 - tpPct / 100);

        // Sonraki fiyatları kontrol et
        let exitPrice = prices[Math.min(i + 10, prices.length - 1)];
        let reason    = 'Zaman Aşımı';

        for (let j = i + 1; j < Math.min(i + 20, prices.length); j++) {
          const p = prices[j];
          if (isLong) {
            if (p <= slPrice) { exitPrice = slPrice; reason = 'Stop-Loss'; break; }
            if (p >= tpPrice) { exitPrice = tpPrice; reason = 'Take-Profit'; break; }
          } else {
            if (p >= slPrice) { exitPrice = slPrice; reason = 'Stop-Loss'; break; }
            if (p <= tpPrice) { exitPrice = tpPrice; reason = 'Take-Profit'; break; }
          }
        }

        const diff = isLong
          ? (exitPrice - entryPrice) / entryPrice
          : (entryPrice - exitPrice) / entryPrice;

        const tradeMargin = Math.min(margin, balance * 0.1);
        const pnl         = parseFloat((tradeMargin * leverage * diff).toFixed(2));

        balance += pnl;
        if (balance > peakBalance) peakBalance = balance;
        const drawdown = (peakBalance - balance) / peakBalance * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        if (pnl > 0) wins++; else losses++;

        trades.push({
          id:          trades.length + 1,
          type:        isLong ? 'LONG' : 'SHORT',
          entryPrice,
          exitPrice,
          pnl,
          reason,
          signal:      sig.type,
          successRate: sig.successRate,
          balance:     parseFloat(balance.toFixed(2)),
        });

        if (balance <= 0) break;
        i += 9; // Pencereyi ilerlet
      }

      const totalReturn   = ((balance - startBal) / startBal * 100).toFixed(2);
      const winRate       = trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : 0;
      const avgPnl        = trades.length > 0 ? (trades.reduce((a, t) => a + t.pnl, 0) / trades.length).toFixed(2) : 0;
      const profitFactor  = losses > 0
        ? (trades.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) /
           Math.abs(trades.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0))).toFixed(2)
        : '∞';

      setResult({
        trades,
        finalBalance: parseFloat(balance.toFixed(2)),
        totalReturn,
        wins, losses,
        winRate,
        avgPnl,
        maxDrawdown:  maxDrawdown.toFixed(2),
        profitFactor,
        totalTrades:  trades.length,
      });

    } catch (e) {
      console.error('Backtest hatası:', e);
    }

    setIsRunning(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>📊 Backtesting — Geçmiş Veri Testi</div>
        <div className={styles.warning}>⚠️ Geçmiş performans gelecek sonuçları garanti etmez</div>
      </div>

      {/* Ayarlar */}
      <div className={styles.settingsCard}>
        <div className={styles.settingsTitle}>Test Parametreleri</div>
        <div className={styles.settingsGrid}>
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Coin</div>
            <select className={styles.select} value={sym} onChange={e => setSym(e.target.value)}>
              {COINS.map(c => <option key={c.sym} value={c.sym}>{c.emoji} {c.sym}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Bot Stratejisi</div>
            <select className={styles.select} value={botId} onChange={e => setBotId(e.target.value)}>
              {BOTS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Kaldıraç</div>
            <select className={styles.select} value={leverage} onChange={e => setLeverage(Number(e.target.value))}>
              {[1, 2, 3, 5, 10].map(l => <option key={l} value={l}>{l}x</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.formLabel}>İşlem Başı Margin ($)</div>
            <input className={styles.input} type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} min="10" />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Stop-Loss (%)</div>
            <input className={styles.input} type="number" value={slPct} onChange={e => setSlPct(Number(e.target.value))} min="0.1" step="0.1" />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Take-Profit (%)</div>
            <input className={styles.input} type="number" value={tpPct} onChange={e => setTpPct(Number(e.target.value))} min="0.1" step="0.1" />
          </div>
        </div>

        <button className={styles.runBtn} onClick={runBacktest} disabled={isRunning}>
          {isRunning ? (
            <><span className={styles.spinner} /> Hesaplanıyor...</>
          ) : (
            '▶ Backtest Başlat'
          )}
        </button>
      </div>

      {/* Sonuçlar */}
      {result && (
        <>
          {/* Özet kartlar */}
          <div className={styles.summaryGrid}>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Başlangıç Bakiye</div>
              <div className={styles.sumValue}>$10,000</div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Son Bakiye</div>
              <div className={styles.sumValue} style={{ color: result.finalBalance >= 10000 ? 'var(--green)' : 'var(--red)' }}>
                ${result.finalBalance.toLocaleString('tr-TR')}
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Toplam Getiri</div>
              <div className={styles.sumValue} style={{ color: parseFloat(result.totalReturn) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Toplam İşlem</div>
              <div className={styles.sumValue}>{result.totalTrades}</div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Kazanma Oranı</div>
              <div className={styles.sumValue} style={{ color: parseFloat(result.winRate) >= 50 ? 'var(--green)' : 'var(--red)' }}>
                {result.winRate}%
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Kazanan / Kaybeden</div>
              <div className={styles.sumValue}>
                <span style={{ color: 'var(--green)' }}>{result.wins}</span>
                <span style={{ color: 'var(--muted)' }}> / </span>
                <span style={{ color: 'var(--red)' }}>{result.losses}</span>
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Ort. PnL</div>
              <div className={styles.sumValue} style={{ color: parseFloat(result.avgPnl) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {result.avgPnl >= 0 ? '+' : ''}${result.avgPnl}
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Max Drawdown</div>
              <div className={styles.sumValue} style={{ color: 'var(--red)' }}>
                -{result.maxDrawdown}%
              </div>
            </div>
            <div className={styles.sumCard}>
              <div className={styles.sumLabel}>Profit Factor</div>
              <div className={styles.sumValue} style={{ color: parseFloat(result.profitFactor) >= 1.5 ? 'var(--green)' : 'var(--accent)' }}>
                {result.profitFactor}
              </div>
            </div>
          </div>

          {/* İşlem tablosu */}
          <div className={styles.tradesCard}>
            <div className={styles.tradesTitle}>İşlem Geçmişi ({result.trades.length})</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Yön</th>
                    <th className={styles.th}>Giriş</th>
                    <th className={styles.th}>Çıkış</th>
                    <th className={styles.th}>PnL</th>
                    <th className={styles.th}>Neden</th>
                    <th className={styles.th}>Sinyal</th>
                    <th className={styles.th}>Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.slice(-50).reverse().map(t => (
                    <tr key={t.id} className={styles.tr}>
                      <td className={styles.td}>{t.id}</td>
                      <td className={styles.td}>
                        <span className={`${styles.typeBadge} ${t.type === 'LONG' ? styles.long : styles.short}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={styles.td}>{formatPrice(t.entryPrice)}</td>
                      <td className={styles.td}>{formatPrice(t.exitPrice)}</td>
                      <td className={styles.td}>
                        <span style={{ color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.reasonBadge} ${
                          t.reason === 'Take-Profit' ? styles.tp :
                          t.reason === 'Stop-Loss'   ? styles.sl : styles.timeout
                        }`}>
                          {t.reason}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{t.signal}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px', color: t.balance >= 10000 ? 'var(--green)' : 'var(--red)' }}>
                          ${t.balance.toLocaleString('tr-TR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}