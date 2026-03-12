import { useState } from 'react';
import { COINS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './DemoAccount.module.css';

const INITIAL_BALANCE  = 10000;
const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

export default function DemoAccount({
  prices, selectedCoin, signal,
  balance, positions, history, totalPnl,
  onOpen, onClose, onReset,
  onCoinChange, activeCoin,
}) {
  const [leverage,  setLeverage]  = useState(10);
  const [amount,    setAmount]    = useState('100');
  const [activeTab, setActiveTab] = useState('positions');
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPct,     setSlPct]     = useState('5');
  const [tpPct,     setTpPct]     = useState('10');

  const coin  = COINS.find(c => c.sym === activeCoin) || selectedCoin;
  const price = prices[activeCoin] || coin?.basePrice || 0;

  const totalEquity = parseFloat((balance + positions.reduce((acc, pos) => {
    const p    = prices[pos.sym] || pos.entryPrice;
    const diff = pos.type === 'LONG'
      ? (p - pos.entryPrice) / pos.entryPrice
      : (pos.entryPrice - p) / pos.entryPrice;
    return acc + pos.margin + pos.margin * pos.leverage * diff;
  }, 0)).toFixed(2));

  const totalReturn = parseFloat(((totalEquity - INITIAL_BALANCE) / INITIAL_BALANCE * 100).toFixed(2));
  const winTrades   = history.filter(h => h.pnl > 0).length;
  const lossTrades  = history.filter(h => h.pnl <= 0).length;
  const winRate     = history.length > 0 ? Math.round(winTrades / history.length * 100) : 0;
  const totalProfit = history.reduce((a, h) => a + h.pnl, 0).toFixed(2);

  const handleOpen = (type) => {
    const m  = parseFloat(amount);
    const sl = slEnabled ? parseFloat(slPct) : null;
    const tp = tpEnabled ? parseFloat(tpPct) : null;
    if (!m || m <= 0 || m > balance || !price) return;
    onOpen(activeCoin, type, m, leverage, price, sl, tp);
  };

  return (
    <div className={styles.panel}>
      {/* Başlık */}
      <div className={styles.header}>
        <div className={styles.title}>🎮 Demo Hesap</div>
        <button className={styles.resetBtn} onClick={onReset}>Sıfırla</button>
      </div>

      {/* Bakiye */}
      <div className={styles.balanceGrid}>
        <div className={styles.balCard}>
          <div className={styles.balLabel}>Bakiye</div>
          <div className={styles.balValue}>${balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className={styles.balCard}>
          <div className={styles.balLabel}>Toplam Varlık</div>
          <div className={styles.balValue} style={{ color: totalEquity >= INITIAL_BALANCE ? 'var(--green)' : 'var(--red)' }}>
            ${totalEquity.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className={styles.balCard}>
          <div className={styles.balLabel}>Toplam Getiri</div>
          <div className={styles.balValue} style={{ color: totalReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn}%
          </div>
        </div>
        <div className={styles.balCard}>
          <div className={styles.balLabel}>Açık PnL</div>
          <div className={styles.balValue} style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl}
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>İşlem</div>
          <div className={styles.statValue}>{history.length}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Kazanan</div>
          <div className={styles.statValue} style={{ color: 'var(--green)' }}>{winTrades}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Kaybeden</div>
          <div className={styles.statValue} style={{ color: 'var(--red)' }}>{lossTrades}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Başarı %</div>
          <div className={styles.statValue} style={{ color: winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>{winRate}%</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Net Kâr</div>
          <div className={styles.statValue} style={{ color: parseFloat(totalProfit) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {parseFloat(totalProfit) >= 0 ? '+' : ''}${totalProfit}
          </div>
        </div>
      </div>

      {/* İşlem formu */}
      <div className={styles.tradeForm}>

        {/* Coin Seçici */}
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>Coin Seç</div>
          <div className={styles.coinSelector}>
            {COINS.map(c => (
              <button
                key={c.sym}
                className={`${styles.coinBtn} ${activeCoin === c.sym ? styles.coinBtnActive : ''}`}
                onClick={() => onCoinChange(c.sym)}
              >
                {c.emoji} {c.sym}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Seçili Coin</div>
            <div className={styles.coinBadge}>{activeCoin}/USDT</div>
          </div>
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Güncel Fiyat</div>
            <div className={styles.coinBadge} style={{ color: 'var(--accent)' }}>{formatPrice(price)}</div>
          </div>
        </div>

        {/* Kaldıraç */}
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>
            Kaldıraç: <span style={{ color: 'var(--accent)' }}>{leverage}x</span>
            {leverage >= 50 && <span style={{ color: 'var(--red)', fontSize: '10px' }}> ⚠️ Yüksek risk</span>}
          </div>
          <div className={styles.leverageBtns}>
            {LEVERAGE_OPTIONS.map(l => (
              <button key={l} className={`${styles.leverageBtn} ${leverage === l ? styles.active : ''}`} onClick={() => setLeverage(l)}>
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Miktar */}
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>
            Margin ($)
            <div style={{ display: 'flex', gap: '6px' }}>
              {[25, 50, 75, 100].map(pct => (
                <span key={pct} className={styles.pctBtn} onClick={() => setAmount((balance * pct / 100).toFixed(0))}>
                  {pct}%
                </span>
              ))}
            </div>
          </div>
          <input
            className={styles.amountInput}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Miktar..."
            min="1"
            max={balance}
          />
          <div className={styles.sizeInfo}>
            İşlem büyüklüğü: <span>${(parseFloat(amount || 0) * leverage).toFixed(2)}</span>
          </div>
        </div>

        {/* Stop-Loss / Take-Profit */}
        <div className={styles.slTpRow}>
          <div className={styles.slTpItem}>
            <div className={styles.slTpHeader}>
              <label className={styles.toggle}>
                <input type="checkbox" checked={slEnabled} onChange={e => setSlEnabled(e.target.checked)} />
                <span className={styles.toggleSlider} />
              </label>
              <span style={{ fontSize: '11px', color: slEnabled ? 'var(--red)' : 'var(--muted)' }}>
                🛑 Stop-Loss
              </span>
            </div>
            {slEnabled && (
              <div className={styles.slTpInput}>
                <input
                  type="number"
                  value={slPct}
                  onChange={e => setSlPct(e.target.value)}
                  className={styles.amountInput}
                  placeholder="% kayıp"
                  min="0.1"
                  max="100"
                />
                <span className={styles.slTpHint} style={{ color: 'var(--red)' }}>
                  ≈ {formatPrice(price * (1 - parseFloat(slPct || 0) / 100))}
                </span>
              </div>
            )}
          </div>
          <div className={styles.slTpItem}>
            <div className={styles.slTpHeader}>
              <label className={styles.toggle}>
                <input type="checkbox" checked={tpEnabled} onChange={e => setTpEnabled(e.target.checked)} />
                <span className={styles.toggleSlider} />
              </label>
              <span style={{ fontSize: '11px', color: tpEnabled ? 'var(--green)' : 'var(--muted)' }}>
                🎯 Take-Profit
              </span>
            </div>
            {tpEnabled && (
              <div className={styles.slTpInput}>
                <input
                  type="number"
                  value={tpPct}
                  onChange={e => setTpPct(e.target.value)}
                  className={styles.amountInput}
                  placeholder="% kâr"
                  min="0.1"
                />
                <span className={styles.slTpHint} style={{ color: 'var(--green)' }}>
                  ≈ {formatPrice(price * (1 + parseFloat(tpPct || 0) / 100))}
                </span>
              </div>
            )}
          </div>
        </div>

        {signal && signal.type !== 'BEKLE' && (
          <div className={`${styles.signalHint} ${signal.cls === 'buy' ? styles.hintBuy : styles.hintSell}`}>
            {signal.icon} AI Önerisi: <b>{signal.cls === 'buy' ? 'LONG aç' : 'SHORT aç'}</b> · Başarı: <b>{signal.successRate}%</b>
          </div>
        )}

        <div className={styles.tradeBtns}>
          <button className={styles.longBtn} onClick={() => handleOpen('LONG')}
            disabled={!price || parseFloat(amount) > balance || parseFloat(amount) <= 0}>
            🚀 LONG AL
            <span>Yükseliş Bekliyorum</span>
          </button>
          <button className={styles.shortBtn} onClick={() => handleOpen('SHORT')}
            disabled={!price || parseFloat(amount) > balance || parseFloat(amount) <= 0}>
            🔻 SHORT SAT
            <span>Düşüş Bekliyorum</span>
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'positions' ? styles.activeTab : ''}`} onClick={() => setActiveTab('positions')}>
          Pozisyonlar ({positions.length})
        </button>
        <button className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveTab('history')}>
          Geçmiş ({history.length})
        </button>
      </div>

      {/* Pozisyonlar */}
      {activeTab === 'positions' && (
        <div className={styles.positionsList}>
          {positions.length === 0 ? (
            <div className={styles.empty}>Açık pozisyon yok</div>
          ) : positions.map(pos => {
            const p    = prices[pos.sym] || pos.entryPrice;
            const diff = pos.type === 'LONG'
              ? (p - pos.entryPrice) / pos.entryPrice
              : (pos.entryPrice - p) / pos.entryPrice;
            const pnl    = parseFloat((pos.margin * pos.leverage * diff).toFixed(2));
            const pnlPct = parseFloat((diff * pos.leverage * 100).toFixed(2));

            return (
              <div key={pos.id} className={styles.posCard}>
                <div className={styles.posTop}>
                  <div className={styles.posLeft}>
                    <span className={`${styles.posBadge} ${pos.type === 'LONG' ? styles.longBadge : styles.shortBadge}`}>{pos.type}</span>
                    <span className={styles.posSym}>{pos.sym}</span>
                    <span className={styles.posLev}>{pos.leverage}x</span>
                  </div>
                  <button className={styles.closeBtn} onClick={() => onClose(pos)}>Kapat</button>
                </div>
                <div className={styles.posDetails}>
                  <div className={styles.posDetail}><span>Giriş</span><span>{formatPrice(pos.entryPrice)}</span></div>
                  <div className={styles.posDetail}><span>Şu an</span><span>{formatPrice(p)}</span></div>
                  <div className={styles.posDetail}><span>Margin</span><span>${pos.margin}</span></div>
                  <div className={styles.posDetail}><span>Likidasyon</span><span style={{ color: 'var(--red)' }}>{formatPrice(pos.liquidPrice)}</span></div>
                  {pos.stopLoss   && <div className={styles.posDetail}><span>Stop-Loss</span><span style={{ color: 'var(--red)' }}>{formatPrice(pos.stopLoss)}</span></div>}
                  {pos.takeProfit && <div className={styles.posDetail}><span>Take-Profit</span><span style={{ color: 'var(--green)' }}>{formatPrice(pos.takeProfit)}</span></div>}
                </div>
                <div className={styles.posPnl} style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {pnl >= 0 ? '+' : ''}${pnl} ({pnl >= 0 ? '+' : ''}{pnlPct}%)
                </div>
              </div>
            );
          })}
          {positions.length > 0 && (
            <button className={styles.closeAllBtn} onClick={() => positions.forEach(onClose)}>Tümünü Kapat</button>
          )}
        </div>
      )}

      {/* Geçmiş */}
      {activeTab === 'history' && (
        <div className={styles.historyList}>
          {history.length === 0 ? (
            <div className={styles.empty}>İşlem geçmişi yok</div>
          ) : history.map(h => (
            <div key={h.id} className={`${styles.histCard} ${h.pnl >= 0 ? styles.histWin : styles.histLoss}`}>
              <div className={styles.histTop}>
                <div className={styles.histLeft}>
                  <span className={`${styles.posBadge} ${h.type === 'LONG' ? styles.longBadge : styles.shortBadge}`}>{h.type}</span>
                  <span className={styles.posSym}>{h.sym}</span>
                  <span className={styles.posLev}>{h.leverage}x</span>
                  {h.reason === 'Likidasyon'  && <span className={styles.liqBadge}>LİK</span>}
                  {h.reason === 'Stop-Loss'   && <span className={styles.slBadge}>SL</span>}
                  {h.reason === 'Take-Profit' && <span className={styles.tpBadge}>TP</span>}
                </div>
                <div style={{ color: h.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'IBM Plex Mono', fontSize: '13px', fontWeight: 700 }}>
                  {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                </div>
              </div>
              <div className={styles.histDetails}>
                <span>{formatPrice(h.entryPrice)} → {formatPrice(h.closePrice)}</span>
                <span>Margin: ${h.margin}</span>
                <span>{h.closeDate} {h.closeTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}