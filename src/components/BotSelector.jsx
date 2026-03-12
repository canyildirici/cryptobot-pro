import styles from './BotSelector.module.css';
import { BOTS } from '../utils/constants';

export default function BotSelector({ selectedBot, onSelect }) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>BOT STRATEJİSİ</div>
      {BOTS.map(bot => (
        <div
          key={bot.id}
          className={`${styles.card} ${selectedBot?.id === bot.id ? styles.selected : ''}`}
          onClick={() => onSelect(bot)}
          style={selectedBot?.id === bot.id ? { borderColor: bot.color + '60' } : {}}
        >
          <div className={styles.cardHeader}>
            <div className={styles.botLeft}>
              <div className={styles.botDot} style={{ background: bot.color }} />
              <div className={styles.botName}>{bot.name}</div>
            </div>
            <div className={styles.badge} style={{ color: bot.color, borderColor: bot.color + '50' }}>
              {bot.successRate}%
            </div>
          </div>
          <div className={styles.desc}>{bot.description}</div>
          <div className={styles.stats}>
            <span>Risk: <b>{bot.risk}</b></span>
            <span>Tarz: <b>{bot.style}</b></span>
          </div>
          {selectedBot?.id === bot.id && (
            <div className={styles.activeBadge} style={{ color: bot.color }}>
              ✓ Aktif
            </div>
          )}
        </div>
      ))}
    </div>
  );
}