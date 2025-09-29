require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const path = require('path');
const { parseUrls } = require('./url-parser');

class AEOChain {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
    };
    this.model = 'gemini-flash-latest';
  }

  async callGemini(prompt, systemPrompt = '', stepName = 'Unknown', maxRetries = 3) {
    console.log(`\n🤖 [${stepName}] Calling Gemini API...`);
    console.log(`📝 Model: ${this.model}`);
    console.log(`📏 System Prompt Length: ${systemPrompt ? systemPrompt.length : 0} chars`);
    console.log(`📏 User Prompt Length: ${prompt.length} chars`);
    
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    console.log(`📏 Combined Prompt Length: ${fullPrompt.length} chars`);
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
    ];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`⏳ [${stepName}] Attempt ${attempt}/${maxRetries} - Sending request to Gemini...`);
        const startTime = Date.now();
        
        const response = await this.ai.models.generateContentStream({
          model: this.model,
          config: this.config,
          contents,
        });
        
        console.log(`📡 Streaming response received, processing chunks...`);
        let fullResponse = '';
        let chunkCount = 0;
        
        for await (const chunk of response) {
          if (chunk.text) {
            fullResponse += chunk.text;
            chunkCount++;
            if (chunkCount % 10 === 0) {
              console.log(`📦 Processed ${chunkCount} chunks, current length: ${fullResponse.length} chars`);
            }
          }
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ [${stepName}] Gemini response completed (attempt ${attempt}):`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📦 Total chunks: ${chunkCount}`);
        console.log(`   📏 Response length: ${fullResponse.length} chars`);
        console.log(`   🎯 First 100 chars: ${fullResponse.substring(0, 100)}...`);
        
        return fullResponse.trim();
        
      } catch (error) {
        console.error(`❌ [${stepName}] Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error(`💥 [${stepName}] All ${maxRetries} attempts failed. Final error:`, error);
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
        console.log(`⏳ [${stepName}] Waiting ${delay}ms before retry ${attempt + 1}...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async loadPrompt(filename) {
    console.log(`📂 Loading prompt file: ${filename}`);
    const promptPath = path.join(__dirname, '..', 'prompts', filename);
    console.log(`📍 Full path: ${promptPath}`);
    
    try {
      const content = await fs.readFile(promptPath, 'utf-8');
      console.log(`✅ Loaded prompt: ${content.length} characters`);
      return content;
    } catch (error) {
      console.error(`❌ Error loading prompt ${filename}:`, error.message);
      throw error;
    }
  }

  async loadAEOContext() {
    console.log(`📚 Loading AEO Context guide...`);
    const contextPath = path.join(__dirname, '..', 'AEOContext.md');
    console.log(`📍 Context path: ${contextPath}`);
    
    try {
      const content = await fs.readFile(contextPath, 'utf-8');
      console.log(`✅ AEO Context loaded: ${content.length} characters`);
      console.log(`📊 Contains ${content.split('\n').length} lines`);
      return content;
    } catch (error) {
      console.error(`❌ Error loading AEO Context:`, error.message);
      throw error;
    }
  }

  async loadSampleData() {
    console.log(`📊 Loading sample data files...`);
    const googlePath = path.join(__dirname, '..', 'prompts', 'sample_data', 'google-result.json');
    const perplexityPath = path.join(__dirname, '..', 'prompts', 'sample_data', 'perplexity-result.json');
    
    console.log(`📍 Google data path: ${googlePath}`);
    console.log(`📍 Perplexity data path: ${perplexityPath}`);
    
    try {
      console.log(`📥 Reading Google results...`);
      const googleData = JSON.parse(await fs.readFile(googlePath, 'utf-8'));
      console.log(`✅ Google data loaded: ${googleData.length} queries`);
      
      googleData.forEach((query, index) => {
        console.log(`   Query ${index + 1}: "${query.query}" - ${query.results?.length || 0} results`);
      });
      
      console.log(`📥 Reading Perplexity results...`);
      const perplexityData = JSON.parse(await fs.readFile(perplexityPath, 'utf-8'));
      console.log(`✅ Perplexity data loaded: ${perplexityData.length} queries`);
      
      perplexityData.forEach((query, index) => {
        console.log(`   Query ${index + 1}: "${query.query}" - ${query.aiEngines?.length || 0} AI engines`);
      });
      
      return { googleData, perplexityData };
    } catch (error) {
      console.error(`❌ Error loading sample data:`, error.message);
      throw error;
    }
  }

  parseJsonResponse(response, stepName = 'Unknown') {
    console.log(`\n🔍 [${stepName}] Parsing JSON response...`);
    console.log(`📏 Response length: ${response.length} characters`);
    
    try {
      // Try to extract JSON from markdown code blocks
      console.log(`🔎 Looking for JSON code blocks...`);
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        console.log(`✅ Found JSON code block, extracting...`);
        const jsonContent = jsonMatch[1];
        console.log(`📏 JSON content length: ${jsonContent.length} characters`);
        const parsed = JSON.parse(jsonContent);
        console.log(`✅ [${stepName}] JSON parsed successfully from code block`);
        console.log(`📊 Parsed object keys: ${Object.keys(parsed).join(', ')}`);
        return parsed;
      }
      
      // Try to parse the entire response as JSON
      console.log(`🔎 No code blocks found, trying to parse entire response as JSON...`);
      const parsed = JSON.parse(response);
      console.log(`✅ [${stepName}] JSON parsed successfully from raw response`);
      console.log(`📊 Parsed object keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (error) {
      console.error(`❌ [${stepName}] Failed to parse JSON response:`, error.message);
      console.error(`📄 Response preview (first 500 chars):`, response.substring(0, 500));
      console.error(`📄 Response preview (last 500 chars):`, response.substring(Math.max(0, response.length - 500)));
      throw new Error(`Invalid JSON response in ${stepName}: ${error.message}`);
    }
  }

  async step01_intake(googleData, perplexityData) {
    console.log('\n🔄 ===== STEP 01: INTAKE NORMALIZATION =====');
    console.log(`📊 Processing ${googleData.length} Google queries and ${perplexityData.length} Perplexity queries`);
    
    const systemPrompt = await this.loadPrompt('01_intake.md');
    
    const inputs = {
      GoogleSearchInput: googleData,
      PerplexityInput: perplexityData
    };
    
    console.log(`📋 Input summary:`);
    console.log(`   🔍 Google queries: ${googleData.map(q => q.query).join(', ')}`);
    console.log(`   🤖 Perplexity queries: ${perplexityData.map(q => q.query).join(', ')}`);
    
    const prompt = `Process the following inputs and output a single NormalizedIntake JSON:

${JSON.stringify(inputs, null, 2)}`;

    console.log(`📏 Total input size: ${JSON.stringify(inputs).length} characters`);
    
    const response = await this.callGemini(prompt, systemPrompt, 'Step01-Intake');
    const result = this.parseJsonResponse(response, 'Step01-Intake');
    
    console.log(`✅ Step 01 completed successfully:`);
    console.log(`   🏷️  Brand: ${result.brand || 'Not specified'}`);
    console.log(`   🎯 Target queries: ${result.targetQueries?.length || 0}`);
    console.log(`   🏢 Competitors: ${result.competitors?.length || 0}`);
    console.log(`   ⚠️  Issues: ${result.issues?.length || 0}`);
    
    return result;
  }

  async step02_contextPriming() {
    console.log('\n🔄 ===== STEP 02: CONTEXT PRIMING =====');
    console.log(`📚 Converting AEO Context guide into operational heuristics`);
    
    const systemPrompt = await this.loadPrompt('02_context_priming.md');
    const aeoContext = await this.loadAEOContext();
    
    console.log(`📋 Context processing:`);
    console.log(`   📄 AEO guide lines: ${aeoContext.split('\n').length}`);
    console.log(`   📏 Total characters: ${aeoContext.length}`);
    console.log(`   🎯 Extracting pillars and scoring criteria...`);
    
    const prompt = `Convert the following AEO Context into AEOHeuristics JSON:

${aeoContext}`;

    const response = await this.callGemini(prompt, systemPrompt, 'Step02-Context');
    const result = this.parseJsonResponse(response, 'Step02-Context');
    
    console.log(`✅ Step 02 completed successfully:`);
    console.log(`   🏛️  Pillars extracted: ${result.AEOHeuristics?.pillars?.length || 0}`);
    console.log(`   ✅ Check categories: ${result.AEOHeuristics?.pillars?.length || 0}`);
    
    if (result.AEOHeuristics?.pillars) {
      result.AEOHeuristics.pillars.forEach((pillar, index) => {
        console.log(`   ${index + 1}. ${pillar.name}: ${pillar.maxPoints} points`);
      });
    }
    
    return result;
  }

  async step03_scoring(normalizedIntake, aeoHeuristics) {
    console.log('\n🔄 ===== STEP 03: AEO SCORING =====');
    console.log(`📊 Scoring brand performance across AEO pillars`);
    
    const systemPrompt = await this.loadPrompt('03_scoring.md');
    
    const inputs = {
      NormalizedIntake: normalizedIntake,
      AEOHeuristics: aeoHeuristics
    };
    
    console.log(`📋 Scoring inputs:`);
    console.log(`   🏷️  Brand: ${normalizedIntake.brand}`);
    console.log(`   🎯 Queries: ${normalizedIntake.targetQueries?.join(', ')}`);
    console.log(`   🏛️  Pillars to score: ${aeoHeuristics.AEOHeuristics?.pillars?.length || 0}`);
    console.log(`   📏 Input size: ${JSON.stringify(inputs).length} characters`);
    
    const prompt = `Score the target using the AEO scorecard. Inputs:

${JSON.stringify(inputs, null, 2)}`;

    const response = await this.callGemini(prompt, systemPrompt, 'Step03-Scoring');
    const result = this.parseJsonResponse(response, 'Step03-Scoring');
    
    console.log(`✅ Step 03 completed successfully:`);
    console.log(`   🎯 Total AEO Score: ${result.totalScore}/${result.maxScore || 100}`);
    console.log(`   🏛️  Pillar breakdown:`);
    
    if (result.pillars) {
      result.pillars.forEach((pillar, index) => {
        console.log(`   ${index + 1}. ${pillar.name}: ${pillar.subtotal} points`);
        console.log(`      📊 ${pillar.items?.length || 0} scoring items evaluated`);
      });
    }
    
    return result;
  }

  async step04_recommendations(normalizedIntake, aeoScore, pageAudits = []) {
    console.log('\n🔄 ===== STEP 04: ACTIONABLE RECOMMENDATIONS =====');
    console.log(`💡 Generating prioritized improvements based on AEO gaps`);
    
    const systemPrompt = await this.loadPrompt('04_recommendations.md');
    
    const inputs = {
      NormalizedIntake: normalizedIntake,
      AEOScore: aeoScore,
      PageAudits: pageAudits
    };
    
    console.log(`📋 Recommendation inputs:`);
    console.log(`   🎯 Current AEO score: ${aeoScore.totalScore}/${aeoScore.maxScore || 100}`);
    console.log(`   🏛️  Pillars analyzed: ${aeoScore.pillars?.length || 0}`);
    console.log(`   🔍 Page audits: ${Object.keys(pageAudits).length} queries`);
    
    // Count total audited pages
    const totalAudits = Object.values(pageAudits).reduce((sum, audits) => sum + audits.length, 0);
    console.log(`   📄 Total pages audited: ${totalAudits}`);
    
    console.log(`   📏 Input size: ${JSON.stringify(inputs).length} characters`);
    
    const prompt = `Generate prioritized recommendations. Inputs:

${JSON.stringify(inputs, null, 2)}`;

    const response = await this.callGemini(prompt, systemPrompt, 'Step04-Recommendations');
    const result = this.parseJsonResponse(response, 'Step04-Recommendations');
    
    console.log(`✅ Step 04 completed successfully:`);
    console.log(`   💡 Total recommendations: ${result.recommendations?.length || 0}`);
    
    if (result.recommendations) {
      const priorityCounts = { P0: 0, P1: 0, P2: 0 };
      result.recommendations.forEach(item => {
        priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
      });
      
      console.log(`   🚨 P0 (Critical): ${priorityCounts.P0}`);
      console.log(`   ⚠️  P1 (High): ${priorityCounts.P1}`);
      console.log(`   📝 P2 (Medium): ${priorityCounts.P2}`);
    }
    
    return result;
  }

  async extractTopUrls(googleData, limit = 3) {
    const urlsByQuery = {};
    
    for (const queryData of googleData) {
      if (queryData.results) {
        // Get top URLs from each query, excluding the target brand's URLs
        const topUrls = queryData.results
          .filter(result => !result.brandMentioned || result.relevanceScore === 0)
          .slice(0, limit)
          .map(result => ({
            url: result.url,
            query: queryData.query,
            position: result.position,
            title: result.title,
            domain: result.domain
          }));
        
        urlsByQuery[queryData.query] = topUrls;
      }
    }
    
    return urlsByQuery;
  }

  async runPageAudits(googleData) {
    console.log('\n🔄 ===== PAGE AUDITS: COMPETITOR ANALYSIS =====');
    console.log(`🔍 Analyzing top competitor URLs to understand ranking factors`);
    
    const urlsByQuery = await this.extractTopUrls(googleData);
    const auditsByQuery = {};
    
    console.log(`📊 URL extraction summary:`);
    Object.entries(urlsByQuery).forEach(([query, urls]) => {
      console.log(`   "${query}": ${urls.length} URLs`);
    });
    
    for (const [query, urls] of Object.entries(urlsByQuery)) {
      console.log(`\n📊 ===== ANALYZING QUERY: "${query}" =====`);
      console.log(`🔗 Found ${urls.length} competitor URLs to analyze`);
      
      if (urls.length === 0) {
        console.log(`⚠️  No URLs to audit for query: ${query}`);
        auditsByQuery[query] = [];
        continue;
      }
      
      const urlList = urls.map(u => u.url);
      console.log(`📋 URLs to analyze:`);
      urls.forEach((urlData, index) => {
        console.log(`   ${index + 1}. Position ${urlData.position}: ${urlData.domain}`);
        console.log(`      🔗 ${urlData.url}`);
        console.log(`      📰 ${urlData.title}`);
      });
      
      console.log(`⏳ Starting content extraction for ${urlList.length} URLs...`);
      const audits = await parseUrls(urlList);
      
      console.log(`✅ Content extraction completed for "${query}"`);
      console.log(`📊 Successfully parsed: ${audits.filter(a => !a.signals?.error).length}/${audits.length} URLs`);
      
      // Enhance audits with query context
      auditsByQuery[query] = audits.map((audit, index) => ({
        ...audit,
        query: query,
        position: urls[index]?.position,
        title: urls[index]?.title,
        domain: urls[index]?.domain
      }));
      
      // Log audit insights
      auditsByQuery[query].forEach((audit, index) => {
        if (!audit.signals?.error) {
          console.log(`   📄 ${audit.domain}: ${audit.signals?.h2Questions?.length || 0} H2 questions, ${audit.signals?.schemaTypes?.length || 0} schema types`);
        } else {
          console.log(`   ❌ ${audit.domain}: ${audit.signals.error}`);
        }
      });
    }
    
    const totalSuccessful = Object.values(auditsByQuery)
      .flat()
      .filter(audit => !audit.signals?.error).length;
    
    console.log(`\n✅ Page audits completed:`);
    console.log(`   📊 Total pages analyzed: ${totalSuccessful}`);
    console.log(`   🎯 Queries covered: ${Object.keys(auditsByQuery).length}`);
    
    return auditsByQuery;
  }

  async saveResults(results, filename = 'aeo-results.json') {
    const outputPath = path.join(__dirname, '..', 'output', filename);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${outputPath}`);
    
    // Copy visualizer to output directory for easy access
    await this.setupVisualizer();
  }


  async setupVisualizer() {
    try {
      const outputDir = path.join(__dirname, '..', 'output');
      const visualizerDest = path.join(outputDir, 'dashboard.html');
      
      // Check if dashboard.html already exists in output directory
      let visualizerSource;
      try {
        await fs.access(visualizerDest);
        console.log(`📊 Dashboard already exists at: ${visualizerDest}`);
        return visualizerDest;
      } catch {
        // Dashboard doesn't exist, copy from src/visualizer.html
        visualizerSource = path.join(__dirname, 'visualizer.html');
      }
      
      const visualizerContent = await fs.readFile(visualizerSource, 'utf-8');
      await fs.writeFile(visualizerDest, visualizerContent);
      
      console.log(`📊 Dashboard created at: ${visualizerDest}`);
      console.log(`🌐 To view dashboard, run: cd /Users/kjyoo/Perpex && npm run dashboard`);
      console.log(`🌐 Then open: http://localhost:8080/dashboard.html`);
      
      return visualizerDest;
    } catch (error) {
      console.error('Error setting up visualizer:', error.message);
      return null;
    }
  }

  async savePartialResults(stepName, data) {
    try {
      const partialPath = path.join(__dirname, '..', 'output', `partial-${stepName.toLowerCase()}.json`);
      await fs.mkdir(path.dirname(partialPath), { recursive: true });
      await fs.writeFile(partialPath, JSON.stringify(data, null, 2));
      console.log(`💾 [${stepName}] Partial results saved to: ${partialPath}`);
    } catch (error) {
      console.error(`⚠️  Failed to save partial results for ${stepName}:`, error.message);
    }
  }

  async run() {
    const startTime = Date.now();
    console.log('🚀 Starting AEO Chain Analysis');
    console.log('=====================================');
    
    let normalizedIntake, aeoHeuristics, aeoScore, pageAudits, recommendations;
    
    try {
      // Load sample data
      console.log('📊 Loading input data...');
      const { googleData, perplexityData } = await this.loadSampleData();
      
      // Step 01: Intake Normalization
      try {
        normalizedIntake = await this.step01_intake(googleData, perplexityData);
        await this.savePartialResults('Step01', normalizedIntake);
        console.log('✅ Step 01 completed and saved');
      } catch (error) {
        console.error('❌ Step 01 failed:', error.message);
        throw new Error(`Step 01 (Intake Normalization) failed: ${error.message}`);
      }
      
      // Step 02: Context Priming
      try {
        aeoHeuristics = await this.step02_contextPriming();
        await this.savePartialResults('Step02', aeoHeuristics);
        console.log('✅ Step 02 completed and saved');
      } catch (error) {
        console.error('❌ Step 02 failed:', error.message);
        throw new Error(`Step 02 (Context Priming) failed: ${error.message}`);
      }
      
      // Step 03: Scoring
      try {
        aeoScore = await this.step03_scoring(normalizedIntake, aeoHeuristics);
        await this.savePartialResults('Step03', aeoScore);
        console.log('✅ Step 03 completed and saved');
      } catch (error) {
        console.error('❌ Step 03 failed:', error.message);
        throw new Error(`Step 03 (AEO Scoring) failed: ${error.message}`);
      }
      
      // Page Audits (optional but recommended)
      try {
        console.log('\n🔍 Starting Page Audits (this may take several minutes)...');
        pageAudits = await this.runPageAudits(googleData);
        await this.savePartialResults('PageAudits', pageAudits);
        
        // Validate page audits results
        const totalPages = Object.values(pageAudits).reduce((sum, audits) => sum + audits.length, 0);
        const successfulPages = Object.values(pageAudits)
          .flat()
          .filter(audit => !audit.signals?.error).length;
        
        console.log(`✅ Page Audits completed and saved:`);
        console.log(`   📊 Total pages processed: ${totalPages}`);
        console.log(`   ✅ Successful extractions: ${successfulPages}`);
        console.log(`   ❌ Failed extractions: ${totalPages - successfulPages}`);
        
        if (successfulPages === 0) {
          console.log('⚠️  No pages were successfully analyzed, but continuing with empty audits');
          pageAudits = {};
        }
        
      } catch (error) {
        console.error('⚠️  Page Audits failed (non-critical):', error.message);
        console.log('📝 This is not critical - the analysis will continue without competitor page insights');
        console.log('💡 Common causes: network issues, blocked requests, or invalid URLs');
        pageAudits = {}; // Continue with empty audits
      }
      
      // Step 04: Recommendations
      try {
        recommendations = await this.step04_recommendations(normalizedIntake, aeoScore, pageAudits);
        await this.savePartialResults('Step04', recommendations);
        console.log('✅ Step 04 completed and saved');
      } catch (error) {
        console.error('❌ Step 04 failed:', error.message);
        throw new Error(`Step 04 (Recommendations) failed: ${error.message}`);
      }
      
      // Compile final results with multi-query analysis
      const queries = normalizedIntake.targetQueries || ['스마트 TV', '프리미엄 가전', '에어컨'];
      const totalAudits = Object.values(pageAudits).reduce((sum, audits) => sum + audits.length, 0);
      
      const results = {
        timestamp: new Date().toISOString(),
        brand: normalizedIntake.brand || 'LG',
        queries: queries,
        queryAnalysis: this.generateQueryAnalysis(googleData, perplexityData),
        steps: {
          normalizedIntake,
          aeoHeuristics,
          aeoScore,
          pageAudits,
          recommendations
        },
        summary: {
          totalScore: aeoScore.totalScore || 0,
          scoreCategory: this.getScoreCategory(aeoScore.totalScore || 0),
          queriesAnalyzed: queries.length,
          topRecommendations: recommendations.recommendations?.slice(0, 5) || [],
          competitorInsights: totalAudits,
          queryPerformance: this.summarizeQueryPerformance(googleData, perplexityData)
        }
      };
      
      // Save results
      await this.saveResults(results);
      
      console.log('=====================================');
      const endTime = Date.now();
      const totalDuration = Math.round((endTime - startTime) / 1000);
      
      console.log('🎉 AEO Chain Analysis Complete!');
      console.log(`⏱️  Total Duration: ${totalDuration} seconds`);
      console.log(`📊 Total AEO Score: ${aeoScore.totalScore || 0}/100 (${this.getScoreCategory(aeoScore.totalScore || 0)})`);
      console.log(`🎯 Analyzed ${queries.length} query categories: ${queries.join(', ')}`);
      console.log(`📋 Generated ${recommendations.recommendations?.length || 0} recommendations`);
      console.log(`🔍 Analyzed ${totalAudits} competitor pages across all queries`);
      console.log(`📊 Dashboard available at: output/dashboard.html`);
      
      return results;
      
    } catch (error) {
      const endTime = Date.now();
      const failedDuration = Math.round((endTime - startTime) / 1000);
      
      console.error('❌ AEO Chain failed after', failedDuration, 'seconds');
      console.error('💡 Partial results may be available in output/partial-*.json files');
      console.error('🔧 You can inspect these files to see what was completed before the failure');
      
      // Try to save whatever we have so far
      if (normalizedIntake || aeoHeuristics || aeoScore || pageAudits) {
        console.log('💾 Attempting to save partial progress...');
        
        const partialResults = {
          timestamp: new Date().toISOString(),
          status: 'partial_failure',
          error: error.message,
          completedSteps: {
            ...(normalizedIntake && { normalizedIntake }),
            ...(aeoHeuristics && { aeoHeuristics }),
            ...(aeoScore && { aeoScore }),
            ...(pageAudits && { pageAudits }),
            ...(recommendations && { recommendations })
          }
        };
        
        try {
          await this.saveResults(partialResults, 'aeo-results-partial.json');
          console.log('💾 Partial results saved to output/aeo-results-partial.json');
        } catch (saveError) {
          console.error('❌ Failed to save partial results:', saveError.message);
        }
      }
      
      throw error;
    }
  }

  generateQueryAnalysis(googleData, perplexityData) {
    const analysis = {};
    
    // Analyze Google performance by query
    for (const queryData of googleData) {
      const query = queryData.query;
      analysis[query] = {
        google: {
          brandVisibility: queryData.brandVisibility || {},
          competitorAnalysis: queryData.competitorAnalysis || {},
          topCompetitors: this.extractTopCompetitors(queryData)
        }
      };
    }
    
    // Analyze Perplexity performance by query
    for (const queryData of perplexityData) {
      const query = queryData.query;
      if (!analysis[query]) analysis[query] = {};
      
      analysis[query].perplexity = {
        brandComparison: queryData.brandComparison || {},
        overallScore: queryData.overallScore || {},
        aiEngines: queryData.aiEngines || []
      };
    }
    
    return analysis;
  }

  extractTopCompetitors(queryData) {
    if (!queryData.results) return [];
    
    return queryData.results
      .filter(result => result.brandMentioned === false)
      .slice(0, 5)
      .map(result => ({
        domain: result.domain,
        position: result.position,
        title: result.title
      }));
  }

  extractQueryAnalysis(googleData, perplexityData) {
    const analysis = {};
    
    // Process Google data
    for (const queryData of googleData) {
      const query = queryData.query;
      analysis[query] = {
        google: {
          brandVisibility: queryData.brandVisibility || {},
          competitorAnalysis: queryData.competitorAnalysis || {},
          results: queryData.results || []
        }
      };
    }
    
    // Process Perplexity data
    for (const queryData of perplexityData) {
      const query = queryData.query;
      if (!analysis[query]) analysis[query] = {};
      
      analysis[query].perplexity = {
        brandComparison: queryData.brandComparison || {},
        overallScore: queryData.overallScore || {},
        aiEngines: queryData.aiEngines || []
      };
    }
    
    return analysis;
  }

  summarizeQueryPerformance(googleData, perplexityData) {
    const performance = {};
    
    // Google performance summary
    for (const queryData of googleData) {
      const query = queryData.query;
      performance[query] = {
        google: {
          topPosition: queryData.brandVisibility?.topPosition || null,
          totalMentions: queryData.brandVisibility?.totalMentions || 0,
          visibilityScore: queryData.brandVisibility?.visibilityScore || 0
        }
      };
    }
    
    // Perplexity performance summary
    for (const queryData of perplexityData) {
      const query = queryData.query;
      if (!performance[query]) performance[query] = {};
      
      performance[query].perplexity = {
        aiVisibility: queryData.overallScore?.aiVisibility || 0,
        competitivePosition: queryData.overallScore?.competitivePosition || 0,
        combined: queryData.overallScore?.combined || 0
      };
    }
    
    return performance;
  }

  getScoreCategory(score) {
    if (score >= 90) return 'AEO Dominator';
    if (score >= 75) return 'AEO Leader';
    if (score >= 50) return 'AEO Competitor';
    if (score >= 25) return 'Foundational Stage';
    return 'AEO Novice';
  }

  async step01_intake(googleData, perplexityData) {
    console.log(`\n🔄 ===== STEP 01: INTAKE NORMALIZATION =====`);
    console.log(`📊 Processing ${googleData.length} Google queries and ${perplexityData.length} Perplexity queries`);
    
    const promptPath = path.join(__dirname, '..', 'prompts', '01_intake.md');
    console.log(`📂 Loading prompt file: 01_intake.md`);
    console.log(`📍 Full path: ${promptPath}`);
    
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt: ${systemPrompt.length} characters`);
    
    const inputData = {
      googleData,
      perplexityData
    };
    
    console.log(`📋 Input summary:`);
    console.log(`   🔍 Google queries: ${googleData.map(q => q.query).join(', ')}`);
    console.log(`   🤖 Perplexity queries: ${perplexityData.map(q => q.query).join(', ')}`);
    
    const inputSize = JSON.stringify(inputData).length;
    console.log(`📏 Total input size: ${inputSize} characters`);
    
    const userPrompt = `Please normalize the following Google and Perplexity search data:

GOOGLE DATA:
${JSON.stringify(googleData, null, 2)}

PERPLEXITY DATA:
${JSON.stringify(perplexityData, null, 2)}`;
    
    const response = await this.callGemini(userPrompt, systemPrompt, 'Step01-Intake');
    const result = this.parseJsonResponse(response, 'Step01-Intake');
    
    console.log(`✅ Step 01 completed successfully:`);
    console.log(`   🏷️  Brand: ${result.brand || 'Not specified'}`);
    console.log(`   🎯 Target queries: ${result.targetQueries?.length || 0}`);
    console.log(`   🏢 Competitors: ${result.competitors?.length || 0}`);
    console.log(`   ⚠️  Issues: ${result.issues?.length || 0}`);
    
    await this.savePartialResults('step01', result);
    console.log(`✅ Step 01 completed and saved`);
    
    return result;
  }

  async step02_contextPriming() {
    console.log(`\n🔄 ===== STEP 02: CONTEXT PRIMING =====`);
    console.log(`📚 Converting AEO Context guide into operational heuristics`);
    
    const promptPath = path.join(__dirname, '..', 'prompts', '02_context_priming.md');
    console.log(`📂 Loading prompt file: 02_context_priming.md`);
    console.log(`📍 Full path: ${promptPath}`);
    
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt: ${systemPrompt.length} characters`);
    
    const aeoContext = await this.loadAEOContext();
    
    console.log(`📋 Context processing:`);
    console.log(`   📄 AEO guide lines: ${aeoContext.split('\n').length}`);
    console.log(`   📏 Total characters: ${aeoContext.length}`);
    console.log(`   🎯 Extracting pillars and scoring criteria...`);
    
    const userPrompt = `Please convert the following AEO Context into operational heuristics:

AEO_CONTEXT_TEXT:
${aeoContext}`;
    
    const response = await this.callGemini(userPrompt, systemPrompt, 'Step02-Context');
    const result = this.parseJsonResponse(response, 'Step02-Context');
    
    console.log(`✅ Step 02 completed successfully:`);
    console.log(`   🏛️  Pillars extracted: ${result.AEOHeuristics?.pillars?.length || 0}`);
    console.log(`   ✅ Check categories: ${result.AEOHeuristics?.pillars?.length || 0}`);
    
    if (result.AEOHeuristics?.pillars) {
      result.AEOHeuristics.pillars.forEach((pillar, i) => {
        console.log(`   ${i + 1}. ${pillar.name}: ${pillar.maxPoints} points`);
      });
    }
    
    await this.savePartialResults('step02', result);
    console.log(`✅ Step 02 completed and saved`);
    
    return result;
  }

  async step03_scoring(normalizedIntake, aeoHeuristics) {
    console.log(`\n🔄 ===== STEP 03: AEO SCORING =====`);
    console.log(`📊 Scoring brand performance across AEO pillars`);
    
    const promptPath = path.join(__dirname, '..', 'prompts', '03_scoring.md');
    console.log(`📂 Loading prompt file: 03_scoring.md`);
    console.log(`📍 Full path: ${promptPath}`);
    
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt: ${systemPrompt.length} characters`);
    
    const inputData = {
      normalizedIntake,
      aeoHeuristics
    };
    
    console.log(`📋 Scoring inputs:`);
    console.log(`   🏷️  Brand: ${normalizedIntake.brand || 'undefined'}`);
    console.log(`   🎯 Queries: ${normalizedIntake.targetQueries?.join(', ') || 'None'}`);
    console.log(`   🏛️  Pillars to score: ${aeoHeuristics.AEOHeuristics?.pillars?.length || 0}`);
    
    const inputSize = JSON.stringify(inputData).length;
    console.log(`📏 Input size: ${inputSize} characters`);
    
    const userPrompt = `Please score the brand's AEO performance using the following data:

NORMALIZED INTAKE:
${JSON.stringify(normalizedIntake, null, 2)}

AEO HEURISTICS:
${JSON.stringify(aeoHeuristics, null, 2)}`;
    
    const response = await this.callGemini(userPrompt, systemPrompt, 'Step03-Scoring');
    const result = this.parseJsonResponse(response, 'Step03-Scoring');
    
    console.log(`✅ Step 03 completed successfully:`);
    console.log(`   🎯 Total AEO Score: ${result.totalScore}/${result.maxScore}`);
    console.log(`   🏛️  Pillar breakdown:`);
    
    if (result.pillars) {
      result.pillars.forEach((pillar, i) => {
        console.log(`   ${i + 1}. ${pillar.name}: ${pillar.subtotal} points`);
        console.log(`      📊 ${pillar.items?.length || 0} scoring items evaluated`);
      });
    }
    
    await this.savePartialResults('step03', result);
    console.log(`✅ Step 03 completed and saved`);
    
    return result;
  }

  async step04_recommendations(normalizedIntake, aeoScore, pageAudits) {
    console.log(`\n🔄 ===== STEP 04: ACTIONABLE RECOMMENDATIONS =====`);
    console.log(`💡 Generating prioritized improvements based on AEO gaps`);
    
    const promptPath = path.join(__dirname, '..', 'prompts', '04_recommendations.md');
    console.log(`📂 Loading prompt file: 04_recommendations.md`);
    console.log(`📍 Full path: ${promptPath}`);
    
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt: ${systemPrompt.length} characters`);
    
    const inputData = {
      normalizedIntake,
      aeoScore,
      pageAudits
    };
    
    console.log(`📋 Recommendation inputs:`);
    console.log(`   🎯 Current AEO score: ${aeoScore.totalScore}/${aeoScore.maxScore}`);
    console.log(`   🏛️  Pillars analyzed: ${aeoScore.pillars?.length || 0}`);
    console.log(`   🔍 Page audits: ${Object.keys(pageAudits || {}).length} queries`);
    console.log(`   📄 Total pages audited: ${Object.values(pageAudits || {}).flat().length}`);
    
    const inputSize = JSON.stringify(inputData).length;
    console.log(`📏 Input size: ${inputSize} characters`);
    
    const userPrompt = `Please generate actionable recommendations based on the following AEO analysis:

NORMALIZED INTAKE:
${JSON.stringify(normalizedIntake, null, 2)}

AEO SCORE:
${JSON.stringify(aeoScore, null, 2)}

PAGE AUDITS:
${JSON.stringify(pageAudits, null, 2)}`;
    
    const response = await this.callGemini(userPrompt, systemPrompt, 'Step04-Recommendations');
    const result = this.parseJsonResponse(response, 'Step04-Recommendations');
    
    console.log(`✅ Step 04 completed successfully:`);
    console.log(`   💡 Total recommendations: ${result.recommendations?.length || 0}`);
    
    if (result.recommendations) {
      const priorities = { P0: 0, P1: 0, P2: 0 };
      result.recommendations.forEach(rec => {
        priorities[rec.priority] = (priorities[rec.priority] || 0) + 1;
      });
      console.log(`   🚨 P0 (Critical): ${priorities.P0}`);
      console.log(`   ⚠️  P1 (High): ${priorities.P1}`);
      console.log(`   📝 P2 (Medium): ${priorities.P2}`);
    }
    
    await this.savePartialResults('step04', result);
    console.log(`✅ Step 04 completed and saved`);
    
    return result;
  }

  async step05_brandStrategy(normalizedIntake, aeoScore, recommendations, pageAudits) {
    console.log(`\n🔄 ===== STEP 05: BRAND CONTENT STRATEGY =====`);
    console.log(`💡 Generating personalized content strategy for ${normalizedIntake.brand || 'target brand'}`);
    
    const promptPath = path.join(__dirname, '..', 'prompts', '05_brand_strategy.md');
    console.log(`📂 Loading prompt file: 05_brand_strategy.md`);
    console.log(`📍 Full path: ${promptPath}`);
    
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt: ${systemPrompt.length} characters`);
    
    const inputData = {
      normalizedIntake,
      aeoScore,
      recommendations,
      pageAudits
    };
    
    console.log(`📋 Strategy inputs:`);
    console.log(`   🏷️  Brand: ${normalizedIntake.brand || 'Not specified'}`);
    console.log(`   🎯 Queries: ${normalizedIntake.targetQueries?.length || 0}`);
    console.log(`   📊 Current AEO Score: ${aeoScore.totalScore}/${aeoScore.maxScore}`);
    console.log(`   📋 Recommendations: ${recommendations.recommendations?.length || 0}`);
    console.log(`   🔍 Page Audits: ${Object.keys(pageAudits || {}).length} queries`);
    
    const inputSize = JSON.stringify(inputData).length;
    console.log(`📏 Input size: ${inputSize} characters`);
    
    const userPrompt = `Please generate a personalized brand content strategy based on the following AEO analysis:

INPUT DATA:
${JSON.stringify(inputData, null, 2)}

Focus on creating specific, actionable strategies for "${normalizedIntake.brand}" that address the identified AEO gaps and leverage competitor insights.`;
    
    const response = await this.callGemini(userPrompt, systemPrompt, 'Step05-BrandStrategy');
    const result = this.parseJsonResponse(response, 'Step05-BrandStrategy');
    
    console.log(`✅ Step 05 completed successfully:`);
    console.log(`   🏷️  Brand: ${result.brandStrategy?.brandName || 'Not specified'}`);
    console.log(`   🎯 Query strategies: ${result.brandStrategy?.queryStrategies?.length || 0}`);
    console.log(`   💡 Cross-query insights: ${result.brandStrategy?.crossQueryInsights?.length || 0}`);
    console.log(`   🎨 Brand voice guidelines: ${result.brandStrategy?.brandVoiceGuidelines ? 'Yes' : 'No'}`);
    
    await this.savePartialResults('step05', result);
    console.log(`✅ Step 05 completed and saved`);
    
    return result.brandStrategy;
  }

  async run() {
    console.log(`🚀 Starting AEO Chain Analysis`);
    console.log(`=====================================`);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Load input data
      console.log(`📊 Loading input data...`);
      const { googleData, perplexityData } = await this.loadSampleData();
      
      // Step 2: Intake normalization
      const normalizedIntake = await this.step01_intake(googleData, perplexityData);
      
      // Step 3: Context priming
      const aeoHeuristics = await this.step02_contextPriming();
      
      // Step 4: AEO scoring
      const aeoScore = await this.step03_scoring(normalizedIntake, aeoHeuristics);
      
      // Step 5: Page audits
      console.log(`\n🔍 Starting Page Audits (this may take several minutes)...`);
      const pageAudits = await this.runPageAudits(googleData);
      
      // Step 6: Recommendations
      const recommendations = await this.step04_recommendations(normalizedIntake, aeoScore, pageAudits);
      
      // Step 7: Brand content strategy
      const brandStrategy = await this.step05_brandStrategy(normalizedIntake, aeoScore, recommendations, pageAudits);
      
      // Compile final results
      const results = {
        timestamp: new Date().toISOString(),
        brand: normalizedIntake.brand || normalizedIntake.canonicalBrand,
        queries: normalizedIntake.targetQueries,
        queryAnalysis: this.extractQueryAnalysis(googleData, perplexityData),
        pageAudits,
        steps: {
          normalizedIntake,
          aeoHeuristics,
          aeoScore,
          recommendations,
          brandStrategy
        },
        summary: {
          totalScore: aeoScore.totalScore,
          scoreCategory: this.getScoreCategory(aeoScore.totalScore),
          queriesAnalyzed: normalizedIntake.targetQueries?.length || 0,
          topRecommendations: recommendations.recommendations?.slice(0, 3) || []
        }
      };
      
      // Save results
      await this.saveResults(results);
      
      // Setup dashboard
      const dashboardPath = await this.setupVisualizer();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`=====================================`);
      console.log(`🎉 AEO Chain Analysis Complete!`);
      console.log(`⏱️  Total Duration: ${duration} seconds`);
      console.log(`📊 Total AEO Score: ${aeoScore.totalScore}/100 (${this.getScoreCategory(aeoScore.totalScore)})`);
      console.log(`🎯 Analyzed ${normalizedIntake.targetQueries?.length || 0} query categories: ${normalizedIntake.targetQueries?.join(', ') || 'None'}`);
      console.log(`📋 Generated ${recommendations.recommendations?.length || 0} recommendations`);
      console.log(`💡 Created personalized brand strategy for ${results.brand}`);
      console.log(`🔍 Analyzed ${Object.keys(pageAudits || {}).reduce((total, query) => total + (pageAudits[query]?.length || 0), 0)} competitor pages across all queries`);
      console.log(`=====================================`);
      console.log(`📊 DASHBOARD READY!`);
      console.log(`📁 Results saved to: output/aeo-results.json`);
      if (dashboardPath) {
        console.log(`🌐 Dashboard available at: ${dashboardPath}`);
        console.log(`🚀 To view dashboard:`);
        console.log(`   1. Run: cd /Users/kjyoo/Perpex && npm run dashboard`);
        console.log(`   2. Open: http://localhost:8080/dashboard.html`);
        console.log(`   3. Or run: npm run dashboard-open`);
      }
      console.log(`=====================================`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ AEO Chain failed:`, error);
      throw error;
    }
  }
}

// Run the chain if this file is executed directly
if (require.main === module) {
  const chain = new AEOChain();
  chain.run().catch(console.error);
}

module.exports = AEOChain;
