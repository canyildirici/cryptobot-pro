import { useState } from 'react';
import { COINS } from '../utils/constants';
import DemoAccount from '../components/DemoAccount';
import CandleChart from '../components/CandleChart';
import SignalPanel from '../components/SignalPanel';
import styles from './Demo.module.css';

export default function Demo({ ctx }) {
  const [activeCoin, setActiveCoin] = useState(ctx.selectedCoin?.sym || 'BTC');

  const handleCoinChange = (sym) => {
    setActiveCoin(sym);
    ctx.selectCoin(sym);
  };

  const coin = COINS.find(c => c.sym === activeCoin) || ctx.selectedCoin;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>🎮 Demo Hesap — Vadeli İşlem</div>
        <div className={styles.warning}>
          ⚠️ Bu hesap tamamen simülasyondur. Gerçek para içermez.
        </div>
      </div>

      <div className={styles.grid}>
        {/* Sol: Grafik + Sinyal */}
        <div className={styles.left}>
          <CandleChart
            coin={coin}
            prices={ctx.prices}
            chartData={ctx.chartData}
            isLoading={ctx.isLoading}
            timeframe={ctx.timeframe}
            onTimeframe={ctx.changeTimeframe}
            signal={ctx.signal}
          />
          <SignalPanel
            signal={ctx.signal}
            indicators={ctx.indicators}
            selectedBot={ctx.selectedBot}
            fearGreed={ctx.fearGreed}
            supportRes={ctx.supportRes}
          />
        </div>

        {/* Sağ: Demo hesap */}
        <div className={styles.right}>
          <DemoAccount
            prices={ctx.prices}
            selectedCoin={coin}
            signal={ctx.signal}
            balance={ctx.demoBalance}
            positions={ctx.demoPositions}
            history={ctx.demoHistory}
            totalPnl={ctx.demoTotalPnl}
            onOpen={ctx.openPosition}
            onClose={ctx.closePosition}
            onReset={ctx.resetDemoAccount}
            onCoinChange={handleCoinChange}
            activeCoin={activeCoin}
          />
        </div>
      </div>
    </div>
  );
}