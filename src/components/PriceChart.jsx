import { useEffect, useRef } from 'react';
import { formatPrice } from '../utils/helpers';
import { TIMEFRAMES } from '../utils/constants';
import styles from './PriceChart.module.css';

export default function PriceChart({ coin, prices, chartData, isLoading, timeframe, onTimeframe }) {
  const canvasRef = useRef(null);

  const price  = prices[coin?.sym] || coin?.basePrice || 0;
  const change = coin?.change || 0;
  const isUp   = change >= 0;

  useEffect(() => {
    if (!chartData || isLoading || !canvasRef.current) return;
    drawChart(canvasRef.current, chartData.prices, isUp);
  }, [chartData, isLoading, isUp]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div className={styles.coinName}>{coin?.sym} / USDT</div>
          <div className={styles.coinPrice}>{formatPrice(price)}</div>
          <div className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
            {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </div>
        </div>
        <div className={styles.controls}>
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
          <div className={styles.vol}>
            Vol: <span>{chartData?.volume || '—'}</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrap}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Grafik yükleniyor...</span>
          </div>
        ) : (
          <canvas ref={canvasRef} className={styles.canvas} />
        )}
      </div>
    </div>
  );
}

function drawChart(canvas, prices, isUp) {
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  canvas.width  = W;
  canvas.height = H;

  const color = isUp ? '#00f5a0' : '#ff3d71';
  const pad = { top: 16, right: 16, bottom: 32, left: 56 };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const toX = (i) => pad.left + (i / (prices.length - 1)) * (W - pad.left - pad.right);
  const toY = (v) => pad.top + (1 - (v - min) / range) * (H - pad.top - pad.bottom);

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    const val = max - (i / 4) * range;
    ctx.fillStyle = '#4a5568';
    ctx.font = '10px Space Mono';
    ctx.textAlign = 'right';
    ctx.fillText(
      val >= 1 ? '$' + val.toFixed(2) : '$' + val.toFixed(4),
      pad.left - 6, y + 4
    );
  }

  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  prices.forEach((p, i) => {
    i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p));
  });
  ctx.lineTo(toX(prices.length - 1), H - pad.bottom);
  ctx.lineTo(toX(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  prices.forEach((p, i) => {
    i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p));
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  const lastX = toX(prices.length - 1);
  const lastY = toY(prices[prices.length - 1]);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#060912';
  ctx.lineWidth = 2;
  ctx.stroke();
}