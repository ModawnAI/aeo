# AEO Chain Implementation

Complete implementation of the Answer Engine Optimization (AEO) evaluation chain using Google Gemini AI.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Test the Setup
```bash
npm run test-chain
```

### 4. Run Full AEO Analysis
```bash
npm run aeo-chain
```

### 5. View Results Dashboard
```bash
npm run dashboard
```

## 📁 Project Structure

```
/Users/kjyoo/Perpex/
├── prompts/                    # Modular system prompts
│   ├── CHAIN.md               # Chain overview
│   ├── schemas.json           # JSON schemas
│   ├── 01_intake.md          # Intake normalization
│   ├── 02_context_priming.md # Context priming
│   ├── 03_scoring.md         # AEO scoring
│   ├── 04_recommendations.md # Recommendations
│   └── sample_data/          # Sample Google & Perplexity data
│       ├── google-result.json
│       └── perplexity-result.json
├── src/
│   ├── aeo-chain.js          # Main orchestrator
│   ├── url-parser.js         # URL content extractor
│   └── test-chain.js         # Test runner
├── output/                   # Generated results
└── AEO Context              # AEO guide content
```

## 🔧 Components

### 1. Main Orchestrator (`src/aeo-chain.js`)
- Coordinates all chain steps
- Manages Gemini API calls
- Handles JSON parsing and validation
- Saves results to `output/`

### 2. URL Parser (`src/url-parser.js`)
- Extracts content from competitor URLs
- Analyzes page structure for AEO signals
- Generates "why it ranks" hypotheses
- Rate-limited parallel processing

### 3. Chain Steps
1. **Intake Normalization**: Validates and normalizes Google/Perplexity inputs
2. **Context Priming**: Converts AEO guide into operational heuristics
3. **Scoring**: Applies AEO scorecard (100 points across 5 pillars)
4. **Recommendations**: Generates prioritized, actionable improvements

## 📊 Sample Data Analysis

The implementation uses your sample data:
- **Query**: "스마트 TV" (Smart TV)
- **Brand**: "LG"
- **Google Results**: 10 positions with brand visibility analysis
- **Perplexity Results**: Brand mentions, sentiment, competitor comparison

## 🎯 Key Features

### Competitor Analysis
- Automatically extracts top-ranking URLs from Google results
- Parses competitor pages to identify AEO signals:
  - Question-based headings (H2/H3)
  - Answer-first content blocks
  - FAQ sections
  - Schema markup
  - Authority signals

### AEO Scoring (100 Points)
- **Pillar I**: On-Page Structure (15 pts)
- **Pillar II**: E-E-A-T & Content Quality (25 pts)
- **Pillar III**: Off-Site Authority & Brand Mentions (30 pts)
- **Pillar IV**: Technical Foundation & Schema (15 pts)
- **Pillar V**: Direct AEO Performance (15 pts)

### Actionable Recommendations
- Prioritized by impact/effort matrix (P0/P1/P2)
- Ready-to-use content snippets
- JSON-LD schema blocks
- Competitor-inspired improvements

## 📈 Output Format

Results are saved to `output/aeo-results.json`:

```json
{
  "timestamp": "2025-01-XX...",
  "brand": "LG",
  "query": "스마트 TV",
  "steps": {
    "normalizedIntake": {...},
    "aeoHeuristics": {...},
    "aeoScore": {...},
    "pageAudits": [...],
    "recommendations": {...}
  },
  "summary": {
    "totalScore": 65,
    "scoreCategory": "AEO Competitor",
    "topRecommendations": [...],
    "competitorInsights": 5
  }
}
```

## 🔍 Example Recommendations

Based on your LG Smart TV analysis, typical recommendations include:

### P0 (High Impact, Low Effort)
- Add question-based H2: "스마트 TV 추천 2025년 최고 모델은?"
- Insert 50-word answer block after each H2
- Add FAQ schema for common questions

### P1 (High Impact, Medium Effort)
- Create comprehensive comparison table (LG vs Samsung vs Sony)
- Add Product schema with specific model details
- Build authority through expert quotes and reviews

### P2 (Medium Impact, High Effort)
- Develop original research content
- Secure mentions in tech publications
- Create video content for enhanced engagement

## 🛠 Customization

### Adding New Prompts
1. Create new `.md` file in `prompts/`
2. Add corresponding method in `AEOChain` class
3. Update chain flow in `run()` method

### Modifying Scoring
- Edit `prompts/03_scoring.md`
- Adjust weights in AEO Context guide
- Update schema in `schemas.json`

### URL Parser Extensions
- Add new content extractors in `url-parser.js`
- Extend `PageAudit` schema
- Add domain-specific parsing logic

## 🔧 Troubleshooting

### Common Issues

1. **Gemini API Errors**
   ```bash
   # Check API key
   echo $GEMINI_API_KEY
   
   # Test API directly
   npm run test-chain
   ```

2. **URL Parsing Failures**
   - Some sites block automated requests
   - Rate limiting may cause timeouts
   - Check console for specific error messages

3. **JSON Parsing Errors**
   - Gemini sometimes returns malformed JSON
   - The parser attempts to extract from markdown blocks
   - Check raw responses in console output

### Performance Optimization

- **Parallel Processing**: URL parsing uses batched requests (3 concurrent)
- **Rate Limiting**: 1-second delays between batches
- **Caching**: Consider adding Redis for repeated analyses
- **Streaming**: Gemini responses are streamed for better UX

## 📚 Next Steps

1. **Run Analysis**: Execute the chain on your sample data
2. **Review Results**: Check `output/aeo-results.json`
3. **Implement Recommendations**: Apply P0 suggestions first
4. **Monitor Progress**: Re-run analysis after changes
5. **Scale Up**: Add more queries and competitors

## 🤝 Integration

The modular design allows easy integration with:
- **CMS Systems**: Automated content optimization
- **SEO Tools**: Bulk analysis workflows  
- **Monitoring**: Scheduled AEO health checks
- **Reporting**: Dashboard integrations

---

**Ready to improve LG's AEO performance for "스마트 TV" queries!** 🚀
