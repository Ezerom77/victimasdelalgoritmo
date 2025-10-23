const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Configure Netlify Blobs with environment variables if provided
    const blobsOptions = (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN)
      ? { siteID: process.env.BLOBS_SITE_ID, token: process.env.BLOBS_TOKEN }
      : undefined;

    const store = getStore('view-counters', blobsOptions);
    
    if (event.httpMethod === 'GET') {
      const { slug } = event.queryStringParameters || {};
      
      if (!slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing slug parameter' }),
        };
      }

      // Get view count for specific post
      const viewData = await store.get(slug, { type: 'json' });
      const views = viewData ? viewData.views : 0;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          slug,
          views,
          lastUpdated: viewData?.lastUpdated || new Date().toISOString()
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

      // Get current count
      const currentData = await store.get(slug, { type: 'json' });
      const currentViews = currentData ? currentData.views : 0;
      
      // Increment count
      const newViews = currentViews + 1;
      const updatedData = {
        views: newViews,
        lastUpdated: new Date().toISOString(),
        slug: slug
      };
      
      // Save updated count
      await store.set(slug, JSON.stringify(updatedData));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          slug,
          views: newViews,
          lastUpdated: updatedData.lastUpdated
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};