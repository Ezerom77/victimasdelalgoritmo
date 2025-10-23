import { getStore, getDeployStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
    const deployID = process.env.DEPLOY_ID;
    const blobsContext = process.env.NETLIFY_BLOBS_CONTEXT || process.env.CONTEXT;

    const hasSiteID = Boolean(siteID);
    const hasToken = Boolean(token);
    const hasDeployID = Boolean(deployID);
    const siteIdFormatValid = typeof siteID === 'string' && /^[a-f0-9]{32}$/i.test(siteID);
    const tokenLen = typeof token === 'string' ? token.length : 0;

    console.log('views: blobs pre-config', {
      hasSiteID,
      hasToken,
      hasDeployID,
      siteIdFormatValid,
      tokenLen,
      blobsContext,
      nodeVersion: process.version,
    });

    let store;
    let storeMethod = 'site-manual';
    let useFallback = false;

    const FALLBACK_FILE = path.join(process.cwd(), 'public', 'data', 'views.json');

    function readViewsFromFile(slug) {
      try {
        const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
        const json = JSON.parse(raw);
        const entry = json?.[slug];
        const views = entry && typeof entry.views === 'number' ? entry.views : 0;
        return views;
      } catch (e) {
        console.error('views: fallback read error', { message: e?.message });
        return 0;
      }
    }

    if (hasSiteID && hasToken) {
      try {
        store = getStore('view-counters', { siteID, token });
      } catch (err) {
        console.error('views: getStore manual failed', { name: err?.name, message: err?.message });
        // Try deploy store without options (auto env injection)
        try {
          store = getDeployStore('view-counters');
          storeMethod = 'deploy-auto';
        } catch (err2) {
          console.error('views: getDeployStore auto failed', { name: err2?.name, message: err2?.message });
          if (hasDeployID) {
            store = getDeployStore('view-counters', { siteID, token, deployID });
            storeMethod = 'deploy-manual';
          } else {
            // Instead of throwing, fallback to file
            useFallback = true
            storeMethod = 'fallback-file'
          }
        }
      }
    } else {
      console.error('views: missing credentials for Blobs', { hasSiteID, hasToken, hasDeployID });
      const storeMethod = 'fallback-file';
      console.log('views: using fallback file', { file: FALLBACK_FILE, storeMethod });

      if (event.httpMethod === 'GET') {
        const { slug } = event.queryStringParameters || {};
        if (!slug) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug parameter' }) };
        }
        const views = readViewsFromFile(slug);
        return { statusCode: 200, headers, body: JSON.stringify({ slug, views, lastUpdated: new Date().toISOString(), storeMethod }) };
      }

      if (event.httpMethod === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {};
        const slug = body && body.slug;
        const isInit = typeof body.initViews === 'number';
        if (!slug) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug in request body' }) };
        }
        const currentViews = readViewsFromFile(slug);
        const nextViews = isInit ? Math.max(0, Math.floor(body.initViews)) : currentViews + 1;
        // No persistence in fallback
        return { statusCode: 200, headers, body: JSON.stringify({ slug, views: nextViews, lastUpdated: new Date().toISOString(), storeMethod }) };
      }

      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed', storeMethod }) };
    }

    console.log('views: blobs config', {
      hasSiteID,
      hasToken,
      hasDeployID,
      siteIdFormatValid,
      tokenLen,
      context: blobsContext,
      storeMethod,
    });

    if (event.httpMethod === 'GET') {
      const { slug } = event.queryStringParameters || {};
      if (!slug) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug parameter' }) };
      }

      const viewData = await store.get(slug, { type: 'json' });
      const views = viewData && typeof viewData.views === 'number' ? viewData.views : 0;
      return { statusCode: 200, headers, body: JSON.stringify({ slug, views, lastUpdated: new Date().toISOString() }) };
    }

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const slug = body && body.slug;
      const isInit = typeof body.initViews === 'number';
      if (!slug) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug in request body' }) };
      }

      if (isInit) {
        const initialViews = Math.max(0, Math.floor(body.initViews));
        await store.set(slug, JSON.stringify({ slug, views: initialViews, lastUpdated: new Date().toISOString() }));
        return { statusCode: 200, headers, body: JSON.stringify({ slug, views: initialViews, lastUpdated: new Date().toISOString() }) };
      }

      const current = await store.get(slug, { type: 'json' });
      const currentViews = current && typeof current.views === 'number' ? current.views : 0;
      const nextViews = currentViews + 1;
      await store.set(slug, JSON.stringify({ slug, views: nextViews, lastUpdated: new Date().toISOString() }));
      return { statusCode: 200, headers, body: JSON.stringify({ slug, views: nextViews, lastUpdated: new Date().toISOString() }) };
    }
  } catch (error) {
    console.error('Error in views function:', error);
  }

  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
}