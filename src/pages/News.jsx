import { useState, useEffect } from 'react';
import styles from './News.module.css';

const RSS_SOURCES = [
  { name: 'CoinDesk',     url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', lang: 'EN' },
  { name: 'CoinTelegraph',url: 'https://cointelegraph.com/rss',                  lang: 'EN' },
  { name: 'Decrypt',      url: 'https://decrypt.co/feed',                         lang: 'EN' },
];

// RSS proxy ile çek
async function fetchRSS(url) {
  const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`;
  const res   = await fetch(proxy);
  const data  = await res.json();
  return data.items || [];
}

// Haberin kripto ile ilgisini belirle
function getSentiment(title) {
  const bullish = ['surge', 'rally', 'gain', 'bull', 'rise', 'high', 'up', 'buy', 'boost', 'record'];
  const bearish = ['crash', 'fall', 'drop', 'bear', 'low', 'down', 'sell', 'hack', 'ban', 'fear'];
  const t = title.toLowerCase();
  if (bullish.some(w => t.includes(w))) return { label: 'Pozitif', color: 'var(--green)', icon: '📈' };
  if (bearish.some(w => t.includes(w))) return { label: 'Negatif', color: 'var(--red)',   icon: '📉' };
  return { label: 'Nötr', color: 'var(--muted)', icon: '📰' };
}

// İlgili coinleri tespit et
function getRelatedCoins(text) {
  const coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];
  const t     = text.toUpperCase();
  return coins.filter(c => t.includes(c) || t.includes(c === 'BTC' ? 'BITCOIN' : c === 'ETH' ? 'ETHEREUM' : c));
}

export default function News() {
  const [news,     setNews]     = useState([]);
  const [isLoading,setIsLoading]= useState(true);
  const [filter,   setFilter]   = useState('all');
  const [source,   setSource]   = useState('all');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        RSS_SOURCES.map(s => fetchRSS(s.url).then(items =>
          items.map(item => ({
            id:          item.guid || item.link,
            title:       item.title,
            description: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
            link:        item.link,
            pubDate:     new Date(item.pubDate),
            source:      s.name,
            lang:        s.lang,
            sentiment:   getSentiment(item.title),
            coins:       getRelatedCoins(item.title + ' ' + (item.description || '')),
            image:       item.thumbnail || item.enclosure?.link || null,
          }))
        ))
      );

      const allNews = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => b.pubDate - a.pubDate);

      setNews(allNews);
    } catch (e) {
      console.error('Haber yükleme hatası:', e);
    }
    setIsLoading(false);
  };

  const filtered = news.filter(n => {
    if (source !== 'all' && n.source !== source) return false;
    if (filter === 'positive' && n.sentiment.label !== 'Pozitif') return false;
    if (filter === 'negative' && n.sentiment.label !== 'Negatif') return false;
    return true;
  });

  const posCount = news.filter(n => n.sentiment.label === 'Pozitif').length;
  const negCount = news.filter(n => n.sentiment.label === 'Negatif').length;
  const neuCount = news.filter(n => n.sentiment.label === 'Nötr').length;
  const sentiment = posCount > negCount ? 'Boğa' : negCount > posCount ? 'Ayı' : 'Nötr';

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)   return `${diff}s önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}sa önce`;
    return `${Math.floor(diff / 86400)}g önce`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>📰 Kripto Haber Akışı</div>
        <button className={styles.refreshBtn} onClick={loadNews} disabled={isLoading}>
          {isLoading ? '🔄 Yükleniyor...' : '🔄 Yenile'}
        </button>
      </div>

      {/* Piyasa duygusu */}
      <div className={styles.sentimentBar}>
        <div className={styles.sentimentItem}>
          <div className={styles.sentimentLabel}>Piyasa Duygusu</div>
          <div className={styles.sentimentValue} style={{
            color: sentiment === 'Boğa' ? 'var(--green)' : sentiment === 'Ayı' ? 'var(--red)' : 'var(--accent)'
          }}>
            {sentiment === 'Boğa' ? '🐂' : sentiment === 'Ayı' ? '🐻' : '😐'} {sentiment}
          </div>
        </div>
        <div className={styles.sentimentItem}>
          <div className={styles.sentimentLabel}>Pozitif Haberler</div>
          <div className={styles.sentimentValue} style={{ color: 'var(--green)' }}>{posCount}</div>
        </div>
        <div className={styles.sentimentItem}>
          <div className={styles.sentimentLabel}>Negatif Haberler</div>
          <div className={styles.sentimentValue} style={{ color: 'var(--red)' }}>{negCount}</div>
        </div>
        <div className={styles.sentimentItem}>
          <div className={styles.sentimentLabel}>Nötr Haberler</div>
          <div className={styles.sentimentValue} style={{ color: 'var(--muted)' }}>{neuCount}</div>
        </div>
        <div className={styles.sentimentItem}>
          <div className={styles.sentimentLabel}>Toplam Haber</div>
          <div className={styles.sentimentValue}>{news.length}</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Duygu:</span>
          {[
            { key: 'all',      label: 'Tümü'    },
            { key: 'positive', label: '📈 Pozitif' },
            { key: 'negative', label: '📉 Negatif' },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Kaynak:</span>
          <button className={`${styles.filterBtn} ${source === 'all' ? styles.filterActive : ''}`} onClick={() => setSource('all')}>
            Tümü
          </button>
          {RSS_SOURCES.map(s => (
            <button
              key={s.name}
              className={`${styles.filterBtn} ${source === s.name ? styles.filterActive : ''}`}
              onClick={() => setSource(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Haberler */}
      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Haberler yükleniyor...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Haber bulunamadı</div>
      ) : (
        <div className={styles.newsList}>
          {filtered.map(n => (
            <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" className={styles.newsCard}
              style={{ borderLeftColor: n.sentiment.color }}>
              <div className={styles.newsLeft}>
                <div className={styles.newsTop}>
                  <span className={styles.newsSource}>{n.source}</span>
                  <span className={styles.newsTime}>{timeAgo(n.pubDate)}</span>
                  <span className={styles.newsSentiment} style={{ color: n.sentiment.color }}>
                    {n.sentiment.icon} {n.sentiment.label}
                  </span>
                  {n.coins.length > 0 && (
                    <div className={styles.newsCoins}>
                      {n.coins.map(c => (
                        <span key={c} className={styles.coinTag}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.newsTitle}>{n.title}</div>
                <div className={styles.newsDesc}>{n.description}</div>
              </div>
              {n.image && (
                <img src={n.image} alt="" className={styles.newsImage} onError={e => e.target.style.display = 'none'} />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}