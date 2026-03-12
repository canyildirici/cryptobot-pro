import { useState, useEffect, useRef, useCallback } from 'react';
import { COINS, BOTS } from '../utils/constants';
import { generateTimeLabels } from '../utils/helpers';
import { getAllPrices, getCoinHistory, getFearGreedIndex } from '../services/cryptoService';
import { aiGenerateSignal } from '../services/aiSignalEngine';

const STORAGE_KEY = 'cryptobot_demo_account';

function loadAccount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveAccount(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useCrypto() {
  const [selectedCoin,  setSelectedCoin]  = useState(COINS[0]);
  const [prices,        setPrices]        = useState({});
  const [chartData,     setChartData]     = useState(null);
  const [indicators,    setIndicators]    = useState({});
  const [signal,        setSignal]        = useState(null);
  const [selectedBot,   setSelectedBot]   = useState(BOTS[3]);
  const [timeframe,     setTimeframe]     = useState('1h');
  const [signalHistory, setSignalHistory] = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [fearGreed,     setFearGreed]     = useState(null);
  const [supportRes,    setSupportRes]    = useState(null);

  const savedAccount = loadAccount();
  const [demoBalance,   setDemoBalance]   = useState(savedAccount?.balance   ?? 10000);
  const [demoPositions, setDemoPositions] = useState(savedAccount?.positions ?? []);
  const [demoHistory,   setDemoHistory]   = useState(savedAccount?.history   ?? []);
  const [demoTotalPnl,  setDemoTotalPnl]  = useState(0);

  const priceIntervalRef = useRef(null);
  const analysisRef      = useRef(null);

  // Demo hesabı kaydet
  useEffect(() => {
    saveAccount({ balance: demoBalance, positions: demoPositions, history: demoHistory });
  }, [demoBalance, demoPositions, demoHistory]);

  // Fiyatları çek
  const fetchPrices = useCallback(async () => {
    try {
      const data = await getAllPrices();
      setPrices(data);
    } catch {}
  }, []);

  // Coin analizi
  const analyzeCoins = useCallback(async (coin, tf) => {
    setIsLoading(true);
    try {
      const history = await getCoinHistory(coin.sym, tf);
      const priceArr = history.prices;

      const {
        calcRSI, calcEMA, calcMACD, calcBollinger,
        calcStochRSI, calcATR, calcSupportResistance,
      } = await import('../services/cryptoService');

      const rsi      = calcRSI(priceArr);
      const macd     = calcMACD(priceArr);
      const ema20    = calcEMA(priceArr, Math.min(20,  priceArr.length));
      const ema50    = calcEMA(priceArr, Math.min(50,  priceArr.length));
      const ema200   = calcEMA(priceArr, Math.min(200, priceArr.length));
      const bbPos    = calcBollinger(priceArr);
      const stochRSI = calcStochRSI(priceArr);
      const atr      = calcATR(priceArr);
      const sr       = calcSupportResistance(priceArr);
      const emaCross = ema20 > ema50;

      setIndicators({ rsi, macd, ema20, ema50, ema200, bbPos, stochRSI, atr, emaCross });
      setSupportRes(sr);

      const sig = aiGenerateSignal(priceArr, selectedBot.id);
      setSignal(sig);

      setChartData({
        prices: priceArr,
        labels: generateTimeLabels(priceArr.length),
      });

      setSignalHistory(prev => [{
        id:          Date.now(),
        sym:         coin.sym,
        type:        sig.type,
        cls:         sig.cls,
        price:       priceArr[priceArr.length - 1],
        successRate: sig.successRate,
        time:        new Date().toLocaleTimeString('tr-TR'),
      }, ...prev.slice(0, 49)]);

    } catch (e) {
      console.error('Analiz hatası:', e);
    }
    setIsLoading(false);
  }, [selectedBot]);

  // Fear & Greed
  useEffect(() => {
    getFearGreedIndex().then(setFearGreed).catch(() => {});
    const id = setInterval(() => getFearGreedIndex().then(setFearGreed).catch(() => {}), 60000);
    return () => clearInterval(id);
  }, []);

  // Fiyat döngüsü
  useEffect(() => {
    fetchPrices();
    priceIntervalRef.current = setInterval(fetchPrices, 5000);
    return () => clearInterval(priceIntervalRef.current);
  }, [fetchPrices]);

  // Analiz döngüsü
  useEffect(() => {
    analyzeCoins(selectedCoin, timeframe);
    analysisRef.current = setInterval(() => analyzeCoins(selectedCoin, timeframe), 30000);
    return () => clearInterval(analysisRef.current);
  }, [selectedCoin, timeframe, analyzeCoins]);

  // Açık PnL güncelle
  useEffect(() => {
    if (demoPositions.length === 0) { setDemoTotalPnl(0); return; }
    let pnl = 0;
    demoPositions.forEach(pos => {
      const p    = prices[pos.sym] || pos.entryPrice;
      const diff = pos.type === 'LONG'
        ? (p - pos.entryPrice) / pos.entryPrice
        : (pos.entryPrice - p) / pos.entryPrice;
      pnl += pos.margin * pos.leverage * diff;
    });
    setDemoTotalPnl(parseFloat(pnl.toFixed(2)));
  }, [prices, demoPositions]);

  // Likidasyon + SL/TP kontrolü
  useEffect(() => {
    if (demoPositions.length === 0) return;
    demoPositions.forEach(pos => {
      const price = prices[pos.sym];
      if (!price) return;

      const isLiquidated = pos.type === 'LONG'
        ? price <= pos.liquidPrice
        : price >= pos.liquidPrice;

      const isStopLoss = pos.stopLoss && (
        pos.type === 'LONG' ? price <= pos.stopLoss : price >= pos.stopLoss
      );

      const isTakeProfit = pos.takeProfit && (
        pos.type === 'LONG' ? price >= pos.takeProfit : price <= pos.takeProfit
      );

      if (isLiquidated || isStopLoss || isTakeProfit) {
        const diff = pos.type === 'LONG'
          ? (price - pos.entryPrice) / pos.entryPrice
          : (pos.entryPrice - price) / pos.entryPrice;
        const pnl      = isLiquidated ? -pos.margin : parseFloat((pos.margin * pos.leverage * diff).toFixed(2));
        const returned = parseFloat((pos.margin + pnl).toFixed(2));
        const reason   = isLiquidated ? 'Likidasyon' : isStopLoss ? 'Stop-Loss' : 'Take-Profit';

        setDemoBalance(prev => parseFloat((Math.max(0, prev + (isLiquidated ? 0 : returned))).toFixed(2)));
        setDemoPositions(prev => prev.filter(p => p.id !== pos.id));
        setDemoHistory(prev => [{
          id:         pos.id,
          sym:        pos.sym,
          type:       pos.type,
          entryPrice: pos.entryPrice,
          closePrice: price,
          pnl,
          leverage:   pos.leverage,
          margin:     pos.margin,
          closeTime:  new Date().toLocaleTimeString('tr-TR'),
          closeDate:  new Date().toLocaleDateString('tr-TR'),
          reason,
        }, ...prev.slice(0, 99)]);
      }
    });
  }, [prices]);

  // Pozisyon aç
  const openPosition = useCallback((sym, type, margin, leverage, entryPrice, slPct = null, tpPct = null) => {
    if (margin > demoBalance || margin <= 0) return false;

    const liqPrice   = type === 'LONG'
      ? entryPrice * (1 - 0.9 / leverage)
      : entryPrice * (1 + 0.9 / leverage);

    const stopLoss   = slPct ? parseFloat((
      type === 'LONG'
        ? entryPrice * (1 - slPct / 100)
        : entryPrice * (1 + slPct / 100)
    ).toFixed(6)) : null;

    const takeProfit = tpPct ? parseFloat((
      type === 'LONG'
        ? entryPrice * (1 + tpPct / 100)
        : entryPrice * (1 - tpPct / 100)
    ).toFixed(6)) : null;

    const pos = {
      id:          Date.now(),
      sym, type, margin, leverage,
      entryPrice,
      size:        margin * leverage,
      liquidPrice: parseFloat(liqPrice.toFixed(6)),
      stopLoss,
      takeProfit,
      openTime:    new Date().toLocaleTimeString('tr-TR'),
      openDate:    new Date().toLocaleDateString('tr-TR'),
    };

    setDemoBalance(prev => parseFloat((prev - margin).toFixed(2)));
    setDemoPositions(prev => [...prev, pos]);
    return true;
  }, [demoBalance]);

  // Pozisyon kapat
  const closePosition = useCallback((pos) => {
    const price    = prices[pos.sym] || pos.entryPrice;
    const diff     = pos.type === 'LONG'
      ? (price - pos.entryPrice) / pos.entryPrice
      : (pos.entryPrice - price) / pos.entryPrice;
    const pnl      = parseFloat((pos.margin * pos.leverage * diff).toFixed(2));
    const returned = parseFloat((pos.margin + pnl).toFixed(2));

    setDemoBalance(prev => parseFloat((Math.max(0, prev + returned)).toFixed(2)));
    setDemoPositions(prev => prev.filter(p => p.id !== pos.id));
    setDemoHistory(prev => [{
      id:         pos.id,
      sym:        pos.sym,
      type:       pos.type,
      entryPrice: pos.entryPrice,
      closePrice: price,
      pnl,
      leverage:   pos.leverage,
      margin:     pos.margin,
      closeTime:  new Date().toLocaleTimeString('tr-TR'),
      closeDate:  new Date().toLocaleDateString('tr-TR'),
      reason:     'Manuel',
    }, ...prev.slice(0, 99)]);
  }, [prices]);

  // Hesap sıfırla
  const resetDemoAccount = useCallback(() => {
    setDemoBalance(10000);
    setDemoPositions([]);
    setDemoHistory([]);
    setDemoTotalPnl(0);
    saveAccount({ balance: 10000, positions: [], history: [] });
  }, []);

  const searchCoin      = useCallback(() => {}, []);
  const selectCoin      = useCallback((sym) => {
    const coin = COINS.find(c => c.sym === sym);
    if (coin) setSelectedCoin(coin);
  }, []);
  const changeBot       = useCallback((bot) => setSelectedBot(bot), []);
  const changeTimeframe = useCallback((tf)  => setTimeframe(tf), []);

  return {
    selectedCoin, prices, chartData, indicators, signal,
    selectedBot, timeframe, signalHistory, isLoading,
    fearGreed, supportRes,
    demoBalance, demoPositions, demoHistory, demoTotalPnl,
    searchCoin, selectCoin, changeBot, changeTimeframe,
    openPosition, closePosition, resetDemoAccount,
  };
}