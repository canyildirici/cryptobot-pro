import { useState, useEffect } from 'react';
import { COINS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './Portfolio.module.css';

const STORAGE_KEY = 'cryptobot_portfolio';

function loadPortfolio() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export default function Portfolio({ prices }) {
  const [holdings, setHoldings] = useState(loadPortfolio);
  const [sym,      setSym]      = useState('BTC');
  const [amount,   setAmount]   = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [tab,      setTab]      = useState('holdings');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const addHolding = () => {
    const amt = parseFloat(amount);
    const bp  = parseFloat(buyPrice);
    if (!amt || !bp || amt <= 0 || bp <= 0) return;

    const existing = holdings.find(h => h.sym === sym);
    if (existing) {
      // Ortalama maliyet hesapla
      const totalAmt  = existing.amount + amt;
      const avgPrice  = (existing.buyPrice * existing.amount + bp * amt) / totalAmt;
      setHoldings(prev => prev.map(h =>
        h.sym === sym ? { ...h, amount: totalAmt, buyPrice: parseFloat(avgPrice.toFixed(6)) } : h
      ));
    } else {
      const coin = COINS.find(c => c.sym === sym);
      setHoldings(prev => [...prev, {
        id:       Date.now(),
        sym,
        name:     coin?.name || sym,
        emoji:    coin?.emoji || '🪙',
        amount:   amt,
        buyPrice: bp,
        addedAt:  new Date().toLocaleDateString('tr-TR'),
      }]);
    }
    setAmount('');
    setBuyPrice('');
  };

  const removeHolding = (id) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  // Hesaplamalar
  const enriched = holdings.map(h => {
    const current   = prices[h.sym] || h.buyPrice;
    const value     = h.amount * current;
    const cost      = h.amount * h.buyPrice;
    const pnl       = value - cost;
    const pnlPct    = ((current - h.buyPrice) / h.buyPrice * 100);
    return { ...h, current, value, cost, pnl, pnlPct };
  });

  const totalValue   = enriched.reduce((a, h) => a + h.value, 0);
  const totalCost    = enriched.reduce((a, h) => a + h.cost,  0);
  const totalPnl     = totalValue - totalCost;
  const totalPnlPct  = totalCost > 0 ? ((totalPnl / totalCost) * 100) : 0;
  const bestAsset    = enriched.sort((a, b) => b.pnlPct - a.pnlPct)[0];
  const worstAsset   = enriched.sort((a, b) => a.pnlPct - b.pnlPct)[0];

  // Dağılım yüzdeleri
  const withAlloc = enriched.map(h => ({
    ...h,
    allocation: totalValue > 0 ? (h.value / totalValue * 100) : 0,
  })).sort((a, b) => b.value - a.value);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>💼 Portföy Takibi</div>
      </div>

      {/* Özet kartlar */}
      <div className={styles.summaryGrid}>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Toplam Değer</div>
          <div className={styles.sumValue}>${totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Toplam Maliyet</div>
          <div className={styles.sumValue}>${totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Toplam K/Z</div>
          <div className={styles.sumValue} style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Toplam Getiri</div>
          <div className={styles.sumValue} style={{ color: totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
          </div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>En İyi Varlık</div>
          <div className={styles.sumValue} style={{ color: 'var(--green)', fontSize: '13px' }}>
            {bestAsset ? `${bestAsset.emoji} ${bestAsset.sym} +${bestAsset.pnlPct.toFixed(2)}%` : '—'}
          </div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>En Kötü Varlık</div>
          <div className={styles.sumValue} style={{ color: 'var(--red)', fontSize: '13px' }}>
            {worstAsset ? `${worstAsset.emoji} ${worstAsset.sym} ${worstAsset.pnlPct.toFixed(2)}%` : '—'}
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Sol: Holdings tablosu */}
        <div className={styles.left}>
          {/* Coin ekle formu */}
          <div className={styles.addCard}>
            <div className={styles.addTitle}>Coin Ekle</div>
            <div className={styles.addForm}>
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>Coin</div>
                <select className={styles.select} value={sym} onChange={e => setSym(e.target.value)}>
                  {COINS.map(c => (
                    <option key={c.sym} value={c.sym}>{c.emoji} {c.sym} — {formatPrice(prices[c.sym] || c.basePrice)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>Miktar</div>
                <input className={styles.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="any" />
              </div>
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>
                  Alış Fiyatı ($)
                  <span className={styles.currentHint} onClick={() => setBuyPrice((prices[sym] || 0).toFixed(2))}>
                    Şu an kullan
                  </span>
                </div>
                <input className={styles.input} type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" min="0" step="any" />
              </div>
              <button className={styles.addBtn} onClick={addHolding} disabled={!amount || !buyPrice}>
                + Ekle
              </button>
            </div>
          </div>

          {/* Holdings tablosu */}
          <div className={styles.tableCard}>
            <div className={styles.tableTitle}>Varlıklarım ({holdings.length})</div>
            {holdings.length === 0 ? (
              <div className={styles.empty}>Henüz coin eklenmedi</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Coin</th>
                      <th className={styles.th}>Miktar</th>
                      <th className={styles.th}>Alış</th>
                      <th className={styles.th}>Şu an</th>
                      <th className={styles.th}>Değer</th>
                      <th className={styles.th}>K/Z</th>
                      <th className={styles.th}>%</th>
                      <th className={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {withAlloc.map(h => (
                      <tr key={h.id} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.coinCell}>
                            <span className={styles.emoji}>{h.emoji}</span>
                            <div>
                              <div className={styles.sym}>{h.sym}</div>
                              <div className={styles.coinName}>{h.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.mono}>{h.amount.toFixed(4)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.mono}>{formatPrice(h.buyPrice)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.mono}>{formatPrice(h.current)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.mono}>${h.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.mono} style={{ color: h.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                            {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.pctBadge} ${h.pnlPct >= 0 ? styles.up : styles.down}`}>
                            {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className={styles.td}>
                          <button className={styles.removeBtn} onClick={() => removeHolding(h.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Dağılım */}
        <div className={styles.right}>
          <div className={styles.allocCard}>
            <div className={styles.allocTitle}>Portföy Dağılımı</div>
            {withAlloc.length === 0 ? (
              <div className={styles.empty}>Veri yok</div>
            ) : withAlloc.map(h => (
              <div key={h.id} className={styles.allocRow}>
                <div className={styles.allocLeft}>
                  <span>{h.emoji}</span>
                  <span className={styles.allocSym}>{h.sym}</span>
                </div>
                <div className={styles.allocBar}>
                  <div
                    className={styles.allocFill}
                    style={{
                      width: `${h.allocation}%`,
                      background: h.pnlPct >= 0 ? 'var(--green)' : 'var(--red)',
                    }}
                  />
                </div>
                <div className={styles.allocPct}>{h.allocation.toFixed(1)}%</div>
                <div className={styles.allocValue}>${h.value.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}