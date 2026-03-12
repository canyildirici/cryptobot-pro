import { useState, useEffect } from 'react';
import styles from './Header.module.css';

export default function Header() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>₿</span>
          <span className={styles.logoText}>CryptoBot <span className={styles.logoPro}>PRO</span></span>
        </div>
        <nav className={styles.nav}>
          <span className={styles.navItem + ' ' + styles.navActive}>Dashboard</span>
          <span className={styles.navItem}>Demo Hesap</span>
          <span className={styles.navItem}>Piyasalar</span>
          <span className={styles.navItem}>Sinyaller</span>
        </nav>
      </div>
      <div className={styles.right}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          Canlı
        </div>
        <div className={styles.clock}>{time}</div>
        <div className={styles.networkBadge}>Binance API</div>
      </div>
    </header>
  );
}