import { getStore, getDeployStore } from '@netlify/blobs';

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    const deployID = process.env.DEPLOY_ID;

    const hasSiteID = Boolean(siteID);
    const hasToken = Boolean(token);
    const hasDeployID = Boolean(deployID);
    const siteIdFormatValid = typeof siteID === 'string' && /^[a-f0-9]{32}$/i.test(siteID);
    const tokenLen = typeof token === 'string' ? token.length : 0;

    let store;
    let storeMethod = 'site';

    // Always try manual credentials first; avoid zero-config path
    if (hasSiteID && hasToken) {
      try {
        store = getStore('view-counters', { siteID, token });
      } catch (err) {
        // If environment detection still fails, try deploy-specific store as diagnostic fallback
        if (err && err.name === 'MissingBlobsEnvironmentError' && hasDeployID) {
          store = getDeployStore('view-counters', { siteID, token, deployID });
          storeMethod = 'deploy';
        } else {
          throw err;
        }
      }
    } else {
      // If credentials are missing, throw with diagnostics
      console.error('views: missing credentials for Blobs', { hasSiteID, hasToken, hasDeployID });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing Netlify credentials (siteID/token)' }),
      };
    }

    console.log('views: blobs config', {
      hasSiteID,
      hasToken,
      hasDeployID,
      siteIdFormatValid,
      tokenLen,
      context: process.env.CONTEXT,
      storeMethod,
    });

    if (event.httpMethod === 'GET') {
      const { slug } = event.queryStringParameters || {};
      if (!slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing slug parameter' }),
        };
      }

      const viewData = await store.get(slug, { type: 'json' });
      const views = viewData && typeof viewData.views === 'number' ? viewData.views : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ slug, views, lastUpdated: new Date().toISOString() }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const slug = body && body.slug;
      const isInit = typeof body.initViews === 'number';

      if (!slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing slug in request body' }),
        };
      }

      if (isInit) {
        const initialViews = Math.max(0, Math.floor(body.initViews));
        await store.set(slug, JSON.stringify({ slug, views: initialViews, lastUpdated: new Date().toISOString() }));
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ slug, views: initialViews, lastUpdated: new Date().toISOString() }),
        };
      }

      const current = await store.get(slug, { type: 'json' });
      const currentViews = current && typeof current.views === 'number' ? current.views : 0;
      const nextViews = currentViews + 1;

      await store.set(slug, JSON.stringify({ slug, views: nextViews, lastUpdated: new Date().toISOString() }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ slug, views: nextViews, lastUpdated: new Date().toISOString() }),
      };
    }
  } catch (error) {
    console.error('Error in views function:', error);
  }

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}