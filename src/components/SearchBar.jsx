import { useState } from 'react';
import { COINS } from '../utils/constants';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSelectCoin, selectedCoin }) {
  const [query, setQuery] = useState('');

  const filtered = query
    ? COINS.filter(c =>
        c.sym.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.chips}>
        {COINS.map(coin => (
          <button
            key={coin.sym}
            className={`${styles.chip} ${selectedCoin?.sym === coin.sym ? styles.active : ''}`}
            onClick={() => onSelectCoin(coin.sym)}
          >
            <span>{coin.emoji}</span>
            <span>{coin.sym}</span>
          </button>
        ))}
      </div>
    </div>
  );
}