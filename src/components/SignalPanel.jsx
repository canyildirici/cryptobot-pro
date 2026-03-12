import styles from './SignalPanel.module.css';

export default function SignalPanel({ signal, indicators, selectedBot, fearGreed, supportRes }) {
  if (!signal) return (
    <div className={styles.panel}>
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Analiz ediliyor...</span>
      </div>
    </div>
  );

  const { rsi, macd, bbPos, stochRSI, atr, ema20, ema50 } = indicators || {};

  const fgColor = fearGreed
    ? fearGreed.value < 25 ? 'var(--red)'
    : fearGreed.value < 45 ? '#ff9800'
    : fearGreed.value < 55 ? 'var(--accent)'
    : fearGreed.value < 75 ? '#8bc34a'
    : 'var(--green)'
    : 'var(--muted)';

  return (
    <div className={styles.panel}>

      {/* Başlık */}
      <div className={styles.sectionTitle}>AI SİNYAL ANALİZİ</div>

      {/* Ana sinyal */}
      <div className={`${styles.mainSignal} ${styles[signal.cls]}`}>
        <div className={styles.sigIcon}>{signal.icon}</div>
        <div className={styles.sigLabel}>{signal.type}</div>
        <div className={styles.sigScore}>Skor: {signal.score > 0 ? '+' : ''}{signal.score}</div>
      </div>

      {/* Başarı oranı */}
      <div className={styles.successBox}>
        <div className={styles.successRow}>
          <span className={styles.successLabel}>AI Başarı Tahmini</span>
          <span className={styles.successNum} style={{ color: signal.successRate >= 70 ? 'var(--green)' : signal.successRate >= 60 ? 'var(--accent)' : 'var(--red)' }}>
            {signal.successRate}%
          </span>
        </div>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${signal.successRate}%` }} />
        </div>
      </div>

      {/* Fear & Greed */}
      {fearGreed && (
        <div className={styles.fgBox} style={{ borderColor: fgColor + '40' }}>
          <div>
            <div className={styles.fgTitle}>Fear & Greed Index</div>
            <div className={styles.fgLabel} style={{ color: fgColor }}>{fearGreed.label}</div>
          </div>
          <div className={styles.fgValue} style={{ color: fgColor }}>{fearGreed.value}</div>
        </div>
      )}

      {/* Destek / Direnç */}
      {supportRes && (
        <div className={styles.srBox}>
          <div className={styles.srItem}>
            <div className={styles.srLabel}>Destek</div>
            <div className={styles.srValue} style={{ color: 'var(--green)' }}>${supportRes.support?.toFixed(2)}</div>
          </div>
          <div className={styles.srDivider} />
          <div className={styles.srItem}>
            <div className={styles.srLabel}>Direnç</div>
            <div className={styles.srValue} style={{ color: 'var(--red)' }}>${supportRes.resistance?.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* İndikatörler */}
      <div className={styles.sectionTitle} style={{ marginTop: 12 }}>İNDİKATÖRLER</div>
      <div className={styles.indGrid}>
        <IndCard label="RSI" value={rsi?.toFixed(1)}
          color={rsi < 35 ? 'var(--green)' : rsi > 65 ? 'var(--red)' : 'var(--text2)'}
          sig={rsi < 35 ? 'Satım' : rsi > 65 ? 'Alım' : 'Nötr'} />
        <IndCard label="StochRSI" value={stochRSI?.toFixed(1)}
          color={stochRSI < 25 ? 'var(--green)' : stochRSI > 75 ? 'var(--red)' : 'var(--text2)'}
          sig={stochRSI < 25 ? 'Satım' : stochRSI > 75 ? 'Alım' : 'Nötr'} />
        <IndCard label="MACD" value={macd?.toFixed(1)}
          color={macd > 0 ? 'var(--green)' : 'var(--red)'}
          sig={macd > 0 ? 'Pozitif' : 'Negatif'} />
        <IndCard label="BB Pos" value={bbPos?.toFixed(1) + '%'}
          color={bbPos < 20 ? 'var(--green)' : bbPos > 80 ? 'var(--red)' : 'var(--text2)'}
          sig={bbPos < 20 ? 'Alt Band' : bbPos > 80 ? 'Üst Band' : 'Orta'} />
        <IndCard label="EMA20" value={ema20?.toFixed(2)}
          color={ema20 > ema50 ? 'var(--green)' : 'var(--red)'}
          sig={ema20 > ema50 ? 'Golden X' : 'Death X'} />
        <IndCard label="ATR" value={atr?.toFixed(2)}
          color="var(--text2)" sig="Volatilite" />
      </div>

      {/* Bot önerisi */}
      <div className={styles.sectionTitle} style={{ marginTop: 12 }}>BOT STRATEJİSİ</div>
      <div className={styles.botBox} style={{ borderColor: selectedBot?.color + '40' }}>
        <div className={styles.botDot} style={{ background: selectedBot?.color }} />
        <div>
          <div className={styles.botName}>{selectedBot?.name}</div>
          <div className={styles.botDesc}>{selectedBot?.description}</div>
        </div>
        <div className={styles.botRate} style={{ color: selectedBot?.color }}>
          {selectedBot?.successRate}%
        </div>
      </div>

      {/* Sinyal detayları */}
      {signal.reason && (
        <>
          <div className={styles.sectionTitle} style={{ marginTop: 12 }}>SİNYAL DETAYLARI</div>
          <div className={styles.reason}>
            {signal.reason.split('\n').map((r, i) => (
              <div key={i} className={styles.reasonRow}>{r}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function IndCard({ label, value, color, sig }) {
  return (
    <div className={styles.indCard}>
      <div className={styles.indLabel}>{label}</div>
      <div className={styles.indValue} style={{ color }}>{value ?? '—'}</div>
      <div className={styles.indSig} style={{ color }}>{sig}</div>
    </div>
  );
}