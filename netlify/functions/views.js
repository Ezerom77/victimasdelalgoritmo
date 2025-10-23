import { getStore } from '@netlify/blobs';

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
    const store = getStore('view-counters');

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
        body: JSON.stringify({
          slug,
          views,
          lastUpdated: viewData?.lastUpdated || new Date().toISOString(),
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { slug } = JSON.parse(event.body || '{}');
      if (!slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing slug in request body' }),
        };
      }

      const currentData = await store.get(slug, { type: 'json' });
      const currentViews = currentData && typeof currentData.views === 'number' ? currentData.views : 0;

      const updatedData = {
        views: currentViews + 1,
        lastUpdated: new Date().toISOString(),
        slug,
      };

      await store.set(slug, JSON.stringify(updatedData));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          slug,
          views: updatedData.views,
          lastUpdated: updatedData.lastUpdated,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in views function:', error);

    // Fallback: try to serve static JSON value if available (best-effort)
    try {
      const { slug } = event.queryStringParameters || {};
      if (slug) {
        const res = await fetch(`${process.env.URL || ''}/data/views.json`);
        const json = await res.json();
        const post = json[slug];
        if (post && typeof post.views === 'number') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ slug, views: post.views, lastUpdated: new Date().toISOString() }),
          };
        }
      }
    } catch (_) {}

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}