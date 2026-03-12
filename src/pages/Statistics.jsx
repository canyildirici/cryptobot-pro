import { useState, useMemo } from 'react';
import styles from './Statistics.module.css';

export default function Statistics({ history, balance }) {
  const [period, setPeriod] = useState('all');

  const filtered = useMemo(() => {
    if (period === 'all') return history;
    const now  = Date.now();
    const days  = period === '7d' ? 7 : period === '30d' ? 30 : 1;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return history.filter(h => {
      const d = new Date(h.closeDate + ' ' + h.closeTime);
      return d.getTime() >= cutoff;
    });
  }, [history, period]);

  // Temel istatistikler
  const totalTrades  = filtered.length;
  const wins         = filtered.filter(h => h.pnl > 0);
  const losses       = filtered.filter(h => h.pnl <= 0);
  const winRate      = totalTrades > 0 ? (wins.length / totalTrades * 100).toFixed(1) : 0;
  const totalPnl     = filtered.reduce((a, h) => a + h.pnl, 0);
  const avgPnl       = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const avgWin       = wins.length   > 0 ? wins.reduce((a, h) => a + h.pnl, 0) / wins.length : 0;
  const avgLoss      = losses.length > 0 ? losses.reduce((a, h) => a + h.pnl, 0) / losses.length : 0;
  const bestTrade    = filtered.reduce((best, h) => h.pnl > (best?.pnl ?? -Infinity) ? h : best, null);
  const worstTrade   = filtered.reduce((worst, h) => h.pnl < (worst?.pnl ?? Infinity) ? h : worst, null);
  const profitFactor = losses.length > 0
    ? Math.abs(wins.reduce((a, h) => a + h.pnl, 0) / losses.reduce((a, h) => a + h.pnl, 0)).toFixed(2)
    : '∞';

  // Streak hesapla
  let currentStreak = 0, maxStreak = 0, tempStreak = 0;
  filtered.forEach(h => {
    if (h.pnl > 0) { tempStreak++; if (tempStreak > maxStreak) maxStreak = tempStreak; }
    else tempStreak = 0;
  });
  if (filtered.length > 0) {
    const last = filtered[0];
    let i = 0;
    while (i < filtered.length && (last.pnl > 0 ? filtered[i].pnl > 0 : filtered[i].pnl <= 0)) {
      currentStreak++; i++;
    }
  }

  // Coin bazlı performans
  const coinStats = {};
  filtered.forEach(h => {
    if (!coinStats[h.sym]) coinStats[h.sym] = { sym: h.sym, trades: 0, pnl: 0, wins: 0 };
    coinStats[h.sym].trades++;
    coinStats[h.sym].pnl += h.pnl;
    if (h.pnl > 0) coinStats[h.sym].wins++;
  });
  const coinList = Object.values(coinStats)
    .sort((a, b) => b.pnl - a.pnl)
    .map(c => ({ ...c, winRate: (c.wins / c.trades * 100).toFixed(0) }));

  // Neden bazlı performans
  const reasonStats = {};
  filtered.forEach(h => {
    if (!reasonStats[h.reason]) reasonStats[h.reason] = { reason: h.reason, trades: 0, pnl: 0 };
    reasonStats[h.reason].trades++;
    reasonStats[h.reason].pnl += h.pnl;
  });

  // Günlük PnL
  const dailyPnl = {};
  filtered.forEach(h => {
    const date = h.closeDate || 'Bilinmiyor';
    if (!dailyPnl[date]) dailyPnl[date] = 0;
    dailyPnl[date] += h.pnl;
  });
  const dailyList = Object.entries(dailyPnl)
    .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14);

  const maxAbsPnl = Math.max(...dailyList.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>📊 Kazanç/Kayıp İstatistikleri</div>
        <div className={styles.periods}>
          {[
            { key: '1d',  label: '1G'  },
            { key: '7d',  label: '7G'  },
            { key: '30d', label: '30G' },
            { key: 'all', label: 'Tümü'},
          ].map(p => (
            <button
              key={p.key}
              className={`${styles.periodBtn} ${period === p.key ? styles.periodActive : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {history.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <div>Henüz işlem geçmişi yok</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6 }}>
            Demo hesapta işlem yaptıkça istatistikler burada görünecek
          </div>
        </div>
      ) : (
        <>
          {/* Ana metrikler */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Toplam İşlem</div>
              <div className={styles.metricValue}>{totalTrades}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Kazanma Oranı</div>
              <div className={styles.metricValue} style={{ color: parseFloat(winRate) >= 50 ? 'var(--green)' : 'var(--red)' }}>
                {winRate}%
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Toplam PnL</div>
              <div className={styles.metricValue} style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Ort. PnL</div>
              <div className={styles.metricValue} style={{ color: avgPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {avgPnl >= 0 ? '+' : ''}${avgPnl.toFixed(2)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Ort. Kazanç</div>
              <div className={styles.metricValue} style={{ color: 'var(--green)' }}>
                +${avgWin.toFixed(2)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Ort. Kayıp</div>
              <div className={styles.metricValue} style={{ color: 'var(--red)' }}>
                ${avgLoss.toFixed(2)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Profit Factor</div>
              <div className={styles.metricValue} style={{ color: parseFloat(profitFactor) >= 1.5 ? 'var(--green)' : 'var(--accent)' }}>
                {profitFactor}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Maks. Seri</div>
              <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>
                {maxStreak} kazanç
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Güncel Seri</div>
              <div className={styles.metricValue} style={{ color: currentStreak > 0 ? 'var(--green)' : 'var(--muted)' }}>
                {currentStreak > 0 ? `${currentStreak} kazanç` : 'Yok'}
              </div>
            </div>
          </div>

          <div className={styles.bottomGrid}>
            {/* Günlük PnL grafiği */}
            <div className={styles.chartCard}>
              <div className={styles.cardTitle}>Günlük PnL (Son 14 Gün)</div>
              {dailyList.length === 0 ? (
                <div className={styles.empty}>Veri yok</div>
              ) : (
                <div className={styles.barChart}>
                  {dailyList.map((d, i) => (
                    <div key={i} className={styles.barItem}>
                      <div className={styles.barWrap}>
                        <div
                          className={styles.bar}
                          style={{
                            height:     `${Math.abs(d.pnl) / maxAbsPnl * 100}%`,
                            background: d.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                            opacity:    0.8,
                          }}
                          title={`${d.date}: ${d.pnl >= 0 ? '+' : ''}$${d.pnl}`}
                        />
                      </div>
                      <div className={styles.barLabel}>{d.date.slice(-5)}</div>
                      <div className={styles.barValue} style={{ color: d.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {d.pnl >= 0 ? '+' : ''}{d.pnl}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* En iyi/kötü işlem */}
            <div className={styles.extremesCard}>
              <div className={styles.cardTitle}>En İyi / En Kötü İşlem</div>
              {bestTrade && (
                <div className={styles.extremeItem} style={{ borderLeftColor: 'var(--green)' }}>
                  <div className={styles.extremeLabel}>🏆 En İyi İşlem</div>
                  <div className={styles.extremeSym}>{bestTrade.sym} {bestTrade.type} {bestTrade.leverage}x</div>
                  <div className={styles.extremePnl} style={{ color: 'var(--green)' }}>+${bestTrade.pnl.toFixed(2)}</div>
                  <div className={styles.extremeDate}>{bestTrade.closeDate} — {bestTrade.reason}</div>
                </div>
              )}
              {worstTrade && (
                <div className={styles.extremeItem} style={{ borderLeftColor: 'var(--red)' }}>
                  <div className={styles.extremeLabel}>💀 En Kötü İşlem</div>
                  <div className={styles.extremeSym}>{worstTrade.sym} {worstTrade.type} {worstTrade.leverage}x</div>
                  <div className={styles.extremePnl} style={{ color: 'var(--red)' }}>${worstTrade.pnl.toFixed(2)}</div>
                  <div className={styles.extremeDate}>{worstTrade.closeDate} — {worstTrade.reason}</div>
                </div>
              )}
            </div>

            {/* Coin performansı */}
            <div className={styles.coinCard}>
              <div className={styles.cardTitle}>Coin Bazlı Performans</div>
              {coinList.length === 0 ? (
                <div className={styles.empty}>Veri yok</div>
              ) : coinList.map(c => (
                <div key={c.sym} className={styles.coinRow}>
                  <div className={styles.coinSym}>{c.sym}</div>
                  <div className={styles.coinTrades}>{c.trades} işlem</div>
                  <div className={styles.coinWr} style={{ color: parseFloat(c.winRate) >= 50 ? 'var(--green)' : 'var(--red)' }}>
                    %{c.winRate}
                  </div>
                  <div className={styles.coinPnl} style={{ color: c.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {c.pnl >= 0 ? '+' : ''}${c.pnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Kapanış nedeni */}
            <div className={styles.reasonCard}>
              <div className={styles.cardTitle}>Kapanış Nedeni</div>
              {Object.values(reasonStats).map(r => (
                <div key={r.reason} className={styles.reasonRow}>
                  <div className={styles.reasonName}>
                    {r.reason === 'Take-Profit' ? '🎯' : r.reason === 'Stop-Loss' ? '🛑' : r.reason === 'Likidasyon' ? '💀' : '✋'} {r.reason}
                  </div>
                  <div className={styles.reasonTrades}>{r.trades} işlem</div>
                  <div className={styles.reasonPnl} style={{ color: r.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {r.pnl >= 0 ? '+' : ''}${r.pnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}