exports.handler = async (event) => {
  const env = process.env;
  const siteID = env.NETLIFY_SITE_ID || env.SITE_ID || env.BLOBS_SITE_ID;
  const token = env.NETLIFY_BLOBS_TOKEN || env.BLOBS_TOKEN || env.NETLIFY_AUTH_TOKEN || env.NETLIFY_API_TOKEN || env.NETLIFY_PERSONAL_ACCESS_TOKEN;
  const deployID = env.DEPLOY_ID || env.NETLIFY_DEPLOY_ID || env.DEPLOY_ID;
  const blobsContext = env.NETLIFY_BLOBS_CONTEXT || env.CONTEXT || env.NODE_ENV;
  const nodeVersion = process.version;

  const result = {
    hasSiteID: Boolean(siteID),
    siteIdFormatValid: typeof siteID === 'string' && (/^[a-f0-9]{32}$/i.test(siteID) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(siteID)),
    hasToken: Boolean(token),
    tokenLen: token ? token.length : 0,
    hasDeployID: Boolean(deployID),
    blobsContext,
    nodeVersion,
    envSample: {
      NETLIFY_SITE_ID: siteID ? `${String(siteID).slice(0, 6)}...` : null,
      NETLIFY_BLOBS_TOKEN: token ? `${String(token).slice(0, 4)}...` : null,
      DEPLOY_ID: deployID ? `${String(deployID).slice(0, 6)}...` : null,
    },
  };

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(result),
  };
};