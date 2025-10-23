// Migration script to transfer view data from views.json to Netlify Blobs
// Run this once after deploying to Netlify to initialize the data

const fs = require('fs');
const path = require('path');

async function migrateViewData() {
  try {
    // Read the current views.json file
    const viewsPath = path.join(__dirname, '../public/data/views.json');
    const viewsData = JSON.parse(fs.readFileSync(viewsPath, 'utf8'));
    
    console.log('📊 Migrating view data to Netlify Blobs...');
    console.log('Found posts:', Object.keys(viewsData));
    
    // Generate curl commands for each post
    const baseUrl = process.env.NETLIFY_URL || 'https://your-site.netlify.app';
    
    console.log('\n🚀 Run these commands to initialize your view counters:');
    console.log('(Replace YOUR_SITE_URL with your actual Netlify URL)\n');
    
    for (const [slug, data] of Object.entries(viewsData)) {
      const views = data.views || 0;
      
      // Generate multiple POST requests to set the initial count
      console.log(`# Initialize ${slug} with ${views} views`);
      console.log(`for i in {1..${views}}; do`);
      console.log(`  curl -X POST "${baseUrl}/.netlify/functions/views" \\`);
      console.log(`    -H "Content-Type: application/json" \\`);
      console.log(`    -d '{"slug":"${slug}"}' \\`);
      console.log(`    --silent > /dev/null`);
      console.log(`done`);
      console.log('');
    }
    
    console.log('📝 Alternative: Manual initialization via Netlify CLI');
    console.log('If you have Netlify CLI installed, you can also run:');
    console.log('');
    
    for (const [slug, data] of Object.entries(viewsData)) {
      const views = data.views || 0;
      console.log(`netlify functions:invoke views --payload '{"slug":"${slug}","initViews":${views}}'`);
    }
    
  } catch (error) {
    console.error('❌ Error reading views.json:', error);
  }
}

migrateViewData();