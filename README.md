# AEO Chain Analyzer

**Answer Engine Optimization (AEO) Chain Analyzer** - A comprehensive AI-powered tool for analyzing and improving brand performance in AI-driven search results and answer engines.

## 🎯 What It Does

This tool analyzes how your brand performs in AI-powered search engines (like Google's AI Overviews, Perplexity, ChatGPT, etc.) and provides actionable recommendations to improve your Answer Engine Optimization (AEO) strategy.

### Key Features

- **Multi-Query Analysis**: Analyzes brand performance across multiple search queries
- **5-Pillar AEO Scoring**: Comprehensive scoring across On-Page Structure, E-E-A-T, Off-Site Authority, Technical Foundation, and Direct AEO Performance
- **Competitor Analysis**: Extracts and analyzes content from top-ranking competitor URLs
- **AI-Powered Recommendations**: Generates prioritized, actionable recommendations (P0/P1/P2)
- **Personalized Brand Strategy**: Creates detailed, brand-specific content strategies with examples
- **Interactive Dashboard**: Beautiful Korean-localized dashboard for visualizing results
- **Robust Web Scraping**: Advanced URL parsing with retry logic and fallback content extraction

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- API Keys for AI providers (see [Configuration](#configuration))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aeo-chain-analyzer.git
cd aeo-chain-analyzer

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your API keys in .env
# Edit .env with your API keys (see Configuration section)
```

### Basic Usage

```bash
# Run the complete AEO analysis
npm run aeo-chain

# View the interactive dashboard
npm run dashboard
# Then open: http://localhost:8080/dashboard.html

# Or open dashboard automatically
npm run dashboard-open
```

## 📊 Sample Analysis Results

The tool analyzes brands like "LG" across queries like "스마트 TV", "프리미엄 가전", "에어컨" and provides:

- **AEO Score**: 53/100 (AEO Competitor)
- **8 Recommendations**: 2 Critical (P0), 5 High Priority (P1), 1 Medium (P2)
- **Competitor Analysis**: 6+ competitor pages analyzed
- **Brand Strategy**: Personalized content strategy with specific examples

## 🏗️ Project Structure

```
aeo-chain-analyzer/
├── src/
│   ├── aeo-chain.js          # Main orchestrator
│   ├── url-parser.js         # Web scraping & content extraction
│   └── visualizer.html       # Dashboard template
├── prompts/
│   ├── 01_intake.md          # Data normalization prompt
│   ├── 02_context_priming.md # AEO heuristics generation
│   ├── 03_scoring.md         # AEO scoring prompt
│   ├── 04_recommendations.md # Recommendations generation
│   ├── 05_brand_strategy.md  # Brand strategy generation
│   ├── schemas.json          # JSON schemas for all steps
│   └── sample_data/
│       ├── google-result.json    # Sample Google search data
│       └── perplexity-result.json # Sample Perplexity data
├── output/                   # Generated results and dashboard
├── AEOContext.md            # Comprehensive AEO knowledge base
├── package.json             # Dependencies and scripts
└── .env                     # API keys (create from env.example)
```

## ⚙️ Configuration

### Required API Keys

Add these to your `.env` file:

```bash
# Primary AI Model (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative AI Providers (Optional)
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
MISTRAL_API_KEY=your_mistral_key_here
XAI_API_KEY=your_xai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# Custom Endpoints (Optional)
OLLAMA_BASE_URL=http://localhost:11434/api
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
```

### Model Configuration

Configure AI models interactively:

```bash
npm run models-setup
```

Or set specific models:

```bash
# Set main model for task generation
npm run models -- --set-main gemini-flash-latest

# Set research model for enhanced analysis
npm run models -- --set-research perplexity-llama-3.1-sonar-large-128k-online

# Set fallback model
npm run models -- --set-fallback gpt-4o-mini
```

## 🔄 The AEO Analysis Chain

The analysis follows a 5-step modular chain:

### Step 1: Intake Normalization
- Processes Google and Perplexity search results
- Extracts brand mentions, competitors, and performance signals
- Normalizes data across different search engines

### Step 2: Context Priming  
- Converts AEO knowledge base into operational scoring criteria
- Generates 5-pillar framework with Korean localization
- Creates standardized evaluation heuristics

### Step 3: AEO Scoring
- Scores brand performance across all pillars (100 points total)
- Provides detailed rationale and evidence for each score
- Identifies strengths and weaknesses

### Step 4: Page Audits (Competitor Analysis)
- Extracts content from top-ranking competitor URLs
- Analyzes structured data, headings, and AEO signals
- Robust parsing with retry logic and fallback extraction

### Step 5: Recommendations Generation
- Creates prioritized, actionable recommendations
- Provides ready-to-use content snippets and examples
- Maps recommendations to specific implementation areas

### Step 6: Brand Content Strategy
- Generates personalized content strategy for the target brand
- Includes query-specific strategies with competitor insights
- Provides implementation timelines and expected outcomes

## 📱 Interactive Dashboard

The dashboard provides:

- **Korean Localized Interface**: All content in Korean
- **AEO Score Visualization**: Interactive circular progress indicators
- **Pillar Breakdowns**: Detailed explanations of each scoring pillar
- **Query Performance Grid**: Performance across different search queries
- **Competitor Analysis**: Insights from top-ranking pages
- **Brand Content Strategy**: Personalized, actionable strategies with examples
- **Recommendations List**: Prioritized improvements with implementation guidance

## 🛠️ Available Scripts

```bash
# Core Analysis
npm run aeo-chain          # Run complete AEO analysis
npm run test-chain         # Test chain with sample data

# Dashboard
npm run dashboard          # Start dashboard server
npm run dashboard-open     # Start server and open browser

# Configuration
npm run models-setup       # Interactive model configuration
npm run models             # View current model settings

# Development
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

## 🔍 Input Data Format

### Google Search Results
```json
{
  "queries": [
    {
      "query": "스마트 TV",
      "results": [
        {
          "position": 1,
          "title": "Smart TVs: HD & LED Smart TVs – Best Buy",
          "url": "https://www.bestbuy.com/site/tvs/smart-tvs/...",
          "snippet": "Shop for smart TVs at Best Buy..."
        }
      ]
    }
  ]
}
```

### Perplexity Results
```json
{
  "queries": [
    {
      "query": "스마트 TV", 
      "engines": [
        {
          "engine": "perplexity",
          "response": "스마트 TV는 인터넷에 연결되어...",
          "sources": ["https://example.com/smart-tv-guide"]
        }
      ]
    }
  ]
}
```

## 🎯 Customization

### Adding New Queries
Edit `prompts/sample_data/google-result.json` and `prompts/sample_data/perplexity-result.json` with your target queries and search results.

### Modifying Scoring Criteria
Update `AEOContext.md` with your specific AEO knowledge and best practices.

### Customizing Prompts
Edit prompt files in `prompts/` directory:
- `01_intake.md` - Data processing logic
- `02_context_priming.md` - Scoring framework
- `03_scoring.md` - Evaluation criteria
- `04_recommendations.md` - Recommendation generation
- `05_brand_strategy.md` - Strategy generation

### Brand Localization
The system is designed for Korean brands and queries but can be adapted:
1. Update prompt files to use your target language
2. Modify dashboard localization in `src/visualizer.html`
3. Adjust AEO context in `AEOContext.md` for your market

## 🚨 Troubleshooting

### Common Issues

**API Key Errors**
```bash
# Check your .env file has the correct API keys
cat .env

# Verify model configuration
npm run models
```

**Dashboard CORS Errors**
```bash
# Always use the HTTP server, not file:// protocol
npm run dashboard
# Then open: http://localhost:8080/dashboard.html
```

**URL Parsing Failures**
- The system includes robust retry logic and fallback extraction
- Failed URLs are logged but don't stop the analysis
- Check console output for specific error details

**Memory Issues**
- Large competitor page analysis may require more memory
- Use `NODE_OPTIONS="--max-old-space-size=4096" npm run aeo-chain`

## 📈 Performance Tips

- **Parallel Processing**: URL parsing uses concurrent requests with rate limiting
- **Partial Results**: Each step saves partial results to prevent data loss
- **Retry Logic**: Automatic retries with exponential backoff for API calls
- **Fallback Extraction**: If detailed parsing fails, extracts basic content (headings, paragraphs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Google Gemini AI for advanced language processing
- Inspired by the evolving landscape of Answer Engine Optimization
- Korean localization for the Korean market focus
- Robust web scraping powered by Axios and Cheerio

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the comprehensive AEO guide in `AEOContext.md`

---

**Happy AEO Analyzing! 🚀**