import styles from './SignalHistory.module.css';

export default function SignalHistory({ history }) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>SİNYAL GEÇMİŞİ</div>
      {history.length === 0 ? (
        <div className={styles.empty}>Henüz sinyal yok</div>
      ) : (
        <ul className={styles.list}>
          {history.slice(0, 12).map(h => (
            <li key={h.id} className={styles.row}>
              <div className={styles.left}>
                <span className={styles.sym}>{h.sym}</span>
                <span className={`${styles.type} ${h.cls === 'buy' ? styles.buy : h.cls === 'sell' ? styles.sell : styles.hold}`}>
                  {h.type}
                </span>
              </div>
              <div className={styles.right}>
                <span className={styles.rate} style={{
                  color: h.successRate >= 70 ? 'var(--green)' : h.successRate >= 60 ? 'var(--accent)' : 'var(--red)'
                }}>
                  {h.successRate}%
                </span>
                <span className={styles.time}>{h.time}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}