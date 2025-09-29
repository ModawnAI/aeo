require('dotenv').config();
const AEOChain = require('./aeo-chain');

async function testChain() {
  console.log('🧪 Testing AEO Chain Components');
  console.log('================================');
  
  const chain = new AEOChain();
  
  try {
    // Test 1: Load sample data
    console.log('Test 1: Loading sample data...');
    const { googleData, perplexityData } = await chain.loadSampleData();
    console.log(`✅ Loaded ${googleData.length} Google queries, ${perplexityData.length} Perplexity queries`);
    
    // Test 2: Load AEO Context
    console.log('Test 2: Loading AEO Context...');
    const aeoContext = await chain.loadAEOContext();
    console.log(`✅ Loaded AEO Context (${aeoContext.length} characters)`);
    
    // Test 3: Test Gemini API
    console.log('Test 3: Testing Gemini API...');
    const testResponse = await chain.callGemini('Respond with "API working" if you can see this message.');
    console.log(`✅ Gemini API response: ${testResponse}`);
    
    // Test 4: Test URL parser
    console.log('Test 4: Testing URL parser...');
    const { parseUrl } = require('./url-parser');
    const testUrl = 'https://en.wikipedia.org/wiki/Smart_TV';
    const pageAudit = await parseUrl(testUrl);
    console.log(`✅ Parsed ${testUrl}: ${pageAudit.signals.title}`);
    
    console.log('================================');
    console.log('🎉 All tests passed! Ready to run full chain.');
    console.log('Run: npm run aeo-chain');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('💡 Make sure to set GEMINI_API_KEY in your .env file');
    }
  }
}

if (require.main === module) {
  testChain();
}

module.exports = testChain;
