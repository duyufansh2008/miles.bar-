const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// 如果你前面有 Nginx / Cloudflare / 宝塔反代，再按实际情况开启。
// 不确定代理链时，先不要乱开 true。
// app.set('trust proxy', true);

const BING_API =
  'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

const CACHE_TTL = 30 * 60 * 1000; // 30分钟
let wallpaperCache = {
  data: null,
  expiresAt: 0
};

app.get('/', (req, res) => {
  res.type('text/plain').send('startup-page api is running');
});

app.get('/api/bing-wallpaper', async (req, res) => {
  try {
    const now = Date.now();

    // 1) 命中缓存，直接返回
    if (wallpaperCache.data && wallpaperCache.expiresAt > now) {
      res.set('Cache-Control', 'public, max-age=300'); // 浏览器缓存 5 分钟
      return res.json({
        ...wallpaperCache.data,
        cached: true
      });
    }

    // 2) 请求 Bing，加超时
    const response = await fetch(BING_API, {
      headers: {
        'User-Agent': 'startup-page/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Bing request failed: ${response.status}`);
    }

    const data = await response.json();
    const image = data?.images?.[0];

    if (!image?.url) {
      throw new Error('No Bing image found');
    }

    const fullUrl = image.url.startsWith('http')
      ? image.url
      : `https://www.bing.com${image.url}`;

    const payload = {
      url: fullUrl,
      title: image.title || '',
      copyright: image.copyright || ''
    };

    // 3) 更新缓存
    wallpaperCache = {
      data: payload,
      expiresAt: now + CACHE_TTL
    };

    res.set('Cache-Control', 'public, max-age=300');
    return res.json({
      ...payload,
      cached: false
    });
  } catch (error) {
    console.error('[bing-wallpaper] failed:', error);

    // 4) 更清楚地区分错误类型
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError' ||
      error?.code === 'ABORT_ERR';

    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'Upstream Bing request timed out'
        : 'Failed to fetch Bing wallpaper'
    });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});