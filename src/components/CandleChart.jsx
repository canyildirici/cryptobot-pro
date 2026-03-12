import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { TIMEFRAMES } from '../utils/constants';
import { formatPrice } from '../utils/helpers';
import styles from './CandleChart.module.css';

export default function CandleChart({ coin, prices, chartData, isLoading, timeframe, onTimeframe, signal }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volumeRef    = useRef(null);
  const ema20Ref     = useRef(null);
  const ema50Ref     = useRef(null);
  const signalRef    = useRef(null);

  const [indicators, setIndicators] = useState(['volume', 'EMA20', 'EMA50']);

  const price  = prices[coin?.sym] || coin?.basePrice || 0;
  const change = coin?.change || 0;
  const isUp   = change >= 0;

  // Grafik oluştur
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#1e2329' },
        textColor:  '#707a8a',
        fontFamily: 'IBM Plex Mono',
      },
      grid: {
        vertLines: { color: '#2b3139', style: 1 },
        horzLines: { color: '#2b3139', style: 1 },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2b3139' },
      timeScale: {
        borderColor:    '#2b3139',
        timeVisible:    true,
        secondsVisible: false,
      },
      width:  containerRef.current.clientWidth,
      height: 420,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:         '#0ecb81',
      downColor:       '#f6465d',
      borderUpColor:   '#0ecb81',
      borderDownColor: '#f6465d',
      wickUpColor:     '#0ecb81',
      wickDownColor:   '#f6465d',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat:  { type: 'volume' },
      priceScaleId: 'vol',
    });
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const ema20Series = chart.addSeries(LineSeries, {
      color:            '#f0b90b',
      lineWidth:        1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color:            '#1890ff',
      lineWidth:        1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Sinyal çizgisi (ayrı LineSeries olarak marker taşır)
    const signalSeries = chart.addSeries(LineSeries, {
      color:            'transparent',
      lineWidth:        0,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current  = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;
    ema20Ref.current  = ema20Series;
    ema50Ref.current  = ema50Series;
    signalRef.current = signalSeries;

    const ro = new ResizeObserver(entries => {
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  // Veri yükle
  useEffect(() => {
    if (!chartData?.prices || !candleRef.current) return;

    const raw     = chartData.prices;
    const candles = buildCandles(raw);

    candleRef.current.setData(candles);

    volumeRef.current?.setData(candles.map(c => ({
      time:  c.time,
      value: Math.abs(c.close - c.open) * (500 + Math.random() * 2000),
      color: c.close >= c.open ? 'rgba(14,203,129,0.35)' : 'rgba(246,70,93,0.35)',
    })));

    const ema20data = calcEMAdata(raw, 20);
    ema20Ref.current?.setData(
      ema20data.map((v, i) => ({
        time:  candles[candles.length - ema20data.length + i]?.time,
        value: v,
      })).filter(d => d.time)
    );

    const ema50data = calcEMAdata(raw, 50);
    ema50Ref.current?.setData(
      ema50data.map((v, i) => ({
        time:  candles[candles.length - ema50data.length + i]?.time,
        value: v,
      })).filter(d => d.time)
    );

    // Sinyal serisi için de veri set et
    signalRef.current?.setData(candles.map(c => ({ time: c.time, value: c.close })));

    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  // Sinyal marker
  useEffect(() => {
    if (!signal || !signalRef.current || !chartData?.prices) return;
    const candles = buildCandles(chartData.prices);
    if (!candles.length) return;

    const last = candles[candles.length - 1];
    try {
      signalRef.current.setMarkers([{
        time:     last.time,
        position: signal.cls === 'buy' ? 'belowBar' : signal.cls === 'sell' ? 'aboveBar' : 'inBar',
        color:    signal.cls === 'buy' ? '#0ecb81' : signal.cls === 'sell' ? '#f6465d' : '#f0b90b',
        shape:    signal.cls === 'buy' ? 'arrowUp'  : signal.cls === 'sell' ? 'arrowDown' : 'circle',
        text:     signal.type,
        size:     2,
      }]);
    } catch (e) {}
  }, [signal, chartData]);

  // İndikatör toggle
  useEffect(() => {
    ema20Ref.current?.applyOptions({ visible: indicators.includes('EMA20') });
    ema50Ref.current?.applyOptions({ visible: indicators.includes('EMA50') });
    volumeRef.current?.applyOptions({ visible: indicators.includes('volume') });
  }, [indicators]);

  const toggleInd = (ind) => {
    setIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.topBar}>
        <div className={styles.coinInfo}>
          <span className={styles.coinName}>{coin?.sym}/USDT</span>
          <span className={styles.coinPrice}>{formatPrice(price)}</span>
          <span className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
            {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </span>
          {signal && (
            <span className={styles.signalTag} style={{
              background: signal.cls === 'buy'  ? 'rgba(14,203,129,0.12)'
                        : signal.cls === 'sell' ? 'rgba(246,70,93,0.12)'
                        : 'rgba(240,185,11,0.12)',
              color:      signal.cls === 'buy'  ? 'var(--green)'
                        : signal.cls === 'sell' ? 'var(--red)'
                        : 'var(--accent)',
              border: `1px solid ${
                        signal.cls === 'buy'  ? 'rgba(14,203,129,0.3)'
                      : signal.cls === 'sell' ? 'rgba(246,70,93,0.3)'
                      : 'rgba(240,185,11,0.3)'}`,
            }}>
              {signal.icon} {signal.type} · {signal.successRate}%
            </span>
          )}
        </div>

        <div className={styles.tfBtns}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              className={`${styles.tfBtn} ${timeframe === tf.value ? styles.active : ''}`}
              onClick={() => onTimeframe(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.indicatorBar}>
        <span className={styles.indBarLabel}>İndikatör:</span>
        {['EMA20', 'EMA50', 'volume'].map(ind => (
          <button
            key={ind}
            className={`${styles.indBtn} ${indicators.includes(ind) ? styles.indActive : ''}`}
            onClick={() => toggleInd(ind)}
            style={indicators.includes(ind) ? {
              borderColor: ind === 'EMA20' ? '#f0b90b' : ind === 'EMA50' ? '#1890ff' : '#0ecb81',
              color:       ind === 'EMA20' ? '#f0b90b' : ind === 'EMA50' ? '#1890ff' : '#0ecb81',
            } : {}}
          >
            {ind}
          </button>
        ))}
        <div className={styles.divider} />
        <div className={styles.legend}>
          <span style={{ color: '#f0b90b', fontSize: '11px' }}>— EMA20</span>
          <span style={{ color: '#1890ff', fontSize: '11px' }}>— EMA50</span>
        </div>
      </div>

      <div className={styles.chartWrap}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Yükleniyor...</span>
          </div>
        )}
        <div ref={containerRef} className={styles.chart} />
      </div>
    </div>
  );
}

function buildCandles(prices) {
  const now      = Math.floor(Date.now() / 1000);
  const interval = 60;
  return prices.map((close, i) => {
    const open = i === 0 ? close : prices[i - 1];
    const wick  = Math.random() * 0.004;
    return {
      time:  now - (prices.length - i) * interval,
      open:  +open.toFixed(6),
      high:  +(Math.max(open, close) * (1 + wick)).toFixed(6),
      low:   +(Math.min(open, close) * (1 - wick)).toFixed(6),
      close: +close.toFixed(6),
    };
  });
}

function calcEMAdata(prices, period) {
  if (prices.length < period) return [];
  const k   = 2 / (period + 1);
  const out  = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    out.push(prices[i] * k + out[i - 1] * (1 - k));
  }
  return out.slice(period - 1);
}