import { useState } from 'react';
import { COINS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './Markets.module.css';

export default function Markets({ prices, onSelectCoin }) {
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = COINS
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sym.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name')   { valA = a.sym; valB = b.sym; }
      if (sortBy === 'price')  { valA = prices[a.sym] || 0; valB = prices[b.sym] || 0; }
      if (sortBy === 'change') { valA = a.change; valB = b.change; }
      if (sortDir === 'asc')  return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const arrow = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>📊 Piyasalar</div>
        <input
          className={styles.search}
          type="text"
          placeholder="Coin ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th} onClick={() => handleSort('name')}>
                Coin{arrow('name')}
              </th>
              <th className={styles.th} onClick={() => handleSort('price')}>
                Fiyat{arrow('price')}
              </th>
              <th className={styles.th} onClick={() => handleSort('change')}>
                24s Değişim{arrow('change')}
              </th>
              <th className={styles.th}>Piyasa</th>
              <th className={styles.th}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((coin, i) => {
              const price  = prices[coin.sym] || coin.basePrice;
              const change = coin.change;
              const isUp   = change >= 0;
              const mcap   = (price * (Math.random() * 1e9 + 1e8)).toFixed(0);

              return (
                <tr key={coin.sym} className={styles.tr} onClick={() => onSelectCoin(coin.sym)}>
                  <td className={styles.td}>{i + 1}</td>
                  <td className={styles.td}>
                    <div className={styles.coinCell}>
                      <span className={styles.emoji}>{coin.emoji}</span>
                      <div>
                        <div className={styles.coinSym}>{coin.sym}</div>
                        <div className={styles.coinName}>{coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.priceCell}>{formatPrice(price)}</div>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.mcap}>${parseInt(mcap).toLocaleString('tr-TR')}</div>
                  </td>
                  <td className={styles.td}>
                    <button className={styles.tradeBtn} onClick={() => onSelectCoin(coin.sym)}>
                      Al/Sat
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}