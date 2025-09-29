const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fallback content extraction when detailed parsing fails
 * Extracts all headings (H1-H6) and paragraphs for basic analysis
 * @param {string} htmlData - Raw HTML content
 * @param {string} url - Original URL for context
 * @returns {Object} Basic content structure
 */
function extractFallbackContent(htmlData, url) {
  console.log(`🔄 Fallback extraction: processing ${htmlData.length} characters`);
  
  try {
    const $ = cheerio.load(htmlData);
    
    // Extract all headings H1-H6
    const headings = [];
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((index, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 0) {
          headings.push({
            level: i,
            text: text.substring(0, 200), // Limit length
            isQuestion: text.includes('?') || text.toLowerCase().match(/^(what|how|why|when|where|which|who|무엇|어떻게|왜|언제|어디서)/)
          });
        }
      });
    }
    
    // Extract all paragraphs
    const paragraphs = [];
    $('p').each((index, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && text.length < 1000) { // Filter out very short/long paragraphs
        paragraphs.push(text.substring(0, 300)); // Limit length
      }
    });
    
    // Basic title extraction
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim() || '';
    
    // Extract question-based headings for AEO analysis
    const h2Questions = headings
      .filter(h => h.level >= 2 && h.isQuestion)
      .map(h => h.text)
      .slice(0, 10); // Limit to 10 questions
    
    // Extract answer-first blocks (first paragraph after each heading)
    const answerFirstBlocks = [];
    headings.forEach(heading => {
      // Find the next paragraph after this heading level
      const headingSelector = `h${heading.level}:contains("${heading.text.substring(0, 50)}")`;
      try {
        const nextP = $(headingSelector).next('p');
        if (nextP.length) {
          const text = nextP.text().trim();
          if (text.length >= 30 && text.length <= 300) {
            answerFirstBlocks.push(text.substring(0, 200));
          }
        }
      } catch (e) {
        // Skip if selector fails
      }
    });
    
    // Create raw content summary
    const rawContent = [
      `TITLE: ${title}`,
      `HEADINGS (${headings.length}):`,
      ...headings.slice(0, 20).map(h => `H${h.level}: ${h.text}`),
      `PARAGRAPHS (${paragraphs.length}):`,
      ...paragraphs.slice(0, 10).map((p, i) => `P${i + 1}: ${p}`)
    ].join('\n');
    
    // Generate summary for "why it ranks"
    const factors = [];
    if (headings.length > 5) factors.push(`${headings.length} headings`);
    if (h2Questions.length > 0) factors.push(`${h2Questions.length} question headings`);
    if (paragraphs.length > 10) factors.push(`${paragraphs.length} content paragraphs`);
    if (title.length > 10) factors.push('descriptive title');
    
    const summary = factors.length > 0 ? factors.join(', ') : 'basic content structure';
    
    console.log(`✅ Fallback extraction completed: ${headings.length} headings, ${paragraphs.length} paragraphs`);
    
    return {
      title,
      metaDescription,
      h1,
      h2Questions,
      answerFirstBlocks: answerFirstBlocks.slice(0, 5),
      faq: [], // Can't reliably extract FAQs in fallback mode
      schemaTypes: [], // Can't extract schema in fallback mode
      headings,
      paragraphs: paragraphs.slice(0, 20), // Limit to first 20 paragraphs
      rawContent: rawContent.substring(0, 5000), // Limit total content
      summary
    };
    
  } catch (error) {
    console.error(`❌ Fallback extraction failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts content from a URL for PageAudit analysis
 * @param {string} url - The URL to parse
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} PageAudit-compatible object
 */
async function parseUrl(url, maxRetries = 3) {
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 [${attempt}/${maxRetries}] Parsing URL: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000, // Increased timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects
        }
      });

      console.log(`📄 Response received: ${response.status} ${response.statusText}`);
      console.log(`📏 Content length: ${response.data?.length || 0} characters`);
      console.log(`🌐 Final URL: ${response.request?.res?.responseUrl || url}`);
      
      if (!response.data || response.data.length < 100) {
        throw new Error('Response too short or empty');
      }
      
      const $ = cheerio.load(response.data);
      
      // Validate that we have actual HTML content
      if ($('html').length === 0 && $('body').length === 0) {
        throw new Error('No valid HTML structure found');
      }
      
      console.log(`✅ HTML parsed successfully, extracting AEO signals...`);
      
      // Extract basic signals with error handling
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
      const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      const h1 = $('h1').first().text().trim() || '';
      
      console.log(`📰 Title: ${title.substring(0, 100)}...`);
      
      // Extract H2 questions (look for question patterns)
      const h2Questions = [];
      $('h2, h3').each((i, el) => {
        const text = $(el).text().trim();
        if (text && (text.includes('?') || text.toLowerCase().match(/^(what|how|why|when|where|which|who|무엇|어떻게|왜|언제|어디서)/))) {
          h2Questions.push(text);
        }
      });
      
      // Extract answer-first blocks (paragraphs immediately following H2/H3)
      const answerFirstBlocks = [];
      $('h2, h3').each((i, el) => {
        const nextP = $(el).next('p');
        if (nextP.length) {
          const text = nextP.text().trim();
          if (text.length >= 30 && text.length <= 300) {
            answerFirstBlocks.push(text.substring(0, 200));
          }
        }
      });
      
      // Extract FAQ content with multiple selectors
      const faq = [];
      const faqSelectors = [
        '[class*="faq"]', '[id*="faq"]', '.accordion', '.qa',
        '[class*="question"]', '[class*="answer"]', '.toggle', '.collapse'
      ];
      
      faqSelectors.forEach(selector => {
        $(selector).each((i, el) => {
          if (faq.length >= 10) return; // Limit FAQ extraction
          
          const question = $(el).find('h3, h4, h5, .question, [class*="question"], dt').first().text().trim();
          const answer = $(el).find('p, .answer, [class*="answer"], dd').first().text().trim();
          
          if (question && answer && question.length > 5 && answer.length > 10) {
            faq.push(`Q: ${question.substring(0, 100)} A: ${answer.substring(0, 200)}`);
          }
        });
      });
      
      // Extract schema types from JSON-LD with better error handling
      const schemaTypes = [];
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const jsonText = $(el).html();
          if (jsonText && jsonText.trim()) {
            const jsonData = JSON.parse(jsonText);
            
            const extractTypes = (obj) => {
              if (obj && typeof obj === 'object') {
                if (obj['@type']) {
                  if (Array.isArray(obj['@type'])) {
                    schemaTypes.push(...obj['@type']);
                  } else {
                    schemaTypes.push(obj['@type']);
                  }
                }
                // Recursively check nested objects
                Object.values(obj).forEach(value => {
                  if (Array.isArray(value)) {
                    value.forEach(extractTypes);
                  } else if (typeof value === 'object') {
                    extractTypes(value);
                  }
                });
              }
            };
            
            if (Array.isArray(jsonData)) {
              jsonData.forEach(extractTypes);
            } else {
              extractTypes(jsonData);
            }
          }
        } catch (e) {
          console.log(`⚠️  Malformed JSON-LD found, skipping...`);
        }
      });
      
      // Generate "why it ranks" hypothesis with more factors
      const factors = [];
      
      if (h2Questions.length > 0) {
        factors.push(`${h2Questions.length} question-based headings`);
      }
      if (answerFirstBlocks.length > 0) {
        factors.push(`${answerFirstBlocks.length} answer-first content blocks`);
      }
      if (schemaTypes.length > 0) {
        factors.push(`structured data (${[...new Set(schemaTypes)].join(', ')})`);
      }
      if (faq.length > 0) {
        factors.push(`FAQ section with ${faq.length} items`);
      }
      
      // Check for authority signals
      const domain = new URL(url).hostname;
      if (domain.includes('.edu') || domain.includes('.gov')) {
        factors.push('authoritative domain (.edu/.gov)');
      }
      if (domain.includes('wikipedia') || domain.includes('wiki')) {
        factors.push('encyclopedia authority (Wikipedia)');
      }
      
      // Check content depth and quality
      const bodyText = $('body').text();
      const wordCount = bodyText.split(/\s+/).filter(word => word.length > 2).length;
      if (wordCount > 1500) {
        factors.push(`comprehensive content (${wordCount} words)`);
      }
      
      // Check for multimedia content
      const images = $('img').length;
      const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
      if (images > 5) factors.push(`${images} images`);
      if (videos > 0) factors.push(`${videos} videos`);
      
      // Check for internal linking
      const internalLinks = $('a[href^="/"], a[href*="' + domain + '"]').length;
      if (internalLinks > 10) factors.push(`strong internal linking (${internalLinks} links)`);
      
      const whyItRanks = factors.length > 0 
        ? `Likely ranks due to: ${factors.join(', ')}.`
        : 'Standard content structure without obvious AEO optimizations.';
      
      const duration = Date.now() - startTime;
      console.log(`✅ Successfully parsed ${url} in ${duration}ms`);
      console.log(`📊 Extracted: ${h2Questions.length} questions, ${schemaTypes.length} schema types, ${faq.length} FAQs`);
      
      return {
        url,
        signals: {
          title,
          metaDescription,
          h1,
          h2Questions,
          answerFirstBlocks,
          faq,
          schemaTypes: [...new Set(schemaTypes)], // Remove duplicates
          wordCount,
          domain,
          images,
          videos,
          internalLinks
        },
        whyItRanks,
        parseTime: duration
      };
      
    } catch (error) {
      console.error(`❌ [${attempt}/${maxRetries}] Failed to parse ${url}:`, error.message);
      
      if (attempt === maxRetries) {
        const duration = Date.now() - startTime;
        console.error(`💥 All ${maxRetries} attempts failed for ${url}`);
        
        // Try fallback extraction if we have any response data
        let fallbackContent = null;
        try {
          // Check multiple possible sources of HTML data
          let htmlData = null;
          if (error.response && error.response.data) {
            htmlData = error.response.data;
          } else if (typeof error.config !== 'undefined' && error.config.data) {
            htmlData = error.config.data;
          }
          
          if (htmlData && typeof htmlData === 'string' && htmlData.length > 100) {
            console.log(`🔄 Attempting fallback content extraction for ${url}...`);
            fallbackContent = extractFallbackContent(htmlData, url);
            console.log(`✅ Fallback extraction successful - recovered some content`);
          } else {
            console.log(`⚠️  No usable HTML data available for fallback extraction`);
          }
        } catch (fallbackError) {
          console.log(`⚠️  Fallback extraction also failed: ${fallbackError.message}`);
        }
        
        return {
          url,
          signals: {
            title: fallbackContent?.title || '',
            metaDescription: fallbackContent?.metaDescription || '',
            h1: fallbackContent?.h1 || '',
            h2Questions: fallbackContent?.h2Questions || [],
            answerFirstBlocks: fallbackContent?.answerFirstBlocks || [],
            faq: fallbackContent?.faq || [],
            schemaTypes: fallbackContent?.schemaTypes || [],
            headings: fallbackContent?.headings || [],
            paragraphs: fallbackContent?.paragraphs || [],
            rawContent: fallbackContent?.rawContent || '',
            error: error.message,
            domain: new URL(url).hostname,
            fallbackUsed: !!fallbackContent
          },
          whyItRanks: fallbackContent ? 
            `Partial analysis (fallback): ${fallbackContent.summary}` : 
            `Could not analyze: ${error.message}`,
          parseTime: duration
        };
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Parse multiple URLs in parallel with rate limiting and robust error handling
 * @param {string[]} urls - Array of URLs to parse
 * @param {number} maxConcurrent - Maximum concurrent requests
 * @param {number} batchDelay - Delay between batches in ms
 * @returns {Promise<Object[]>} Array of PageAudit objects
 */
async function parseUrls(urls, maxConcurrent = 2, batchDelay = 2000) {
  console.log(`\n🚀 Starting batch URL parsing: ${urls.length} URLs, ${maxConcurrent} concurrent`);
  
  const results = [];
  const totalBatches = Math.ceil(urls.length / maxConcurrent);
  
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batchNumber = Math.floor(i / maxConcurrent) + 1;
    const batch = urls.slice(i, i + maxConcurrent);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} URLs)`);
    batch.forEach((url, index) => {
      console.log(`   ${i + index + 1}. ${url}`);
    });
    
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const batchPromises = batch.map(async (url, index) => {
        try {
          const result = await parseUrl(url);
          console.log(`✅ Batch ${batchNumber} URL ${index + 1}: Success`);
          return result;
        } catch (error) {
          console.error(`❌ Batch ${batchNumber} URL ${index + 1}: ${error.message}`);
          
          // Try fallback extraction for batch errors too
          let fallbackContent = null;
          try {
            if (error.response && error.response.data && typeof error.response.data === 'string') {
              console.log(`🔄 Batch fallback extraction for ${url}...`);
              fallbackContent = extractFallbackContent(error.response.data, url);
            }
          } catch (fallbackError) {
            // Silent fallback failure in batch mode
          }
          
          return {
            url,
            signals: {
              title: fallbackContent?.title || '',
              metaDescription: fallbackContent?.metaDescription || '',
              h1: fallbackContent?.h1 || '',
              h2Questions: fallbackContent?.h2Questions || [],
              answerFirstBlocks: fallbackContent?.answerFirstBlocks || [],
              faq: fallbackContent?.faq || [],
              schemaTypes: fallbackContent?.schemaTypes || [],
              headings: fallbackContent?.headings || [],
              paragraphs: fallbackContent?.paragraphs || [],
              rawContent: fallbackContent?.rawContent || '',
              error: error.message,
              domain: new URL(url).hostname,
              fallbackUsed: !!fallbackContent
            },
            whyItRanks: fallbackContent ? 
              `Partial analysis (fallback): ${fallbackContent.summary}` : 
              `Could not analyze: ${error.message}`,
            parseTime: 0
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results and handle any additional failures
      const processedResults = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ Promise failed for ${batch[index]}:`, result.reason);
          return {
            url: batch[index],
            signals: {
              title: '',
              metaDescription: '',
              h1: '',
              h2Questions: [],
              answerFirstBlocks: [],
              faq: [],
              schemaTypes: [],
              error: result.reason?.message || 'Promise rejected',
              domain: new URL(batch[index]).hostname
            },
            whyItRanks: `Could not analyze: Promise rejected`,
            parseTime: 0
          };
        }
      });
      
      results.push(...processedResults);
      
      // Log batch completion stats
      const successful = processedResults.filter(r => !r.signals.error).length;
      const failed = processedResults.length - successful;
      console.log(`📊 Batch ${batchNumber} completed: ${successful} success, ${failed} failed`);
      
      // Rate limiting delay between batches
      if (i + maxConcurrent < urls.length) {
        console.log(`⏳ Waiting ${batchDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
      
    } catch (error) {
      console.error(`💥 Batch ${batchNumber} failed completely:`, error.message);
      
      // Add failed results for the entire batch
      const failedResults = batch.map(url => ({
        url,
        signals: {
          title: '',
          metaDescription: '',
          h1: '',
          h2Questions: [],
          answerFirstBlocks: [],
          faq: [],
          schemaTypes: [],
          error: `Batch failure: ${error.message}`,
          domain: new URL(url).hostname
        },
        whyItRanks: `Could not analyze: Batch failure`,
        parseTime: 0
      }));
      
      results.push(...failedResults);
    }
  }
  
  // Final statistics
  const totalSuccessful = results.filter(r => !r.signals.error).length;
  const totalFailed = results.length - totalSuccessful;
  const avgParseTime = results
    .filter(r => r.parseTime > 0)
    .reduce((sum, r) => sum + r.parseTime, 0) / Math.max(totalSuccessful, 1);
  
  console.log(`\n📊 URL Parsing Complete:`);
  console.log(`   ✅ Successful: ${totalSuccessful}/${results.length} (${Math.round(totalSuccessful/results.length*100)}%)`);
  console.log(`   ❌ Failed: ${totalFailed}/${results.length}`);
  console.log(`   ⏱️  Average parse time: ${Math.round(avgParseTime)}ms`);
  
  if (totalFailed > 0) {
    console.log(`\n⚠️  Failed URLs:`);
    results.filter(r => r.signals.error).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.url}: ${result.signals.error}`);
    });
  }
  
  return results;
}

module.exports = { parseUrl, parseUrls };
