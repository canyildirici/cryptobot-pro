import { useState, useEffect } from 'react';
import { COINS } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './Alarms.module.css';

export default function Alarms({ prices }) {
  const [alarms,     setAlarms]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('cryptobot_alarms') || '[]'); } catch { return []; }
  });
  const [sym,        setSym]        = useState('BTC');
  const [condition,  setCondition]  = useState('above');
  const [targetPrice,setTargetPrice]= useState('');
  const [triggered,  setTriggered]  = useState([]);

  // Alarm kaydet
  useEffect(() => {
    localStorage.setItem('cryptobot_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Alarm kontrolü
  useEffect(() => {
    if (!prices || alarms.length === 0) return;
    alarms.forEach(alarm => {
      if (alarm.triggered) return;
      const price = prices[alarm.sym];
      if (!price) return;

      const hit = alarm.condition === 'above'
        ? price >= alarm.targetPrice
        : price <= alarm.targetPrice;

      if (hit) {
        // Alarm tetiklendi
        setAlarms(prev => prev.map(a =>
          a.id === alarm.id ? { ...a, triggered: true, triggeredAt: new Date().toLocaleTimeString('tr-TR'), triggeredPrice: price } : a
        ));
        setTriggered(prev => [...prev, alarm]);

        // Tarayıcı bildirimi
        if (Notification.permission === 'granted') {
          new Notification(`🚨 ${alarm.sym} Fiyat Alarmı!`, {
            body: `${alarm.sym} fiyatı $${price.toFixed(2)} — Hedef: $${alarm.targetPrice}`,
          });
        }
      }
    });
  }, [prices, alarms]);

  const addAlarm = () => {
    const tp = parseFloat(targetPrice);
    if (!tp || tp <= 0) return;
    const newAlarm = {
      id:          Date.now(),
      sym,
      condition,
      targetPrice: tp,
      currentPrice: prices[sym] || 0,
      triggered:   false,
      createdAt:   new Date().toLocaleTimeString('tr-TR'),
    };
    setAlarms(prev => [...prev, newAlarm]);
    setTargetPrice('');
  };

  const deleteAlarm = (id) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const clearTriggered = () => {
    setAlarms(prev => prev.filter(a => !a.triggered));
  };

  const requestNotification = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const activeAlarms    = alarms.filter(a => !a.triggered);
  const triggeredAlarms = alarms.filter(a => a.triggered);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>🔔 Fiyat Alarmları</div>
        {Notification.permission !== 'granted' && (
          <button className={styles.notifBtn} onClick={requestNotification}>
            🔔 Bildirimlere İzin Ver
          </button>
        )}
      </div>

      {/* Alarm oluştur */}
      <div className={styles.createCard}>
        <div className={styles.createTitle}>Yeni Alarm Oluştur</div>
        <div className={styles.createForm}>
          {/* Coin seç */}
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Coin</div>
            <select className={styles.select} value={sym} onChange={e => setSym(e.target.value)}>
              {COINS.map(c => (
                <option key={c.sym} value={c.sym}>
                  {c.emoji} {c.sym} — {formatPrice(prices[c.sym] || c.basePrice)}
                </option>
              ))}
            </select>
          </div>

          {/* Koşul */}
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>Koşul</div>
            <div className={styles.condBtns}>
              <button
                className={`${styles.condBtn} ${condition === 'above' ? styles.condActive : ''}`}
                onClick={() => setCondition('above')}
                style={condition === 'above' ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
              >
                ▲ Üzerine çıkınca
              </button>
              <button
                className={`${styles.condBtn} ${condition === 'below' ? styles.condActive : ''}`}
                onClick={() => setCondition('below')}
                style={condition === 'below' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              >
                ▼ Altına düşünce
              </button>
            </div>
          </div>

          {/* Hedef fiyat */}
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>
              Hedef Fiyat ($)
              <span className={styles.currentPrice}>
                Şu an: {formatPrice(prices[sym] || 0)}
              </span>
            </div>
            <input
              className={styles.input}
              type="number"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              placeholder="Fiyat girin..."
              min="0"
            />
          </div>

          <button className={styles.addBtn} onClick={addAlarm} disabled={!targetPrice}>
            + Alarm Ekle
          </button>
        </div>
      </div>

      {/* Aktif alarmlar */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>⏳ Aktif Alarmlar ({activeAlarms.length})</div>
        </div>
        {activeAlarms.length === 0 ? (
          <div className={styles.empty}>Aktif alarm yok</div>
        ) : activeAlarms.map(alarm => {
          const current = prices[alarm.sym] || alarm.currentPrice;
          const pct     = ((alarm.targetPrice - current) / current * 100).toFixed(2);
          const isAbove = alarm.condition === 'above';

          return (
            <div key={alarm.id} className={styles.alarmCard}>
              <div className={styles.alarmLeft}>
                <div className={styles.alarmCoin}>
                  {COINS.find(c => c.sym === alarm.sym)?.emoji} {alarm.sym}
                </div>
                <div className={styles.alarmCond} style={{ color: isAbove ? 'var(--green)' : 'var(--red)' }}>
                  {isAbove ? '▲ Üzerine çıkınca' : '▼ Altına düşünce'}
                </div>
              </div>
              <div className={styles.alarmMid}>
                <div className={styles.alarmTarget}>{formatPrice(alarm.targetPrice)}</div>
                <div className={styles.alarmCurrent}>
                  Şu an: {formatPrice(current)}
                  <span style={{ color: isAbove ? 'var(--green)' : 'var(--red)', marginLeft: 6 }}>
                    {isAbove ? '+' : ''}{pct}%
                  </span>
                </div>
              </div>
              <div className={styles.alarmRight}>
                <div className={styles.alarmTime}>{alarm.createdAt}</div>
                <button className={styles.deleteBtn} onClick={() => deleteAlarm(alarm.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tetiklenen alarmlar */}
      {triggeredAlarms.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>✅ Tetiklenen Alarmlar ({triggeredAlarms.length})</div>
            <button className={styles.clearBtn} onClick={clearTriggered}>Temizle</button>
          </div>
          {triggeredAlarms.map(alarm => (
            <div key={alarm.id} className={`${styles.alarmCard} ${styles.triggered}`}>
              <div className={styles.alarmLeft}>
                <div className={styles.alarmCoin}>
                  {COINS.find(c => c.sym === alarm.sym)?.emoji} {alarm.sym}
                </div>
                <div className={styles.triggeredBadge}>✅ Tetiklendi</div>
              </div>
              <div className={styles.alarmMid}>
                <div className={styles.alarmTarget}>{formatPrice(alarm.targetPrice)}</div>
                <div className={styles.alarmCurrent}>
                  Tetiklenme: {formatPrice(alarm.triggeredPrice)} — {alarm.triggeredAt}
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={() => deleteAlarm(alarm.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}