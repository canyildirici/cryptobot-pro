import { useState } from 'react';
import styles from './App.module.css';
import { useCrypto } from './hooks/useCrypto';

import SearchBar      from './components/SearchBar';
import CandleChart    from './components/CandleChart';
import SignalPanel    from './components/SignalPanel';
import BotSelector    from './components/BotSelector';
import SignalHistory  from './components/SignalHistory';
import MarketOverview from './components/MarketOverview';
import Markets        from './pages/Markets';
import Signals        from './pages/Signals';
import Demo           from './pages/Demo';
import Alarms         from './pages/Alarms';
import Backtest       from './pages/Backtest';
import Portfolio      from './pages/Portfolio';
import News           from './pages/News';
import Statistics     from './pages/Statistics';

export default function App() {
  const ctx = useCrypto();
  const [activePage, setActivePage] = useState('dashboard');

  const goTo = (page, sym) => {
    if (sym) ctx.selectCoin(sym);
    setActivePage(page);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>₿</span>
            <span className={styles.logoText}>
              CryptoBot <span className={styles.logoPro}>PRO</span>
            </span>
          </div>

          <nav className={styles.nav}>
            {[
              { key: 'dashboard',  label: '📈 Dashboard'  },
              { key: 'signals',    label: '⚡ Sinyaller'  },
              { key: 'markets',    label: '📊 Piyasalar'  },
              { key: 'demo',       label: '🎮 Demo Hesap' },
              { key: 'portfolio',  label: '💼 Portföy'    },
              { key: 'alarms',     label: '🔔 Alarmlar'   },
              { key: 'backtest',   label: '🧪 Backtest'   },
              { key: 'news',       label: '📰 Haberler'   },
              { key: 'statistics', label: '📊 İstatistik' },
            ].map(p => (
              <button
                key={p.key}
                className={`${styles.navBtn} ${activePage === p.key ? styles.navActive : ''}`}
                onClick={() => setActivePage(p.key)}
              >
                {p.label}
              </button>
            ))}
          </nav>

          <div className={styles.headerRight}>
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Canlı
            </div>
            <div className={styles.networkBadge}>Binance API</div>
            <div className={styles.demoBadge} onClick={() => setActivePage('demo')}>
              💰 ${ctx.demoBalance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </header>

        {/* ── Dashboard ── */}
        {activePage === 'dashboard' && (
          <>
            <SearchBar
              onSearch={ctx.searchCoin}
              onSelectCoin={ctx.selectCoin}
              selectedCoin={ctx.selectedCoin}
            />
            <div className={styles.mainGrid}>
              <CandleChart
                coin={ctx.selectedCoin}
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
            <div className={styles.bottomGrid}>
              <SignalHistory history={ctx.signalHistory} />
              <BotSelector selectedBot={ctx.selectedBot} onSelect={ctx.changeBot} />
              <MarketOverview prices={ctx.prices} onSelect={ctx.selectCoin} />
            </div>
          </>
        )}

        {/* ── Sinyaller ── */}
        {activePage === 'signals' && (
          <Signals prices={ctx.prices} onSelectCoin={(sym) => goTo('dashboard', sym)} />
        )}

        {/* ── Piyasalar ── */}
        {activePage === 'markets' && (
          <Markets prices={ctx.prices} onSelectCoin={(sym) => goTo('dashboard', sym)} />
        )}

        {/* ── Demo Hesap ── */}
        {activePage === 'demo' && <Demo ctx={ctx} />}

        {/* ── Portföy ── */}
        {activePage === 'portfolio' && <Portfolio prices={ctx.prices} />}

        {/* ── Alarmlar ── */}
        {activePage === 'alarms' && <Alarms prices={ctx.prices} />}

        {/* ── Backtest ── */}
        {activePage === 'backtest' && <Backtest />}

        {/* ── Haberler ── */}
        {activePage === 'news' && <News />}

        {/* ── İstatistikler ── */}
        {activePage === 'statistics' && (
          <Statistics
            history={ctx.demoHistory}
            balance={ctx.demoBalance}
          />
        )}

      </div>
    </div>
  );
}