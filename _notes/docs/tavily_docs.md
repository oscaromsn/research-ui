# About
Source: https://docs.tavily.com/documentation/about

Welcome to Tavily!

<Note>
  Looking for a step-by-step tutorial to get started in under 5 minutes? Head to our [Quickstart guide](/guides/quickstart) and start coding!
</Note>

## Who are we?

We're a team of AI researchers and developers passionate about helping you build the next generation of AI assistants.
Our mission is to empower individuals and organizations with accurate, unbiased, and factual information.

## What is the Tavily Search Engine?

Building an AI agent that leverages realtime online information is not a simple task. Scraping doesn't scale and requires expertise to refine, current search engine APIs don't provide explicit information to queries but simply potential related articles (which are not always related), and are not very customziable for AI agent needs. This is why we're excited to introduce the first search engine for AI agents - [Tavily](https://app.tavily.com).

Tavily is a search engine optimized for LLMs, aimed at efficient, quick and persistent search results. Unlike other search APIs such as Serp or Google, Tavily focuses on optimizing search for AI developers and autonomous AI agents. We take care of all the burden of searching, scraping, filtering and extracting the most relevant information from online sources. All in a single API call!

To try the API in action, you can now use our hosted version on our [API Playground](https://app.tavily.com/playground).

<Info>
  If you're an AI developer looking to integrate your application with our API, or seek increased API limits, [please reach out!](mailto:support@tavily.com)
</Info>

## Why choose Tavily?

Tavily shines where others fail, with a Search API optimized for LLMs.

<AccordionGroup>
  <Accordion title="Purpose-Built">
    Tailored just for LLM Agents, we ensure the search results are optimized for <a href="https://towardsdatascience.com/retrieval-augmented-generation-intuitively-and-exhaustively-explain-6a39d6fe6fc9">RAG</a>. We take care of all the burden in searching, scraping, filtering and extracting information from online sources. All in a single API call! Simply pass the returned search results as context to your LLM.
  </Accordion>

  <Accordion title="Versatility">
    Beyond just fetching results, the Tavily Search API offers precision. With customizable search depths, domain management, and parsing HTML content controls, you're in the driver's seat.
  </Accordion>

  <Accordion title="Performance">
    Committed to speed and efficiency, our API guarantees real-time and trusted information. Our team works hard to improve Tavily's performance over time.
  </Accordion>

  <Accordion title="Integration-friendly">
    We appreciate the essence of adaptability. That's why integrating our API with your existing setup is a breeze. You can choose our [Python library](https://pypi.org/project/tavily-python/), [JavaScript package](https://www.npmjs.com/package/@tavily/core) or a simple API call. You can also use Tavily through any of our supported partners such as [LangChain](/integrations/langchain) and [LlamaIndex](/integrations/llamaindex).
  </Accordion>

  <Accordion title="Transparent & Informative">
    Our detailed documentation ensures you're never left in the dark. From setup basics to nuanced features, we've got you covered.
  </Accordion>
</AccordionGroup>

## How does the Search API work?

Traditional search APIs such as Google, Serp and Bing retrieve search results based on a user query. However, the results are sometimes irrelevant to the goal of the search, and return simple URLs and snippets of content which are not always relevant. Because of this, any developer would need to then scrape the sites to extract relevant content, filter irrelevant information, optimize the content to fit LLM context limits, and more. This task is a burden and requires a lot of time and effort to complete. The Tavily Search API takes care of all of this for you in a single API call.

The Tavily Search API aggregates up to 20 sites per a single API call, and uses proprietary AI to score, filter and rank the top most relevant sources and content to your task, query or goal.
In addition, Tavily allows developers to add custom fields such as context and limit response tokens to enable the optimal search experience for LLMs.

Tavily can also help your AI agent make better decisions by including a short answer for cross-agent communication.

<Tip>
  With LLM hallucinations, it's crucial to optimize for RAG with the right context and information. This is where Tavily comes in, delivering accurate and precise information for your RAG applications.
</Tip>

## Getting started

[Sign up](https://app.tavily.com) for Tavily to get your API key. You get **1,000 free API Credits every month**. No credit card required.

<Card icon="key" href="https://app.tavily.com" title="Get your free API key" horizontal>
  You get 1,000 free API Credits every month. **No credit card required.**
</Card>

Head to our [API Playground](https://app.tavily.com/playground) to familiarize yourself with our API.

To get started with Tavily's APIs and SDKs using code, head to our [Quickstart Guide](/guides/quickstart) and follow the steps.

<Note>
  Got questions? Stumbled upon an issue? Simply intrigued? Don't hesitate! Our support team is always on standby, eager to assist. Join us, dive deep, and redefine your search experience! [Contact us!](mailto:support@tavily.com)
</Note>


# Credits & Pricing
Source: https://docs.tavily.com/documentation/api-credits

Learn how to get and manage your Tavily API Credits.

## Free API Credits

<Card icon="key" href="https://app.tavily.com" title="Get your free API key" horizontal>
  You get 1,000 free API Credits every month.
  **No credit card required.**
</Card>

## Pricing Overview

Tavily operates on a simple, credit-based model:

* **Free**: 1,000 credits/month
* **Pay-as-you-go**: \$0.008 per credit (allows you to be charged per credit once your plan’s credit limit is reached).
* **Monthly plans**: \$0.0075 - \$0.005 per credit
* **Enterprise**: Custom pricing and volume

| <div align="left">**Plan**</div> | **Credits per month** | **Monthly price** | **Price per credit** |
| -------------------------------- | --------------------- | ----------------- | -------------------- |
| **Researcher**                   | 1,000                 | Free              | -                    |
| **Project**                      | 4,000                 | \$30              | \$0.0075             |
| **Bootstrap**                    | 15,000                | \$100             | \$0.0067             |
| **Startup**                      | 38,000                | \$220             | \$0.0058             |
| **Growth**                       | 100,000               | \$500             | \$0.005              |
| **Pay as you go**                | Per usage             | \$0.008 / Credit  | \$0.008              |
| **Enterprise**                   | Custom                | Custom            | Custom               |

Head to [my plan](https://app.tavily.com/account/plan) to explore our different options and manage your plan.

## API Credits Costs

### Tavily Search

Your [search depth](/api-reference/endpoint/search#body-search-depth) determines the cost of your request.

* **Basic Search (`basic`):**
  Each request costs **1 API credit**.

* **Advanced Search (`advanced`):**
  Each request costs **2 API credits**.

### Tavily Extract

The number of successful URL extractions and your [extraction depth](/api-reference/endpoint/extract#body-extract-depth) determines the cost of your request. You never get charged if a URL extraction fails.

* **Basic Extract (`basic`):**
  Every 5 successful URL extractions cost **1 API credit**

* **Advanced Extract (`advanced`):**
  Every 5 successful URL extractions cost **2 API credits**


# Tavily Crawl (BETA)
Source: https://docs.tavily.com/documentation/api-reference/endpoint/crawl

POST /crawl
Traverse a site like a graph starting from a base URL.

Tavily Crawl is currently in **open-access beta**.



# Tavily Extract
Source: https://docs.tavily.com/documentation/api-reference/endpoint/extract

POST /extract
Extract web page content from one or more specified URLs using Tavily Extract.



# Tavily Map (BETA)
Source: https://docs.tavily.com/documentation/api-reference/endpoint/map

POST /map
Obtain a sitemap starting from a base URL.

Tavily Map is currently in **open-access beta**.



# Tavily Search
Source: https://docs.tavily.com/documentation/api-reference/endpoint/search

POST /search
Execute a search query using Tavily Search.



# Introduction
Source: https://docs.tavily.com/documentation/api-reference/introduction

Easily integrate our APIs with your services.

<Tip>
  Looking for the Python or JavaScript SDK Reference? Head to our [SDKs](/sdk) page to see how to natively integrate Tavily in your project.
</Tip>

## Base URL

The base URL for all requests to the Tavily API is:

```plaintext
https://api.tavily.com
```

## Authentication

All Tavily endpoints are authenticated using API keys.
[Get your free API key](https://app.tavily.com).

```bash
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tvly-YOUR_API_KEY" \
  -d '{"query": "Who is Leo Messi?"}'
```

## Endpoints

<CardGroup cols={3}>
  <Card icon="magnifying-glass" horizontal href="/api-reference/endpoint/search">
    **`/search`**

    Tavily's powerful web search API.
  </Card>

  <Card icon="file-lines" horizontal href="/api-reference/endpoint/extract">
    **`/extract`**

    Tavily's powerful content extraction API.
  </Card>

  <Card icon="circle-nodes" horizontal href="/api-reference/endpoint/crawl">
    `/crawl` , `/map`

    Tavily's intelligent sitegraph navigation and extraction tools.
  </Card>
</CardGroup>


# Best Practices for Crawl
Source: https://docs.tavily.com/documentation/best-practices/best-practices-crawl

Learn how to effectively use Tavily's Crawl API to extract and process web content.

## When to Use `crawl` vs `map`

### Use Crawl when you need:

* Full content extraction from pages
* Deep content analysis
* Processing of paginated or nested content
* Extraction of specific content patterns
* Integration with RAG systems

### Use Map when you need:

* Quick site structure discovery
* URL collection without content extraction
* Sitemap generation
* Path pattern matching
* Domain structure analysis

## Use Cases

### 1. Deep or Unlinked Content

Many sites have content that's difficult to access through standard means:

* Deeply nested pages not in main navigation
* Paginated archives (old blog posts, changelogs)
* Internal search-only content

**Best Practice:**

```json
{
  "url": "example.com",
  "max_depth": 3,
  "max_breadth": 50,
  "limit": 200,
  "select_paths": ["/blog/.*", "/changelog/.*"],
  "exclude_paths": ["/private/.*", "/admin/.*"]
}
```

### 2. Structured but Nonstandard Layouts

For content that's structured but not marked up in schema.org:

* Documentation
* Changelogs
* FAQs

**Best Practice:**

```json
{
  "url": "docs.example.com",
  "max_depth": 2,
  "extract_depth": "advanced",
  "categories": ["Documentation"],
  "select_paths": ["/docs/.*"]
}
```

### 3. Multi-modal Information Needs

When you need to combine information from multiple sections:

* Cross-referencing content
* Finding related information
* Building comprehensive knowledge bases

**Best Practice:**

```json
{
  "url": "example.com",
  "max_depth": 2,
  "instructions": "Find all documentation pages that link to API reference docs",
  "extract_depth": "advanced"
}
```

### 4. Rapidly Changing Content

For content that updates frequently:

* API documentation
* Product announcements
* News sections

**Best Practice:**

```json
{
  "url": "api.example.com",
  "max_depth": 1,
  "max_breadth": 100,
  "extract_depth": "basic"
}
```

### 5. Behind Auth / Paywalls

For content requiring authentication:

* Internal knowledge bases
* Customer help centers
* Gated documentation

**Best Practice:**

```json
{
  "url": "help.example.com",
  "max_depth": 2,
  "select_domains": ["^help\\.example\\.com$"],
  "exclude_domains": ["^public\\.example\\.com$"]
}
```

### 6. Complete Coverage / Auditing

For comprehensive content analysis:

* Legal compliance checks
* Security audits
* Policy verification

**Best Practice:**

```json
{
  "url": "example.com",
  "max_depth": 3,
  "max_breadth": 100,
  "limit": 1000,
  "extract_depth": "advanced",
  "instructions": "Find all mentions of GDPR and data protection policies"
}
```

### 7. Semantic Search or RAG Integration

For feeding content into LLMs or search systems:

* RAG systems
* Enterprise search
* Knowledge bases

**Best Practice:**

```json
{
  "url": "docs.example.com",
  "max_depth": 2,
  "extract_depth": "advanced",
  "include_images": true,
  "categories": ["Documentation", "API"]
}
```

### 8. Known URL Patterns

When you have specific paths to crawl:

* Sitemap-based crawling
* Section-specific extraction
* Pattern-based content collection

**Best Practice:**

```json
{
  "url": "example.com",
  "max_depth": 1,
  "select_paths": ["/docs/.*", "/api/.*", "/guides/.*"],
  "exclude_paths": ["/private/.*", "/admin/.*"]
}
```

## Performance Considerations

### Depth vs. Performance

* Each level of depth increases crawl time exponentially
* Start with `max_depth: 1` and increase as needed
* Use `max_breadth` to control horizontal expansion
* Set appropriate `limit` to prevent excessive crawling

### Resource Optimization

* Use `basic` extract\_depth for simple content
* Use `advanced` extract\_depth only when needed
* Set appropriate `max_breadth` based on site structure
* Use `select_paths` and `exclude_paths` to focus crawling

### Rate Limiting

* Respect site's robots.txt
* Implement appropriate delays between requests
* Monitor API usage and limits
* Use appropriate error handling for rate limits

## Best Practices Summary

1. **Start Small**
   * Begin with limited depth and breadth
   * Gradually increase based on needs
   * Monitor performance and adjust

2. **Be Specific**
   * Use path patterns to focus crawling
   * Exclude irrelevant sections
   * Set appropriate categories

3. **Optimize Resources**
   * Choose appropriate extract\_depth
   * Set reasonable limits
   * Use include\_images only when needed

4. **Handle Errors**
   * Implement retry logic
   * Monitor failed results
   * Handle rate limits appropriately

5. **Security**
   * Respect robots.txt
   * Use appropriate authentication
   * Exclude sensitive paths

6. **Integration**
   * Plan for data processing
   * Consider storage requirements
   * Design for scalability

## Common Pitfalls

1. **Excessive Depth**
   * Avoid setting max\_depth too high
   * Start with 1-2 levels
   * Increase only if necessary

2. **Unfocused Crawling**
   * Set appropriate categories
   * Use instructions for guidance

3. **Resource Overuse**
   * Monitor API usage
   * Set appropriate limits
   * Use basic extract\_depth when possible

4. **Missing Content**
   * Verify path patterns
   * Monitor crawl coverage

## Integration with Map

Consider using Map before Crawl to:

1. Discover site structure
2. Identify relevant paths
3. Plan crawl strategy
4. Validate URL patterns

Example workflow:

1. Use Map to get site structure
2. Analyze paths and patterns
3. Configure Crawl with discovered paths
4. Execute focused crawl

## Conclusion

Tavily's Crawl API is powerful for extracting structured content from websites. By following these best practices, you can:

* Optimize crawl performance
* Ensure complete coverage
* Maintain resource efficiency
* Build robust content extraction pipelines

Remember to:

* Start with limited scope
* Use appropriate parameters
* Monitor performance
* Handle errors gracefully
* Respect site policies


# Best Practices for Extract
Source: https://docs.tavily.com/documentation/best-practices/best-practices-extract

Learn the best practices for web content extraction process

## Extracting web content using Tavily

Efficiently extracting content from web pages is crucial for AI-powered applications. Tavily provides two main approaches to content extraction, each suited for different use cases.

### 1. One-step extraction: directly retrieve `raw_content`

You can extract web content by enabling `include_raw_content = true` when making a Tavily Search API call. This allows you to retrieve both search results and extracted content in a single step.

**However**, this can increase latency because you may extract raw content from sources that are not relevant in the first place.  It's recommended to split the process into two steps: running multiple sub-queries to expand the pool of sources, then curating the most relevant documents based on content snippets or source scores. By extracting raw content from the most relevant sources, you get high-quality RAG documents.

### 2. Two-step process: search, then extract

For better accuracy and customization, we recommend a two-step process:

> #### Step 1: Search

Use the Tavily Search API to retrieve relevant web pages, which output URLs.

> #### Step 2: Extract

Use the Tavily Extract API to fetch the full content from the most relevant URLs.

**Example:**

```python
import asyncio
from tavily import AsyncTavilyClient

tavily_client = AsyncTavilyClient(api_key="tvly-YOUR_API_KEY")

async def fetch_and_extract():
   # Define the queries with search_depth and max_results inside the query dictionary
   queries = [
       {"query": "AI applications in healthcare", "search_depth": "advanced", "max_results": 10},
       {"query": "ethical implications of AI in healthcare", "search_depth": "advanced", "max_results": 10},
       {"query": "latest trends in machine learning healthcare applications", "search_depth": "advanced",
        "max_results": 10},
       {"query": "AI and healthcare regulatory challenges", "search_depth": "advanced", "max_results": 10}
   ]

   # Perform the search queries concurrently, passing the entire query dictionary
   responses = await asyncio.gather(*[tavily_client.search(**q) for q in queries])

   # Filter URLs with a score greater than 0.5. Alternatively, you can use a re-ranking model or an LLM to identify the most relevant sources, or cluster your documents and extract content only from the most relevant cluster
   relevant_urls = []
   for response in responses:
       for result in response.get('results', []):
           if result.get('score', 0) > 0.5:
               relevant_urls.append(result.get('url'))

   # Extract content from the relevant URLs
   extracted_data = await asyncio.gather(*(tavily_client.extract(url) for url in relevant_urls))

   # Print the extracted content
   for data in extracted_data:
       print(data)

# Run the function
asyncio.run(fetch_and_extract())
```

#### **Pros of two-Step extraction**

✅ **More control** – Extract only from selected URLs.

✅ **Higher accuracy** – Filter out irrelevant results before extraction.

✅ **Advanced extraction capabilities** – Using `search_depth = "advanced"`.

#### **Cons of two-step extraction**

❌ slightly more expensive.

### Using advanced extraction

Using `extract_depth = "advanced"` in the Extract API allows for more comprehensive content retrieval. This mode is particularly useful when dealing with:

* **Complex web pages** with dynamic content, embedded media, or structured data.
* **Tables and structured information** that require accurate parsing.
* **Higher success rates**.

> If precision and depth are priorities for your application, `extract_depth = "advanced"` is the recommended choice.


# Best Practices for Search
Source: https://docs.tavily.com/documentation/best-practices/best-practices-search

Learn how to optimize your queries, refine search filters, and leverage advanced parameters for better performance.

## Optimizing your query

#### 1. Keep your query under 400 characters

For efficient processing, keep your query concise—under **400 characters**. Think of it as a query for an agent performing web search, not long-form prompts. If your query exceeds the limit, you'll see this error:

```json
{
  "detail": {
    "error": "Query is too long. Max query length is 400 characters."
  }
}
```

#### 2. Break your query into smaller sub-queries

If your query is complex or covers multiple topics, consider breaking it into smaller, more focused sub-queries and sending them as separate requests.

<CodeGroup>
  ```json ✅ Good
  // Breaking the query into smaller, more focused sub-queries.
  {
     "query":"Competitors of company ABC."
  }
  {
     "query":"Financial performance of company ABC."
  }
  {
     "query":"Recent developments of company ABC."
  }
  {
     "query":"Latest industry trends related to ABC."
  }
  ```

  ```json ❌ Bad
  {
    "query": "Information regarding the history, financial performance, market positioning, recent developments, executive leadership, product offerings, customer demographics, strategic partnerships, mergers and acquisitions, regulatory challenges, competitor analysis, emerging market trends, technological advancements, and overall industry outlook for the company ABC and its key competitors within the industry, including recent reports, expert analyses, and predictions for future growth."
  }
  ```
</CodeGroup>

## Optimizing your request parameters

#### `max_results`  (Limiting the number of results)

* Limits the number of search results (default is `5`).

<CodeGroup>
  ```json ✅ Good
  // Customizing max_results based on your needs, limiting the results to 10 to improve relevance and focus on the most relevant sources.
  {
    "query": "Info about renewable energy technologies",
    "max_results": 10
  }
  ```

  ```json ❌ Bad
  // Setting max_results too high may return irrelevant or low-quality results.
  {
    "query": "Info about renewable energy technologies",
    "max_results": 300
  }
  ```
</CodeGroup>

#### `content` (NLP-based snippet)

* Provides a summarized content snippet.
* Helps in quickly understanding the main context without extracting full content.
* When `search_depth` is set to `advanced` , it extracts content closely aligned with your query, surfacing the most valuable sections of a web page rather than a generic summary. Additionally, it uses `chunks_per_source` to determine the number of content chunks to return per source.

#### `search_depth=advanced`  (Ideal for higher relevance in search results)

* Retrieves the most relevant content snippets for your query.
* By setting  `include_raw_content` to `true`, you can increase the likelihood of enhancing retrieval precision and retrieving the desired number of `chunks_per_source`.

<CodeGroup>
  ```json ✅ Good
  // Using search_depth=advanced and chunks_per_source for a query to get the most relevant content, and enabling include_raw_content.
  {
    "query": "How many countries use Monday.com?",
    "search_depth": "advanced",
    "chunks_per_source": 3,
    "include_raw_content": true
  }
  ```

  ```json 👍 Good
  // Using search_depth=advanced and chunks_per_source for a query to get the most relevant content.
  {
    "query": "How many countries use Monday.com?",
    "search_depth": "advanced",
    "chunks_per_source": 3
  }
  ```

  ```json ❌ Bad
  // Using basic search for queries that is seeking specific information that might not be available in the generic `content` snippet.
  {
    "query": "How many countries use Monday.com?",
    "search_depth": "basic"
  }
  ```
</CodeGroup>

#### `time_range` (Filtering by Date)

* Restricts search results to a specific time frame.

<CodeGroup>
  ```json ✅ Good
  // Using time_range to filter sources from the past month.
  {
    "query": "latest trends in machine learning",
    "time_range": "month"
  }
  ```

  ```json 👍 Moderate
  // Not using time_range to filter results by date for recent sources.
  {
    "query": "latest trends in machine learning"
  }
  ```
</CodeGroup>

#### `include_raw_content` (Extracted web content)

Set to true to return the full extracted content of the web page, useful for deeper content analysis. However, the most recommended approach for extracting web page content is using a two-step process:

1. Search: Retrieve relevant URLs.
2. Extract: Extract content from those URLs.

For more information on this two-step process, please refer to the [Best Practices for the Extract API](/documentation/best-practices/best-practices-extract#2-two-step-process-search-then-extract).

<CodeGroup>
  ```json ✅ Good
  // Using include_raw_content to retrieve full content for comprehensive analysis.
  {
      "query": "The impact of AI in healthcare",
      "include_raw_content": true
  }
  ```

  ```json 👍 Moderate
   // Not using include_raw_content when detailed content is needed.
   {
      "query": "The impact of AI in healthcare"
   }
  ```
</CodeGroup>

#### `topic=news` (Filtering news sources)

* Limits results to news-related sources.
* Includes `published_date` metadata.
* `days` specifies the number of days back from the current date to include in the results. The default is `3`.
* Useful for getting real-time updates, particularly about politics, sports, and major current events covered by mainstream media sources.

<CodeGroup>
  ```json ✅ Good
  // Using "topic=news" and "days=1" to get the latest updates from news sources.
  {
    "query": "What happened today in NY?",
    "topic": "news",
    "days": 1
  }
  ```

  ```json ❌ Bad
  // Not specifying the "topic" or "days" parameters, which are essential for retrieving results specifically from news sources.
  {
    "query": "What happened today in NY?"
  }
  ```
</CodeGroup>

#### `include_domains` (Restricting searches to specific domains)

* Limits searches to predefined trusted domains.

<CodeGroup>
  ```json ✅ Good
  // Using include_domains to restrict search for more domain-specific information.
  {
    "query": "What is the professional background of the CEO at Google?",
    "include_domains": ["linkedin.com/in"]
  }
  ```

  ```json ❌ Bad
  // Not specifying the domain, leading to broader, less focused results.
  {
    "query": "What is the professional background of the CEO at Google?"
  }
  ```
</CodeGroup>

* Minimize the number of domains in the `include_domains` list and make sure they are relevant to your search query.

<CodeGroup>
  ```json ✅ Good
  // Using a concise list of 3 relevant domains to refine search results effectively.
  {
      "query": "What are the latest funding rounds for AI startups?",
      "include_domains": [ "crunchbase.com", "techcrunch.com", "pitchbook.com" ]
   }
  ```

  ```json ❌ Bad
  // Including an excessively long list of domains can reduce search efficiency and lead to sub-optimal search results.
  {
     "query": "What are the latest funding rounds for AI startups?",
     "include_domains": [ "example1.com", "example2.com", "example3.com", ..., "example200.com" ]
  }
  ```
</CodeGroup>

#### `exclude_domains` (Excluding specific domains)

* Filters out results from specific domains.

<CodeGroup>
  ```json ✅ Good
  // Excluding unrelated domains to US economy trends, ensuring that irrelevant sources are filtered out.
  {
     "query": "US economy trends in 2025",
     "exclude_domains": ["espn.com","vogue.com"]
  }
  ```

  ```json ❌ Bad
  // Excluding results from Forbes, which is a key source for U.S. economics. This may filter out valuable information.
  {
      "query": "US economy trends in 2025",
      "exclude_domains": ["forbes.com"]
  }
  ```
</CodeGroup>

* Minimize the number of domains in the `exclude_domains` list to ensure you only exclude domains that are truly irrelevant to your query.

<CodeGroup>
  ```json ✅ Good
  // Using a concise list of 3 domains to exclude from the search results.
  {
      "query": "US fashion trends in 2025",
      "exclude_domains": ["nytimes.com","forbes.com","bloomberg.com"]
  }
  ```

  ```json ❌ Bad
  // Excluding an excessively long list of domains may prevent relevant sources from being included, potentially resulting in little to no results.
  {
     "query": "US fashion trends in 2025",
     "exclude_domains": [ "example1.com", "example2.com", "example3.com", ..., "example200.com" ]
  }
  ```
</CodeGroup>

#### Controlling search results by website region

Example: Limit to U.S.-based websites (`.com` domain):

```json
{
    "query": "latest AI research",
    "include_domains": ["*.com"]
}
```

Example: Exclude Icelandic websites (`.is` domain):

```json
{
    "query": "global economic trends",
    "exclude_domains": ["*.is"]
}
```

#### Combining include and exclude domains

Restrict search to `.com` but exclude `example.com`:

```json
{
    "query": "AI industry news",
    "include_domains": ["*.com"],
    "exclude_domains": ["example.com"]
}
```

## Asynchronous API calls with Tavily

* Use `async/await` to ensure non-blocking API requests.
* Initialize `AsyncTavilyClient` once and reuse it for multiple requests.
* Use `asyncio.gather` for handling multiple queries concurrently.
* Implement error handling to manage API failures gracefully.
* Limit concurrent requests to avoid hitting rate limits.

Example:

```python
import asyncio
from tavily import AsyncTavilyClient

# Initialize Tavily client
tavily_client = AsyncTavilyClient("tvly-YOUR_API_KEY")

async def fetch_and_gather():
    queries = ["latest AI trends", "future of quantum computing"]

    # Perform search and continue even if one query fails (using return_exceptions=True)
    try:
        responses = await asyncio.gather(*(tavily_client.search(q) for q in queries), return_exceptions=True)

        # Handle responses and print
        for response in responses:
            if isinstance(response, Exception):
                print(f"Search query failed: {response}")
            else:
                print(response)

    except Exception as e:
        print(f"Error during search queries: {e}")

# Run the function
asyncio.run(fetch_and_gather())
```

## Optimizing search results with post-processing techniques

When working with Tavily’s Search API, refining search results through post-processing techniques can significantly enhance the relevance of the retrieved information.

### Combining LLMs with Keyword Filtering

One of the most effective ways to refine search results is by using a combination of LLMs and deterministic keyword filtering.

* **LLMs** can analyze search results in a more contextual and semantic manner, understanding the deeper meaning of the text.
* **Keyword filtering** offers a rule-based approach to eliminate irrelevant results based on predefined terms, ensuring a balance between flexibility and precision.

#### How it works

By applying keyword filters before or after processing results with an LLM, you can:

* Remove results that contain specific unwanted terms.
* Prioritize articles that contain high-value keywords relevant to your use case.
* Improve efficiency by reducing the number of search results requiring further LLM processing.

### Utilizing metadata for improved post-processing

Tavily’s Search API provides rich metadata that can be leveraged to refine and prioritize search results. By incorporating metadata into post-processing logic, you can improve precision in selecting the most relevant content.

#### Key metadata fields and their Functions

* **`title`**: Helps in identifying articles that are more likely to be relevant based on their headlines. Filtering results by keyword occurrences in the title can improve result relevancy.
* **`raw_content`**: Provides the extracted content from the web page, allowing deeper analysis. If the `content` does not provide enough information, raw content can be useful for further filtering and ranking. You can also use the Extract API with a two-step extraction process. For more information, see [Best Practices for Extract API](/documentation/best-practices/best-practices-extract#2-two-step-process-search-then-extract).
* **`score`**: Represents the relevancy between the query and the retrieved content snippet. Higher scores typically indicate better matches.
* **`content`**: Offers a general summary of the webpage, providing a quick way to gauge relevance without processing the full content. When `search_depth` is set to `advanced`, the content is more closely aligned with the query, offering valuable insights.

#### Enhancing post-processing with metadata

By leveraging these metadata elements, you can:

* Sort results based on scores, prioritizing high-confidence matches.
* Perform additional filtering based on title or content to refine search results.

#### Understanding the `score` Parameter

Tavily assigns a `score` to each search result, indicating how well the content aligns with the query. This score helps in ranking and selecting the most relevant results.

#### What does the `score` mean?

* The `score` is a numerical measure of relevance between the content and the query.
* A higher score generally indicates that the result is more relevant to the query.
* There is no fixed threshold that determines whether a result is useful. The ideal score cutoff depends on the specific use case.

#### Best practices for using scores

* Set a minimum score threshold to exclude low-relevance results automatically.
* Analyze the distribution of scores within a search response to adjust thresholds dynamically.
* Combine similarity scores with other metadata fields (e.g., url, content) to improve ranking strategies.

### Using regex-based data extraction

In addition to leveraging LLMs and metadata for refining search results, Python's `re.search` and `re.findall` methods can play a crucial role in post-processing by allowing you to parse and extract specific data from the `raw_content`. These methods enable pattern-based filtering and extraction, enhancing the precision and relevance of the processed results.

#### Benefits of using `re.search` and `re.findall`

* **Pattern Matching**: Both methods are designed to search for specific patterns in text, which is ideal for structured data extraction.
* **Efficiency**: These methods help automate the extraction of specific elements from large datasets, improving post-processing efficiency.
* **Flexibility**: You can define custom patterns to match a variety of data types, from dates and addresses to keywords and job titles.

#### How they work

* **`re.search`**: Scans the content for the first occurrence of a specified pattern and returns a match object, which can be used to extract specific parts of the text.

Example:

```python
import re
text = "Company: Tavily, Location: New York"
match = re.search(r"Location: (\w+)", text)
if match:
    print(match.group(1))  # Output: New York
```

* **`re.findall`**: Returns a list of all non-overlapping matches of a pattern in the content, making it suitable for extracting multiple instances of a pattern.

Example:

```python
text = "Contact: john@example.com, support@tavily.com"
emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
print(emails)  # Output: ['john@example.com', 'support@tavily.com']
```

#### Common use cases for post-processing

* **Content Filtering**: Use `re.search` to identify sections or specific patterns in content (e.g., dates, locations, company names).

* **Data Extraction**: Use `re.findall` to extract multiple instances of specific data points (e.g., phone numbers, emails).

* **Improving Relevance**: Apply regex patterns to remove irrelevant content, ensuring that only the most pertinent information remains.

> By leveraging post-processing techniques such as LLM-assisted filtering, metadata analysis, and score-based ranking, along with regex-based data extraction, you can optimize Tavily’s Search API results for better relevance. Incorporating these methods into your workflow will help you extract high-quality insights tailored to your needs.


# Help Center
Source: https://docs.tavily.com/documentation/help





# Agno
Source: https://docs.tavily.com/documentation/integrations/agno

Tavily is now available for integration through Agno.

## Introduction

Integrate [Tavily with Agno](https://docs.agno.com/tools/toolkits/search/tavily#tavily) to enhance your AI agents with powerful web search capabilities. Agno provides a lightweight library for building agents with memory, knowledge, tools, and reasoning, making it easy to incorporate real-time web search and data extraction into your AI applications.

## Step-by-Step Integration Guide

### Step 1: Install Required Packages

Install the necessary Python packages:

```bash
pip install agno tavily-python
```

### Step 2: Set Up API Keys

* **Tavily API Key:** [Get your Tavily API key here](https://app.tavily.com/home)
* **OpenAI API Key:** [Get your OpenAI API key here](https://platform.openai.com/account/api-keys)

Set these as environment variables in your terminal or add them to your environment configuration file:

```bash
export TAVILY_API_KEY=your_tavily_api_key
export OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Initialize Agno Agent with Tavily Tools

```python
from agno.agent import Agent
from agno.tools.tavily import TavilyTools
import os

# Initialize the agent with Tavily tools
agent = Agent(
    tools=[TavilyTools(
        search=True,                    # Enable search functionality
        max_tokens=8000,                # Increase max tokens for more detailed results
        search_depth="advanced",        # Use advanced search for comprehensive results
        format="markdown"               # Format results as markdown
    )],
    show_tool_calls=True
)
```

### Step 4: Example Use Cases

```python
# Example 1: Basic search with default parameters
agent.print_response("Latest developments in quantum computing", markdown=True)

# Example 2: Market research with multiple parameters
agent.print_response(
    "Analyze the competitive landscape of AI-powered customer service solutions in 2024, "
    "focusing on market leaders and emerging trends",
    markdown=True
)

# Example 3: Technical documentation search
agent.print_response(
    "Find the latest documentation and tutorials about Python async programming, "
    "focusing on asyncio and FastAPI",
    markdown=True
)

# Example 4: News aggregation
agent.print_response(
    "Gather the latest news about artificial intelligence from tech news websites "
    "published in the last week",
    markdown=True
)
```

## Additional Use Cases

1. **Content Curation**: Gather and organize information from multiple sources
2. **Real-time Data Integration**: Keep your AI agents up-to-date with the latest information
3. **Technical Documentation**: Search and analyze technical documentation
4. **Market Analysis**: Conduct comprehensive market research and analysis


# Composio
Source: https://docs.tavily.com/documentation/integrations/composio

Tavily is now available for integration through Composio.

## Introduction

Integrate Tavily with Composio to enhance your AI workflows with powerful web search capabilities. Composio provides a platform to connect your AI agents to external tools like Tavily, making it easy to incorporate real-time web search and data extraction into your applications.

## Step-by-Step Integration Guide

### Step 1: Install Required Packages

Install the necessary Python packages:

```bash
pip install composio-openai openai
```

### Step 2: Set Up API Keys

* **OpenAI API Key:** [Get your OpenAI API key here](https://platform.openai.com/account/api-keys)
* **Composio API Key:** [Get your Composio API key here](https://app.composio.dev/dashboard)

Set these as environment variables in your terminal or add them to your environment configuration file:

```bash
export OPENAI_API_KEY=your_openai_api_key
export COMPOSIO_API_KEY=your_composio_api_key
```

### Step 3: Connect Tavily to Composio

Add Tavily as an integration in Composio:

```bash
composio add tavily
```

When prompted, enter your Tavily API key:

```
> Enter API Key: your_tavily_api_key
```

### Step 4: Example Use Case

```python
from composio_openai import ComposioToolSet, Action
from openai import OpenAI

# Initialize OpenAI client with API key
client = OpenAI()

# Initialize Composio toolset
toolset = ComposioToolSet()

# Get the Tavily tool with all available parameters
tools = toolset.get_tools(actions=[Action.TAVILY_TAVILY_SEARCH])

# Define the market research task with specific parameters
task = {
    "query": "Analyze the competitive landscape of AI-powered customer service solutions in 2024",
    "search_depth": "advanced",  
    "include_answer": True,      
    "max_results": 10,  
    # Focus on relevant industry sources         
    "include_domains": [        
        "techcrunch.com",
        "venturebeat.com",
        "forbes.com",
        "gartner.com",
        "marketsandmarkets.com"
    ],
}

# Send request to LLM
messages = [{"role": "user", "content": str(task)}]

response = client.chat.completions.create(
    model="gpt-4",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

# Handle tool call via Composio
execution_result = None
response_message = response.choices[0].message

if response_message.tool_calls:
    execution_result = toolset.handle_tool_calls(response)
    print("Execution Result:", execution_result)
    messages.append(response_message)
    
    # Add tool response messages
    for tool_call, result in zip(response_message.tool_calls, execution_result):
        messages.append({
            "role": "tool",
            "content": str(result),
            "tool_call_id": tool_call.id
        })
    
    # Get final response from LLM
    final_response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )
    
    print("\nMarket Research Summary:")
    print(final_response.choices[0].message.content)
else:
    print("LLM responded directly (no tool used):", response_message.content) 
```

## Additional Use Cases

1. **Research Automation**: Automate the collection and summarization of research data
2. **Content Curation**: Gather and organize information from multiple sources
3. **Real-time Data Integration**: Keeping your AI models up-to-date with the latest information.


# Dify
Source: https://docs.tavily.com/documentation/integrations/dify

Tavily is now available for no-code integration through Dify.

## Introduction

Integrate Tavily with Dify to enhance your AI workflows without writing any code. Dify is a no-code platform that allows you to build and deploy AI applications using various tools, including the **Tavily Search API** and **Tavily Extract API**. This integration enables access to real-time web data, improving the capabilities of your AI applications.

## How to set up Tavily with Dify

Follow these steps to integrate Tavily with Dify:

<AccordionGroup>
  <Accordion title="Step 1: Log in to Dify">
    Go to [Dify](https://dify.ai/) and log in to your account.
  </Accordion>

  <Accordion title="Step 2: Obtain Your Tavily API Key">
    Go to the [Tavily Dashboard](https://app.tavily.com/home) to obtain your **API key**.
  </Accordion>

  <Accordion title="Step 3: Install the Tavily Tool">
    Install the **Tavily tool** from the [Plugin Marketplace](https://marketplace.dify.ai/plugins/langgenius/tavily) to enable integration with your Dify workflows.
  </Accordion>

  <Accordion title="Step 4: Authorize Tavily in Dify">
    In **Dify**, navigate to **Tools > Tavily > To Authorize** and enter your **Tavily API key** to connect your Dify instance to Tavily.
  </Accordion>
</AccordionGroup>

## Using the Tavily tool in Dify

Tavily can be utilized in various Dify application types:

### Chatflow / Workflow Applications

Dify’s Chatflow and Workflow applications support Tavily tool nodes, which include:

* **Tavily Search API** – Perform dynamic web searches and retrieve up-to-date information.
* **Tavily Extract API** – Extract raw content from web pages.

These nodes allow you to automate tasks such as research, content curation, and real-time data integration into your workflows.

### Agent Applications

In Agent applications, you can integrate the Tavily tool to access web data in real time. Use this to:

* Retrieve structured and relevant search results.
* Extract raw content for further processing.
* Provide accurate, context-aware answers to user queries.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/defy-tavily.png" alt="defy" />

## Example use case: automated deep research

Use **Tavily Search API** within **Dify** to conduct automated, multi-step searches, iterating through multiple queries to gather, refine, and summarize insights for comprehensive reports.

For a detailed walkthrough, check out this blog post:
[DeepResearch: Building a Research Automation App with Dify](https://dify.ai/blog/deepresearch-building-a-research-automation-app-with-dify)

## Best practices for using Tavily in Dify

* **Design Concise Queries** – Use focused queries to maximize the relevance of search results.
* **Utilize Domain Filtering** – Use the `include_domains` parameter to narrow search results to specific domains.
* **Enable an Agentic Workflow** – Leverage an LLM to dynamically generate and refine queries for Tavily.

***


# FlowiseAI
Source: https://docs.tavily.com/documentation/integrations/flowise

Tavily is now available for integration through Flowise.

## Introduction

Integrate [Tavily with FlowiseAI](https://docs.flowiseai.com/integrations/langchain/tools/tavily-ai) to enhance your AI workflows with powerful web search capabilities. Flowise provides a no-code platform for building AI applications, and the Tavily integration offers real-time, accurate search results tailored for LLMs and RAG (Retrieval-Augmented Generation) systems.

Set up Tavily in Flowise to create chatflows or agent flows that can automate research, track news, or feed relevant data into your connected applications.

## How to set up Tavily with Flowise

Follow these steps to integrate Tavily with Flowise:

<AccordionGroup>
  <Accordion title="Step 1: Log in to Flowise">
    <div>[Login](\(https://flowiseai.com/\)) to your Flowise account.</div>
  </Accordion>

  <Accordion title="Step 2: Create a New Flow">
    <div>
      <p>Create a new flow in Flowise:</p>

      <ol>
        <li>Click "Create New Flow"</li>
        <li>Select either "Chat Flow" or "Agent Flow" as the type</li>
        <li>Name your flow (e.g., "Research Assistant")</li>
      </ol>
    </div>
  </Accordion>

  <Accordion title="Step 3: Add Tavily Node">
    <div>
      <p>Add the Tavily node to your flow:</p>

      <p><strong>For Chat Flow:</strong></p>

      <ol>
        <li>Click on the (+) button</li>
        <li>Navigate to <strong>LangChain > Tools > Tavily API</strong></li>
        <li>Drag the Tavily node into your flow</li>
      </ol>

      <p><strong>For Agent Flow:</strong></p>

      <ol>
        <li>Click on the (+) button</li>
        <li>Navigate to <strong>Tools > Tavily API</strong></li>
        <li>Drag the Tavily node into your flow</li>
      </ol>
    </div>
  </Accordion>

  <Accordion title="Step 4: Configure Tavily Node">
    <div>
      <p>Configure the Tavily node with your credentials and parameters:</p>

      <ol>
        <li>Enter your Tavily API key in the credentials section</li>

        <li>
          Configure additional parameters, for example:

          <ul>
            <li><strong>Search Depth:</strong> Choose between 'basic' or 'advanced'</li>
            <li><strong>Max Results:</strong> Set the number of results to return</li>
            <li><strong>Include Domains:</strong> Specify domains to include in search</li>
            <li><strong>Exclude Domains:</strong> Specify domains to exclude from search</li>
          </ul>
        </li>
      </ol>
    </div>
  </Accordion>

  <Accordion title="Step 5: Connect Nodes">
    <div>
      <p>Connect the Tavily node to other nodes in your flow:</p>

      <ol>
        <li>Connect to any node that accepts tool inputs</li>
        <li>Connect to an LLM node for query processing</li>
        <li>Connect to a Response node to format results</li>
      </ol>
    </div>
  </Accordion>
</AccordionGroup>

## Using Tavily in Flowise

Tavily can be utilized in various Flowise application types:

### Chatflow Applications

Flowise's Chatflow applications support Tavily tool node. This node allows you to automate tasks such as research, content curation, and real-time data integration into your workflows.

### Agent Applications

In Agent applications, you can integrate the Tavily tool to access web data in real time. Use this to:

* Retrieve structured and relevant search results
* Extract raw content for further processing
* Provide accurate, context-aware answers to user queries

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/flowise-tavily.png" alt="Flowise Tavily Integration" width="400" height="300" />


# LangChain
Source: https://docs.tavily.com/documentation/integrations/langchain

We're excited to partner with Langchain as their recommended search tool!

> **Warning**: The [`langchain_community.tools.tavily_search.tool`](https://python.langchain.com/docs/integrations/tools/tavily_search/) is deprecated. While it remains functional for now, we strongly recommend migrating to the new `langchain-tavily` Python package which supports both [Search](#tavily-search) and [Extract](#tavily-extract) functionality and receives continuous updates with the latest features.

The [langchain-tavily](https://pypi.org/project/langchain-tavily/) Python package is the offical LangChain integration of Tavily, inlcuding both [TavilySearch](#tavily-search) and [TavilyExtract](#tavily-extract)

## Installation

```bash
pip install -U langchain-tavily
```

### Credentials

We also need to set our Tavily API key. You can get an API key by visiting [this site](https://app.tavily.com/sign-in) and creating an account.

```bash
import getpass
import os

if not os.environ.get("TAVILY_API_KEY"):
    os.environ["TAVILY_API_KEY"] = getpass.getpass("Tavily API key:\n")
```

## Tavily Search

Here we show how to instantiate an instance of the Tavily search tool. The tool accepts various parameters to customize the search. After instantiation we invoke the tool with a simple query. This tool allows you to complete search queries using Tavily's Search API endpoint.

### Instantiation

The tool accepts various parameters during instantiation:

* `max_results` (optional, int): Maximum number of search results to return. Default is 5.
* `topic` (optional, str): Category of the search. Can be "general", "news", or "finance". Default is "general".
* `include_answer` (optional, bool): Include an answer to original query in results. Default is False.
* `include_raw_content` (optional, bool): Include cleaned and parsed HTML of each search result. Default is False.
* `include_images` (optional, bool): Include a list of query related images in the response. Default is False.
* `include_image_descriptions` (optional, bool): Include descriptive text for each image. Default is False.
* `search_depth` (optional, str): Depth of the search, either "basic" or "advanced". Default is "basic".
* `time_range` (optional, str): The time range back from the current date to filter results - "day", "week", "month", or "year". Default is None.
* `include_domains` (optional, List\[str]): List of domains to specifically include. Default is None.
* `exclude_domains` (optional, List\[str]): List of domains to specifically exclude. Default is None.

For a comprehensive overview of the available parameters, refer to the [Tavily Search API documentation](https://docs.tavily.com/documentation/api-reference/endpoint/search)

```python
from langchain_tavily import TavilySearch

tool = TavilySearch(
    max_results=5,
    topic="general",
    # include_answer=False,
    # include_raw_content=False,
    # include_images=False,
    # include_image_descriptions=False,
    # search_depth="basic",
    # time_range="day",
    # include_domains=None,
    # exclude_domains=None
)
```

### Invoke directly with args

The Tavily search tool accepts the following arguments during invocation:

* `query` (required): A natural language search query
* The following arguments can also be set during invokation : `include_images`, `search_depth` , `time_range`, `include_domains`, `exclude_domains`, `include_images`
* For reliability and performance reasons, certain parameters that affect response size cannot be modified during invocation: `include_answer` and `include_raw_content`. These limitations prevent unexpected context window issues and ensure consistent results.

NOTE: The optional arguments are available for agents to dynamically set, if you set a argument during instantiation and then invoke the tool with a different value, the tool will use the value you passed during invokation.

```python
# Basic query
tool.invoke({"query": "What happened at the last wimbledon"})
```

output:

```bash
{
 'query': 'What happened at the last wimbledon',
 'follow_up_questions': None,
 'answer': None,
 'images': [],
 'results':
 [{'url': 'https://en.wikipedia.org/wiki/Wimbledon_Championships',
   'title': 'Wimbledon Championships - Wikipedia',
   'content': 'Due to the COVID-19 pandemic, Wimbledon 2020 was cancelled ...',
   'score': 0.62365627198,
   'raw_content': None},
    ......................................................................
    {'url': 'https://www.cbsnews.com/news/wimbledon-men-final-carlos-alcaraz-novak-djokovic/',
    'title': "Carlos Alcaraz beats Novak Djokovic at Wimbledon men's final to ...",
    'content': 'In attendance on Sunday was Catherine, the Princess of Wales ...',
    'score': 0.5154731446,
    'raw_content': None}],
  'response_time': 2.3
}
```

### Agent Tool Calling

We can use our tools directly with an agent executor by binding the tool to the agent. This gives the agent the ability to dynamically set the available arguments to the Tavily search tool.

In the below example when we ask the agent to find "What is the most popular sport in the world? include only wikipedia sources" the agent will dynamically set the argments and invoke Tavily search tool : Invoking `tavily_search` with `{'query': 'most popular sport in the world', 'include_domains': ['wikipedia.org'], 'search_depth': 'basic'}`

```python
# !pip install -qU langchain langchain-openai langchain-tavily
from typing import Any, Dict, Optional
import datetime

from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_tavily import TavilySearch
from langchain.schema import HumanMessage, SystemMessage

# Initialize LLM
llm = init_chat_model(model="gpt-4o", model_provider="openai", temperature=0)

# Initialize Tavily Search Tool
tavily_search_tool = TavilySearch(
    max_results=5,
    topic="general",
)

# Set up Prompt with 'agent_scratchpad'
today = datetime.datetime.today().strftime("%D")
prompt = ChatPromptTemplate.from_messages([
    ("system", f"""You are a helpful reaserch assistant, you will be given a query and you will need to
    search the web for the most relevant information. The date today is {today}."""),
    MessagesPlaceholder(variable_name="messages"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),  # Required for tool calls
])

# Create an agent that can use tools
agent = create_openai_tools_agent(
    llm=llm,
    tools=[tavily_search_tool],
    prompt=prompt
)

# Create an Agent Executor to handle tool execution
agent_executor = AgentExecutor(agent=agent, tools=[tavily_search_tool], verbose=True)

user_input =  "What is the most popular sport in the world? include only wikipedia sources"

# Construct input properly as a dictionary
response = agent_executor.invoke({"messages": [HumanMessage(content=user_input)]})
```

## Tavily Extract

Here we show how to instantiate an instance of the Tavily extract tool. After instantiation we invoke the tool with a list of URLs. This tool allows you to extract content from URLs using Tavily's Extract API endpoint.

### Instantiation

The tool accepts various parameters during instantiation:

* `extract_depth` (optional, str): The depth of the extraction, either "basic" or "advanced". Default is "basic ".
* `include_images` (optional, bool): Whether to include images in the extraction. Default is False.

For a comprehensive overview of the available parameters, refer to the [Tavily Extract API documentation](https://docs.tavily.com/documentation/api-reference/endpoint/extract)

```python
from langchain_tavily import TavilyExtract

tool = TavilyExtract(
    extract_depth="advanced",
    include_images=False,
)
```

### Invoke directly with args

The Tavily extract tool accepts the following arguments during invocation:

* `urls` (required): A list of URLs to extract content from.
* Both `extract_depth` and `include_images` can also be set during invokation

NOTE: The optional arguments are available for agents to dynamically set, if you set a argument during instantiation and then invoke the tool with a different value, the tool will use the value you passed during invokation.

```python
# Extract content from a URL
result = tool.invoke({
    "urls": ["https://en.wikipedia.org/wiki/Lionel_Messi"]
})
```

output:

```bash
{
    'results': [{
        'url': 'https://en.wikipedia.org/wiki/Lionel_Messi',
        'raw_content': 'Lionel Messi\nLionel Andrés "Leo" Messi...',
        'images': []
    }],
    'failed_results': [],
    'response_time': 0.79
}
```

## Tavily Research Agent

This example demonstrates how to build a powerful web research agent using Tavily's search and extract Langchain tools.

### Features

* Internet Search: Query the web for up-to-date information using Tavily's search API
* Content Extraction: Extract and analyze specific content from web pages
* Seamless Integration: Works with OpenAI's function calling capability for reliable tool use

```python
# !pip install -qU langchain langchain-openai langchain-tavily
from typing import Any, Dict, Optional
import datetime

from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_tavily import TavilySearch, TavilyExtract
from langchain.schema import HumanMessage, SystemMessage

# Initialize LLM
llm = ChatOpenAI(temperature=0, model="gpt-4o")

# Initialize Tavily Search Tool
tavily_search_tool = TavilySearch(
    max_results=5,
    topic="general",
)
# Initialize Tavily Extract Tool
tavily_extract_tool = TavilyExtract()

tools = [tavily_search_tool, tavily_extract_tool]

# Set up Prompt with 'agent_scratchpad'
today = datetime.datetime.today().strftime("%D")
prompt = ChatPromptTemplate.from_messages([
    ("system", f"""You are a helpful reaserch assistant, you will be given a query and you will need to
    search the web for the most relevant information then extract content to gain more insights. The date today is {today}."""),
    MessagesPlaceholder(variable_name="messages"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),  # Required for tool calls
])
# Create an agent that can use tools
agent = create_openai_tools_agent(
    llm=llm,
    tools=tools,
    prompt=prompt
)

# Create an Agent Executor to handle tool execution
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

user_input =  "Research the latest developments in quantum computing and provide a detailed summary of how it might impact cybersecurity in the next decade."

# Construct input properly as a dictionary
response = agent_executor.invoke({"messages": [HumanMessage(content=user_input)]})
```


# Langflow
Source: https://docs.tavily.com/documentation/integrations/langflow

Integrate Tavily with Langflow, an open-source visual framework for building multi-agent and RAG applications.

## Introduction

Integrate [Tavily with Langflow](https://blog.langflow.org/web-search-in-your-ai-agents-a-langflow-tutorial/) to create powerful AI workflows using a visual interface. Langflow is an open-source tool that provides a visual builder for creating AI agents and workflows, making it easy to incorporate Tavily's search and extraction capabilities into your applications.

## Installation

Langflow works with Python 3.10 to 3.13. You can install it using either UV (recommended) or pip:

```bash
# Using UV (recommended)
uv pip install langflow

# Using pip
pip install langflow
```

## Setting Up Tavily Components in Langflow

### Step 1: Launch Langflow

After installation, start Langflow:

```bash
langflow run
```

This will start the Langflow server locally at `http://localhost:7860`.

### Step 2: Using Tavily Components

Langflow provides two main Tavily components in the **Tools** section of the components library:

1. **Tavily Search API**: Perform web searches and retrieve relevant information
   * Located under Tools > Tavily Search API
   * **Configuration Options**: Select the component and go to "Controls" to access all available settings. Here are some key examples:
     * Max Results: Number of results to return
     * Search Depth: "basic" or "advanced"
     * *Note: Additional parameters are available in the Controls panel*

2. **Tavily Extract API**: Extract content from web pages
   * Located under Tools > Tavily Extract API
   * **Configuration Options**: Select the component and go to "Controls" to access all available settings. Here are some key examples:
     * Extract Depth: "basic" or "advanced"
     * *Note: Additional parameters are available in the Controls panel*

### Step 3: Configure Your Tavily API Key

To use Tavily components, you need to enter your [Tavily API key](https://app.tavily.com/home) under "Tavily API Key"

## Example Workflows

### Basic Search Workflow

1. Add a Tavily Search component to your flow
2. Connect it to a prompt template
3. Configure the search parameters
4. Add an LLM component to process the results
5. Connect to an output component

### Content Extraction Workflow

1. Add a Tavily Extract component
2. Connect it to a URL input
3. Configure extraction parameters
4. Add processing components as needed
5. Connect to your desired output

## Example Use Cases

1. **Research Assistant**
   * Combine Tavily Search with LLMs for comprehensive research
   * Extract and summarize information from multiple sources

2. **Content Aggregation**
   * Use Tavily Extract to gather content from specific websites
   * Process and format the extracted content

3. **Market Intelligence**
   * Create workflows for competitive analysis
   * Monitor industry trends and news

4. **Documentation Search**
   * Build custom documentation search interfaces
   * Extract and format technical documentation

## Additional Resources

* [Langflow GitHub Repository](https://github.com/langflow-ai/langflow)
* [Langflow Documentation](https://docs.langflow.org)


# LlamaIndex
Source: https://docs.tavily.com/documentation/integrations/llamaindex

Search the web from LlamaIndex with Tavily.

<Note>
  This tool has a more extensive example use case documented in a Jupyter notebook [here](https://github.com/run-llama/llama_index/blob/main/llama-index-integrations/tools/llama-index-tools-tavily-research/examples/tavily.ipynb).
</Note>

## Install Tavily and LlamaIndex

The following dependencies are required to properly run the integration:

```bash
pip install llama-index-tools-tavily-research llama-index llama-hub tavily-python
```

## Usage

You can use access Tavily in LlamaIndex through the `TavilyToolSpec`.

Here is a simple use case that performs a web search with Tavily and generates an answer to the user's search query:

```python
from llama_index.tools.tavily_research.base import TavilyToolSpec
from llama_index.agent.openai import OpenAIAgent

tavily_tool = TavilyToolSpec(
    api_key='tvly-YOUR_API_KEY',
)
agent = OpenAIAgent.from_tools(tavily_tool.to_tool_list())

agent.chat('What happened in the latest Burning Man festival?')
```

`search`: Search for relevant dynamic data based on a query. Returns a list of urls and their relevant content.

This loader is designed to be used as a way to load data as a Tool in an Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.


# Make
Source: https://docs.tavily.com/documentation/integrations/make

Tavily is now available for no-code integration through Make.

## Introduction

Integrate [Tavily with Make](https://www.make.com/en/integrations/tavily) to enhance your business processes without writing a single line of code. With Tavily's powerful search and content extraction capabilities, you can seamlessly integrate real-time online information into your Make workflows and automations.

<Frame>
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/make-tavily.gif" alt="Make-Tavily" />
</Frame>

## How to set up Tavily with Make

<AccordionGroup>
  <Accordion title="Step 1: Log in to Make">
    <p><a href="https://www.make.com/en/login">Log in</a> to your Make account.</p>
  </Accordion>

  <Accordion title="Step 2: Create a New Scenario">
    <p>Create a new scenario and select a trigger module that will start your workflow.</p>
  </Accordion>

  <Accordion title="Step 3: Add Tavily as an Action Module">
    <div>
      <p>Add Tavily as an action module in your scenario and choose between **Perform a Search** or **Extract Raw Content**:</p>

      <p><strong>Connection:</strong> Connect your Tavily account by entering your [Tavily API key](https://app.tavily.com/home).</p>

      <p><strong>Configuration:</strong> Set up your parameters:</p>

      <p><strong>For Search:</strong></p>

      <ul>
        <li>Enter your search `query` (can be manually entered or populated from another module's output)</li>
        <li>Select a `topic` (`general` or `news`)</li>
        <li>Choose whether to include raw content or generate an answer</li>
        <li>Specify domains to include or exclude</li>
        <li>Set search depth and other optional parameters</li>
      </ul>

      <p><strong>For Extract:</strong></p>

      <ul>
        <li>Enter the URL(s) to extract content from (can be a single URL or multiple URLs from another module's output)</li>
        <li>Choose extraction type (`basic` or `advanced`)</li>
      </ul>

      <p><strong>Test:</strong> Run a test to verify your configuration.</p>
    </div>
  </Accordion>

  <Accordion title="Step 4: Process and Use Tavily Results">
    <div>
      <p>Utilize the search results in your workflow:</p>

      <ul>
        <li>Process data through additional modules</li>
        <li>Send information to your CRM or database</li>
        <li>Generate reports or notifications</li>
        <li>Feed data into AI models for further processing</li>
      </ul>
    </div>
  </Accordion>
</AccordionGroup>

## Use cases for Tavily in Make

Leverage Tavily's capabilities to create powerful automated workflows:

* **Competitive Intelligence**: Automatically gather and analyze competitor information
* **Market Research**: Track industry trends and market developments
* **Content Curation**: Collect and organize relevant content for your business
* **Lead Enrichment**: Enhance lead data with real-time information
* **News Monitoring**: Stay updated with the latest developments in your field

## Detailed example - automated market research

Create an automated workflow that performs market research and delivers insights to your team.

<Accordion title="Workflow Steps">
  <ol>
    <li><strong>Trigger:</strong> Schedule the scenario to run daily or weekly</li>
    <li><strong>Generate Search Queries:</strong> Use an AI module to create relevant search queries</li>
    <li><strong>Execute Searches:</strong> Use Tavily to perform multiple searches with the generated queries</li>
    <li><strong>Process Results:</strong> Filter and organize the search results</li>
    <li><strong>Generate Report:</strong> Use an AI module to create a comprehensive report</li>
    <li><strong>Deliver Insights:</strong> Send the report via email or to your team's communication platform</li>
  </ol>
</Accordion>

## Best practices

To optimize your Tavily integration in Make:

* Use the Iterator module to process multiple search results efficiently
* Use filters to process only relevant results
* Use the Aggregator module to combine multiple search results


# Pydantic AI
Source: https://docs.tavily.com/documentation/integrations/pydantic-ai

Tavily is now available for integration through Pydantic AI.

## Introduction

Integrate[Tavily with Pydantic AI](https://ai.pydantic.dev/common-tools/#tavily-search-tool) to enhance your AI agents with powerful web search capabilities. Pydantic AI provides a framework for building AI agents with tools, making it easy to incorporate real-time web search and data extraction into your applications.

## Step-by-Step Integration Guide

### Step 1: Install Required Packages

Install the necessary Python packages:

```bash
pip install "pydantic-ai-slim[tavily]"
```

### Step 2: Set Up API Keys

* **Tavily API Key:** [Get your Tavily API key here](https://app.tavily.com/home)

Set this as an environment variable in your terminal or add it to your environment configuration file:

```bash
export TAVILY_API_KEY=your_tavily_api_key
```

### Step 3: Initialize Pydantic AI Agent with Tavily Tools

```python
import os
from pydantic_ai.agent import Agent
from pydantic_ai.common_tools.tavily import tavily_search_tool

# Get API key from environment
api_key = os.getenv('TAVILY_API_KEY')
assert api_key is not None

# Initialize the agent with Tavily tools
agent = Agent(
    'openai:o3-mini',
    tools=[tavily_search_tool(api_key)],
    system_prompt='Search Tavily for the given query and return the results.'
)
```

### Step 4: Example Use Cases

```python
# Example 1: Basic search for news
result = agent.run_sync('Tell me the top news in the GenAI world, give me links.')
print(result.output)
```

Example Response:

```markdown
Here are some of the top recent news articles related to GenAI:

1. How CLEAR users can improve risk analysis with GenAI – Thomson Reuters
   Read more: https://legal.thomsonreuters.com/blog/how-clear-users-can-improve-risk-analysis-with-genai/
   (This article discusses how CLEAR's new GenAI-powered tool streamlines risk analysis by quickly summarizing key information from various public data sources.)

2. TELUS Digital Survey Reveals Enterprise Employees Are Entering Sensitive Data Into AI Assistants More Than You Think – FT.com
   Read more: https://markets.ft.com/data/announce/detail?dockey=600-202502260645BIZWIRE_USPRX____20250226_BW490609-1
   (This news piece highlights findings from a TELUS Digital survey showing that many enterprise employees use public GenAI tools and sometimes even enter sensitive data.)

3. The Essential Guide to Generative AI – Virtualization Review
   Read more: https://virtualizationreview.com/Whitepapers/2025/02/SNOWFLAKE-The-Essential-Guide-to-Generative-AI.aspx
   (This guide provides insights into how GenAI is revolutionizing enterprise strategies and productivity, with input from industry leaders.)
```

## Additional Use Cases

1. **Content Curation**: Gather and organize information from multiple sources
2. **Real-time Data Integration**: Keep your AI agents up-to-date with the latest information
3. **Technical Documentation**: Search and analyze technical documentation
4. **Market Analysis**: Conduct comprehensive market research and analysis


# Tines
Source: https://docs.tavily.com/documentation/integrations/tines

Integrate Tavily with Tines for automated, no-code intelligence workflows.

## Introduction

Integrate [Tavily with Tines](https://www.tines.com/docs/credentials/connect-flows/tavily/) to enhance your automation workflows with powerful web search and content extraction capabilities. Tines' no-code platform makes it easy to incorporate Tavily's real-time search and data extraction features into your stories, enabling you to build powerful automation workflows without writing code.

## How to set up Tavily with Tines

<AccordionGroup>
  <Accordion title="Step 1: Log in to Tines">
    <p><a href="https://www.tines.com/">Log in</a> to your Tines account.</p>
  </Accordion>

  <Accordion title="Step 2: Create or Open a Story">
    <p>Create a new story or open an existing one where you want to add Tavily.</p>
  </Accordion>

  <Accordion title="Step 3: Add a Tavily Action">
    <div>
      <p>Follow these steps to add a Tavily action to your story:</p>

      <ol>
        <li>Navigate to the Templates section.</li>
        <li>Search for "Tavily" in the search bar.</li>
        <li>Drag the Tavily action into your story.</li>
        <li>Select a template between "Extract Web Content" and "Search the Web" based on your use case.</li>
        <li>Click on the Tavily connection to set up new credentials.</li>
        <li>Enter your Tavily API key in the provided field.</li>
      </ol>
    </div>
  </Accordion>

  <Accordion title="Step 4: Process and Use Tavily Results">
    <div>
      <p>Use Tines built-in actions to process Tavily's response:</p>

      <ul>
        <li>Parse and filter search results</li>
        <li>Enrich alerts or tickets with real-time intelligence</li>
        <li>Trigger notifications or follow-up actions based on findings</li>
      </ul>
    </div>
  </Accordion>
</AccordionGroup>

## Use cases for Tavily in Tines

* **Workbench Integration**: Connect Tavily to Tines Workbench (AI-powered chat interface) to enable real-time web search and content extraction directly in your conversations
* **Market & News Monitoring**: Track industry trends or breaking news relevant to your organization
* **Lead & Entity Enrichment**: Pull real-time data on companies, people, or technologies
* **Content Extraction**: Extract and analyze web content for deeper investigations

## Example Use Cases

<AccordionGroup>
  <Accordion title="Enrich new Airtable company records using Tavily search">
    <p>
      Enrich a company when it is added to an Airtable database. Receive a webhook notification when a new record is added and fill out the remaining fields with web searches powered by Tavily.<br />
      See the <a href="https://www.tines.com/library/stories/1312477/?name=enrich-new-airtable-company-records-using-tavily-searches" target="_blank">full story</a> on Tines' library.
    </p>
  </Accordion>

  <Accordion title="Search the internet with Tavily via Slack">
    <p>
      Search the internet using Tavily in response to a Slack slash command. Summarize the results and post them in a Slack thread, including source links. Users can click on the links to access more detailed information from the original sources.<br />
      See the <a href="https://www.tines.com/library/stories/1312847/?name=search-the-internet-with-tavily-via-slack" target="_blank">full story</a> on Tines' library.
    </p>
  </Accordion>
</AccordionGroup>


# Zapier
Source: https://docs.tavily.com/documentation/integrations/zapier

 Tavily is now available for no-code integration through Zapier.

## Introduction

No need to write a single line of code to connect Tavily to your business processes. With Tavily's robust search capabilities, you can pull in the latest online information into any application or workflow.

Simply set up [**Tavily in Zapier**](https://zapier.com/apps/tavily/integrations) to automate research, track real-time news, or feed relevant data into your tools of choice.

## How to set up Tavily with Zapier

<AccordionGroup>
  <Accordion title="Step 1: Log in to Zapier">
    <p><a href="https://zapier.com/sign-up">Log in</a> to your Zapier account.</p>
  </Accordion>

  <Accordion title="Step 2: Create a Zap and Select a Trigger Event">
    <p>Create a new Zap and select a trigger event that will start your workflow.</p>
  </Accordion>

  <Accordion title="Step 3: Add an Action Step with Tavily">
    <p>
      Add an action step with Tavily in your workflow:

      <ul>
        <li><strong>Setup:</strong> Connect your Tavily account by pasting your API key.</li>
        <li><strong>Configure:</strong> Enter your search `query` along with optional parameters, such as selecting a `topic` (`general` or `news`), deciding whether to include raw content from the sources or an answer based on the content found, and specifying particular domains to run the search on.</li>
        <li><strong>Test:</strong> Test your query.</li>
      </ul>
    </p>
  </Accordion>

  <Accordion title="Step 4: Use the Results and Answer Generated by Tavily">
    <p>
      Use the `results` and optionally the `answer` generated by Tavily in the rest of your workflow, such as:

      <ul>
        <li>Sending up-to-date research to your CRM.</li>
        <li>Feeding real-time content into your language model (e.g., GPT models) for additional applications.</li>
        <li>Inserting dynamic info into an email automation tool.</li>
      </ul>
    </p>
  </Accordion>
</AccordionGroup>

## Use cases for Tavily in Zapier

With Tavily, you can harness the power of Retrieval-Augmented Generation (RAG) to create complex workflows. Here are some examples, for inspiration:

* **Automated Email Generation**: Use Tavily to create tailored emails based on real-time data.

* **Meeting Preparation**: Gather real-time information about meeting participants. For instance, before a client meeting, retrieve their latest news or social media updates and receive a concise summary through your preferred method, ensuring you’re well-informed.

* **Automated Reporting**: Utilize Tavily’s online search data to generate reports. Push this information into tools like **Google Sheets**, **Notion**, or **Slack** to create a weekly digest of industry trends or competitor analysis, keeping your team updated effortlessly.

## Detailed example - company research

We can build an automated workflow that executes brief company research for newly signed-up companies and delivers the report via Slack.

<Accordion title="Workflow Steps">
  <ol>
    <li><strong>Trigger Event:</strong> A new company is created in your CRM.</li>
    <li><strong>Conduct Company Search:</strong> Use Tavily to perform a general search using the company's domain (provided by the CRM).</li>
    <li><strong>Retrieve Current Date:</strong> Capture the current date and pass it to the LLM in the next step.</li>
    <li><strong>Generate Search Queries:</strong> Request the LLM to create 3 concise search queries for Tavily to obtain additional information about the company (e.g., industry, ARR, CEO, CTO). Include the previously gathered data from the company website as context to prevent redundancy. Ask the LLM to incorporate important keywords related to the company to avoid retrieving information about a different company with the same name but in a different industry or domain.</li>
    <li><strong>Organize Queries:</strong> Format the generated queries into separate fields for use in distinct steps.</li>
    <li><strong>Configure Queries:</strong> Set up the 3 queries in Tavily across 3 individual steps.</li>
    <li><strong>Extract Structured Data:</strong> Instruct the LLM to fill in specific details about the company from the gathered data and indicate the sources used for verification. Additionally, instruct the LLM to use the sources extracted from the domain as the ground truth.</li>
    <li><strong>Refine Information:</strong> Format the information for clarity and professionalism.</li>
    <li><strong>Send to Slack:</strong> Deliver the final message to Slack for easy access and sharing.</li>
  </ol>

  <img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/zap.png" alt="zap" />
</Accordion>

## Best practices

To use Tavily most efficiently in your Zapier workflows, keep the following guidelines in mind when designing your automations:

* Create concise queries for Tavily, and if needed, create multiple Tavily steps.
* If up-to-date news information is required, configure "news" as your topic.
* Add the current date to your queries for relevant, updated information.
* Consider using specific domains to narrow down search results.
* Use an LLM to generate queries for Tavily to enable a more agentic workflow.


# Tavily MCP Server
Source: https://docs.tavily.com/documentation/mcp

Tavily MCP Server allows you to use the Tavily API in your MCP clients.

<CardGroup cols={2}>
  <Card title="GitHub" icon="github" href="https://github.com/tavily-ai/tavily-mcp" horizontal>
    `/tavily-ai/tavily-mcp`

    <img noZoom src="https://img.shields.io/github/stars/tavily-ai/tavily-mcp?style=social" alt="GitHub Repo stars" />
  </Card>

  <Card title="NPM" icon="npm" href="https://www.npmjs.com/package/tavily-mcp" horizontal>
    `@tavily/mcp`

    <img noZoom src="https://img.shields.io/npm/dt/tavily-mcp" alt="npm" />
  </Card>
</CardGroup>

<Tip>
  **Compatible with both [Cursor](https://cursor.sh) and [Claude Desktop](https://claude.ai/download)!**

  Tavily MCP is also compatible with any MCP client.
</Tip>

<Info>
  **Check out our
  [tutorial](https://medium.com/@dustin_36183/building-a-knowledge-graph-assistant-combining-tavily-and-neo4j-mcp-servers-with-claude-db92de075df9)
  on combining Tavily MCP with Neo4j MCP server!**
</Info>

<Frame>
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/mcp-demo.gif" alt="Tavily MCP Demo" />
</Frame>

<Tabs>
  <Tab title="Overview">
    The Model Context Protocol (MCP) is an open standard that enables AI systems to interact seamlessly with various data sources and tools, facilitating secure, two-way connections.

    Developed by Anthropic, the Model Context Protocol (MCP) enables AI assistants like Claude to seamlessly integrate with Tavily's advanced search and data extraction capabilities. This integration provides AI models with real-time access to web information, complete with sophisticated filtering options and domain-specific search features.
  </Tab>

  <Tab title="Features">
    The Tavily MCP server provides:

    * Seamless interaction with the tavily-search and tavily-extract tools
    * Real-time web search capabilities through the tavily-search tool
    * Intelligent data extraction from web pages via the tavily-extract tool
  </Tab>
</Tabs>

## Prerequisites

<AccordionGroup>
  <Accordion title="Required Tools" icon="wrench">
    * [Tavily API key](https://app.tavily.com/home)
      * If you don't have a Tavily API key, you can sign up for a free account [here](https://app.tavily.com/home)
    * [Claude Desktop](https://claude.ai/download) or [Cursor](https://cursor.sh)
    * [Node.js](https://nodejs.org/) (v20 or higher)
      * You can verify your Node.js installation by running:
        ```bash
        node --version
        ```
  </Accordion>

  <Accordion title="Git Installation (Optional)" icon="code-branch">
    Only needed if using Git installation method:

    * On macOS: `brew install git`
    * On Linux:
      * Debian/Ubuntu: `sudo apt install git`
      * RedHat/CentOS: `sudo yum install git`
    * On Windows: Download [Git for Windows](https://git-scm.com/download/win)
  </Accordion>
</AccordionGroup>

## Installation Methods

<CodeGroup>
  ```bash NPX
  npx -y tavily-mcp@0.1.3
  ```

  ```bash Git
  git clone https://github.com/tavily-ai/tavily-mcp.git
  cd tavily-mcp
  npm install
  npm run build
  ```
</CodeGroup>

<Note>
  Although you can launch a server on its own, it's not particularly helpful in
  isolation. Instead, you should integrate it into an MCP client.
</Note>

## Configuring MCP Clients

<Tabs>
  <Tab title="Cursor">
    > **Note**: Requires Cursor version 0.45.6 or higher

    To set up the Tavily MCP server in Cursor:

    1. Open Cursor Settings
    2. Navigate to Features > MCP Servers
    3. Click on the "+ Add New MCP Server" button
    4. Fill out the following information:
       * **Name**: Enter a nickname for the server (e.g., "tavily-mcp")
       * **Type**: Select "command" as the type
       * **Command**: Enter the command to run the server:
         ```bash
         env TAVILY_API_KEY=tvly-YOUR_API_KEY npx -y tavily-mcp@0.1.3
         ```
         <Warning>Replace `tvly-YOUR_API_KEY` with your Tavily API key from [app.tavily.com/home](https://app.tavily.com/home)</Warning>

    <Frame>
      <img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/cursor-reference.png" alt="Cursor Interface Example" />
    </Frame>
  </Tab>

  <Tab title="Claude Desktop">
    <CodeGroup>
      ```bash macOS
      # Create the config file if it doesn't exist
      touch "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

      # Opens the config file in TextEdit
      open -e "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

      # Alternative method using Visual Studio Code
      code "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      ```

      ```bash Windows
      code %APPDATA%\Claude\claude_desktop_config.json
      ```
    </CodeGroup>

    Add this configuration (replace `tvly-YOUR_API_KEY-here` with your [Tavily API key](https://tavily.com/api-keys)):

    ```json Configuration
    {
      "mcpServers": {
        "tavily-mcp": {
          "command": "npx",
          "args": ["-y", "tavily-mcp@0.1.2"],
          "env": {
            "TAVILY_API_KEY": "tvly-YOUR_API_KEY-here"
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Usage Examples

<AccordionGroup>
  <Accordion title="Tavily Search Examples" icon="magnifying-glass">
    1. **General Web Search**:

    ```
    Can you search for recent developments in quantum computing?
    ```

    2. **News Search**:

    ```
    Search for news articles about AI startups from the last 7 days.
    ```

    3. **Domain-Specific Search**:

    ```
    Search for climate change research on nature.com and sciencedirect.com
    ```
  </Accordion>

  <Accordion title="Tavily Extract Examples" icon="file-export">
    **Extract Article Content**: `Extract the main content from this article:
      https://example.com/article`
  </Accordion>

  <Accordion title="Combined Usage" icon="wand-magic-sparkles">
    ```
    Search for news articles about AI startups from the last 7 days and extract the main content from each article to generate a detailed report.
    ```
  </Accordion>
</AccordionGroup>

## Troubleshooting

<Accordion title="Server Not Found" icon="server">
  If you encounter server connection issues, run these commands to verify your environment:

  ```bash
  npm --version
  node --version
  ```

  Make sure to also check your configuration syntax for any errors.
</Accordion>

<Accordion title="NPX Issues" icon="terminal">
  If experiencing problems with npx, locate your executable:

  ```bash
  which npx
  ```

  <Tip>
    Once you have the path, update your configuration to use the full path to the npx executable.
  </Tip>
</Accordion>

<Accordion title="API Key Issues" icon="key">
  When troubleshooting API key problems, verify that your key is:

  * Properly formatted with the `tvly-` prefix
  * Valid and active in your Tavily dashboard
  * Correctly configured in your environment variables

  <Tip>
    You can test your API key validity by making a simple test request through the [Tavily Playground](https://app.tavily.com/playground)
  </Tip>
</Accordion>

## Acknowledgments

<CardGroup cols={2}>
  <Card title="Model Context Protocol" icon="book" href="https://modelcontextprotocol.io">
    For the MCP specification
  </Card>

  <Card title="Anthropic" icon="robot" href="https://www.anthropic.com/claude">
    For Claude Desktop
  </Card>
</CardGroup>


# Privacy Policy
Source: https://docs.tavily.com/documentation/privacy





# Quickstart
Source: https://docs.tavily.com/documentation/quickstart

Start searching with Tavily in under 5 minutes.

## Get your free Tavily API key

Head to the [Tavily Platform](https://app.tavily.com) and sign in (or create an account). Then, copy one of your API keys from your dashboard.

<Card icon="key" href="https://app.tavily.com" title="Get your free API key" horizontal>
  You get 1,000 free API Credits every month. **No credit card required.**
</Card>

## Install Tavily

Install the Tavily SDK in your language of choice.

<CodeGroup>
  ```bash Python
  pip install tavily-python
  ```

  ```bash JavaScript
  npm i @tavily/core
  ```
</CodeGroup>

## Start searching with Tavily

Run your first Tavily Search in 4 lines of code. Simply replace the API key in this snippet with your own.

<CodeGroup>
  ```python Python
  from tavily import TavilyClient

  tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
  response = tavily_client.search("Who is Leo Messi?")

  print(response)
  ```

  ```js JavaScript
  const { tavily } = require("@tavily/core");

  const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
  const response = await tvly.search("Who is Leo Messi?");

  console.log(response);
  ```

  ```bash cURL
  curl -X POST https://api.tavily.com/search \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer tvly-YOUR_API_KEY" \
    -d '{"query": "Who is Leo Messi?"}'
  ```
</CodeGroup>

## Next steps

That's all it takes to start using Tavily's basic features!

If you want to learn how to implement more complex workflows in Python, check out our intermediate-level [Getting Started notebook](https://colab.research.google.com/drive/1dWGtS3u4ocCLebuaa8Ivz7BkZ_40IgH1).

Or, dive deep into our API and read about the different parameters on our [API Reference](/documentation/api-reference/introduction) page, and learn how to integrate natively with one of our [SDKs](/sdk).


# Rate Limits
Source: https://docs.tavily.com/documentation/rate-limits

Learn about Tavily's API rate limits for both  development and production environments.

We offer two types of rate limits based on the environment associated with your API key.

<Card icon="key" href="https://app.tavily.com" title="Get your API key" horizontal>
  Create your Development or Production API keys.
</Card>

<table style={{ textAlign: "left", padding: "8px", width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Environment</th>
      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Requests per minute (RPM)</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}><code>Development</code></td>
      <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>100</td>
    </tr>

    <tr>
      <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}><code>Production</code></td>
      <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>1,000</td>
    </tr>
  </tbody>
</table>

<Tip>
  1. Access to production keys requires either an active **Paid Plan** or **PAYGO** enabled. More information can be found [here](/guides/api-credits).
  2. When using the REST API, ensure you include your API key in the header to apply the correct rate limits.
</Tip>


# Tavily Search Crawler
Source: https://docs.tavily.com/documentation/search-crawler



Like any other search engine, Tavily Search has a crawler to discover new pages and index their content.

The Tavily Search crawler does not advertise a differentiated user agent because we must avoid discrimination from websites that allow only Google to crawl them. However, if a domain or page is not crawlable by Googlebot, then Tavily Search’s bot will not crawl it either.

### Indexing and Delisting

* robots.txt is not used to prevent a page from being indexed. Instead, a site owner can delist a page by using the robots noindex directive.
* Once your web page has been updated with this directive, Tavily needs to re-fetch it to apply the changes.

### Right to Be Forgotten

If your inquiry is about delisting web pages containing personal data about you, please follow the guidance and process of the [right to be forgotten](/documentation/Right-To-Be-Forgotten).

### Reporting Non-Existent Pages

In case Tavily Search is returning a page that no longer exists, and you would like to have it delisted, you may contact us at **[support@tavily.com](mailto:support@tavily.com)**.


# Security & Compliance
Source: https://docs.tavily.com/documentation/trust





# GPT Researcher
Source: https://docs.tavily.com/examples/open-sources/gpt-researcher



## Multi Agent Frameworks

We are strong advocates for the future of AI agents, envisioning a world where autonomous agents communicate and collaborate as a cohesive team to undertake and complete complex tasks.

We hold the belief that research is a pivotal element in successfully tackling these complex tasks, ensuring superior outcomes.

Consider the scenario of developing a coding agent responsible for coding tasks using the latest API documentation and best practices. It would be wise to integrate an agent specializing in research to curate the most recent and relevant documentation, before crafting a technical design that would subsequently be handed off to the coding assistant tasked with generating the code. This approach is applicable across various sectors, including finance, business analysis, healthcare, marketing, and legal, among others.

One multi-agent framework that we're excited about is [LangGraph](https://langchain-ai.github.io/langgraph/), built by the team at [Langchain](https://www.langchain.com/). LangGraph is a Python library for building stateful, multi-actor applications with LLMs. It extends the [LangChain Expression Language](https://python.langchain.com/docs/concepts/lcel/) with the ability to coordinate multiple chains (or actors) across multiple steps of computation.

What's great about LangGraph is that it follows a DAG architecture, enabling each specialized agent to communicate with one another, and subsequently trigger actions among other agents within the graph.

We've added an example for leveraging [GPT Researcher with LangGraph](https://github.com/assafelovic/gpt-researcher/tree/master/multi_agents) which can be found in `/multi_agents`.

The example demonstrates a generic use case for an editorial agent team that works together to complete a research report on a given task.

### The Multi Agent Team

The research team is made up of 7 AI agents:

1. Chief Editor - Oversees the research process and manages the team. This is the "master" agent that coordinates the other agents using Langgraph.
2. Researcher (gpt-researcher) - A specialized autonomous agent that conducts in depth research on a given topic.
3. Editor - Responsible for planning the research outline and structure.
4. Reviewer - Validates the correctness of the research results given a set of criteria.
5. Revisor - Revises the research results based on the feedback from the reviewer.
6. Writer - Responsible for compiling and writing the final report.
7. Publisher - Responsible for publishing the final report in various formats.

### How it works

Generally, the process is based on the following stages:

1. Planning stage
2. Data collection and analysis
3. Writing and submission
4. Review and revision
5. Publication

### Architecture

<img height="100" src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/gpt-researcher.png" />

### Steps

More specifically (as seen in the architecture diagram) the process is as follows:

1. Browser (gpt-researcher) - Browses the internet for initial research based on the given research task.
2. Editor - Plans the report outline and structure based on the initial research.
3. For each outline topic (in parallel):
4. Researcher (gpt-researcher) - Runs an in depth research on the subtopics and writes a draft.
5. Reviewer - Validates the correctness of the draft given a set of criteria and provides feedback.
6. Revisor - Revises the draft until it is satisfactory based on the reviewer feedback.
7. Writer - Compiles and writes the final report including an introduction, conclusion and references section from the given research findings.
8. Publisher - Publishes the final report to multi formats such as PDF, Docx, Markdown, etc.

### How to run

1. Install required packages:

```python
pip install -r requirements.txt
```

2. Run the application:

```python
python main.py
```

### Usage

To change the research query and customize the report, edit the `task.json` file in the main directory.

## Customization

The config.py enables you to customize GPT Researcher to your specific needs and preferences.

Thanks to our amazing community and contributions, GPT Researcher supports multiple LLMs and Retrievers. In addition, GPT Researcher can be tailored to various report formats (such as APA), word count, research iterations depth, etc.

GPT Researcher defaults to our recommended suite of integrations: [OpenAI](https://platform.openai.com/docs/overview) for LLM calls and [Tavily API](https://app.tavily.com/home) for retrieving realtime online information.

As seen below, OpenAI still stands as the superior LLM. We assume it will stay this way for some time, and that prices will only continue to decrease, while performance and speed increase over time.

It may not come as a surprise that our default search engine is Tavily. We're aimed at building our search engine to tailor the exact needs of searching and aggregating for the most factual and unbiased information for research tasks. We highly recommend using it with GPT Researcher, and more generally with LLM applications that are built with RAG.

Here is an example of the default config.py file found in `/gpt_researcher/config/`:

```python
def __init__(self, config_file: str = None):
    self.config_file = config_file
    self.retriever = "tavily"
    self.llm_provider = "openai"
    self.fast_llm_model = "gpt-3.5-turbo"
    self.smart_llm_model = "gpt-4o"
    self.fast_token_limit = 2000
    self.smart_token_limit = 4000
    self.browse_chunk_max_length = 8192
    self.summary_token_limit = 700
    self.temperature = 0.6
    self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)" \
                      " Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
    self.memory_backend = "local"
    self.total_words = 1000
    self.report_format = "apa"
    self.max_iterations = 1

    self.load_config_file()
```

Please note that you can also include your own external JSON file by adding the path in the config\_file param.

To learn more about additional LLM support you can check out the [Langchain supported LLMs documentation](https://python.langchain.com/docs/integrations/llms/). Simply pass different provider names in the `llm_provider` config param.

You can also change the search engine by modifying the retriever param to others such as `duckduckgo`, `googleAPI`, `googleSerp`, `searx` and more.

Please note that you might need to sign up and obtain an API key for any of the other supported retrievers and LLM providers.

## Agent Example

If you're interested in using GPT Researcher as a standalone agent, you can easily import it into any existing Python project. Below, is an example of calling the agent to generate a research report:

```python
from gpt_researcher import GPTResearcher
import asyncio

# It is best to define global constants at the top of your script
QUERY = "What happened in the latest burning man floods?"
REPORT_TYPE = "research_report"

async def fetch_report(query, report_type):
    """
    Fetch a research report based on the provided query and report type.
    """
    researcher = GPTResearcher(query=query, report_type=report_type, config_path=None)
    await researcher.conduct_research()
    report = await researcher.write_report()
    return report

async def generate_research_report():
    """
    This is a sample script that executes an async main function to run a research report.
    """
    report = await fetch_report(QUERY, REPORT_TYPE)
    print(report)

if __name__ == "__main__":
    asyncio.run(generate_research_report())
```

You can further enhance this example to use the returned report as context for generating valuable content such as news article, marketing content, email templates, newsletters, etc.

You can also use GPT Researcher to gather information about code documentation, business analysis, financial information and more. All of which can be used to complete much more complex tasks that require factual and high quality realtime information.

## Getting Started

**Step 0** - Install Python 3.11 or later. [See here](https://www.tutorialsteacher.com/python/install-python) for a step-by-step guide.

**Step 1** - Download the project and navigate to its directory

```python
$ git clone https://github.com/assafelovic/gpt-researcher.git
$ cd gpt-researcher
```

**Step 2** - Set up API keys using two methods: exporting them directly or storing them in a `.env` file.

For Linux/Temporary Windows Setup, use the export method:

```python
export OPENAI_API_KEY={Your OpenAI API Key here}
export TAVILY_API_KEY={Your Tavily API Key here}
```

For a more permanent setup, create a `.env` file in the current gpt-researcher folder and input the keys as follows:

```python
OPENAI_API_KEY={Your OpenAI API Key here}
TAVILY_API_KEY={Your Tavily API Key here}
```

For LLM, we recommend [OpenAI GPT](https://platform.openai.com/docs/guides/text-generation), but you can use any other LLM model (including open sources), simply change the llm model and provider in config/config.py.
For search engine, we recommend [Tavily Search API](https://app.tavily.com/home), but you can also refer to other search engines of your choice by changing the search provider in config/config.py to `duckduckgo`, `googleAPI`, `googleSerp`, `searx`, or `bing`. Then add the corresponding env API key as seen in the config.py file.

### Quickstart

**Step 1** - Install dependencies

```python
$ pip install -r requirements.txt
```

**Step 2** - Run the agent with FastAPI

```python
$ uvicorn main:app --reload
```

**Step 3** - Go to [http://localhost:8000](http://localhost:8000) on any browser and enjoy researching!

### Using Virtual Environment or Poetry

Select either based on your familiarity with each:

### Virtual Environment

Establishing the Virtual Environment with Activate/Deactivate configuration
Create a virtual environment using the `venv` package with the environment name `<your_name>`, for example, `env`. Execute the following command in the PowerShell/CMD terminal:

```python
python -m venv env
```

To activate the virtual environment, use the following activation script in PowerShell/CMD terminal:

```python
.\env\Scripts\activate
```

To deactivate the virtual environment, run the following deactivation script in PowerShell/CMD terminal:

```python
deactivate
```

Install the dependencies for a Virtual environment
After activating the `env` environment, install dependencies using the `requirements.txt` file with the following command:

```python
python -m pip install -r requirements.txt
```

### Poetry

Establishing the Poetry dependencies and virtual environment with Poetry version `~1.7.1`
Install project dependencies and simultaneously create a virtual environment for the specified project. By executing this command, Poetry reads the project's "pyproject.toml" file to determine the required dependencies and their versions, ensuring a consistent and isolated development environment. The virtual environment allows for a clean separation of project-specific dependencies, preventing conflicts with system-wide packages and enabling more straightforward dependency management throughout the project's lifecycle.

```python
poetry install
```

Activate the virtual environment associated with a Poetry project
By running this command, the user enters a shell session within the isolated environment associated with the project, providing a dedicated space for development and execution. This virtual environment ensures that the project dependencies are encapsulated, avoiding conflicts with system-wide packages. Activating the Poetry shell is essential for seamlessly working on a project, as it ensures that the correct versions of dependencies are used and provides a controlled environment conducive to efficient development and testing.

```python
poetry shell
```

### Run the app

Launch the FastAPI application agent on a Virtual Environment or Poetry setup by executing the following command:

```python
python -m uvicorn main:app --reload
```

Visit [http://localhost:8000](http://localhost:8000) in any web browser and explore your research!

### Try it with Docker

**Step 1** - Install Docker

Follow the instructions [here](https://docs.docker.com/engine/install/)

**Step 2** - Create `.env` file with your OpenAI Key or simply export it

```python
$ export OPENAI_API_KEY={Your API Key here}
$ export TAVILY_API_KEY={Your Tavily API Key here}
```

**Step 3** - Run the application

```python
$ docker-compose up
```

**Step 4** - Go to [http://localhost:8000](http://localhost:8000) on any browser and enjoy researching!

## Introduction

[GPT Researcher](https://gptr.dev/) is an autonomous agent designed for comprehensive online research on a variety of tasks.

The agent can produce detailed, factual and unbiased research reports, with customization options for focusing on relevant resources, outlines, and lessons. Inspired by the recent [Plan-and-Solve](https://arxiv.org/abs/2305.04091) and [RAG](https://arxiv.org/abs/2005.11401) papers, GPT Researcher addresses issues of speed, determinism and reliability, offering a more stable performance and increased speed through parallelized agent work, as opposed to synchronous operations.

### Why GPT Researcher?

1. To form objective conclusions for manual research tasks can take time, sometimes weeks to find the right resources and information.
2. Current LLMs are trained on past and outdated information, with heavy risks of hallucinations, making them almost irrelevant for research tasks.
3. Solutions that enable web search (such as ChatGPT + Web Plugin), only consider limited resources and content that in some cases result in superficial conclusions or biased answers.
4. Using only a selection of resources can create bias in determining the right conclusions for research questions or tasks.

### Architecture

The main idea is to run "planner" and "execution" agents, whereas the planner generates questions to research, and the execution agents seek the most related information based on each generated research question. Finally, the planner filters and aggregates all related information and creates a research report.

The agents leverage both gpt3.5-turbo and gpt-4-turbo (128K context) to complete a research task. We optimize for costs using each only when necessary. The average research task takes around 3 minutes to complete, and costs \~\$0.1.

<img height="100" src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/report-flow.png" />

More specifically:

1. Create a domain specific agent based on research query or task.
2. Generate a set of research questions that together form an objective opinion on any given task.
3. For each research question, trigger a crawler agent that scrapes online resources for information relevant to the given task.
4. For each scraped resources, summarize based on relevant information and keep track of its sources.
5. Finally, filter and aggregate all summarized sources and generate a final research report.

### Demo

<iframe height="400" width="700" src="https://github.com/assafelovic/gpt-researcher/assets/13554167/a00c89a6-a295-4dd0-b58d-098a31c40fda" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen />

### Tutorials

1. [How it Works](https://medium.com/better-programming/how-i-built-an-autonomous-ai-agent-for-online-research-93435a97c6c)
2. [How to Install](https://www.loom.com/share/04ebffb6ed2a4520a27c3e3addcdde20?sid=da1848e8-b1f1-42d1-93c3-5b0b9c3b24ea)
3. [Live Demo](https://www.loom.com/share/6a3385db4e8747a1913dd85a7834846f?sid=a740fd5b-2aa3-457e-8fb7-86976f59f9b8)
4. [Home Page](https://gptr.dev/)

### Features

1. 📝 Generate research, outlines, resources and lessons reports
2. 📜 Can generate long and detailed research reports (over 2K words)
3. 🌐 Aggregates over 20 web sources per research to form objective and factual conclusions
4. 🖥️ Includes an easy-to-use web interface (HTML/CSS/JS)
5. 🔍 Scrapes web sources with javascript support
6. 📂 Keeps track and context of visited and used web sources
7. 📄 Export research reports to PDF, Word and more...

### Disclaimer

This project, GPT Researcher, is an experimental application and is provided "as-is" without any warranty, express or implied. We are sharing codes for academic purposes under the MIT license. Nothing herein is academic advice, and NOT a recommendation to use in academic or research papers.

Our view on unbiased research claims:

The whole point of our scraping system is to reduce incorrect fact. How? The more sites we scrape the less chances of incorrect data. We are scraping 20 per research, the chances that they are all wrong is extremely low.
We do not aim to eliminate biases; we aim to reduce it as much as possible. We are here as a community to figure out the most effective human/llm interactions.
In research, people also tend towards biases as most have already opinions on the topics they research about. This tool scrapes many opinions and will evenly explain diverse views that a biased person would never have read.
Please note that the use of the GPT-4 language model can be expensive due to its token usage. By utilizing this project, you acknowledge that you are responsible for monitoring and managing your own token usage and the associated costs. It is highly recommended to check your OpenAI API usage regularly and set up any necessary limits or alerts to prevent unexpected charges.

## PIP Package

🌟 Exciting News! Now, you can integrate gpt-researcher with your apps seamlessly!

### Steps to Install GPT Researcher 🛠️

Follow these easy steps to get started:

0. Pre-requisite: Ensure Python 3.10+ is installed on your machine 💻
1. Install gpt-researcher: Grab the official package from [PyPi](https://pypi.org/project/gpt-researcher/).

```python
pip install gpt-researcher
```

2. Environment Variables: Create a .env file with your OpenAI API key or simply export it

```python
export OPENAI_API_KEY={Your OpenAI API Key here}
export TAVILY_API_KEY={Your Tavily API Key here}
```

3. Start using GPT Researcher in your own codebase

### Example Usage 📝

```python
from gpt_researcher import GPTResearcher
import asyncio


from gpt_researcher import GPTResearcher
import asyncio


async def get_report(query: str, report_type: str) -> str:
    researcher = GPTResearcher(query, report_type)
    research_result = await researcher.conduct_research()
    report = await researcher.write_report()
    return report

if __name__ == "__main__":
    query = "what team may win the NBA finals?"
    report_type = "research_report"

    report = asyncio.run(get_report(query, report_type))
    print(report)
```

### Specific Examples 🌐

Example 1: Research Report 📚

```python
query = "Latest developments in renewable energy technologies"
report_type = "research_report"
```

Example 2: Resource Report 📋

```python
query = "List of top AI conferences in 2023"
report_type = "resource_report"
```

Example 3: Outline Report 📝

```python
query = "Outline for an article on the impact of AI in education"
report_type = "outline_report"
```

### Integration with Web Frameworks 🌍

FastAPI Example:

```python
from fastapi import FastAPI
from gpt_researcher import GPTResearcher
import asyncio

app = FastAPI()

@app.get("/report/{report_type}")
async def get_report(query: str, report_type: str) -> dict:
    researcher = GPTResearcher(query, report_type)
    research_result = await researcher.conduct_research()
    report = await researcher.write_report()
    return {"report": report}

# Run the server
# uvicorn main:app --reload
```

Flask Example
Pre-requisite: Install flask with the async extra.

```python
pip install 'flask[async]'
```

```python
from flask import Flask, request
from gpt_researcher import GPTResearcher

app = Flask(__name__)

@app.route('/report/<report_type>', methods=['GET'])
async def get_report(report_type):
    query = request.args.get('query')
    researcher = GPTResearcher(query, report_type)
    research_result = await researcher.conduct_research()
    report = await researcher.write_report()
    return report

# Run the server
# flask run
```

Run the server:

```python
flask run
```

Example Request:

```python
curl -X GET "http://localhost:5000/report/research_report?query=what team may win the nba finals?"
```

Note: The above code snippets are just examples. You can customize them as per your requirements.

## Roadmap

We're constantly working on additional features and improvements to our products and services. We're also working on new products and services to help you build better AI applications using [GPT Researcher](https://gptr.dev/).

Our vision is to build the #1 autonomous research agent for AI developers and researchers, and we're excited to have you join us on this journey!

The roadmap is prioritized based on the following goals: Performance, Quality, Modularity and Conversational flexibility. The roadmap is public and can be found [here](https://trello.com/b/3O7KBePw/gpt-researcher-roadmap).

## Tailored Research

The GPT Researcher package allows you to tailor the research to your needs such as researching on specific sources or local documents, and even specify the agent prompt instruction upon which the research is conducted.

### Research on Specific Sources 📚

You can specify the sources you want the GPT Researcher to research on by providing a list of URLs. The GPT Researcher will then conduct research on the provided sources.

```python
from gpt_researcher import GPTResearcher
import asyncio

async def get_report(query: str, report_type: str, sources: list) -> str:
    researcher = GPTResearcher(query=query, report_type=report_type, source_urls=sources)
    await researcher.conduct_research()
    report = await researcher.write_report()
    return report

if __name__ == "__main__":
    query = "What are the latest advancements in AI?"
    report_type = "research_report"
    sources = ["https://en.wikipedia.org/wiki/Artificial_intelligence", "https://www.ibm.com/watson/ai"]

    report = asyncio.run(get_report(query, report_type, sources))
    print(report)
```

### Specify Agent Prompt 📝

You can specify the agent prompt instruction upon which the research is conducted. This allows you to guide the research in a specific direction and tailor the report layout. Simplay pass the prompt as the `query` argument to the `GPTResearcher` class and the "custom\_report" `report_type`.

```python
from gpt_researcher import GPTResearcher
import asyncio

async def get_report(prompt: str, report_type: str) -> str:
    researcher = GPTResearcher(query=prompt, report_type=report_type)
    await researcher.conduct_research()
    report = await researcher.write_report()
    return report

if __name__ == "__main__":
    report_type = "custom_report"
    prompt = "Research the latest advancements in AI and provide a detailed report in APA format including sources."

    report = asyncio.run(get_report(prompt=prompt, report_type=report_type))
    print(report)
```

### Research on Local Documents 📄

TBD!

## Troubleshooting

We're constantly working to provide a more stable version. If you're running into any issues, please first check out the resolved issues or ask us via our [Discord community](https://discord.com/invite/2pFkc83fRq).

### Model: gpt-4 does not exist

This relates to not having permission to use gpt-4 yet. Based on OpenAI, it will be [widely available for all by end of July](https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4-gpt-4-turbo-gpt-4o-and-gpt-4o-mini).

### Cannot load library 'gobject-2.0-0'

The issue relates to the library WeasyPrint (which is used to generate PDFs from the research report). Please follow this guide to resolve it: [https://doc.courtbouillon.org/weasyprint/stable/first\_steps.html](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html), or you can install this package manually.

In case of MacOS you can install this lib using `brew install glib gobject-introspection`

In case of Linux you can install this lib using `sudo apt install libglib2.0-dev`

### Cannot load library 'pango'

In case of MacOS you can install this lib using `brew install pango`

In case of Linux you can install this lib using `sudo apt install libpango-1.0-0`

### Workaround for Mac M chip users

If the above solutions don't work, you can try the following:

1. Install a fresh version of Python 3.11 pointed to brew: `brew install python@3.11`
2. Install the required libraries: `brew install pango glib gobject-introspection`
3. Install the required GPT Researcher Python packages: `pip3.11 install -r requirements.txt`
4. Run the app with Python 3.11 (using brew): `python3.11 -m uvicorn main:app --reload`

### Error processing the url

We're using [Selenium](https://www.selenium.dev/) for site scraping. Some sites fail to be scraped. In these cases, restart and try running again.

### Chrome version issues

Many users have an issue with their chromedriver because the latest chrome browser version doesn't have a compatible chrome driver yet.

To downgrade your Chrome web browser using [slimjet](https://www.slimjet.com/chrome/google-chrome-old-version.php), follow these steps. First, visit the website and scroll down to find the list of available older Chrome versions. Choose the version you wish to install making sure it's compatible with your operating system. Once you've selected the desired version, click on the corresponding link to download the installer. Before proceeding with the installation, it's crucial to uninstall your current version of Chrome to avoid conflicts.

It's important to check if the version you downgrade to, has a chromedriver available in the official [chrome driver website](https://developer.chrome.com/docs/chromedriver/downloads).


# Product News Tracker
Source: https://docs.tavily.com/examples/quick-tutorials/product-news-tracker

Stay informed with real-time product news using Tavily's APIs.

## What will you learn?

In this use case, you'll discover how to gather a company's product news and updates using Tavily's Search API. This tutorial outlines how to get started with the Tavily Python SDK, how to properly configure search parameters for optimal results, and how to effectively interact with Tavily’s Search API to retrieve the latest product updates for a specified company.

## How does it work?

### Self-Reported News

Our system gathers official updates including **blog posts**, **product announcements**, and **company news** by utilizing the `include_domain` parameter. This allows us to focus specifically on content from:

* A company's official website

This domain-filtered approach ensures efficient credit usage while maintaining search accuracy.

### Third-Party Coverage

To capture external perspectives, we employ specialized news search parameters:

* Set `topic = news` to focus on reputable news sources
* Utilize `time_range = month` for current coverage

<Tip>
  For the functionality discussed in this tutorial, `search_depth = basic` will
  be sufficient to acheive the intended results.
</Tip>

## Getting Started

> We have prepared a [Jupyter Notebook](https://github.com/tavily-ai/tavily-tutorials/blob/main/product-news-tracker.ipynb) outlining the contents of this tutorial

First create an account and get your free API key.

<Card title="Get your Tavily API key" icon="key" href="https://app.tavily.com" horizontal />

Next, use the Tavily Python SDK to create the workflow.

<Steps>
  <Step title="Install the Tavily Python SDK">
    ```python Shell
    %pip install -q tavily-python python-dotenv ipykernel
    ```
  </Step>

  <Step title="Import the necessary libraries">
    ```python Python
    import getpass
    import os

    if not os.environ.get("TAVILY_API_KEY"):
        os.environ["TAVILY_API_KEY"] = getpass.getpass("TAVILY_API_KEY:\n")

    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
    ```
  </Step>

  <Step title="Instantiate the Tavily Client">
    ```python Python
    from tavily import TavilyClient

    tavily_client = TavilyClient()
    ```
  </Step>

  <Step title="Define the search parameters">
    ```python Python
    def search_product_updates(company_name: str, domains: list):
        all_results = []

        # Search for self-reported news
        company_results = tavily_client.search(
            query=f"{company_name} product news, updates, releases, and announcements",
            search_depth="basic",
            max_results=10,
            include_domains=domains
        )

        for result in company_results["results"]:
            result["search_type"] = "Self-reported News"
            all_results.append(result)


        # Search for third-party coverage
        news_results = tavily_client.search(
            query=f"{company_name} product news, updates, releases, and announcements",
            search_depth="basic",
            max_results=10,
            time_range="month",
            topic="news"
        )

        for result in news_results["results"]:
            result["search_type"] = "Third-party Coverage"
            all_results.append(result)

        return all_results
    ```
  </Step>

  <Step title="Execute the search">
    ```python Python
        product_updates = search_product_updates(
            "OpenAI", ["openai.com"]
        )

        product_updates
    ```
  </Step>

  <Step title="Output">
    ```json Shell
     [
         {
             "title": "OpenAI launches new tools to help businesses build AI agents - TechCrunch",
             "url": "https://techcrunch.com/2025/03/11/openai-launches-new-tools-to-help-businesses-build-ai-agents/",
             "score": 0.70847535,
             "published_date": "Tue, 11 Mar 2025 17:00:00 GMT",
             "content": "OpenAI launches new tools to help businesses build AI agents | TechCrunch OpenAI launches new tools to help businesses build AI agents | TechCrunch On Tuesday, OpenAI released new tools designed to help developers and enterprises build AI agents – automated systems that can independently accomplish tasks – using the company’s own AI models and frameworks. The tools are part of OpenAI’s new Responses API, which lets businesses develop custom AI agents that can perform web searches, scan through company files, and navigate websites, much like OpenAI’s Operator product. Using the Responses API, developers can tap the same AI models (in preview) under the hood of OpenAI’s ChatGPT Search web search tool: GPT-4o search and GPT-4o mini search.",
             "search_type": "Third-party Coverage"
         },
         {
             "title": "New embedding models and API updates - Announcements - OpenAI Developer ...",
             "url": "https://community.openai.com/t/new-embedding-models-and-api-updates/610540",
             "score": 0.752468,
             "content": "We are releasing new models, reducing prices for GPT-3.5 Turbo, and introducing new ways for developers to manage API keys and understand API usage. The new models include: Two new embedding models An updated GPT-4 Turbo preview model An updated GPT-3.5 Turbo model An updated text moderation model By default, data sent to the OpenAI API will not be used to train or improve OpenAI models. All",
             "search_type": "Self-reported News"
         },
         ...
     ]
    ```
  </Step>
</Steps>


# Tavily Chat Integration
Source: https://docs.tavily.com/examples/use-cases/chat

Build a chat interface with real-time web search capabilities using Tavily's API

## Try Our Chatbot

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/chatbotgif.gif" alt="Tavily Chatbot Demo" width="700" />

### Step 1: Get Your API Key

<Card title="Get your Tavily API key" icon="key" href="https://app.tavily.com" horizontal />

### Step 2: Chat with Tavily

<Card title="Launch the application" icon="message-bot" href="https://chatbot.tavily.com" horizontal />

### Step 3: Read The Open Source Code

<Card title="View Github Repository" icon="github" href="https://github.com/tavily-ai/tavily-chat" horizontal />

## Features

1. **Fast Results**: Tavily's search system delivers quick responses essential for real-time chat experiences.
2. **Intelligent Parameter Selection**: Dynamically select search parameters based on conversation context, specifically designed for agentic systems. All you need is a natural language input, no need to configure structured JSON for our API.
3. **Content Snippets**: Tavily provides compact summaries of search results in the `content` field, best for maintaining small context sizes in low latency, multi-turn applications.
4. **Source Attribution**: All search results include URLs, enabling easy implementation of citations for transparency and credibility in responses.

## How Does It Work?

The chatbot uses a simple graph-based architecture to manage conversation flow and decision-making. Here's how the core components work together:

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/chatbot.png" />

The workflow consists of several key components:

<AccordionGroup>
  <Accordion title="1. Code Snippet: Graph Structure">
    The chatbot uses LangGraph to manage conversation flow. The graph structure conrtols how messages are processed and routed.

    <Tip>
      This code snippet is not meant to run standalone. View the full implementation in our [github repository](https://github.com/tavily-ai/tavily-chat).
    </Tip>

    ```python
    def build_graph(self):
        """Build and compile the graph"""
        graph_builder = StateGraph(State)

        # Add router node
        graph_builder.add_node("router", self.router)

        # Add tavily node
        graph_builder.add_node("tavily", self.tavily_node)

        # Add chatbot node
        graph_builder.add_node("chatbot", self.chatbot_node)

        # Add edges and compile
        graph_builder.add_conditional_edges(
            "router",
            determine_route,
            {"tavily": "tavily", "chatbot": "chatbot"},
        )

        return graph_builder.compile(checkpointer=self.memory)
    ```
  </Accordion>

  <Accordion title="2. Routing Logic">
    The router decides whether to use base knowledge or perform a Tavily web search based on:

    * Question complexity
    * Need for current information
    * Available conversation context
  </Accordion>

  <Accordion title="3. Memory Management">
    The chatbot maintains conversation history using a memory system that:

    * Preserves context across multiple exchanges
    * Stores relevant search results for future reference
    * Manages system prompts and initialization
  </Accordion>

  <Accordion title="4. Real-time Search Integration">
    When Tavily search is needed, the chatbot:

    * Performs targeted web searches using auto search parameters
    * Responds with multiple `content` snippets for context window management
    * Includes source citations
  </Accordion>

  <Accordion title="5. Streaming Updates">
    Users receive real-time updates on:

    * Search progress
    * Response generation
    * Source processing
  </Accordion>
</AccordionGroup>


# Company Research Agent
Source: https://docs.tavily.com/examples/use-cases/company-research

Harness the power of Tavily's APIs to perform in-depth company research.

## Try Our Company Researcher

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/company-researcher.gif" alt="Company Research Demo" width="700" />

### Step 1: Get Your API Key

<Card title="Get your Tavily API key" icon="key" href="https://app.tavily.com" horizontal />

### Step 2: Try the Company Researcher

<Card title="Launch the application" icon="message-bot" href="https://companyresearcher.tavily.com/" horizontal />

### Step 3: Read The Open Source Code

<Card title="View Github Repository" icon="github" href="https://github.com/pogjester/company-research-agent" horizontal />

## Why Use Tavily for company research?

<Tip>
  This is one of the most popular use cases for Tavily. Our powerful APIs can easily be integrated with agentic workflows to perform in-depth, accurate company research.
</Tip>

Tavily offers several advantages for conducting in-depth company research:

1. **Comprehensive Data Gathering**: Tavily's advanced search algorithms pull relevant information from a wide range of online sources, providing a robust foundation for in-depth company research.

2. **Flexible Agentic Search**: When Tavily is integrated into agentic workflows, such as those powered by frameworks like LangGraph, it allows AI agents to dynamically tailor their search strategies. The agents can decide to perform either a news or general search depending on the context, retrieve raw content for more in-depth analysis, or simply pull summaries when high-level insights are sufficient. This adaptability ensures that the research process is optimized according to the specific requirements of the task and the nature of the data available, bringing a new level of autonomy and intelligence to the research process.

3. **Real-time Data Retrieval**: Tavily ensures that the data used for research is up-to-date by querying live sources. This is crucial for company research where timely information can impact the accuracy and relevance of the analysis.

4. **Efficient and Scalable**: Tavily handles multiple queries simultaneously, making it capable of processing large datasets quickly. This efficiency reduces the time needed for comprehensive research, allowing for faster decision-making.

## How does it work?

We have prepared a [Jupyter Notebook](https://github.com/tavily-ai/use-cases/blob/main/company-research/company_research.ipynb) that demonstrates how to run a weekly research process on companies using Tavily, the LangGraph framework, and OpenAI for content generation.

This notebook outlines a comprehensive workflow that dynamically gathers relevant information on a company, processes the data, and generates a detailed PDF report.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/company-flow.png" />

The notebook utilizes several components to achieve its goal through a structured set of nodes representing different stages of the research process:

<AccordionGroup>
  <Accordion title="1. ResearchState setup">
    The `ResearchState` data structure manages the company's name, keywords, documents retrieved during research, and messages exchanged during the process. This state keeps track of all necessary data throughout the workflow.

    ```python
    class ResearchState(TypedDict):
            company: str
            company_keywords: str
            exclude_keywords: str
            report: str
            documents: Dict[str, Dict[Union[str, int], Union[str, float]]]
            RAG_docs: Dict[str, Dict[Union[str, int], Union[str, float]]]
            messages: Annotated[list[AnyMessage], add_messages]
    ```
  </Accordion>

  <Accordion title="2. Research and Tool nodes">
    In the **research** step, the workflow initiates the information-gathering process using the `research_model` function. The function leverages OpenAI as the base model for analyzing and generating insights about the company's latest developments.  It also determines the next course of action in the workflow. Depending on the information gathered so far, the model decides whether to continue executing the **Tavily Search tool** to gather more data or to proceed to curating the gathered documents using **Tavily Extract**. This decision-making capability is what makes the workflow agentic, allowing it to dynamically adapt to the specific research needs and ensure that the most relevant and comprehensive information is included in the final output.

    The `should_continue` function is used to determine whether tools should be executed or if the process should move on to the next phase (i.e., curation).

    **Tavily Search API tool:** The `TavilyQuery` and `TavilySearchInput` classes facilitate detailed and efficient searches with the Tavily Search API. Within an agentic workflow, the agent leverages the Tavily Search API to determine which queries to execute and under what conditions.
    By appending the current date to the query (e.g., `query_with_date = f"{itm.query} {datetime.now().strftime('%m-%Y')}"`), the agent ensures that the data retrieved by Tavily is current and pertinent.

    The `tool_node` processes the retrieved data into a dictionary so it can be easily accessible for further evaluation.

    ```python
    # Invoke the model to gather data about the company and decide whether to continue invoking the Tavily Search tool
    def research_model(state: ResearchState):
        prompt = f"""Today's date is {datetime.now().strftime('%d/%m/%Y')}.\n
        You are an expert researcher tasked with gathering information for a weekly report on recent developments in portfolio companies.\n
        Your current objective is to gather documents about any significant events that occurred in the past week for the following company: {state['company']}.\n
        The user has provided the following company keywords: {state['company_keywords']} to help you find relevant documents.\n
        **Instructions:**\n
        - Use the 'tavily_search' tool to search for relevant documents
        - Focus on gathering documents by making appropriate tool calls
        - If you believe you have gathered enough information, state 'I have gathered enough information and am ready to proceed.'
        """
        messages = state['messages'] + [SystemMessage(content=prompt)]
        # ...
        response = model.bind_tools(tools).invoke(messages)
        return {"messages": [response]}
    ```

    ```python
    # Define the function to determine the next step in the workflow
    def should_continue(state: ResearchState) -> Literal["tools", "curate"]:
        last_message = state['messages'][-1]
        # If tool calls exist, continue with tools
        if last_message.tool_calls:
            return "tools"
        # Otherwise, proceed to curation
        return "curate"
    ```

    ```python
    # Define the structure for Tavily search inputs

    # Add Tavily's arguments to enhance the web search tool's capabilities
    class TavilyQuery(BaseModel):
        query: str = Field(description="web search query")
        topic: str = Field(description="type of search, should be 'general' or 'news'. Choose 'news' ONLY when the company you searching is publicly traded and is likely to be featured on popular news")
        days: int = Field(description="number of days back to run 'news' search")
        domains: Optional[List[str]] = Field(default=None, description="list of domains to include in the research. Useful when trying to gather information from trusted and relevant domains")

    class TavilySearchInput(BaseModel):
        sub_queries: List[TavilyQuery] = Field(description="set of sub-queries that can be answered in isolation")

    # Tavily search tool for performing searches concurrently
    @tool("tavily_search", args_schema=TavilySearchInput, return_direct=True)
    async def tavily_search(sub_queries: List[TavilyQuery]):
        """Perform searches for each sub-query using the Tavily search tool concurrently."""  
        async def perform_search(itm):
            try:
                # Construct query with date for the most recent results
                query_with_date = f"{itm.query} {datetime.now().strftime('%m-%Y')}"
                response = await tavily_client.search(query=query_with_date, topic=itm.topic, days=itm.days, max_results=10)
                return response['results']
            except Exception as e:
                # Handle exceptions
                print(f"Error occurred during search for query '{itm.query}': {str(e)}")
                return []

        # Run all search tasks concurrently
        search_tasks = [perform_search(itm) for itm in sub_queries]
        search_responses = await asyncio.gather(*search_tasks)

        # Combine results
        # ...

        return search_results
    ```

    ```python
    # Tool node for processing Tavily's search results
    async def tool_node(state: ResearchState):
        docs = state.get('documents', {})
        msgs = []
        for tool_call in state["messages"][-1].tool_calls:
            tool = tools_by_name[tool_call["name"]]
            new_docs = await tool.ainvoke(tool_call["args"])
            # Store only new documents
            for doc in new_docs:
                if not docs or doc['url'] not in docs:
                    docs[doc['url']] = doc
                    # ...
            msgs.append(ToolMessage(content="Found the following new documents/information...", tool_call_id=tool_call["id"]))
        return {"messages": msgs, "documents": docs}
    ```
  </Accordion>

  <Accordion title="3. Curate nodes">
    In the **curate** step, the workflow selects the most relevant documents from the data retrieved. This involves reviewing documents, applying keyword matching, and retrieving raw content to ensure a focused dataset.

    ```python
    async def select_and_process(state: ResearchState):
        prompt = f"""You are an expert researcher..."""
        if state['exclude_keywords'] != "":
            prompt += f"""Additionally, exclude the following keywords..."""
        prompt += f"""\nHere is the list of documents..."""
        # ...
        # Use the model to filter documents
        relevant_urls = model.with_structured_output(TavilyExtractInput).invoke(messages)
            
        try:
            # Extract raw content from selected URLs
            response = await tavily_client.extract(urls=relevant_urls.urls)
            # ...
        except Exception as e:
            print(f"Error occurred during Tavily Extract request: {str(e)}")
        # ...
        return {"messages": [AIMessage(content=msg)], "RAG_docs": RAG_docs}
    ```
  </Accordion>

  <Accordion title="4. Write node">
    The **write** step involves generating the weekly report based on the curated documents using OpenAI, ensuring that the report is detailed and well-cited.

    ```python
    def write_report(state: ResearchState):
        prompt = f"""Today's date is {datetime.now().strftime('%d/%m/%Y')}.
        You are an expert researcher, writing a weekly report..."""
        response = model.with_structured_output(QuotedAnswer).invoke(messages)
        full_report = response.answer
        full_report += "\n\n### Citations\n"
        # Append citations
        return {"messages": [AIMessage(content=f"Generated Report:\n{full_report}")], "report": full_report}
    ```
  </Accordion>

  <Accordion title="5. Publish node">
    In the **publish** step, the generated report is converted into a PDF document for easy sharing and presentation.

    ```python
    def generate_pdf(state: ResearchState):
        directory = "reports"
        file_name = f"{state['company']} Weekly Report..."
        msg = generate_pdf_from_md(state['report'], filename=f'{directory}/{file_name}.pdf')
        return {"messages": [AIMessage(content=msg)]}
    ```
  </Accordion>
</AccordionGroup>

You can view examples of company reports generated by the code in the notebook [here](https://github.com/tavily-ai/use-cases/tree/main/company-research/reports).

## Possible Improvements

1. **Advanced Content Generation Filtering:** Enhance the workflow by incorporating more advanced filtering techniques, such as selecting the top K most relevant documents using relevance scoring or similarity measures. This pre-content generation filtering step, combined with keyword-based filtering, ensures that only the most pertinent information is used, allowing the content generation step to focus solely on producing high-quality, accurate reports without the burden of additional filtering.

2. **"Human on the Loop" Feedback Integration:** Allow a human to provide feedback on the sources found during research and guide the agent to retrieve the most relevant sources. Instead of predefining keywords before the execution of the process, enable the dynamic inclusion or exclusion of keywords and other adjustments that only a human can provide when needed, improving the user experience as well as the quality and accuracy of the sources used.

3. **Advanced Curation Step:** Instead of adding raw content to the RAG documents, include only the relevant information extracted from the raw text. This can be achieved through live chunking or using an LLM to extract or summarize the pertinent information, ensuring that the content fed into the generation step is highly focused and relevant.

4. **Customized Workflow for Specific Needs:** Tailor the workflow to meet specific requirements by defining a precise report format or prioritizing the use of particular sources. For instance, you can specify that only certain trusted domains should be used for data retrieval or create a structured template that the generated reports must follow. This customization enhances the relevance and precision of the research output, ensuring it aligns closely with your unique needs.


# Data Enrichment Agent
Source: https://docs.tavily.com/examples/use-cases/data-enrichment

Enhance datasets with Tavily's powerful APIs.

## Try Our Data Enrichment Agent

#### Fill in spreadsheet columns

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/enrichment1.gif" alt="Enrichment1 Demo" width="700" />

#### Enrich your spreadsheet

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/enrichment22.gif" alt="Enrichment2 Demo" width="700" />

#### Export as CSV

<img src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/enrichment3.gif" alt="Enrichment3 Demo" width="700" />

### Step 1: Get Your API Key

<Card title="Get your Tavily API key" icon="key" href="https://app.tavily.com" horizontal />

### Step 2: Try the Data Enrichment Agent

<Card title="Launch the application" icon="message-bot" href="https://sheets.tavily.com/" horizontal />

### Step 3: Read The Open Source Code

<Card title="View Github Repository" icon="github" href="https://github.com/tavily-ai/tavily-sheets" horizontal />

## Why use Tavily for dataset enhancement?

Tavily offers several advantages for enhancing datasets:

1. **Advanced Search Capabilities**: Tavily utilizes advanced search algorithms to gather relevant information from various online sources, making it ideal for filling in missing data points.

2. **Real-time Data Retrieval**: By querying live sources, Tavily ensures that the data used for enrichment is up-to-date and relevant.

3. **Scalable and Efficient**: Tavily can handle multiple queries simultaneously, allowing you to process large datasets efficiently and reduce overall execution time.

## How does it work?

We have prepared a [Jupyter Notebook](https://github.com/tavily-ai/use-cases/blob/main/data-enrichment/data_enrichment_agent.ipynb) that illustrates how to build an AI agent that leverages the Tavily API for data enrichment.
Feel free to dive into the source code yourself to fully understand how the agent works.

The system uses the LangGraph Framework to orchestrate the workflow, managing two agents: a Data Agent and an Enrich Agent.
The Data Agent is responsible for retrieving, processing, and loading data into a DataFrame, as well as saving the enriched data in various formats, such as CSV, Excel, or Google Sheets.
Meanwhile, the Enrich Agent automates the process of filling in missing data within the dataset. It utilizes Tavily's search capabilities to collect relevant information from the web and employs an OpenAI model to generate search queries and extract the necessary data points.

The use of asynchronous tasks allows multiple rows to be processed concurrently, increasing the efficiency of the data enrichment process.

<img height="100" src="https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/enrichment-flow.png" />

Below is a partial implementation of the `EnrichAgent` class, highlighting its key components without showing all the internal details:

```python
class EnrichAgent():
    def __init__(self):
        # Initialize settings
        self.MAX_COLS_PER_PASS = 5
        self.MAX_PASSES = 5
        self.model = ChatOpenAI(model="gpt-4o", temperature=0)

    def is_missing_value(self, value):
        # Check if a value is considered missing.
        # ...

    async def generate_search_query(self, head, columns):
        # Generate a search query for missing columns.
        prompt = "You are a researcher with the task of filling in a spreadsheet..."
        response = await self.model.ainvoke(messages)
        return response.content.strip('\'"')

    async def fill_in_row(self, df, head, row_index, columns, search_query):
        # Call the Tavily API to retrieve information using the search_query and prompt OpenAI to extract column values from the response
        entry = str(df.iloc[row_index][head[0]])
        # ...
        # Process API response
        # ...

    async def run(self, state: AgentState):
        # Main function to for running the Enrichment Process
        df = state['raw_data'].copy()
        # ...
        # Loop through rows and apply enrichment
        # ...
```

* `MAX_COLS_PER_PASS`: This sets the maximum number of columns that the agent will try to fill in during a single operation, which can help in managing the complexity of the data retrieval and processing tasks.
* `MAX_PASSES`: This defines the maximum number of attempts the agent will make to fill in missing data across the dataset. By setting a limit, the agent avoids getting stuck in endless loops if the data cannot be fully retrieved.
* `generate_search_query`: This function generates a search query tailored to fill in specific missing columns. It constructs a prompt using the column headers and fields that need data, and then uses the OpenAI model to generate a suitable search query. This query is used to interact with the Tavily API for data retrieval.
* `fill_in_row`: This function attempts to fill in the missing data for a given row in the DataFrame. It constructs a search query for Tavily by replacing a placeholder (\$ENTRY) with the actual entry being queried. After receiving the Tavily response, it uses OpenAI to interpret the data and fill in the missing fields. It ensures consistency by creating examples from existing data for the model to refer to during data extraction.
* `run`: This function is the main driver of the enrichment process. It starts by generating a general search query and then attempts to fill in as many missing fields as possible for each row using asynchronous tasks. The function loops through the dataset for a predefined number of passes, each time attempting to fill in missing fields with data retrieved from Tavily and processed by OpenAI.

## Possible Improvements

1. **Customize Workflow for Specific Use Cases**: Define more predefined workflows tailored to specific use cases, such as company data enrichment. This could include field-specific scraping techniques to ensure data consistency and enhance the search query by incorporating the values of certain fields to improve the likelihood of obtaining accurate results.

2. **Enhanced API Feature Utilization**: Utilize specific features of the Tavily API, such as the 'include domain' option, to refine searches and improve data accuracy. For instance, if website links are available in the dataset, using the 'include domain' feature allows the search to be targeted to specific domains, thereby enhancing the relevance and precision of the retrieved information.

3. **Search Query Enhancement**: Enhance search queries by incorporating additional field values alongside the main entry field. For example, if the data enrichment task involves gathering information about a person, and their company affiliation is also available, it can be beneficial to include the company name in the search query along with their name to improve the accuracy of the results.

4. **Integrate LangGraph with Tools**: Bind the LangGraph framework with various tools and configure tavily web search as one of these tools. This will allow for more flexible and dynamic query generation and data retrieval.

5. **Incorporate a Local Database**: Add a local database as an additional data source for the agent. This can help to cross-reference information and verify the accuracy of the enriched data.


# Web-based RAG evaluation
Source: https://docs.tavily.com/examples/use-cases/web-eval

Effortless Web-Based RAG Evaluation Using Tavily and LangGraph

# Introduction

Every data science enthusiast knows that a vital first step to building a successful model or algorithm is having a reliable evaluation set to aspire to. In the rapidly evolving landscape of **Retrieval-Augmented Generation (RAG)** and AI-driven search systems, the importance of high-quality eval datasets is crucial.

In this article, we introduce an agentic workflow designed to **generate** subject-specific dynamic **evaluation datasets**, enabling precise validation of web search augmented agents' performance.

**Known RAG evaluation datasets**, such as [HotPotQA](https://hotpotqa.github.io), [CRAG](https://github.com/facebookresearch/CRAG), and [MultiHop-RAG](https://github.com/yixuantt/MultiHop-RAG), have been pivotal in benchmarking and fine-tuning models. However, these datasets primarily focus on evaluating performance with **static, pre-defined document sets**. As a result, they fall short when it comes to evaluating **web-based RAG systems**, where data is dynamic, contextual, and ever-changing.

This gap presents a significant challenge: how do we effectively test and refine RAG systems designed for real-world web search scenarios? **Enter the Real-Time Dataset Generator for RAG Evals** — an agentic tool leveraging [Tavily’s Search Layer](https://tavily.com) and the **LangGraph framework** to create diverse, relevant, and dynamic datasets tailored specifically for web based RAG agents.

# How does it work?

<Frame>
  ![Web Evaluation Graph](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/images/web-eval-graph.png)
</Frame>

The Real-Time Dataset Generator follows a systematic workflow to create high-quality evaluation datasets:

<Steps>
  <Step title="Input">
    The workflow begins with user-provided inputs.
  </Step>

  <Step title="Domain-Specific Search Query Generation">
    If a subject is provided (e.g., “NBA Basketball”), the system **generates a
    set of search queries**. This ensures queries are tailored to gather
    high-quality, recent, and subject-specific information.
  </Step>

  <Step title="Web Search with Tavily">
    This step guarantees that the dataset reflects **current and relevant
    information**, particularly for web search RAG evaluation, where up-to-date
    data is crucial.This is the **heart of the RAG Dataset Generator**,
    transforming queries into actionable, high-quality data that forms the
    foundation of the evaluation set.
  </Step>

  <Step title="Q&A Pair Generation">
    For each website returned by Tavily, the system generates question-answer pair
    using a **map-reduce paradigm** to ensure efficient processing across multiple
    sources. This step is implemented using LangGraph’s Send API.
  </Step>

  <Step title="Saving the Evaluation Set">
    Finally, the generated dataset is saved either **locally** or to
    **Langsmith**, based on the input configuration.
  </Step>

  <Step title="Output">
    The result is a well-structured, subject-specific evaluation dataset, ready for use in advanced evaluation methods like **LLM-as-a-Judge**.
  </Step>
</Steps>

# Learn More

Want to dive deeper into web-based RAG evaluation? Check out these resources:

<CardGroup cols={2}>
  <Card title="Blog Post" icon="newspaper" href="https://blog.tavily.com/effortless-web-based-rag-evaluation-using-tavily-and-langgraph/">
    Read our detailed blog post about generating dynamic RAG evaluation datasets
  </Card>

  <Card title="GitHub" icon="github" href="https://github.com/Eyalbenba/tavily-web-eval-generator">
    `/Eyalbenba/tavily-web-eval-generator`

    <img noZoom src="https://img.shields.io/github/stars/Eyalbenba/tavily-web-eval-generator?style=social" alt="GitHub Repo stars" />
  </Card>
</CardGroup>


# Frequently Asked Questions
Source: https://docs.tavily.com/faq/faq



<Accordion title="What is Tavily?">
  Tavily allows your AI agent to access the web, securely, and at scale. Supercharge your AI agent with real-time search, scraping, and structured data retrieval in a single API call. Tavily simplifies the process of integrating dynamic web information into AI-driven solutions.
</Accordion>

<Accordion title="What APIs does Tavily offer?">
  Tavily offers three different endpoints:

  * **Tavily Search API** - A search engine designed for AI agents, combining search and scraping capabilities.
  * **Tavily Extract API** - Scrape up to 20 URLs in a single API call.
  * **Tavily Crawl API** - Map and crawl domains efficiently. Currently in Beta! Want to be part of the beta testing? Send an email to [support@tavily.com](mailto:support@tavily.com) to request access. 🚀
</Accordion>

<Accordion title="What is Tavily Search API?">
  Tavily Search API is a specialized search engine designed for LLMs and AI agents. It provides real-time, customizable, and RAG-ready search results and extracted content, enabling AI applications to retrieve and process data efficiently.
</Accordion>

<Accordion title="How is Tavily Search API different from other search APIs?">
  **Traditional Search APIs:** Unlike Bing, Google, or SerpAPI, Tavily dynamically searches the web, reviews multiple sources, and extracts the most relevant content, delivering concise, ready-to-use information optimized for AI applications.

  **AI Answer Engine APIs:** Unlike Perplexity Sonar API or OpenAI Web Search API, Tavily focuses on delivering high-quality, customizable search results. Developers control search depth, domain targeting, and content extraction. LLM-generated answers are optional, making Tavily a flexible, search-first solution adaptable to different use cases.
</Accordion>

#### Features & Benefits

<Accordion title="What are the key advantages of using Tavily Search API?">
  * **Built for AI** – Designed for AI workflows like Retrieval-Augmented Generation (RAG) with structured and customizable search.
  * **Customizable** – Control search depth, target specific domains, extract full page content, and get an LLM-generated response in one API call.
  * **Real-time & Reliable** – Delivers up-to-date and real-time results.
  * **Easy Integration** – Simple API setup with support for Python, JavaScript, LangChain, and LlamaIndex.
  * **Secure & Scalable** – SOC 2 certified, zero data retention, and built to handle high-volume workloads.
</Accordion>

<Accordion title="How does Tavily ensure the accuracy of its information?">
  Tavily uses advanced algorithms and NLP techniques to gather data from trusted, authoritative sources. Users can also prioritize preferred sources to enhance relevance.
</Accordion>

<Accordion title="How fast is Tavily Search API?">
  Tavily prioritizes speed and typically returns results within seconds. Complex queries involving extensive data retrieval may take slightly longer.
</Accordion>

#### Pricing & Plans

<Accordion title="Can I test Tavily Search API before subscribing to a paid plan?">
  Yes! Tavily offers a free plan with limited monthly API calls, allowing you to test its capabilities before committing to a paid plan. No credit card is required.
</Accordion>

<Accordion title="What are the available pricing plans?">
  * **Free**: 1,000 credits/month
  * **Pay-as-you-go**: \$0.008 per credit
  * **Monthly plans**: \$0.0075 - \$0.005 per credit
  * **Enterprise**: Custom pricing and volume
</Accordion>

<Accordion title="When do my monthly API credits reset?">
  Your API credits reset on the first day of each month, regardless of the billing date. This ensures you start each month with a clean slate of credits to use for your searches.
</Accordion>

<Accordion title="How does plan upgrading or downgrading work?">
  When upgrading or downgrading your plan, charges are typically **prorated**.
  This means:

  * **Upgrading**: If you upgrade mid-cycle, you'll only pay the difference for the remaining days in your billing period.
  * **Downgrading**: Downgrades take effect at the start of the next billing cycle, and you will continue on your current plan until the cycle ends.
</Accordion>

<Accordion title="Is Tavily free for students?">
  Yes! Tavily offers free access for students. Contact [support@tavily.com](mailto:support@tavily.com) for eligibility details.
</Accordion>

#### Integration & Usage

<Accordion title="How do I integrate Tavily into my application?">
  Tavily supports Python, Node.js, and cURL. The API is simple to set up—just sign up, [get your API key](https://app.tavily.com/home), and integrate it within minutes. Visit our [SDKs](/sdk) and [API Reference](/api-reference) for more guidance and information.
</Accordion>

<Accordion title="What is GPT Researcher, and how does it relate to Tavily?">
  GPT Researcher is an open-source, autonomous research agent powered by Tavily’s Search API. It automates the research process by retrieving, filtering, and synthesizing data from over 20 web sources per task.
</Accordion>

#### Support & Privacy

<Accordion title="What level of support does Tavily provide?">
  * **Paid Subscriptions** – Email support via [support@tavily.com](mailto:support@tavily.com).
  * **Enterprise Plan** – White-glove support including:
    * Personal Slack channel
    * Dedicated account manager
    * AI engineer for technical assistance and optimizations
    * Uptime and support SLAs
</Accordion>

<Accordion title="Where can I find Tavily’s privacy policy?">
  Tavily's privacy policy is available [here](https://tavily.com/privacy), outlining how data is handled and ensuring compliance with global regulations.
</Accordion>

<Accordion title="Where can I find Tavily’s knowledge base?">
  The [Tavily Help Center](https://help.tavily.com/) is a comprehensive knowledge base with detailed guides on how to use Tavily. You can search for the information you need, explore tutorials, and find answers to common questions.
</Accordion>

#### Getting Started

<Accordion title="How do I start using Tavily?">
  1. [Sign up for an account](https://tavily.com/)
  2. [Get your API key](https://app.tavily.com/home)
  3. Integrate it into your application using our Python or Node.js SDK.
  4. Start retrieving real-time search results!
</Accordion>


# Quickstart
Source: https://docs.tavily.com/sdk/javascript/quick-start

Integrate Tavily's powerful APIs natively in your JavaScript/TypeScript projects.

<Tip>
  Looking for the JavaScript SDK Reference? Head to our [JavaScript SDK
  Reference](/sdk/javascript/reference) and learn how to use `tavily-js`.
</Tip>

{" "}

## Introduction

Tavily's JavaScript SDK allows for easy interaction with the Tavily API, offering the full range of our search and extract functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search and content extraction capabilities into your applications, harnessing Tavily's powerful search and extract features.

<CardGroup cols="2">
  <Card title="GitHub" icon="github" horizontal href="https://github.com/tavily-ai/tavily-js">
    `/tavily-ai/tavily-js`

    <img noZoom={true} src="https://img.shields.io/github/stars/tavily-ai/tavily-js?style=social" alt="GitHub Repo stars" />
  </Card>

  <Card title="NPM" icon="npm" horizontal href="https://www.npmjs.com/package/@tavily/core">
    `@tavily/core`

    <img noZoom={true} src="https://img.shields.io/npm/dt/@tavily/core" alt="GitHub Repo stars" />
  </Card>
</CardGroup>

## Quickstart

Get started with our JavaScript SDK in less than 5 minutes!

<Card title="Get your free API key" icon="key" horizontal href="https://app.tavily.com">
  You get 1,000 free API Credits every month. **No credit card required.**
</Card>

### Installation

You can install the Tavily JavaScript SDK using the following:

```bash
npm i @tavily/core
```

### Usage

With Tavily's Python SDK, you can search the web in only 4 lines of code:

```javascript
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await tvly.search("Who is Leo Messi?");

console.log(response);
```

You can also easily extract content from URLs:

```javascript
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await tvly.extract(
  "https://en.wikipedia.org/wiki/Lionel_Messi"
);

console.log(response);
```

Tavily also allows you to perform a smart crawl starting at a given URL.

<Tip>
  Our agent-first crawl is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

```javascript
const { tavily } = require("@tavily/core")

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await client.crawl("https://docs.tavily.com", { instructions: "Find all pages on the Python SDK" });

console.log(response);
```

## Features

Our JavaScript SDK supports the full feature range of our [REST API](/api-reference). Our JavaScript client is asynchronous by default.

* The `search` function lets you harness the full power of Tavily Search.
* The `extract` function allows you to easily retrieve web content with Tavily Extract.
* The `crawl` and `map`functions allow you to intelligently traverse websites and extract content.


# SDK Reference
Source: https://docs.tavily.com/sdk/javascript/reference

Integrate Tavily's powerful APIs natively in your JavaScript/TypeScript projects.

## Instantiating a client

To interact with Tavily in JavaScript, you must instatiate a client with your API key. Our client is asynchronous by default.

Once you have instantiated a client, call one of our supported methods (detailed below) to access the API.

```javascript
const { tavily } = require("@tavily/core");

client = tavily({ apiKey: "tvly-YOUR_API_KEY" });
```

### Proxies

If you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.

Proxy configuration is available in both the synchronous and asynchronous clients.

```javascript
const { tavily } = require("@tavily/core");

const proxies = {
  http: "<your HTTP proxy>",
  https: "<your HTTPS proxy>",
};

client = tavily({ apiKey: "tvly-YOUR_API_KEY", proxies });
```

Alternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.

## Tavily Search

<Tip>
  **NEW!** Try our interactive [API
  Playground](https://app.tavily.com/playground) to see each parameter in
  action, and generate ready-to-use JavaScript snippets.
</Tip>

You can access Tavily Search in JavaScript through the client's `search` function.

### Parameters

| Parameter                  | Type                  | Description                                                                                                                                                                                                                                           | Default     |
| :------------------------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| `query` **(required)**     | `string`              | The query to run a search on.                                                                                                                                                                                                                         | —           |
| `searchDepth`              | `string`              | The depth of the search. It can be `"basic"` or `"advanced"`. `"advanced"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `"basic"` search provides generic content snippets from each source. | `"basic"`   |
| `topic`                    | `string`              | The category of the search. Determines which agent will be used. Supported values are `"general"` and `"news"`.                                                                                                                                       | `"general"` |
| `days`                     | `number`              | The number of days back from the current date to include in the results. Available only when using the `"news"` topic.                                                                                                                                | `7`         |
| `timeRange`                | `string`              | The time range back from the current date. Accepted values include `"day"`, `"week"`, `"month"`, `"year"` or shorthand values `"d"`, `"w"`, `"m"`, `"y"`.                                                                                             | —           |
| `maxResults`               | `number`              | The maximum number of search results to return. It must be between `0` and `20`.                                                                                                                                                                      | `5`         |
| `chunksPerSource`          | `number`              | The number of `content` chunks to retrieve from each source. Each chunk's length is maximum 500 characters. It must be between `1` and `3`. Available only when `searchDepth` is `"advanced"`.                                                        | —           |
| `includeImages`            | `boolean`             | Include a list of query-related images in the response.                                                                                                                                                                                               | `false`     |
| `includeImageDescriptions` | `boolean`             | Include a list of query-related images and their descriptions in the response.                                                                                                                                                                        | `false`     |
| `includeAnswer`            | `boolean` or `string` | Include an answer to the query generated by an LLM based on search results. A `"basic"` (or `true`) answer is quick but less detailed; an `"advanced"` answer is more detailed.                                                                       | `false`     |
| `includeRawContent`        | `boolean`             | Include the cleaned and parsed HTML content of each search result.                                                                                                                                                                                    | `false`     |
| `includeDomains`           | `string[]`            | A list of domains to specifically include in the search results.                                                                                                                                                                                      | `[]`        |
| `excludeDomains`           | `string[]`            | A list of domains to specifically exclude from the search results.                                                                                                                                                                                    | `[]`        |
| `timeout`                  | `number`              | A timeout to be used in requests to the Tavily API.                                                                                                                                                                                                   | `60`        |

### Response format

The response object you receive will be in the following format:

| Key                 | Type                          | Description                                                                                                                                                                          |
| :------------------ | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `results`           | `Result[]`                    | A list of sorted search results ranked by relevancy.                                                                                                                                 |
| `query`             | `string`                      | Your search query.                                                                                                                                                                   |
| `responseTime`      | `number`                      | Your search result response time.                                                                                                                                                    |
| `answer` (optional) | `string`                      | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `includeAnswer` is set to `true`.                                   |
| `images` (optional) | `string[]` or `ImageResult[]` | This is only available if `includeImages` is set to `true`. A list of query-related image URLs. If `includeImageDescriptions` is set to `true`, each entry will be an `ImageResult`. |

### Results

Each result in the `results` list will be in the following `Result` format:

| Key                        | Type     | Description                                                                                                                                             |
| :------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                    | `string` | The title of the search result.                                                                                                                         |
| `url`                      | `string` | The URL of the search result.                                                                                                                           |
| `content`                  | `string` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |
| `score`                    | `float`  | The relevance score of the search result.                                                                                                               |
| `rawContent` (optional)    | `string` | The parsed and cleaned HTML content of the site. This is only available if `includeRawContent` is set to `true`.                                        |
| `publishedDate` (optional) | `string` | The publication date of the source. This is only available if the search `topic` is set to `news`.                                                      |

#### Image Results

Each image in the `images` list will be in the following `ImageResult` format:

| Key                      | Type     | Description                                                                                                       |
| :----------------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| `url`                    | `string` | The URL of the image.                                                                                             |
| `description` (optional) | `string` | This is only available if `includeImageDescriptions` is set to `true`. An LLM-generated description of the image. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Executing a simple search query
    const response = await tvly.search("Who is Leo Messi?");

    // Step 3. That's it! You've done a Tavily Search!
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ```json
    {
      "query": "Who is Leo Messi?",
      "images": [
        {
          "url": "Image 1 URL",
          "description": "Image 1 Description"
        },
        {
          "url": "Image 2 URL",
          "description": "Image 2 Description"
        },
        {
          "url": "Image 3 URL",
          "description": "Image 3 Description"
        },
        {
          "url": "Image 4 URL",
          "description": "Image 4 Description"
        },
        {
          "url": "Image 5 URL",
          "description": "Image 5 Description"
        }
      ],
      "results": [
        {
          "title": "Source 1 Title",
          "url": "Source 1 URL",
          "content": "Source 1 Content",
          "score": 0.99
        },
        {
          "title": "Source 2 Title",
          "url": "Source 2 URL",
          "content": "Source 2 Content",
          "score": 0.97
        }
      ],
      "responseTime": 1.09
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Extract

You can access Tavily Extract in JavaScript through the client's `extract` function.

### Parameters

| Parameter             | Type       | Description                                                                                                                                                                                                                                                                                                                                                                   | Default   |
| :-------------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| `urls` **(required)** | `string[]` | The URLs you want to extract. The list must not contain more than 20 URLs.                                                                                                                                                                                                                                                                                                    | —         |
| `includeImages`       | `boolean`  | Include a list of images extracted from the URLs in the response.                                                                                                                                                                                                                                                                                                             | `false`   |
| `extractDepth`        | `string`   | The depth of the extraction process. You may experience higher latency with `"advanced"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `"basic"` extraction costs 1 API Credit per 5 successful URL extractions, while `"advanced"` extraction costs 2 API Credits per 5 successful URL extractions. | `"basic"` |
| `timeout`             | `number`   | A timeout to be used in requests to the Tavily API.                                                                                                                                                                                                                                                                                                                           | `60`      |

### Response format

The response object you receive will be in the following format:

| Key              | Type                 | Description                                 |
| :--------------- | :------------------- | :------------------------------------------ |
| `results`        | `SuccessfulResult[]` | A list of extracted content.                |
| `failed_results` | `FailedResult[]`     | A list of URLs that could not be processed. |
| `response_time`  | `number`             | The search result response time.            |

#### Successful Results

Each successful result in the `results` list will be in the following `SuccessfulResult` format:

| Key                 | Type       | Description                                                                                 |
| :------------------ | :--------- | :------------------------------------------------------------------------------------------ |
| `url`               | `string`   | The URL of the webpage.                                                                     |
| `raw_content`       | `string`   | The raw content extracted.                                                                  |
| `images` (optional) | `string[]` | This is only available if `includeImages` is set to `true`. A list of extracted image URLs. |

#### Failed Results

Each failed result in the `results` list will be in the following `FailedResult` format:

| Key     | Type     | Description                                                |
| :------ | :------- | :--------------------------------------------------------- |
| `url`   | `string` | The URL that failed.                                       |
| `error` | `string` | An error message describing why it could not be processed. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Defining the list of URLs to extract content from
    urls = [
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "https://en.wikipedia.org/wiki/Machine_learning",
        "https://en.wikipedia.org/wiki/Data_science",
    ]

    # Step 3. Executing the extract request
    response = tavily_client.extract(urls=urls, include_images=True)

    # Step 4. Printing the extracted raw content
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ```javascript
    {
      "results": [
        {
          "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
          "rawContent": "URL 1 raw content",
          "images": [
            "Image 1 URL",
            "Image 2 URL"
          ]
        },
        {
          "url": "https://en.wikipedia.org/wiki/Machine_learning",
          "rawContent": "URL 2 raw content",
          "images": [
            "Image 3 URL",
            "Image 4 URL"
          ]
        },
        {
          "url": "https://en.wikipedia.org/wiki/Data_science",
          "rawContent": "URL 3 raw content",
          "images": [
            "Image 5 URL",
            "Image 6 URL"
          ]
        }
      ],
      "failedResults": [],
      "responseTime": 1.23
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Crawl

<Tip>
  Our agent-first crawl endpoint, **Tavily Crawl** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

You can access Tavily Crawl in JavaScript through the client's `crawl` function.

### Parameters

| Parameter            | Type       | Description                                                                                                                                                               | Default   |
| :------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------- |
| `url` **(required)** | `string`   | The root URL to begin the crawl.                                                                                                                                          | —         |
| `maxDepth`           | `number`   | Max depth of the crawl. Defines how far from the base URL the crawler can explore.                                                                                        | `1`       |
| `maxBreadth`         | `number`   | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                 | `20`      |
| `limit`              | `number`   | Total number of links the crawler will process before stopping.                                                                                                           | `50`      |
| `instructions`       | `string`   | Natural language instructions for the crawler.                                                                                                                            | —         |
| `selectPaths`        | `string[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                   | `[]`      |
| `selectDomains`      | `string[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                 | `[]`      |
| `excludePaths`       | `string[]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/admin/.*"`, `"/private/.*"`).                                                                    | `[]`      |
| `excludeDomains`     | `string[]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `"^admin\.example\.com$"`).                                                             | `[]`      |
| `allowExternal`      | `boolean`  | Whether to return links from external domains in crawl output.                                                                                                            | `false`   |
| `includeImages`      | `boolean`  | Whether to extract image URLs from the crawled pages.                                                                                                                     | `false`   |
| `categories`         | `string[]` | Filter URLs using predefined categories. Options: `"Careers"`, `"Blog"`, `"Documentation"`, `"About"`, `"Pricing"`, `"Community"`, `"Developers"`, `"Contact"`, `"Media"` | `[]`      |
| `extractDepth`       | `string`   | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `"basic"` or `"advanced"`.         | `"basic"` |
| `timeout`            | `number`   | A timeout to be used in requests to the Tavily API.                                                                                                                       | `60`      |

### Response format

The response object you receive will be in the following format:

| Key            | Type       | Description                         |
| :------------- | :--------- | :---------------------------------- |
| `baseUrl`      | `string`   | The URL you started the crawl from. |
| `results`      | `Result[]` | A list of crawled pages.            |
| `responseTime` | `number`   | The crawl response time.            |

#### Results

Each successful result in the `results` list will be in the following `Result` format:

| Key          | Type       | Description                         |
| :----------- | :--------- | :---------------------------------- |
| `url`        | `string`   | The URL of the webpage.             |
| `rawContent` | `string`   | The raw content extracted.          |
| `images`     | `string[]` | Image URLs extracted from the page. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Defining the starting URL of the crawl
    const url = "https://docs.tavily.com";

    // Step 3. Executing the crawl with some guidance parameters
    const response = await client.crawl(url, { instructions: "Find all info on the Python SDK" });
      
    // Step 4. Printing the crawled results
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ````javascript
    {
      responseTime: 9.09,
      baseUrl: "https://docs.tavily.com",
      results: [
        {
          "url": "https://docs.tavily.com/sdk/python/reference",
          "raw_content": "SDK Reference - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\nPython\n\nSDK Reference\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# SDK Reference\n\nIntegrate Tavily’s powerful APIs natively in your Python apps.\n\n## [​](#instantiating-a-client) Instantiating a client\n\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\n\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\n\n### [​](#synchronous-client) Synchronous Client\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [​](#asynchronous-client) Asynchronous Client\n\nCopy\n\n```\nfrom tavily import AsyncTavilyClient\n\nclient = AsyncTavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [​](#proxies) Proxies\n\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\n\nProxy configuration is available in both the synchronous and asynchronous clients.\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nproxies = {\n  \"http\": \"<your HTTP proxy>\",\n  \"https\": \"<your HTTPS proxy>\",\n}\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\", proxies=proxies)\n\n```\n\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\n\n## [​](#tavily-search) Tavily Search\n\n**NEW!** Try our interactive [API\nPlayground](https://app.tavily.com/playground) to see each parameter in\naction, and generate ready-to-use Python snippets.\n\nYou can access Tavily Search in Python through the client’s `search` function.\n\n### [​](#parameters) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `query` **(required)** | `str` | The query to run a search on. | — |  |\n| `search_depth` | `str` | The depth of the search. It can be `\"basic\"` or `\"advanced\"`. `\"advanced\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\"basic\"` search provides generic content snippets from each source. | `\"basic\"` |  |\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\"general\"` and `\"news\"`. | `\"general\"` |  |\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\"news\"` topic. | `7` |  |\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\"day\"`, `\"week\"`, `\"month\"`, `\"year\"` or shorthand values `\"d\"`, `\"w\"`, `\"m\"`, `\"y\"`. | — |  |\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk’s length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\"basic\"` (or `True`) answer is quick but less detailed; an `\"advanced\"` answer is more detailed. | `False` |  |\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. | `[]` |  |\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. | `[]` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [​](#response-format) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\n| `query` | `str` | Your search query. |\n| `response_time` | `float` | Your search result response time. |\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily’s search results. This is only available if `include_answer` is set to `True`. |\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\n\n### [​](#results) Results\n\n| `Key` | `Type` | Description |\n| --- | --- | --- |\n| `title` | `str` | The title of the search result. |\n| `url` | `str` | The URL of the search result. |\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\n| `score` | `float` | The relevance score of the search result. |\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\"news\"`. |\n\n#### [​](#image-results) Image Results\n\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `string` | The URL of the image. |\n| `description` | `string` | An LLM-generated description of the image. |\n\n### [​](#example) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Executing the search request\nresponse = tavily_client.search(\"Who is Leo Messi?\", include_images=True, include_image_descriptions=True)\n\n# Step 3. Printing the search results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n  \"query\": \"Who is Leo Messi?\",\n  \"images\": [\n    {\n      \"url\": \"Image 1 URL\",\n      \"description\": \"Image 1 Description\",\n    },\n    {\n      \"url\": \"Image 2 URL\",\n      \"description\": \"Image 2 Description\",\n    },\n    {\n      \"url\": \"Image 3 URL\",\n      \"description\": \"Image 3 Description\",\n    },\n    {\n      \"url\": \"Image 4 URL\",\n      \"description\": \"Image 4 Description\",\n    },\n    {\n      \"url\": \"Image 5 URL\",\n      \"description\": \"Image 5 Description\",\n    }\n  ],\n  \"results\": [\n    {\n      \"title\": \"Source 1 Title\",\n      \"url\": \"Source 1 URL\",\n      \"content\": \"Source 1 Content\",\n      \"score\": 0.99\n    },\n    {\n      \"title\": \"Source 2 Title\",\n      \"url\": \"Source 2 URL\",\n      \"content\": \"Source 2 Content\",\n      \"score\": 0.97\n    }\n  ],\n  \"response_time\": 1.09\n}\n\n```\n\n## [​](#tavily-extract) Tavily Extract\n\nYou can access Tavily Extract in Python through the client’s `extract` function.\n\n### [​](#parameters-2) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. | — |  |\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\"advanced\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\"basic\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\"basic\"` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [​](#response-format-2) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\n| `response_time` | `float` | The search result response time. |\n\n#### [​](#successful-results) Successful Results\n\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\n\n#### [​](#failed-results) Failed Results\n\nEach failed result in the `results` list will be in the following `FailedResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL that failed. |\n| `error` | `str` | An error message describing why it could not be processed. |\n\n### [​](#example-2) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the list of URLs to extract content from\nurls = [\n    \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n    \"https://en.wikipedia.org/wiki/Machine_learning\",\n    \"https://en.wikipedia.org/wiki/Data_science\",\n]\n\n# Step 3. Executing the extract request\nresponse = tavily_client.extract(urls=urls, include_images=True)\n\n# Step 4. Printing the extracted raw content\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    \"results\": [\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n            \"raw_content\": \"URL 1 raw content\",\n            \"images\": [\n                \"Image 1 URL\",\n                \"Image 2 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Machine_learning\",\n            \"raw_content\": \"URL 2 raw content\",\n            \"images\": [\n                \"Image 3 URL\",\n                \"Image 4 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Data_science\",\n            \"raw_content\": \"URL 3 raw content\",\n            \"images\": [\n                \"Image 5 URL\",\n                \"Image 6 URL\"\n            ]\n        }\n    ],\n    \"failed_results\": [],\n    \"response_time\": 1.23\n}\n\n```\n\n## [​](#tavily-crawl) Tavily Crawl\n\nOur agent-first crawl endpoint, **Tavily Crawl** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nYou can access Tavily Crawl in Python through the `crawl` function.\n\n### [​](#parameters-3) Parameters\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the crawl. | — |\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler. | — |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `include_images` | `bool` | Whether to extract image URLs from the crawled pages. | `False` |\n| `categories` | `list[str]` | Filter URLs using predefined categories. Options: `\"Careers\"`, `\"Blog\"`, `\"Documentation\"`, `\"About\"`, `\"Pricing\"`, `\"Community\"`, `\"Developers\"`, `\"Contact\"`, `\"Media\"` | `None` |\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\"basic\"` or `\"advanced\"`. | `\"basic\"` |\n\n### [​](#response-format-3) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `base_url` | `str` | The URL you started the crawl from. |\n| `results` | `list[Result]` | A list of crawled pages. |\n| `response_time` | `float` | The crawl response time. |\n\n#### [​](#results-2) Results\n\nEach successful result in the `results` list will be in the following `Result` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n| `images` | `list[str]` | Image URLs extracted from the page. |\n\n### [​](#example-3) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the starting URL of the crawl\nurl = \"https://docs.tavily.com\"\n\n# Step 3. Executing the crawl with some guidance parameters\nresponse = tavily_client.crawl(url, query=\"Python SDK\")\n\n# Step 4. Printing the crawled results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    \"base_url\": \"https://docs.tavily.com\",\n    \"results\": [\n        {\n            \"url\": \"https://docs.tavily.com/sdk/python/reference\",\n            \"raw_content\": \"SDK Reference - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nSDK Reference\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\n\\n- [API Playground](https://app.tavily.com/playground)\\n- [Community](https://community.tavily.com)\\n- [Blog](https://blog.tavily.com)\\n\\n##### Python\\n\\n- [Quickstart](/sdk/python/quick-start)\\n- [SDK Reference](/sdk/python/reference)\\n\\n##### JavaScript\\n\\n- [Quickstart](/sdk/javascript/quick-start)\\n- [SDK Reference](/sdk/javascript/reference)\\n\\nPython\\n\\n# SDK Reference\\n\\nIntegrate Tavily\\u2019s powerful APIs natively in your Python apps.\\n\\n## [\\u200b](#instantiating-a-client) Instantiating a client\\n\\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\\n\\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\\n\\n### [\\u200b](#synchronous-client) Synchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\")\\n\\n```\\n\\n### [\\u200b](#asynchronous-client) Asynchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import AsyncTavilyClient\\n\\nclient = AsyncTavilyClient(\\\"tvly-YOUR_API_KEY\\\")\\n\\n```\\n\\n### [\\u200b](#proxies) Proxies\\n\\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\\n\\nProxy configuration is available in both the synchronous and asynchronous clients.\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nproxies = {\\n  \\\"http\\\": \\\"<your HTTP proxy>\\\",\\n  \\\"https\\\": \\\"<your HTTPS proxy>\\\",\\n}\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\\n\\n## [\\u200b](#tavily-search) Tavily Search\\n\\n**NEW!** Try our interactive [API\\nPlayground](https://app.tavily.com/playground) to see each parameter in\\naction, and generate ready-to-use Python snippets.\\n\\nYou can access Tavily Search in Python through the client\\u2019s `search` function.\\n\\n### [\\u200b](#parameters) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `query` **(required)** | `str` | The query to run a search on. |  |  |\\n| `search_depth` | `str` | The depth of the search. It can be `\\\"basic\\\"` or `\\\"advanced\\\"`. `\\\"advanced\\\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\\\"basic\\\"` search provides generic content snippets from each source. | `\\\"basic\\\"` |  |\\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\\\"general\\\"` and `\\\"news\\\"`. | `\\\"general\\\"` |  |\\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\\\"news\\\"` topic. | `7` |  |\\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\\\"day\\\"`, `\\\"week\\\"`, `\\\"month\\\"`, `\\\"year\\\"` or shorthand values `\\\"d\\\"`, `\\\"w\\\"`, `\\\"m\\\"`, `\\\"y\\\"`. |  |  |\\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk\\u2019s length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\\\"basic\\\"` (or `True`) answer is quick but less detailed; an `\\\"advanced\\\"` answer is more detailed. | `False` |  |\\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. | `[]` |  |\\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. | `[]` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\\n| `query` | `str` | Your search query. |\\n| `response_time` | `float` | Your search result response time. |\\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily\\u2019s search results. This is only available if `include_answer` is set to `True`. |\\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\\n\\n### [\\u200b](#results) Results\\n\\n| `Key` | `Type` | Description |\\n| --- | --- | --- |\\n| `title` | `str` | The title of the search result. |\\n| `url` | `str` | The URL of the search result. |\\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\\n| `score` | `float` | The relevance score of the search result. |\\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\\\"news\\\"`. |\\n\\n#### [\\u200b](#image-results) Image Results\\n\\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `string` | The URL of the image. |\\n| `description` | `string` | An LLM-generated description of the image. |\\n\\n### [\\u200b](#example) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Executing the search request\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\", include_images=True, include_image_descriptions=True)\\n\\n# Step 3. Printing the search results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n  \\\"query\\\": \\\"Who is Leo Messi?\\\",\\n  \\\"images\\\": [\\n    {\\n      \\\"url\\\": \\\"Image 1 URL\\\",\\n      \\\"description\\\": \\\"Image 1 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 2 URL\\\",\\n      \\\"description\\\": \\\"Image 2 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 3 URL\\\",\\n      \\\"description\\\": \\\"Image 3 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 4 URL\\\",\\n      \\\"description\\\": \\\"Image 4 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 5 URL\\\",\\n      \\\"description\\\": \\\"Image 5 Description\\\",\\n    }\\n  ],\\n  \\\"results\\\": [\\n    {\\n      \\\"title\\\": \\\"Source 1 Title\\\",\\n      \\\"url\\\": \\\"Source 1 URL\\\",\\n      \\\"content\\\": \\\"Source 1 Content\\\",\\n      \\\"score\\\": 0.99\\n    },\\n    {\\n      \\\"title\\\": \\\"Source 2 Title\\\",\\n      \\\"url\\\": \\\"Source 2 URL\\\",\\n      \\\"content\\\": \\\"Source 2 Content\\\",\\n      \\\"score\\\": 0.97\\n    }\\n  ],\\n  \\\"response_time\\\": 1.09\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-extract) Tavily Extract\\n\\nYou can access Tavily Extract in Python through the client\\u2019s `extract` function.\\n\\n### [\\u200b](#parameters-2) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. |  |  |\\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\\\"advanced\\\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\\\"basic\\\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\\\"basic\\\"` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format-2) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\\n| `response_time` | `float` | The search result response time. |\\n\\n#### [\\u200b](#successful-results) Successful Results\\n\\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\\n\\n#### [\\u200b](#failed-results) Failed Results\\n\\nEach failed result in the `results` list will be in the following `FailedResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL that failed. |\\n| `error` | `str` | An error message describing why it could not be processed. |\\n\\n### [\\u200b](#example-2) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the list of URLs to extract content from\\nurls = [\\n    \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n    \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n    \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n]\\n\\n# Step 3. Executing the extract request\\nresponse = tavily_client.extract(urls=urls, include_images=True)\\n\\n# Step 4. Printing the extracted raw content\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    \\\"results\\\": [\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n            \\\"raw_content\\\": \\\"URL 1 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 1 URL\\\",\\n                \\\"Image 2 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n            \\\"raw_content\\\": \\\"URL 2 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 3 URL\\\",\\n                \\\"Image 4 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n            \\\"raw_content\\\": \\\"URL 3 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 5 URL\\\",\\n                \\\"Image 6 URL\\\"\\n            ]\\n        }\\n    ],\\n    \\\"failed_results\\\": [],\\n    \\\"response_time\\\": 1.23\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-crawl) Tavily Crawl\\n\\nOur agent-first crawl endpoint, **Tavily Crawl** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\\n\\nYou can access Tavily Crawl in Python through the `crawl` function.\\n\\n### [\\u200b](#parameters-3) Parameters\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `url` **(required)** | `str` | The root URL to begin the crawl. | \\u2014 |\\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\\n| `query` | `str` | Natural language instructions for the crawler. | \\u2014 |\\n| `select_paths` | `str[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\\\"/docs/.*\\\"`, `\\\"/api/v1.*\\\"`). | `None` |\\n| `select_domains` | `str[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\\\"^docs\\\\.example\\\\.com$\\\"`). | `None` |\\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\\n| `categories` | `str[]` | Filter URLs using predefined categories. Options: `\\\"Careers\\\"`, `\\\"Blog\\\"`, `\\\"Documentation\\\"`, `\\\"About\\\"`, `\\\"Pricing\\\"`, `\\\"Community\\\"`, `\\\"Developers\\\"`, `\\\"Contact\\\"`, `\\\"Media\\\"` | `None` |\\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\\\"basic\\\"` or `\\\"advanced\\\"`. | `\\\"basic\\\"` |\\n\\n### [\\u200b](#response-format-3) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `base_url` | `str` | The URL you started the crawl from. |\\n| `results` | `list[Result]` | A list of crawled pages. |\\n| `response_time` | `float` | The crawl response time. |\\n\\n#### [\\u200b](#results-2) Results\\n\\nEach successful result in the `results` list will be in the following `Result` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n\\n### [\\u200b](#example-3) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the starting URL of the crawl\\nurl = \\\"https://docs.tavily.com\\\"\\n\\n# Step 3. Executing the crawl with some guidance parameters\\nresponse = tavily_client.crawl(url, query=\\\"Python SDK\\\")\\n\\n# Step 4. Printing the crawled results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    'base_url': 'https://docs.tavily.com',\\n    'results': [\\n        {\\n            'url': 'https://docs.tavily.com/sdk/python/quick-start',\\n            'raw_content': 'Quickstart - Tavily Docs\\\\n\\\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\\\n\\\\nSearch or ask...\\\\n\\\\nCtrl K\\\\n\\\\n- [Support](mailto:support@tavily.com)\\\\n- [Get an API key](https://app.tavily.com)\\\\n- [Get an API key](https://app.tavily.com)\\\\n\\\\nSearch...\\\\n\\\\nNavigation\\\\n\\\\nPython\\\\n\\\\nQuickstart\\\\n\\\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\\\n\\\\n- [API Playground](https://app.tavily.com/playground)\\\\n- [Community](https://community.tavily.com)\\\\n- [Blog](https://blog.tavily.com)\\\\n\\\\n##### Python\\\\n\\\\n- [Quickstart](/sdk/python/quick-start)\\\\n- [SDK Reference](/sdk/python/reference)\\\\n\\\\n##### JavaScript\\\\n\\\\n- [Quickstart](/sdk/javascript/quick-start)\\\\n- [SDK Reference](/sdk/javascript/reference)\\\\n\\\\nPython\\\\n\\\\n# Quickstart\\\\n\\\\nIntegrate Tavily\\\\'s powerful APIs natively in your Python apps.\\\\n\\\\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\\\\n\\\\n## [\\\\u200b](#introduction) Introduction\\\\n\\\\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily\\\\'s powerful search features.\\\\n\\\\n[## GitHub\\\\n\\\\n`/tavily-ai/tavily-python`\\\\n\\\\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\\\\n\\\\n`tavily-python`\\\\n\\\\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\\\\n\\\\n## [\\\\u200b](#quickstart) Quickstart\\\\n\\\\nGet started with our Python SDK in less than 5 minutes!\\\\n\\\\n[## Get your free API key\\\\n\\\\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\\\\n\\\\n### [\\\\u200b](#installation) Installation\\\\n\\\\nYou can install the Tavily Python SDK using the following:\\\\n\\\\nCopy\\\\n\\\\n```\\\\npip install tavily-python\\\\n\\\\n```\\\\n\\\\n### [\\\\u200b](#usage) Usage\\\\n\\\\nWith Tavily\\\\'s Python SDK, you can search the web in only 4 lines of code:\\\\n\\\\nCopy\\\\n\\\\n```\\\\nfrom tavily import TavilyClient\\\\n\\\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\")\\\\n\\\\nprint(response)\\\\n\\\\n```\\\\n\\\\nYou can also easily extract content from URLs:\\\\n\\\\nCopy\\\\n\\\\n```\\\\nfrom tavily import TavilyClient\\\\n\\\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\\\nresponse = tavily_client.extract(\\\"https://en.wikipedia.org/wiki/Lionel_Messi\\\")\\\\n\\\\nprint(response)\\\\n\\\\n```\\\\n\\\\nThese examples are very simple, and you can do so much more with Tavily!\\\\n\\\\n## [\\\\u200b](#features) Features\\\\n\\\\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\\\\n\\\\n- The `search` function lets you harness the full power of Tavily Search.\\\\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\\\\n\\\\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\\\\n\\\\n[SDK Reference](/sdk/python/reference)\\\\n\\\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\\\n\\\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\\\n\\\\nOn this page\\\\n\\\\n- [Introduction](#introduction)\\\\n- [Quickstart](#quickstart)\\\\n- [Installation](#installation)\\\\n- [Usage](#usage)\\\\n- [Features](#features)'\\n        }\\n    ],\\n    'response_time': 9.14\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-map) Tavily Map\\n\\nOur agent-first mapping endpoint, **Tavily Map** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\\n\\nTavily Map allows you to obtain a sitemap starting from a base URL.\\n\\nYou can access Tavily Map in Python through the `map` function.\\n\\n### [\\u200b](#parameters-4) Parameters\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `url` **(required)** | `str` | The root URL to begin the mapping. | \\u2014 |\\n| `max_depth` | `int` | Max depth of the mapping. Defines how far from the base URL the crawler can explore. | `1` |\\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\\n| `query` | `str` | Natural language instructions for the crawler | \\u2014 |\\n| `select_paths` | `str[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\\\"/docs/.*\\\"`, `\\\"/api/v1.*\\\"`). | `None` |\\n| `select_domains` | `str[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\\\"^docs\\\\.example\\\\.com$\\\"`). | `None` |\\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\\n| `categories` | `str[]` | Filter URLs using predefined categories. Options: `\\\"Careers\\\"`, `\\\"Blog\\\"`, `\\\"Documentation\\\"`, `\\\"About\\\"`, `\\\"Pricing\\\"`, `\\\"Community\\\"`, `\\\"Developers\\\"`, `\\\"Contact\\\"`, `\\\"Media\\\"` | `None` |\\n\\n### [\\u200b](#response-format-4) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `base_url` | `str` | The URL you started the mapping from. |\\n| `results` | `list[str]` | A list of URLs that were discovered during the mapping. |\\n| `response_time` | `float` | The mapping response time. |\\n\\n### [\\u200b](#example-4) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the starting URL of the mapping\\nurl = \\\"https://docs.tavily.com\\\"\\n\\n# Step 3. Executing the mapping with some guidance parameters\\nresponse = tavily_client.mapping(url, query=\\\"JavaScript\\\")\\n\\n# Step 4. Printing the results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    'base_url': 'https://docs.tavily.com',\\n    'results': [\\n      'https://docs.tavily.com/sdk/javascript/quick-start',\\n      'https://docs.tavily.com/sdk/javascript/reference',\\n    ],\\n    'response_time': 8.43\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-hybrid-rag) Tavily Hybrid RAG\\n\\nTavily Hybrid RAG is an extension of the Tavily Search API built to retrieve relevant data from both the web and an existing database collection. This way, a RAG agent can combine web sources and locally available data to perform its tasks. Additionally, data queried from the web that is not yet in the database can optionally be inserted into it. This will allow similar searches in the future to be answered faster, without the need to query the web again.\\n\\n### [\\u200b](#parameters-5) Parameters\\n\\nThe TavilyHybridClient class is your gateway to Tavily Hybrid RAG. There are a few important parameters to keep in mind when you are instantiating a Tavily Hybrid Client.\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `api_key` | `str` | Your Tavily API Key |  |\\n| `db_provider` | `str` | Your database provider. Currently, only `\\\"mongodb\\\"` is supported. |  |\\n| `collection` | `str` | A reference to the MongoDB collection that will be used for local search. |  |\\n| `embeddings_field` (optional) | `str` | The name of the field that stores the embeddings in the specified collection. This field MUST be the same one used in the specified index. This will also be used when inserting web search results in the database using our default function. | `\\\"embeddings\\\"` |\\n| `content_field` (optional) | `str` | The name of the field that stores the text content in the specified collection. This will also be used when inserting web search results in the database using our default function. | `\\\"content\\\"` |\\n| `embedding_function` (optional) | `function` | A custom embedding function (if you want to use one). The function must take in a `list[str]` corresponding to the list of strings to be embedded, as well as an additional string defining the type of document. It must return a `list[list[float]]`, one embedding per input string. If no function is provided, defaults to Cohere\\u2019s Embed. Keep in mind that you shouldn\\u2019t mix different embeddings in the same database collection. |  |\\n| `ranking_function` (optional) | `function` | A custom ranking function (if you want to use one). If no function is provided, defaults to Cohere\\u2019s Rerank. It should return an ordered `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. The function MUST accept the following parameters: `query`: `str` - This is the query you are executing. When your ranking function is called during Hybrid RAG, the query parameter of your search call (more details below) will be passed as query. `documents`:`List[Dict]`: - This is the list of documents that are returned by your Hybrid RAG call and that you want to sort. Each document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. `top_n`: `int` - This is the number of results you want to return after ranking. When your ranking function is called during Hybrid RAG, the max\\\\_results value will be passed as `top_n`. |  |\\n\\n### [\\u200b](#methods) Methods\\n\\n`search`(query, max\\\\_results=10, max\\\\_local=None, max\\\\_foreign=None, save\\\\_foreign=False, \\\\*\\\\*kwargs)\\n\\nPerforms a Tavily Hybrid RAG query and returns the retrieved documents as a `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have three properties - `content` (str), `score` (float), and `origin`, which is either `local` or `foreign`.\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `query` | `str` | The query you want to search for. |  |  |\\n| `max_results` | `int` | The maximum number of total search results to return. | 10 |  |\\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\\n| `max_foreign` | `int` | The maximum number of web search results to return. | `None`, which defaults to `max_results`. |  |\\n| `save_foreign` | `Union[bool, function]` | Save documents from the web search in the local database. If `True` is passed, our default saving function (which only saves the content `str` and the embedding `list[float]` will be used.) If `False` is passed, no web search result documents will be saved in the local database. If a function is passed, that function MUST take in a `dict` as a parameter, and return another `dict`. The input `dict` contains all properties of the returned Tavily result object. The output dict is the final document that will be inserted in the database. You are free to add to it any fields that are supported by the database, as well as remove any of the default ones. If this function returns `None`, the document will not be saved in the database. |  |  |\\n\\nAdditional parameters can be provided as keyword arguments (detailed below). The keyword arguments supported by this method are: `search_depth`, `topic`, `include_raw_content`, `include_domains`,`exclude_domains`.\\n\\n### [\\u200b](#setup) Setup\\n\\n#### [\\u200b](#mongodb-setup) MongoDB setup\\n\\nYou will need to have a MongoDB collection with a vector search index. You can follow the [MongoDB Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/) to learn how to set this up.\\n\\n#### [\\u200b](#cohere-api-key) Cohere API Key\\n\\nBy default, embedding and ranking use the Cohere API, our recommended option. Unless you want to provide a custom embedding and ranking function, you\\u2019ll need to get an API key from [Cohere](https://cohere.com/) and set it as an environment variable named `CO_API_KEY`\\n\\nIf you decide to stick with Cohere, please note that you\\u2019ll need to install the Cohere Python package as well:\\n\\nCopy\\n\\n```\\npip install cohere\\n\\n```\\n\\n#### [\\u200b](#tavily-hybrid-rag-client-setup) Tavily Hybrid RAG Client setup\\n\\nOnce you are done setting up your database, you\\u2019ll need to create a MongoDB Client as well as a Tavily Hybrid RAG Client.\\nA minimal setup would look like this:\\n\\nCopy\\n\\n```\\nfrom pymongo import MongoClient\\nfrom tavily import TavilyHybridClient\\n\\ndb = MongoClient(\\\"mongodb+srv://YOUR_MONGO_URI\\\")[\\\"YOUR_DB\\\"]\\n\\nhybrid_rag = TavilyHybridClient(\\n    api_key=\\\"tvly-YOUR_API_KEY\\\",\\n    db_provider=\\\"mongodb\\\",\\n    collection=db.get_collection(\\\"YOUR_COLLECTION\\\"),\\n    index=\\\"YOUR_VECTOR_SEARCH_INDEX\\\",\\n    embeddings_field=\\\"YOUR_EMBEDDINGS_FIELD\\\",\\n    content_field=\\\"YOUR_CONTENT_FIELD\\\"\\n)\\n\\n```\\n\\n### [\\u200b](#usage) Usage\\n\\nOnce you create the proper clients, you can easily start searching. A few simple examples are shown below. They assume you\\u2019ve followed earlier steps. You can use most of the Tavily Search parameters with Tavily Hybrid RAG as well.\\n\\n#### [\\u200b](#simple-tavily-hybrid-rag-example) Simple Tavily Hybrid RAG example\\n\\nThis example will look for context about Leo Messi on the web and in the local database.\\nHere, we get 5 sources, both from our database and from the web, but we want to exclude unwanted-domain.com from our web search results:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", max_results=5, exclude_domains=['unwanted-domain.com'])\\n\\n```\\n\\nHere, we want to prioritize the number of local sources, so we will get 2 foreign (web) sources, and 5 sources from our database:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\",  max_local=5, max_foreign=2)\\n\\n```\\n\\nNote: The sum of `max_local` and `max_foreign` can exceed `max_results`, but only the top `max_results` results will be returned.\\n\\n#### [\\u200b](#adding-retrieved-data-to-the-database) Adding retrieved data to the database\\n\\nIf you want to add the retrieved data to the database, you can do so by setting the save\\\\_foreign parameter to True:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", save_foreign=True)\\n\\n```\\n\\nThis will use our default saving function, which stores the content and its embedding.\\n\\n### [\\u200b](#examples) Examples\\n\\n#### [\\u200b](#sample-1%3A-using-a-custom-saving-function) Sample 1: Using a custom saving function\\n\\nYou might want to add some extra properties to documents you\\u2019re inserting or even discard some of them based on custom criteria. This can be done by passing a function to the save\\\\_foreign parameter:\\n\\nCopy\\n\\n```\\ndef save_document(document):\\n    if document['score'] < 0.5:\\n        return None # Do not save documents with low scores\\n\\n    return {\\n        'content': document['content'],\\n\\n         # Save the title and URL in the database\\n        'site_title': document['title'],\\n        'site_url': document['url'],\\n\\n        # Add a new field\\n        'added_at': datetime.now()\\n    }\\n\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", save_foreign=save_document)\\n\\n```\\n\\n#### [\\u200b](#sample-2%3A-using-a-custom-embedding-function) Sample 2: Using a custom embedding function\\n\\nBy default, we use [Cohere](https://cohere.com/) for our embeddings. If you want to use your own embeddings, can pass a custom embedding function to the TavilyHybridClient:\\n\\nCopy\\n\\n```\\ndef my_embedding_function(texts, doc_type): # doc_type will be either 'search_query' or 'search_document'\\n    return my_embedding_model.encode(texts)\\n\\nhybrid_rag = TavilyHybridClient(\\n    # ...\\n    embedding_function=my_embedding_function\\n)\\n\\n```\\n\\n#### [\\u200b](#sample-3%3A-using-a-custom-ranking-function) Sample 3: Using a custom ranking function\\n\\nCohere\\u2019s [rerank](https://cohere.com/rerank) model is used by default, but you can pass your own function to the ranking\\\\_function parameter:\\n\\nCopy\\n\\n```\\ndef my_ranking_function(query, documents, top_n):\\n    return my_ranking_model.rank(query, documents, top_n)\\n\\nhybrid_rag = TavilyHybridClient(\\n    # ...\\n    ranking_function=my_ranking_function\\n)\\n\\n```\\n\\n[Quickstart](/sdk/python/quick-start)[Quickstart](/sdk/javascript/quick-start)\\n\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\n\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\n\\nOn this page\\n\\n- [Instantiating a client](#instantiating-a-client)\\n- [Synchronous Client](#synchronous-client)\\n- [Asynchronous Client](#asynchronous-client)\\n- [Proxies](#proxies)\\n- [Tavily Search](#tavily-search)\\n- [Parameters](#parameters)\\n- [Response format](#response-format)\\n- [Results](#results)\\n- [Image Results](#image-results)\\n- [Example](#example)\\n- [Tavily Extract](#tavily-extract)\\n- [Parameters](#parameters-2)\\n- [Response format](#response-format-2)\\n- [Successful Results](#successful-results)\\n- [Failed Results](#failed-results)\\n- [Example](#example-2)\\n- [Tavily Crawl](#tavily-crawl)\\n- [Parameters](#parameters-3)\\n- [Response format](#response-format-3)\\n- [Results](#results-2)\\n- [Example](#example-3)\\n- [Tavily Map](#tavily-map)\\n- [Parameters](#parameters-4)\\n- [Response format](#response-format-4)\\n- [Example](#example-4)\\n- [Tavily Hybrid RAG](#tavily-hybrid-rag)\\n- [Parameters](#parameters-5)\\n- [Methods](#methods)\\n- [Setup](#setup)\\n- [MongoDB setup](#mongodb-setup)\\n- [Cohere API Key](#cohere-api-key)\\n- [Tavily Hybrid RAG Client setup](#tavily-hybrid-rag-client-setup)\\n- [Usage](#usage)\\n- [Simple Tavily Hybrid RAG example](#simple-tavily-hybrid-rag-example)\\n- [Adding retrieved data to the database](#adding-retrieved-data-to-the-database)\\n- [Examples](#examples)\\n- [Sample 1: Using a custom saving function](#sample-1%3A-using-a-custom-saving-function)\\n- [Sample 2: Using a custom embedding function](#sample-2%3A-using-a-custom-embedding-function)\\n- [Sample 3: Using a custom ranking function](#sample-3%3A-using-a-custom-ranking-function)\",\n            \"images\": []\n        },\n        {\n            \"url\": \"https://docs.tavily.com/sdk/python/quick-start\",\n            \"raw_content\": \"Quickstart - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nQuickstart\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\n\\n- [API Playground](https://app.tavily.com/playground)\\n- [Community](https://community.tavily.com)\\n- [Blog](https://blog.tavily.com)\\n\\n##### Python\\n\\n- [Quickstart](/sdk/python/quick-start)\\n- [SDK Reference](/sdk/python/reference)\\n\\n##### JavaScript\\n\\n- [Quickstart](/sdk/javascript/quick-start)\\n- [SDK Reference](/sdk/javascript/reference)\\n\\nPython\\n\\n# Quickstart\\n\\nIntegrate Tavily\\u2019s powerful APIs natively in your Python apps.\\n\\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\\n\\n## [\\u200b](#introduction) Introduction\\n\\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily\\u2019s powerful search features.\\n\\n[## GitHub\\n\\n`/tavily-ai/tavily-python`\\n\\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\\n\\n`tavily-python`\\n\\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\\n\\n## [\\u200b](#quickstart) Quickstart\\n\\nGet started with our Python SDK in less than 5 minutes!\\n\\n[## Get your free API key\\n\\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\\n\\n### [\\u200b](#installation) Installation\\n\\nYou can install the Tavily Python SDK using the following:\\n\\nCopy\\n\\n```\\npip install tavily-python\\n\\n```\\n\\n### [\\u200b](#usage) Usage\\n\\nWith Tavily\\u2019s Python SDK, you can search the web in only 4 lines of code:\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\")\\n\\nprint(response)\\n\\n```\\n\\nYou can also easily extract content from URLs:\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\nresponse = tavily_client.extract(\\\"https://en.wikipedia.org/wiki/Lionel_Messi\\\")\\n\\nprint(response)\\n\\n```\\n\\nTavily also allows you to perform a smart crawl starting at a given URL.\\n\\nOur agent-first crawl is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\nresponse = tavily_client.crawl(\\\"https://docs.tavily.com\\\", query=\\\"Python SDK\\\")\\n\\nprint(response)\\n\\n```\\n\\nThese examples are very simple, and you can do so much more with Tavily!\\n\\n## [\\u200b](#features) Features\\n\\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\\n\\n- The `search` function lets you harness the full power of Tavily Search.\\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\\n\\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\\n\\n[SDK Reference](/sdk/python/reference)\\n\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\n\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\n\\nOn this page\\n\\n- [Introduction](#introduction)\\n- [Quickstart](#quickstart)\\n- [Installation](#installation)\\n- [Usage](#usage)\\n- [Features](#features)\",\n            \"images\": []\n        }\n    ],\n    \"response_time\": 9.07\n}\n\n```\n\n## [​](#tavily-map) Tavily Map\n\nOur agent-first mapping endpoint, **Tavily Map** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nTavily Map allows you to obtain a sitemap starting from a base URL.\n\nYou can access Tavily Map in Python through the `map` function.\n\n### [​](#parameters-4) Parameters\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the mapping. | — |\n| `max_depth` | `int` | Max depth of the mapping. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler | — |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `categories` | `list[str]` | Filter URLs using predefined categories. Options: `\"Careers\"`, `\"Blog\"`, `\"Documentation\"`, `\"About\"`, `\"Pricing\"`, `\"Community\"`, `\"Developers\"`, `\"Contact\"`, `\"Media\"` | `None` |\n\n### [​](#response-format-4) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `base_url` | `str` | The URL you started the mapping from. |\n| `results` | `list[str]` | A list of URLs that were discovered during the mapping. |\n| `response_time` | `float` | The mapping response time. |\n\n### [​](#example-4) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the starting URL of the mapping\nurl = \"https://docs.tavily.com\"\n\n# Step 3. Executing the mapping with some guidance parameters\nresponse = tavily_client.mapping(url, query=\"JavaScript\")\n\n# Step 4. Printing the results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    'base_url': 'https://docs.tavily.com',\n    'results': [\n      'https://docs.tavily.com/sdk/javascript/quick-start',\n      'https://docs.tavily.com/sdk/javascript/reference',\n    ],\n    'response_time': 8.43\n}\n\n```\n\n## [​](#tavily-hybrid-rag) Tavily Hybrid RAG\n\nTavily Hybrid RAG is an extension of the Tavily Search API built to retrieve relevant data from both the web and an existing database collection. This way, a RAG agent can combine web sources and locally available data to perform its tasks. Additionally, data queried from the web that is not yet in the database can optionally be inserted into it. This will allow similar searches in the future to be answered faster, without the need to query the web again.\n\n### [​](#parameters-5) Parameters\n\nThe TavilyHybridClient class is your gateway to Tavily Hybrid RAG. There are a few important parameters to keep in mind when you are instantiating a Tavily Hybrid Client.\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `api_key` | `str` | Your Tavily API Key |  |\n| `db_provider` | `str` | Your database provider. Currently, only `\"mongodb\"` is supported. |  |\n| `collection` | `str` | A reference to the MongoDB collection that will be used for local search. |  |\n| `embeddings_field` (optional) | `str` | The name of the field that stores the embeddings in the specified collection. This field MUST be the same one used in the specified index. This will also be used when inserting web search results in the database using our default function. | `\"embeddings\"` |\n| `content_field` (optional) | `str` | The name of the field that stores the text content in the specified collection. This will also be used when inserting web search results in the database using our default function. | `\"content\"` |\n| `embedding_function` (optional) | `function` | A custom embedding function (if you want to use one). The function must take in a `list[str]` corresponding to the list of strings to be embedded, as well as an additional string defining the type of document. It must return a `list[list[float]]`, one embedding per input string. If no function is provided, defaults to Cohere’s Embed. Keep in mind that you shouldn’t mix different embeddings in the same database collection. |  |\n| `ranking_function` (optional) | `function` | A custom ranking function (if you want to use one). If no function is provided, defaults to Cohere’s Rerank. It should return an ordered `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. The function MUST accept the following parameters: `query`: `str` - This is the query you are executing. When your ranking function is called during Hybrid RAG, the query parameter of your search call (more details below) will be passed as query. `documents`:`List[Dict]`: - This is the list of documents that are returned by your Hybrid RAG call and that you want to sort. Each document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. `top_n`: `int` - This is the number of results you want to return after ranking. When your ranking function is called during Hybrid RAG, the max\\_results value will be passed as `top_n`. |  |\n\n### [​](#methods) Methods\n\n`search`(query, max\\_results=10, max\\_local=None, max\\_foreign=None, save\\_foreign=False, \\*\\*kwargs)\n\nPerforms a Tavily Hybrid RAG query and returns the retrieved documents as a `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have three properties - `content` (str), `score` (float), and `origin`, which is either `local` or `foreign`.\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `query` | `str` | The query you want to search for. | — |  |\n| `max_results` | `int` | The maximum number of total search results to return. | 10 |  |\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\n| `max_foreign` | `int` | The maximum number of web search results to return. | `None`, which defaults to `max_results`. |  |\n| `save_foreign` | `Union[bool, function]` | Save documents from the web search in the local database. If `True` is passed, our default saving function (which only saves the content `str` and the embedding `list[float]` will be used.) If `False` is passed, no web search result documents will be saved in the local database. If a function is passed, that function MUST take in a `dict` as a parameter, and return another `dict`. The input `dict` contains all properties of the returned Tavily result object. The output dict is the final document that will be inserted in the database. You are free to add to it any fields that are supported by the database, as well as remove any of the default ones. If this function returns `None`, the document will not be saved in the database. | — |  |\n\nAdditional parameters can be provided as keyword arguments (detailed below). The keyword arguments supported by this method are: `search_depth`, `topic`, `include_raw_content`, `include_domains`,`exclude_domains`.\n\n### [​](#setup) Setup\n\n#### [​](#mongodb-setup) MongoDB setup\n\nYou will need to have a MongoDB collection with a vector search index. You can follow the [MongoDB Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/) to learn how to set this up.\n\n#### [​](#cohere-api-key) Cohere API Key\n\nBy default, embedding and ranking use the Cohere API, our recommended option. Unless you want to provide a custom embedding and ranking function, you’ll need to get an API key from [Cohere](https://cohere.com/) and set it as an environment variable named `CO_API_KEY`\n\nIf you decide to stick with Cohere, please note that you’ll need to install the Cohere Python package as well:\n\nCopy\n\n```\npip install cohere\n\n```\n\n#### [​](#tavily-hybrid-rag-client-setup) Tavily Hybrid RAG Client setup\n\nOnce you are done setting up your database, you’ll need to create a MongoDB Client as well as a Tavily Hybrid RAG Client.\nA minimal setup would look like this:\n\nCopy\n\n```\nfrom pymongo import MongoClient\nfrom tavily import TavilyHybridClient\n\ndb = MongoClient(\"mongodb+srv://YOUR_MONGO_URI\")[\"YOUR_DB\"]\n\nhybrid_rag = TavilyHybridClient(\n    api_key=\"tvly-YOUR_API_KEY\",\n    db_provider=\"mongodb\",\n    collection=db.get_collection(\"YOUR_COLLECTION\"),\n    index=\"YOUR_VECTOR_SEARCH_INDEX\",\n    embeddings_field=\"YOUR_EMBEDDINGS_FIELD\",\n    content_field=\"YOUR_CONTENT_FIELD\"\n)\n\n```\n\n### [​](#usage) Usage\n\nOnce you create the proper clients, you can easily start searching. A few simple examples are shown below. They assume you’ve followed earlier steps. You can use most of the Tavily Search parameters with Tavily Hybrid RAG as well.\n\n#### [​](#simple-tavily-hybrid-rag-example) Simple Tavily Hybrid RAG example\n\nThis example will look for context about Leo Messi on the web and in the local database.\nHere, we get 5 sources, both from our database and from the web, but we want to exclude unwanted-domain.com from our web search results:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\", max_results=5, exclude_domains=['unwanted-domain.com'])\n\n```\n\nHere, we want to prioritize the number of local sources, so we will get 2 foreign (web) sources, and 5 sources from our database:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\",  max_local=5, max_foreign=2)\n\n```\n\nNote: The sum of `max_local` and `max_foreign` can exceed `max_results`, but only the top `max_results` results will be returned.\n\n#### [​](#adding-retrieved-data-to-the-database) Adding retrieved data to the database\n\nIf you want to add the retrieved data to the database, you can do so by setting the save\\_foreign parameter to True:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\", save_foreign=True)\n\n```\n\nThis will use our default saving function, which stores the content and its embedding.\n\n### [​](#examples) Examples\n\n#### [​](#sample-1%3A-using-a-custom-saving-function) Sample 1: Using a custom saving function\n\nYou might want to add some extra properties to documents you’re inserting or even discard some of them based on custom criteria. This can be done by passing a function to the save\\_foreign parameter:\n\nCopy\n\n```\ndef save_document(document):\n    if document['score'] < 0.5:\n        return None # Do not save documents with low scores\n\n    return {\n        'content': document['content'],\n\n         # Save the title and URL in the database\n        'site_title': document['title'],\n        'site_url': document['url'],\n\n        # Add a new field\n        'added_at': datetime.now()\n    }\n\nresults = hybrid_rag.search(\"Who is Leo Messi?\", save_foreign=save_document)\n\n```\n\n#### [​](#sample-2%3A-using-a-custom-embedding-function) Sample 2: Using a custom embedding function\n\nBy default, we use [Cohere](https://cohere.com/) for our embeddings. If you want to use your own embeddings, can pass a custom embedding function to the TavilyHybridClient:\n\nCopy\n\n```\ndef my_embedding_function(texts, doc_type): # doc_type will be either 'search_query' or 'search_document'\n    return my_embedding_model.encode(texts)\n\nhybrid_rag = TavilyHybridClient(\n    # ...\n    embedding_function=my_embedding_function\n)\n\n```\n\n#### [​](#sample-3%3A-using-a-custom-ranking-function) Sample 3: Using a custom ranking function\n\nCohere’s [rerank](https://cohere.com/rerank) model is used by default, but you can pass your own function to the ranking\\_function parameter:\n\nCopy\n\n```\ndef my_ranking_function(query, documents, top_n):\n    return my_ranking_model.rank(query, documents, top_n)\n\nhybrid_rag = TavilyHybridClient(\n    # ...\n    ranking_function=my_ranking_function\n)\n\n```\n\n[Quickstart](/sdk/python/quick-start)[Quickstart](/sdk/javascript/quick-start)\n\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\n\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=referral&utm_source=docs.tavily.com)\n\nOn this page\n\n- [Instantiating a client](#instantiating-a-client)\n- [Synchronous Client](#synchronous-client)\n- [Asynchronous Client](#asynchronous-client)\n- [Proxies](#proxies)\n- [Tavily Search](#tavily-search)\n- [Parameters](#parameters)\n- [Response format](#response-format)\n- [Results](#results)\n- [Image Results](#image-results)\n- [Example](#example)\n- [Tavily Extract](#tavily-extract)\n- [Parameters](#parameters-2)\n- [Response format](#response-format-2)\n- [Successful Results](#successful-results)\n- [Failed Results](#failed-results)\n- [Example](#example-2)\n- [Tavily Crawl](#tavily-crawl)\n- [Parameters](#parameters-3)\n- [Response format](#response-format-3)\n- [Results](#results-2)\n- [Example](#example-3)\n- [Tavily Map](#tavily-map)\n- [Parameters](#parameters-4)\n- [Response format](#response-format-4)\n- [Example](#example-4)\n- [Tavily Hybrid RAG](#tavily-hybrid-rag)\n- [Parameters](#parameters-5)\n- [Methods](#methods)\n- [Setup](#setup)\n- [MongoDB setup](#mongodb-setup)\n- [Cohere API Key](#cohere-api-key)\n- [Tavily Hybrid RAG Client setup](#tavily-hybrid-rag-client-setup)\n- [Usage](#usage)\n- [Simple Tavily Hybrid RAG example](#simple-tavily-hybrid-rag-example)\n- [Adding retrieved data to the database](#adding-retrieved-data-to-the-database)\n- [Examples](#examples)\n- [Sample 1: Using a custom saving function](#sample-1%3A-using-a-custom-saving-function)\n- [Sample 2: Using a custom embedding function](#sample-2%3A-using-a-custom-embedding-function)\n- [Sample 3: Using a custom ranking function](#sample-3%3A-using-a-custom-ranking-function)",
          "images": []
        },
        {
          url: "https://docs.tavily.com/sdk/python/quick-start",
          rawContent: "Quickstart - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\nPython\n\nQuickstart\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# Quickstart\n\nIntegrate Tavily's powerful APIs natively in your Python apps.\n\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\n\n## [](#introduction) Introduction\n\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily's powerful search features.\n\n[## GitHub\n\n`/tavily-ai/tavily-python`\n\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\n\n`tavily-python`\n\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\n\n## [](#quickstart) Quickstart\n\nGet started with our Python SDK in less than 5 minutes!\n\n[## Get your free API key\n\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\n\n### [](#installation) Installation\n\nYou can install the Tavily Python SDK using the following:\n\nCopy\n\n```\npip install tavily-python\n\n```\n\n### [](#usage) Usage\n\nWith Tavily's Python SDK, you can search the web in only 4 lines of code:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.search("Who is Leo Messi?")\n\nprint(response)\n\n```\n\nYou can also easily extract content from URLs:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.extract("https://en.wikipedia.org/wiki/Lionel_Messi")\n\nprint(response)\n\n```\n\nTavily also allows you to perform a smart crawl starting at a given URL.\n\nOur agent-first crawl is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.crawl("https://docs.tavily.com", query="Python SDK")\n\nprint(response)\n\n```\n\nThese examples are very simple, and you can do so much more with Tavily!\n\n## [](#features) Features\n\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\n\n- The `search` function lets you harness the full power of Tavily Search.\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\n\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\n\n[SDK Reference](/sdk/python/reference)\n\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\n\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\n\nOn this page\n\n- [Introduction](#introduction)\n- [Quickstart](#quickstart)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Features](#features)",
          images: []
        },
        {
          "url": "https://docs.tavily.com/docs/python-sdk/tavily-search/getting-started",
          "raw_content": "Welcome - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\nExplore our docs\n\nYour journey to state-of-the-art web search starts right here.\n\n[## Quickstart\n\nStart searching with Tavily in minutes](documentation/quickstart)[## API Reference\n\nStart using Tavily’s powerful APIs](documentation/api-reference/endpoint/search)[## API Credits Overview\n\nLearn how to get and manage your Tavily API Credits](documentation/api-credits)[## Rate Limits\n\nLearn about Tavily’s API rate limits for both development and production environments](documentation/rate-limits)[## Python\n\nGet started with our Python SDK, `tavily-python`](sdk/python/quick-start)[## Playground\n\nExplore Tavily’s APIs with our interactive playground](https://app.tavily.com/playground)",
          "images": []
        }
      ]
    }
    ````
  </Accordion>
</AccordionGroup>

## Tavily Map

<Tip>
  Our agent-first mapping endpoint, **Tavily Map** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

You can access Tavily Map in JavaScript through the client's `map` function.

### Parameters

| Parameter            | Type       | Description                                                                                                                                                               | Default |
| :------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ |
| `url` **(required)** | `string`   | The root URL to begin the mapping.                                                                                                                                        | —       |
| `maxDepth`           | `number`   | Max depth of the mapping. Defines how far from the base URL the crawler can explore.                                                                                      | `1`     |
| `maxBreadth`         | `number`   | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                 | `20`    |
| `limit`              | `number`   | Total number of links the crawler will process before stopping.                                                                                                           | `50`    |
| `instructions`       | `string`   | Natural language instructions for the mapper.                                                                                                                             | —       |
| `selectPaths`        | `string[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                   | `[]`    |
| `selectDomains`      | `string[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                 | `[]`    |
| `excludePaths`       | `string[]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/admin/.*"`, `"/private/.*"`).                                                                    | `[]`    |
| `excludeDomains`     | `string[]` | **Regex patterns** to exclude specific domains or subdomains from mapping (e.g., `"^admin\.example\.com$"`).                                                              | `[]`    |
| `allowExternal`      | `boolean`  | Whether to return links from external domains in crawl output.                                                                                                            | `false` |
| `categories`         | `string[]` | Filter URLs using predefined categories. Options: `"Careers"`, `"Blog"`, `"Documentation"`, `"About"`, `"Pricing"`, `"Community"`, `"Developers"`, `"Contact"`, `"Media"` | `[]`    |
| `timeout`            | `number`   | A timeout to be used in requests to the Tavily API.                                                                                                                       | `60`    |

### Response format

The response object you receive will be in the following format:

| Key            | Type       | Description                                             |
| :------------- | :--------- | :------------------------------------------------------ |
| `baseUrl`      | `string`   | The URL you started the crawl from.                     |
| `results`      | `string[]` | A list of URLs that were discovered during the mapping. |
| `responseTime` | `number`   | The crawl response time.                                |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Defining the starting URL of the mapping
    const url = "https://docs.tavily.com";

    // Step 3. Executing the mapping with some guidance parameters
    const response = await client.map(url, { instructions: "Find all pages on the Python SDK" });
      
    // Step 4. Printing the results
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ```javascript
    {
        baseUrl: 'https://docs.tavily.com',
        results:[
          'https://docs.tavily.com/sdk/python/reference',
          'https://docs.tavily.com/sdk/python/quick-start',
          'https://docs.tavily.com/docs/python-sdk/tavily-search/getting-started'
        ],
        responseTime: 8.43
    }
    ```
  </Accordion>
</AccordionGroup>


# Quickstart
Source: https://docs.tavily.com/sdk/python/quick-start

Integrate Tavily's powerful APIs natively in your Python apps.

<Tip>
  Looking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.
</Tip>

## Introduction

The Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily's powerful search features.

<CardGroup cols={2}>
  <Card title="GitHub" icon="github" href="https://github.com/tavily-ai/tavily-python" horizontal>
    `/tavily-ai/tavily-python`

    <img noZoom src="https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social" alt="GitHub Repo stars" />
  </Card>

  <Card title="PyPI" icon="python" href="https://pypi.org/project/tavily-python" horizontal>
    `tavily-python`

    <img noZoom src="https://img.shields.io/pypi/dm/tavily-python" alt="PyPI downloads" />
  </Card>
</CardGroup>

## Quickstart

Get started with our Python SDK in less than 5 minutes!

<Card icon="key" href="https://app.tavily.com" title="Get your free API key" horizontal>
  You get 1,000 free API Credits every month. **No credit card required.**
</Card>

### Installation

You can install the Tavily Python SDK using the following:

```bash
pip install tavily-python
```

### Usage

With Tavily's Python SDK, you can search the web in only 4 lines of code:

```python
from tavily import TavilyClient

tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
response = tavily_client.search("Who is Leo Messi?")

print(response)
```

You can also easily extract content from URLs:

```python
from tavily import TavilyClient

tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
response = tavily_client.extract("https://en.wikipedia.org/wiki/Lionel_Messi")

print(response)
```

Tavily also allows you to perform a smart crawl starting at a given URL.

<Tip>
  Our agent-first crawl is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

```python
from tavily import TavilyClient

tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
response = tavily_client.crawl("https://docs.tavily.com", instructions="Find all pages on the Python SDK")

print(response)
```

These examples are very simple, and you can do so much more with Tavily!

## Features

Our Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.

* The `search` function lets you harness the full power of Tavily Search.
* The `extract` function allows you to easily retrieve web content with Tavily Extract.
* The `crawl` and `map`functions allow you to intelligently traverse websites and extract content.

For more details, head to the [Python SDK Reference](/sdk/python/reference).


# SDK Reference
Source: https://docs.tavily.com/sdk/python/reference

Integrate Tavily's powerful APIs natively in your Python apps.

## Instantiating a client

To interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.

Once you have instantiated a client, call one of our supported methods (detailed below) to access the API.

### Synchronous Client

```python
from tavily import TavilyClient

client = TavilyClient("tvly-YOUR_API_KEY")
```

### Asynchronous Client

```python
from tavily import AsyncTavilyClient

client = AsyncTavilyClient("tvly-YOUR_API_KEY")
```

### Proxies

If you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.

Proxy configuration is available in both the synchronous and asynchronous clients.

```python
from tavily import TavilyClient

proxies = {
  "http": "<your HTTP proxy>",
  "https": "<your HTTPS proxy>",
}

client = TavilyClient("tvly-YOUR_API_KEY", proxies=proxies)
```

Alternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.

## Tavily Search

<Tip>
  **NEW!** Try our interactive [API
  Playground](https://app.tavily.com/playground) to see each parameter in
  action, and generate ready-to-use Python snippets.
</Tip>

You can access Tavily Search in Python through the client's `search` function.

### Parameters

| Parameter                    | Type            | Description                                                                                                                                                                                                                                           | Default     |   |
| :--------------------------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- | - |
| `query` **(required)**       | `str`           | The query to run a search on.                                                                                                                                                                                                                         | —           |   |
| `search_depth`               | `str`           | The depth of the search. It can be `"basic"` or `"advanced"`. `"advanced"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `"basic"` search provides generic content snippets from each source. | `"basic"`   |   |
| `topic`                      | `str`           | The category of the search. Determines which agent will be used. Supported values are `"general"` and `"news"`.                                                                                                                                       | `"general"` |   |
| `days`                       | `int`           | The number of days back from the current date to include in the results. Available only when using the `"news"` topic.                                                                                                                                | `7`         |   |
| `time_range`                 | `str`           | The time range back from the current date. Accepted values include `"day"`, `"week"`, `"month"`, `"year"` or shorthand values `"d"`, `"w"`, `"m"`, `"y"`.                                                                                             | —           |   |
| `max_results`                | `int`           | The maximum number of search results to return. It must be between `0` and `20`.                                                                                                                                                                      | `5`         |   |
| `chunks_per_source`          | `int`           | The number of `content` chunks to retrieve from each source. Each chunk's length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`.                                                         | `3`         |   |
| `include_images`             | `bool`          | Include a list of query-related images in the response.                                                                                                                                                                                               | `False`     |   |
| `include_image_descriptions` | `bool`          | Include a list of query-related images and their descriptions in the response.                                                                                                                                                                        | `False`     |   |
| `include_answer`             | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `"basic"` (or `True`) answer is quick but less detailed; an `"advanced"` answer is more detailed.                                                                       | `False`     |   |
| `include_raw_content`        | `bool`          | Include the cleaned and parsed HTML content of each search result.                                                                                                                                                                                    | `False`     |   |
| `include_domains`            | `list[str]`     | A list of domains to specifically include in the search results.                                                                                                                                                                                      | `[]`        |   |
| `exclude_domains`            | `list[str]`     | A list of domains to specifically exclude from the search results.                                                                                                                                                                                    | `[]`        |   |
| `timeout`                    | `int`           | A timeout to be used in requests to the Tavily API.                                                                                                                                                                                                   | `60`        |   |

### Response format

The response object you receive will be in the following format:

| Key                 | Type                               | Description                                                                                                                                                                             |
| :------------------ | :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `results`           | `list[Result]`                     | A list of sorted search results ranked by relevancy.                                                                                                                                    |
| `query`             | `str`                              | Your search query.                                                                                                                                                                      |
| `response_time`     | `float`                            | Your search result response time.                                                                                                                                                       |
| `answer` (optional) | `str`                              | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `include_answer` is set to `True`.                                     |
| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |

### Results

| `Key`                       | `Type`  | Description                                                                                                                                             |
| :-------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                     | `str`   | The title of the search result.                                                                                                                         |
| `url`                       | `str`   | The URL of the search result.                                                                                                                           |
| `content`                   | `str`   | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |
| `score`                     | `float` | The relevance score of the search result.                                                                                                               |
| `raw_content` (optional)    | `str`   | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`.                                      |
| `published_date` (optional) | `str`   | The publication date of the source. This is only available if the search `topic` is set to `"news"`.                                                    |

#### Image Results

If `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:

| Key           | Type     | Description                                |
| :------------ | :------- | :----------------------------------------- |
| `url`         | `string` | The URL of the image.                      |
| `description` | `string` | An LLM-generated description of the image. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Executing the search request
    response = tavily_client.search("Who is Leo Messi?", include_images=True, include_image_descriptions=True)

    # Step 3. Printing the search results
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ```python
    {
      "query": "Who is Leo Messi?",
      "images": [
        {
          "url": "Image 1 URL",
          "description": "Image 1 Description",
        },
        {
          "url": "Image 2 URL",
          "description": "Image 2 Description",
        },
        {
          "url": "Image 3 URL",
          "description": "Image 3 Description",
        },
        {
          "url": "Image 4 URL",
          "description": "Image 4 Description",
        },
        {
          "url": "Image 5 URL",
          "description": "Image 5 Description",
        }
      ],
      "results": [
        {
          "title": "Source 1 Title",
          "url": "Source 1 URL",
          "content": "Source 1 Content",
          "score": 0.99
        },
        {
          "title": "Source 2 Title",
          "url": "Source 2 URL",
          "content": "Source 2 Content",
          "score": 0.97
        }
      ],
      "response_time": 1.09
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Extract

You can access Tavily Extract in Python through the client's `extract` function.

### Parameters

| Parameter             | Type                 | Description                                                                                                                                                                                                                                                                                                                                                                 | Default   |   |
| :-------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- | - |
| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs.                                                                                                                                                                                                                                                                        | —         |   |
| `include_images`      | `bool`               | Include a list of images extracted from the URLs in the response.                                                                                                                                                                                                                                                                                                           | `False`   |   |
| `extract_depth`       | `str`                | The depth of the extraction process. You may experience higher latency with `"advanced"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `"basic"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `"basic"` |   |
| `timeout`             | `int`                | A timeout to be used in requests to the Tavily API.                                                                                                                                                                                                                                                                                                                         | `60`      |   |

### Response format

The response object you receive will be in the following format:

| Key              | Type                     | Description                                 |
| :--------------- | :----------------------- | :------------------------------------------ |
| `results`        | `list[SuccessfulResult]` | A list of extracted content.                |
| `failed_results` | `list[FailedResult]`     | A list of URLs that could not be processed. |
| `response_time`  | `float`                  | The search result response time.            |

#### Successful Results

Each successful result in the `results` list will be in the following `SuccessfulResult` format:

| Key                 | Type        | Description                                                                                  |
| :------------------ | :---------- | :------------------------------------------------------------------------------------------- |
| `url`               | `str`       | The URL of the webpage.                                                                      |
| `raw_content`       | `str`       | The raw content extracted.                                                                   |
| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |

#### Failed Results

Each failed result in the `results` list will be in the following `FailedResult` format:

| Key     | Type  | Description                                                |
| :------ | :---- | :--------------------------------------------------------- |
| `url`   | `str` | The URL that failed.                                       |
| `error` | `str` | An error message describing why it could not be processed. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Defining the list of URLs to extract content from
    urls = [
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "https://en.wikipedia.org/wiki/Machine_learning",
        "https://en.wikipedia.org/wiki/Data_science",
    ]

    # Step 3. Executing the extract request
    response = tavily_client.extract(urls=urls, include_images=True)

    # Step 4. Printing the extracted raw content
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ```python
    {
        "results": [
            {
                "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
                "raw_content": "URL 1 raw content",
                "images": [
                    "Image 1 URL",
                    "Image 2 URL"
                ]
            },
            {
                "url": "https://en.wikipedia.org/wiki/Machine_learning",
                "raw_content": "URL 2 raw content",
                "images": [
                    "Image 3 URL",
                    "Image 4 URL"
                ]
            },
            {
                "url": "https://en.wikipedia.org/wiki/Data_science",
                "raw_content": "URL 3 raw content",
                "images": [
                    "Image 5 URL",
                    "Image 6 URL"
                ]
            }
        ],
        "failed_results": [],
        "response_time": 1.23
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Crawl

<Tip>
  Our agent-first crawl endpoint, **Tavily Crawl** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

You can access Tavily Crawl in Python through the `crawl` function.

### Parameters

| Parameter            | Type        | Description                                                                                                                                                               | Default   |
| :------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------- |
| `url` **(required)** | `str`       | The root URL to begin the crawl.                                                                                                                                          | —         |
| `max_depth`          | `int`       | Max depth of the crawl. Defines how far from the base URL the crawler can explore.                                                                                        | `1`       |
| `max_breadth`        | `int`       | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                 | `20`      |
| `limit`              | `int`       | Total number of links the crawler will process before stopping.                                                                                                           | `50`      |
| `instructions`       | `str`       | Natural language instructions for the crawler.                                                                                                                            | —         |
| `select_paths`       | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                   | `None`    |
| `select_domains`     | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                 | `None`    |
| `exclude_paths`      | `list[str]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/private/.*"`, `"/admin/.*"`).                                                                    | `None`    |
| `exclude_domains`    | `list[str]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `"^private\.example\.com$"`).                                                           | `None`    |
| `allow_external`     | `bool`      | Whether to allow following links that go to external domains.                                                                                                             | `False`   |
| `include_images`     | `bool`      | Whether to extract image URLs from the crawled pages.                                                                                                                     | `False`   |
| `categories`         | `list[str]` | Filter URLs using predefined categories. Options: `"Careers"`, `"Blog"`, `"Documentation"`, `"About"`, `"Pricing"`, `"Community"`, `"Developers"`, `"Contact"`, `"Media"` | `None`    |
| `extract_depth`      | `str`       | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `"basic"` or `"advanced"`.         | `"basic"` |

### Response format

The response object you receive will be in the following format:

| Key             | Type           | Description                         |
| :-------------- | :------------- | :---------------------------------- |
| `base_url`      | `str`          | The URL you started the crawl from. |
| `results`       | `list[Result]` | A list of crawled pages.            |
| `response_time` | `float`        | The crawl response time.            |

#### Results

Each successful result in the `results` list will be in the following `Result` format:

| Key           | Type        | Description                         |
| :------------ | :---------- | :---------------------------------- |
| `url`         | `str`       | The URL of the webpage.             |
| `raw_content` | `str`       | The raw content extracted.          |
| `images`      | `list[str]` | Image URLs extracted from the page. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Defining the starting URL of the crawl
    url = "https://docs.tavily.com"

    # Step 3. Executing the crawl with some guidance parameters
    response = tavily_client.crawl(url, instructions="Find information on the Python SDK")

    # Step 4. Printing the crawled results
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ````python
    {
        "base_url": "https://docs.tavily.com",
        "results": [
            {
                "url": "https://docs.tavily.com/sdk/python/reference",
                "raw_content": "SDK Reference - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\nPython\n\nSDK Reference\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# SDK Reference\n\nIntegrate Tavily\u2019s powerful APIs natively in your Python apps.\n\n## [\u200b](#instantiating-a-client) Instantiating a client\n\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\n\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\n\n### [\u200b](#synchronous-client) Synchronous Client\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [\u200b](#asynchronous-client) Asynchronous Client\n\nCopy\n\n```\nfrom tavily import AsyncTavilyClient\n\nclient = AsyncTavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [\u200b](#proxies) Proxies\n\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\n\nProxy configuration is available in both the synchronous and asynchronous clients.\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nproxies = {\n  \"http\": \"<your HTTP proxy>\",\n  \"https\": \"<your HTTPS proxy>\",\n}\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\", proxies=proxies)\n\n```\n\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\n\n## [\u200b](#tavily-search) Tavily Search\n\n**NEW!** Try our interactive [API\nPlayground](https://app.tavily.com/playground) to see each parameter in\naction, and generate ready-to-use Python snippets.\n\nYou can access Tavily Search in Python through the client\u2019s `search` function.\n\n### [\u200b](#parameters) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `query` **(required)** | `str` | The query to run a search on. |  |  |\n| `search_depth` | `str` | The depth of the search. It can be `\"basic\"` or `\"advanced\"`. `\"advanced\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\"basic\"` search provides generic content snippets from each source. | `\"basic\"` |  |\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\"general\"` and `\"news\"`. | `\"general\"` |  |\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\"news\"` topic. | `7` |  |\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\"day\"`, `\"week\"`, `\"month\"`, `\"year\"` or shorthand values `\"d\"`, `\"w\"`, `\"m\"`, `\"y\"`. |  |  |\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk\u2019s length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\"basic\"` (or `True`) answer is quick but less detailed; an `\"advanced\"` answer is more detailed. | `False` |  |\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. | `[]` |  |\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. | `[]` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [\u200b](#response-format) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\n| `query` | `str` | Your search query. |\n| `response_time` | `float` | Your search result response time. |\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily\u2019s search results. This is only available if `include_answer` is set to `True`. |\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\n\n### [\u200b](#results) Results\n\n| `Key` | `Type` | Description |\n| --- | --- | --- |\n| `title` | `str` | The title of the search result. |\n| `url` | `str` | The URL of the search result. |\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\n| `score` | `float` | The relevance score of the search result. |\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\"news\"`. |\n\n#### [\u200b](#image-results) Image Results\n\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `string` | The URL of the image. |\n| `description` | `string` | An LLM-generated description of the image. |\n\n### [\u200b](#example) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Executing the search request\nresponse = tavily_client.search(\"Who is Leo Messi?\", include_images=True, include_image_descriptions=True)\n\n# Step 3. Printing the search results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n  \"query\": \"Who is Leo Messi?\",\n  \"images\": [\n    {\n      \"url\": \"Image 1 URL\",\n      \"description\": \"Image 1 Description\",\n    },\n    {\n      \"url\": \"Image 2 URL\",\n      \"description\": \"Image 2 Description\",\n    },\n    {\n      \"url\": \"Image 3 URL\",\n      \"description\": \"Image 3 Description\",\n    },\n    {\n      \"url\": \"Image 4 URL\",\n      \"description\": \"Image 4 Description\",\n    },\n    {\n      \"url\": \"Image 5 URL\",\n      \"description\": \"Image 5 Description\",\n    }\n  ],\n  \"results\": [\n    {\n      \"title\": \"Source 1 Title\",\n      \"url\": \"Source 1 URL\",\n      \"content\": \"Source 1 Content\",\n      \"score\": 0.99\n    },\n    {\n      \"title\": \"Source 2 Title\",\n      \"url\": \"Source 2 URL\",\n      \"content\": \"Source 2 Content\",\n      \"score\": 0.97\n    }\n  ],\n  \"response_time\": 1.09\n}\n\n```\n\n## [\u200b](#tavily-extract) Tavily Extract\n\nYou can access Tavily Extract in Python through the client\u2019s `extract` function.\n\n### [\u200b](#parameters-2) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. |  |  |\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\"advanced\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\"basic\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\"basic\"` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [\u200b](#response-format-2) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\n| `response_time` | `float` | The search result response time. |\n\n#### [\u200b](#successful-results) Successful Results\n\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\n\n#### [\u200b](#failed-results) Failed Results\n\nEach failed result in the `results` list will be in the following `FailedResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL that failed. |\n| `error` | `str` | An error message describing why it could not be processed. |\n\n### [\u200b](#example-2) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the list of URLs to extract content from\nurls = [\n    \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n    \"https://en.wikipedia.org/wiki/Machine_learning\",\n    \"https://en.wikipedia.org/wiki/Data_science\",\n]\n\n# Step 3. Executing the extract request\nresponse = tavily_client.extract(urls=urls, include_images=True)\n\n# Step 4. Printing the extracted raw content\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    \"results\": [\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n            \"raw_content\": \"URL 1 raw content\",\n            \"images\": [\n                \"Image 1 URL\",\n                \"Image 2 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Machine_learning\",\n            \"raw_content\": \"URL 2 raw content\",\n            \"images\": [\n                \"Image 3 URL\",\n                \"Image 4 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Data_science\",\n            \"raw_content\": \"URL 3 raw content\",\n            \"images\": [\n                \"Image 5 URL\",\n                \"Image 6 URL\"\n            ]\n        }\n    ],\n    \"failed_results\": [],\n    \"response_time\": 1.23\n}\n\n```\n\n## [\u200b](#tavily-crawl) Tavily Crawl\n\nOur agent-first crawl endpoint, **Tavily Crawl** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nYou can access Tavily Crawl in Python through the `crawl` function.\n\n### [\u200b](#parameters-3) Parameters\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the crawl. | \u2014 |\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler. | \u2014 |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `exclude_paths` | `list[str]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `\"/private/.*\"`, `\"/admin/.*\"`). | `None` |\n| `exclude_domains` | `list[str]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `\"^private\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `categories` | `list[str]` | Filter URLs using predefined categories. Options: `\"Careers\"`, `\"Blog\"`, `\"Documentation\"`, `\"About\"`, `\"Pricing\"`, `\"Community\"`, `\"Developers\"`, `\"Contact\"`, `\"Media\"` | `None` |\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\"basic\"` or `\"advanced\"`. | `\"basic\"` |\n\n### [\u200b](#response-format-3) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `base_url` | `str` | The URL you started the crawl from. |\n| `results` | `list[Result]` | A list of crawled pages. |\n| `response_time` | `float` | The crawl response time. |\n\n#### [\u200b](#results-2) Results\n\nEach successful result in the `results` list will be in the following `Result` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n\n### [\u200b](#example-3) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the starting URL of the crawl\nurl = \"https://docs.tavily.com\"\n\n# Step 3. Executing the crawl with some guidance parameters\nresponse = tavily_client.crawl(url, query=\"Python SDK\")\n\n# Step 4. Printing the crawled results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    'base_url': 'https://docs.tavily.com',\n    'results': [\n        {\n            'url': 'https://docs.tavily.com/sdk/python/quick-start',\n            'raw_content': 'Quickstart - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nQuickstart\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\n\\n- [API Playground](https://app.tavily.com/playground)\\n- [Community](https://community.tavily.com)\\n- [Blog](https://blog.tavily.com)\\n\\n##### Python\\n\\n- [Quickstart](/sdk/python/quick-start)\\n- [SDK Reference](/sdk/python/reference)\\n\\n##### JavaScript\\n\\n- [Quickstart](/sdk/javascript/quick-start)\\n- [SDK Reference](/sdk/javascript/reference)\\n\\nPython\\n\\n# Quickstart\\n\\nIntegrate Tavily\\'s powerful APIs natively in your Python apps.\\n\\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\\n\\n## [\\u200b](#introduction) Introduction\\n\\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily\\'s powerful search features.\\n\\n[## GitHub\\n\\n`/tavily-ai/tavily-python`\\n\\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\\n\\n`tavily-python`\\n\\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\\n\\n## [\\u200b](#quickstart) Quickstart\\n\\nGet started with our Python SDK in less than 5 minutes!\\n\\n[## Get your free API key\\n\\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\\n\\n### [\\u200b](#installation) Installation\\n\\nYou can install the Tavily Python SDK using the following:\\n\\nCopy\\n\\n```\\npip install tavily-python\\n\\n```\\n\\n### [\\u200b](#usage) Usage\\n\\nWith Tavily\\'s Python SDK, you can search the web in only 4 lines of code:\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\\nresponse = tavily_client.search(\"Who is Leo Messi?\")\\n\\nprint(response)\\n\\n```\\n\\nYou can also easily extract content from URLs:\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\\nresponse = tavily_client.extract(\"https://en.wikipedia.org/wiki/Lionel_Messi\")\\n\\nprint(response)\\n\\n```\\n\\nThese examples are very simple, and you can do so much more with Tavily!\\n\\n## [\\u200b](#features) Features\\n\\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\\n\\n- The `search` function lets you harness the full power of Tavily Search.\\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\\n\\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\\n\\n[SDK Reference](/sdk/python/reference)\\n\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\n\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\n\\nOn this page\\n\\n- [Introduction](#introduction)\\n- [Quickstart](#quickstart)\\n- [Installation](#installation)\\n- [Usage](#usage)\\n- [Features](#features)'\n        }\n    ],\n    'response_time': 9.14\n}\n\n```\n\n## [\u200b](#tavily-map) Tavily Map\n\nOur agent-first mapping endpoint, **Tavily Map** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nTavily Map allows you to obtain a sitemap starting from a base URL.\n\nYou can access Tavily Map in Python through the `map` function.\n\n### [\u200b](#parameters-4) Parameters\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the mapping. | \u2014 |\n| `max_depth` | `int` | Max depth of the mapping. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler | \u2014 |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `exclude_paths` | `list[str]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `\"/private/.*\"`, `\"/admin/.*\"`). | `None` |\n| `exclude_domains` | `list[str]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `\"^private\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `categories` | `list[str]` | Filter URLs using predefined categories. Options: `\"Careers\"`, `\"Blog\"`, `\"Documentation\"`, `\"About\"`, `\"Pricing\"`, `\"Community\"`, `\"Developers\"`, `\"Contact\"`, `\"Media\"` | `None` |\n\n### [\u200b](#response-format-4) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `base_url` | `str` | The URL you started the mapping from. |\n| `results` | `list[str]` | A list of URLs that were discovered during the mapping. |\n| `response_time` | `float` | The mapping response time. |\n\n### [\u200b](#example-4) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the starting URL of the mapping\nurl = \"https://docs.tavily.com\"\n\n# Step 3. Executing the mapping with some guidance parameters\nresponse = tavily_client.mapping(url, query=\"JavaScript\")\n\n# Step 4. Printing the results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    'base_url': 'https://docs.tavily.com',\n    'results': [\n      'https://docs.tavily.com/sdk/javascript/quick-start',\n      'https://docs.tavily.com/sdk/javascript/reference',\n    ],\n    'response_time': 8.43\n}\n\n```\n\n## [\u200b](#tavily-hybrid-rag) Tavily Hybrid RAG\n\nTavily Hybrid RAG is an extension of the Tavily Search API built to retrieve relevant data from both the web and an existing database collection. This way, a RAG agent can combine web sources and locally available data to perform its tasks. Additionally, data queried from the web that is not yet in the database can optionally be inserted into it. This will allow similar searches in the future to be answered faster, without the need to query the web again.\n\n### [\u200b](#parameters-5) Parameters\n\nThe TavilyHybridClient class is your gateway to Tavily Hybrid RAG. There are a few important parameters to keep in mind when you are instantiating a Tavily Hybrid Client.\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `api_key` | `str` | Your Tavily API Key |  |\n| `db_provider` | `str` | Your database provider. Currently, only `\"mongodb\"` is supported. |  |\n| `collection` | `str` | A reference to the MongoDB collection that will be used for local search. |  |\n| `embeddings_field` (optional) | `str` | The name of the field that stores the embeddings in the specified collection. This field MUST be the same one used in the specified index. This will also be used when inserting web search results in the database using our default function. | `\"embeddings\"` |\n| `content_field` (optional) | `str` | The name of the field that stores the text content in the specified collection. This will also be used when inserting web search results in the database using our default function. | `\"content\"` |\n| `embedding_function` (optional) | `function` | A custom embedding function (if you want to use one). The function must take in a `list[str]` corresponding to the list of strings to be embedded, as well as an additional string defining the type of document. It must return a `list[list[float]]`, one embedding per input string. If no function is provided, defaults to Cohere\u2019s Embed. Keep in mind that you shouldn\u2019t mix different embeddings in the same database collection. |  |\n| `ranking_function` (optional) | `function` | A custom ranking function (if you want to use one). If no function is provided, defaults to Cohere\u2019s Rerank. It should return an ordered `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. The function MUST accept the following parameters: `query`: `str` - This is the query you are executing. When your ranking function is called during Hybrid RAG, the query parameter of your search call (more details below) will be passed as query. `documents`:`List[Dict]`: - This is the list of documents that are returned by your Hybrid RAG call and that you want to sort. Each document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. `top_n`: `int` - This is the number of results you want to return after ranking. When your ranking function is called during Hybrid RAG, the max\\_results value will be passed as `top_n`. |  |\n\n### [\u200b](#methods) Methods\n\n`search`(query, max\\_results=10, max\\_local=None, max\\_foreign=None, save\\_foreign=False, \\*\\*kwargs)\n\nPerforms a Tavily Hybrid RAG query and returns the retrieved documents as a `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have three properties - `content` (str), `score` (float), and `origin`, which is either `local` or `foreign`.\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `query` | `str` | The query you want to search for. |  |  |\n| `max_results` | `int` | The maximum number of total search results to return. | 10 |  |\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\n| `max_foreign` | `int` | The maximum number of web search results to return. | `None`, which defaults to `max_results`. |  |\n| `save_foreign` | `Union[bool, function]` | Save documents from the web search in the local database. If `True` is passed, our default saving function (which only saves the content `str` and the embedding `list[float]` will be used.) If `False` is passed, no web search result documents will be saved in the local database. If a function is passed, that function MUST take in a `dict` as a parameter, and return another `dict`. The input `dict` contains all properties of the returned Tavily result object. The output dict is the final document that will be inserted in the database. You are free to add to it any fields that are supported by the database, as well as remove any of the default ones. If this function returns `None`, the document will not be saved in the database. |  |  |\n\nAdditional parameters can be provided as keyword arguments (detailed below). The keyword arguments supported by this method are: `search_depth`, `topic`, `include_raw_content`, `include_domains`,`exclude_domains`.\n\n### [\u200b](#setup) Setup\n\n#### [\u200b](#mongodb-setup) MongoDB setup\n\nYou will need to have a MongoDB collection with a vector search index. You can follow the [MongoDB Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/) to learn how to set this up.\n\n#### [\u200b](#cohere-api-key) Cohere API Key\n\nBy default, embedding and ranking use the Cohere API, our recommended option. Unless you want to provide a custom embedding and ranking function, you\u2019ll need to get an API key from [Cohere](https://cohere.com/) and set it as an environment variable named `CO_API_KEY`\n\nIf you decide to stick with Cohere, please note that you\u2019ll need to install the Cohere Python package as well:\n\nCopy\n\n```\npip install cohere\n\n```\n\n#### [\u200b](#tavily-hybrid-rag-client-setup) Tavily Hybrid RAG Client setup\n\nOnce you are done setting up your database, you\u2019ll need to create a MongoDB Client as well as a Tavily Hybrid RAG Client.\nA minimal setup would look like this:\n\nCopy\n\n```\nfrom pymongo import MongoClient\nfrom tavily import TavilyHybridClient\n\ndb = MongoClient(\"mongodb+srv://YOUR_MONGO_URI\")[\"YOUR_DB\"]\n\nhybrid_rag = TavilyHybridClient(\n    api_key=\"tvly-YOUR_API_KEY\",\n    db_provider=\"mongodb\",\n    collection=db.get_collection(\"YOUR_COLLECTION\"),\n    index=\"YOUR_VECTOR_SEARCH_INDEX\",\n    embeddings_field=\"YOUR_EMBEDDINGS_FIELD\",\n    content_field=\"YOUR_CONTENT_FIELD\"\n)\n\n```\n\n### [\u200b](#usage) Usage\n\nOnce you create the proper clients, you can easily start searching. A few simple examples are shown below. They assume you\u2019ve followed earlier steps. You can use most of the Tavily Search parameters with Tavily Hybrid RAG as well.\n\n#### [\u200b](#simple-tavily-hybrid-rag-example) Simple Tavily Hybrid RAG example\n\nThis example will look for context about Leo Messi on the web and in the local database.\nHere, we get 5 sources, both from our database and from the web, but we want to exclude unwanted-domain.com from our web search results:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\", max_results=5, exclude_domains=['unwanted-domain.com'])\n\n```\n\nHere, we want to prioritize the number of local sources, so we will get 2 foreign (web) sources, and 5 sources from our database:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\",  max_local=5, max_foreign=2)\n\n```\n\nNote: The sum of `max_local` and `max_foreign` can exceed `max_results`, but only the top `max_results` results will be returned.\n\n#### [\u200b](#adding-retrieved-data-to-the-database) Adding retrieved data to the database\n\nIf you want to add the retrieved data to the database, you can do so by setting the save\\_foreign parameter to True:\n\nCopy\n\n```\nresults = hybrid_rag.search(\"Who is Leo Messi?\", save_foreign=True)\n\n```\n\nThis will use our default saving function, which stores the content and its embedding.\n\n### [\u200b](#examples) Examples\n\n#### [\u200b](#sample-1%3A-using-a-custom-saving-function) Sample 1: Using a custom saving function\n\nYou might want to add some extra properties to documents you\u2019re inserting or even discard some of them based on custom criteria. This can be done by passing a function to the save\\_foreign parameter:\n\nCopy\n\n```\ndef save_document(document):\n    if document['score'] < 0.5:\n        return None # Do not save documents with low scores\n\n    return {\n        'content': document['content'],\n\n         # Save the title and URL in the database\n        'site_title': document['title'],\n        'site_url': document['url'],\n\n        # Add a new field\n        'added_at': datetime.now()\n    }\n\nresults = hybrid_rag.search(\"Who is Leo Messi?\", save_foreign=save_document)\n\n```\n\n#### [\u200b](#sample-2%3A-using-a-custom-embedding-function) Sample 2: Using a custom embedding function\n\nBy default, we use [Cohere](https://cohere.com/) for our embeddings. If you want to use your own embeddings, can pass a custom embedding function to the TavilyHybridClient:\n\nCopy\n\n```\ndef my_embedding_function(texts, doc_type): # doc_type will be either 'search_query' or 'search_document'\n    return my_embedding_model.encode(texts)\n\nhybrid_rag = TavilyHybridClient(\n    # ...\n    embedding_function=my_embedding_function\n)\n\n```\n\n#### [\u200b](#sample-3%3A-using-a-custom-ranking-function) Sample 3: Using a custom ranking function\n\nCohere\u2019s [rerank](https://cohere.com/rerank) model is used by default, but you can pass your own function to the ranking\\_function parameter:\n\nCopy\n\n```\ndef my_ranking_function(query, documents, top_n):\n    return my_ranking_model.rank(query, documents, top_n)\n\nhybrid_rag = TavilyHybridClient(\n    # ...\n    ranking_function=my_ranking_function\n)\n\n```\n\n[Quickstart](/sdk/python/quick-start)[Quickstart](/sdk/javascript/quick-start)\n\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\n\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\n\nOn this page\n\n- [Instantiating a client](#instantiating-a-client)\n- [Synchronous Client](#synchronous-client)\n- [Asynchronous Client](#asynchronous-client)\n- [Proxies](#proxies)\n- [Tavily Search](#tavily-search)\n- [Parameters](#parameters)\n- [Response format](#response-format)\n- [Results](#results)\n- [Image Results](#image-results)\n- [Example](#example)\n- [Tavily Extract](#tavily-extract)\n- [Parameters](#parameters-2)\n- [Response format](#response-format-2)\n- [Successful Results](#successful-results)\n- [Failed Results](#failed-results)\n- [Example](#example-2)\n- [Tavily Crawl](#tavily-crawl)\n- [Parameters](#parameters-3)\n- [Response format](#response-format-3)\n- [Results](#results-2)\n- [Example](#example-3)\n- [Tavily Map](#tavily-map)\n- [Parameters](#parameters-4)\n- [Response format](#response-format-4)\n- [Example](#example-4)\n- [Tavily Hybrid RAG](#tavily-hybrid-rag)\n- [Parameters](#parameters-5)\n- [Methods](#methods)\n- [Setup](#setup)\n- [MongoDB setup](#mongodb-setup)\n- [Cohere API Key](#cohere-api-key)\n- [Tavily Hybrid RAG Client setup](#tavily-hybrid-rag-client-setup)\n- [Usage](#usage)\n- [Simple Tavily Hybrid RAG example](#simple-tavily-hybrid-rag-example)\n- [Adding retrieved data to the database](#adding-retrieved-data-to-the-database)\n- [Examples](#examples)\n- [Sample 1: Using a custom saving function](#sample-1%3A-using-a-custom-saving-function)\n- [Sample 2: Using a custom embedding function](#sample-2%3A-using-a-custom-embedding-function)\n- [Sample 3: Using a custom ranking function](#sample-3%3A-using-a-custom-ranking-function)",
                "images": []
            },
            {
                "url": "https://docs.tavily.com/sdk/python/quick-start",
                "raw_content": "Quickstart - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\nPython\n\nQuickstart\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# Quickstart\n\nIntegrate Tavily\u2019s powerful APIs natively in your Python apps.\n\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\n\n## [\u200b](#introduction) Introduction\n\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily\u2019s powerful search features.\n\n[## GitHub\n\n`/tavily-ai/tavily-python`\n\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\n\n`tavily-python`\n\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\n\n## [\u200b](#quickstart) Quickstart\n\nGet started with our Python SDK in less than 5 minutes!\n\n[## Get your free API key\n\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\n\n### [\u200b](#installation) Installation\n\nYou can install the Tavily Python SDK using the following:\n\nCopy\n\n```\npip install tavily-python\n\n```\n\n### [\u200b](#usage) Usage\n\nWith Tavily\u2019s Python SDK, you can search the web in only 4 lines of code:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\nresponse = tavily_client.search(\"Who is Leo Messi?\")\n\nprint(response)\n\n```\n\nYou can also easily extract content from URLs:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\nresponse = tavily_client.extract(\"https://en.wikipedia.org/wiki/Lionel_Messi\")\n\nprint(response)\n\n```\n\nTavily also allows you to perform a smart crawl starting at a given URL.\n\nOur agent-first crawl is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\nresponse = tavily_client.crawl(\"https://docs.tavily.com\", query=\"Python SDK\")\n\nprint(response)\n\n```\n\nThese examples are very simple, and you can do so much more with Tavily!\n\n## [\u200b](#features) Features\n\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\n\n- The `search` function lets you harness the full power of Tavily Search.\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\n\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\n\n[SDK Reference](/sdk/python/reference)\n\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\n\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\n\nOn this page\n\n- [Introduction](#introduction)\n- [Quickstart](#quickstart)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Features](#features)",
                "images": []
            }
        ],
        "response_time": 9.07
    }
    ````
  </Accordion>
</AccordionGroup>

## Tavily Map

<Tip>
  Our agent-first mapping endpoint, **Tavily Map** is currently in **invite-only beta**. If you are interested in joining the beta, please email [support@tavily.com](mailto:support@tavily.com).
</Tip>

Tavily Map allows you to obtain a sitemap starting from a base URL.

You can access Tavily Map in Python through the `map` function.

### Parameters

| Parameter            | Type        | Description                                                                                                                                                               | Default |
| :------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ |
| `url` **(required)** | `str`       | The root URL to begin the mapping.                                                                                                                                        | —       |
| `max_depth`          | `int`       | Max depth of the mapping. Defines how far from the base URL the crawler can explore.                                                                                      | `1`     |
| `max_breadth`        | `int`       | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                 | `20`    |
| `limit`              | `int`       | Total number of links the crawler will process before stopping.                                                                                                           | `50`    |
| `instructions`       | `str`       | Natural language instructions for the crawler                                                                                                                             | —       |
| `select_paths`       | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                   | `None`  |
| `select_domains`     | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                 | `None`  |
| `exclude_paths`      | `list[str]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/private/.*"`, `"/admin/.*"`).                                                                    | `None`  |
| `exclude_domains`    | `list[str]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `"^private\.example\.com$"`).                                                           | `None`  |
| `allow_external`     | `bool`      | Whether to allow following links that go to external domains.                                                                                                             | `False` |
| `categories`         | `list[str]` | Filter URLs using predefined categories. Options: `"Careers"`, `"Blog"`, `"Documentation"`, `"About"`, `"Pricing"`, `"Community"`, `"Developers"`, `"Contact"`, `"Media"` | `None`  |

### Response format

The response object you receive will be in the following format:

| Key             | Type        | Description                                             |
| :-------------- | :---------- | :------------------------------------------------------ |
| `base_url`      | `str`       | The URL you started the mapping from.                   |
| `results`       | `list[str]` | A list of URLs that were discovered during the mapping. |
| `response_time` | `float`     | The mapping response time.                              |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Defining the starting URL of the mapping
    url = "https://docs.tavily.com"

    # Step 3. Executing the mapping with some guidance parameters
    response = tavily_client.mapping(url, instructions="Find information on the JavaScript SDK")

    # Step 4. Printing the results
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ```python
    {
        'base_url': 'https://docs.tavily.com',
        'results': [
          'https://docs.tavily.com/sdk/javascript/quick-start',
          'https://docs.tavily.com/sdk/javascript/reference',
        ],
        'response_time': 8.43
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Hybrid RAG

Tavily Hybrid RAG is an extension of the Tavily Search API built to retrieve relevant data from both the web and an existing database collection. This way, a RAG agent can combine web sources and locally available data to perform its tasks. Additionally, data queried from the web that is not yet in the database can optionally be inserted into it. This will allow similar searches in the future to be answered faster, without the need to query the web again.

### Parameters

The TavilyHybridClient class is your gateway to Tavily Hybrid RAG. There are a few important parameters to keep in mind when you are instantiating a Tavily Hybrid Client.

| Parameter                       | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Default        |
| :------------------------------ | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| `api_key`                       | `str`      | Your Tavily API Key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                |
| `db_provider`                   | `str`      | Your database provider. Currently, only `"mongodb"` is supported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                |
| `collection`                    | `str`      | A reference to the MongoDB collection that will be used for local search.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                |
| `embeddings_field` (optional)   | `str`      | The name of the field that stores the embeddings in the specified collection. This field MUST be the same one used in the specified index. This will also be used when inserting web search results in the database using our default function.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `"embeddings"` |
| `content_field` (optional)      | `str`      | The name of the field that stores the text content in the specified collection. This will also be used when inserting web search results in the database using our default function.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `"content"`    |
| `embedding_function` (optional) | `function` | A custom embedding function (if you want to use one). The function must take in a `list[str]` corresponding to the list of strings to be embedded, as well as an additional string defining the type of document. It must return a `list[list[float]]`, one embedding per input string. If no function is provided, defaults to Cohere's Embed. Keep in mind that you shouldn't mix different embeddings in the same database collection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                |
| `ranking_function` (optional)   | `function` | A custom ranking function (if you want to use one). If no function is provided, defaults to Cohere's Rerank. It should return an ordered `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. The function MUST accept the following parameters: `query`: `str` - This is the query you are executing. When your ranking function is called during Hybrid RAG, the query parameter of your search call (more details below) will be passed as query. `documents`:`List[Dict]`: - This is the list of documents that are returned by your Hybrid RAG call and that you want to sort. Each document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. `top_n`: `int` - This is the number of results you want to return after ranking. When your ranking function is called during Hybrid RAG, the max\_results value will be passed as `top_n`. |                |

### Methods

`search`(query, max\_results=10, max\_local=None, max\_foreign=None, save\_foreign=False, \*\*kwargs)

Performs a Tavily Hybrid RAG query and returns the retrieved documents as a `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have three properties - `content` (str), `score` (float), and `origin`, which is either `local` or `foreign`.

| Parameter      | Type                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default                                  |   |
| :------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- | - |
| `query`        | `str`                   | The query you want to search for.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                        |   |
| `max_results`  | `int`                   | The maximum number of total search results to return.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 10                                       |   |
| `max_local`    | `int`                   | The maximum number of local search results to return.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `None`, which defaults to `max_results`. |   |
| `max_local`    | `int`                   | The maximum number of local search results to return.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `None`, which defaults to `max_results`. |   |
| `max_foreign`  | `int`                   | The maximum number of web search results to return.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `None`, which defaults to `max_results`. |   |
| `save_foreign` | `Union[bool, function]` | Save documents from the web search in the local database. If `True` is passed, our default saving function (which only saves the content `str` and the embedding `list[float]` will be used.) If `False` is passed, no web search result documents will be saved in the local database. If a function is passed, that function MUST take in a `dict` as a parameter, and return another `dict`. The input `dict` contains all properties of the returned Tavily result object. The output dict is the final document that will be inserted in the database. You are free to add to it any fields that are supported by the database, as well as remove any of the default ones. If this function returns `None`, the document will not be saved in the database. | —                                        |   |

Additional parameters can be provided as keyword arguments (detailed below). The keyword arguments supported by this method are: `search_depth`, `topic`, `include_raw_content`, `include_domains`,`exclude_domains`.

### Setup

#### MongoDB setup

You will need to have a MongoDB collection with a vector search index. You can follow the [MongoDB Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/) to learn how to set this up.

#### Cohere API Key

By default, embedding and ranking use the Cohere API, our recommended option. Unless you want to provide a custom embedding and ranking function, you'll need to get an API key from [Cohere](https://cohere.com/) and set it as an environment variable named `CO_API_KEY`

If you decide to stick with Cohere, please note that you'll need to install the Cohere Python package as well:

```bash
pip install cohere
```

#### Tavily Hybrid RAG Client setup

Once you are done setting up your database, you'll need to create a MongoDB Client as well as a Tavily Hybrid RAG Client.
A minimal setup would look like this:

```python
from pymongo import MongoClient
from tavily import TavilyHybridClient

db = MongoClient("mongodb+srv://YOUR_MONGO_URI")["YOUR_DB"]

hybrid_rag = TavilyHybridClient(
    api_key="tvly-YOUR_API_KEY",
    db_provider="mongodb",
    collection=db.get_collection("YOUR_COLLECTION"),
    index="YOUR_VECTOR_SEARCH_INDEX",
    embeddings_field="YOUR_EMBEDDINGS_FIELD",
    content_field="YOUR_CONTENT_FIELD"
)
```

### Usage

Once you create the proper clients, you can easily start searching. A few simple examples are shown below. They assume you've followed earlier steps. You can use most of the Tavily Search parameters with Tavily Hybrid RAG as well.

#### Simple Tavily Hybrid RAG example

This example will look for context about Leo Messi on the web and in the local database.
Here, we get 5 sources, both from our database and from the web, but we want to exclude unwanted-domain.com from our web search results:

```python
results = hybrid_rag.search("Who is Leo Messi?", max_results=5, exclude_domains=['unwanted-domain.com'])
```

Here, we want to prioritize the number of local sources, so we will get 2 foreign (web) sources, and 5 sources from our database:

```python
results = hybrid_rag.search("Who is Leo Messi?",  max_local=5, max_foreign=2)
```

Note: The sum of `max_local` and `max_foreign` can exceed `max_results`, but only the top `max_results` results will be returned.

#### Adding retrieved data to the database

If you want to add the retrieved data to the database, you can do so by setting the save\_foreign parameter to True:

```python
results = hybrid_rag.search("Who is Leo Messi?", save_foreign=True)
```

This will use our default saving function, which stores the content and its embedding.

### Examples

#### Sample 1: Using a custom saving function

You might want to add some extra properties to documents you're inserting or even discard some of them based on custom criteria. This can be done by passing a function to the save\_foreign parameter:

```python
def save_document(document):
    if document['score'] < 0.5:
        return None # Do not save documents with low scores

    return {
        'content': document['content'],

         # Save the title and URL in the database
        'site_title': document['title'],
        'site_url': document['url'],

        # Add a new field
        'added_at': datetime.now()
    }

results = hybrid_rag.search("Who is Leo Messi?", save_foreign=save_document)
```

#### Sample 2: Using a custom embedding function

By default, we use [Cohere](https://cohere.com/) for our embeddings. If you want to use your own embeddings, can pass a custom embedding function to the TavilyHybridClient:

```python
def my_embedding_function(texts, doc_type): # doc_type will be either 'search_query' or 'search_document'
    return my_embedding_model.encode(texts)

hybrid_rag = TavilyHybridClient(
    # ...
    embedding_function=my_embedding_function
)
```

#### Sample 3: Using a custom ranking function

Cohere's [rerank](https://cohere.com/rerank) model is used by default, but you can pass your own function to the ranking\_function parameter:

```python
def my_ranking_function(query, documents, top_n):
    return my_ranking_model.rank(query, documents, top_n)

hybrid_rag = TavilyHybridClient(
    # ...
    ranking_function=my_ranking_function
)
```


# null
Source: https://docs.tavily.com/welcome



<div style={{ marginTop: "100px", marginBottom: "100px" }}>
  <div className="flex justify-center">
    <p style={{ fontSize: "2rem", fontWeight: "bold" }} className="text-black dark:text-white">
      Explore our docs
    </p>
  </div>

  <div className="text-center ">
    Your journey to state-of-the-art web search starts right here.
  </div>
</div>

<div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
  <CardGroup cols={3}>
    <Card title="Quickstart" icon="forward" href="documentation/quickstart">
      Start searching with Tavily in minutes
    </Card>

    <Card title="API Reference" icon="square-terminal" href="documentation/api-reference/endpoint/search">
      Start using Tavily's powerful APIs
    </Card>

    <Card title="API Credits Overview" icon="book-open" href="documentation/api-credits">
      Learn how to get and manage your Tavily API Credits
    </Card>

    <Card title="Rate Limits" icon="gauge" href="documentation/rate-limits">
      Learn about Tavily’s API rate limits for both development and production environments
    </Card>

    <Card title="Python" icon="python" href="sdk/python/quick-start">
      Get started with our Python SDK, `tavily-python`
    </Card>

    <Card title="Playground" icon="play" href="https://app.tavily.com/playground">
      Explore Tavily's APIs with our interactive playground
    </Card>
  </CardGroup>
</div>
