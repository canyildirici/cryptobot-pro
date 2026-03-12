import { COINS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './MarketOverview.module.css';

export default function MarketOverview({ prices, onSelect }) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>PİYASA ÖZETİ</div>
      <div className={styles.list}>
        {COINS.map(coin => {
          const price  = prices[coin.sym] || coin.basePrice;
          const change = coin.change;
          const isUp   = change >= 0;
          return (
            <div key={coin.sym} className={styles.row} onClick={() => onSelect(coin.sym)}>
              <div className={styles.left}>
                <span className={styles.emoji}>{coin.emoji}</span>
                <div>
                  <div className={styles.sym}>{coin.sym}</div>
                  <div className={styles.name}>{coin.name}</div>
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.price}>{formatPrice(price)}</div>
                <div className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
                  {isUp ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}