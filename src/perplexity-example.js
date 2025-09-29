/**
 * Example usage of Perplexity AI search functionality
 * This file demonstrates how to use the Perplexity AI client
 */

const Perplexity = require('@perplexity-ai/perplexity_ai');
const config = require('../config');

async function exampleSearch() {
  try {
    // Initialize the client
    const client = new Perplexity({
      apiKey: config.PERPLEXITY_API_KEY
    });

    // Perform a search
    const search = await client.search.create({
      query: "latest AI developments 2024",
      maxResults: 5,
      maxTokensPerPage: 1024
    });

    // Display results
    console.log('\n=== Perplexity AI Search Results ===\n');
    
    for (const result of search.results) {
      console.log(`${result.title}: ${result.url}`);
    }

    console.log(`\nFound ${search.results.length} results`);
    
  } catch (error) {
    console.error('Error performing search:', error.message);
    
    if (!config.PERPLEXITY_API_KEY) {
      console.error('\nPlease set your PERPLEXITY_API_KEY in the config.js file');
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleSearch();
}

module.exports = { exampleSearch };
