# Adding Images
Source: https://docs.linkup.so/pages/changelog/addingimages

_Released: January 07, 2025_

We're excited to introduce the ability to include images in your search results. This new feature allows you to retrieve relevant images alongside your regular search data.

### How to Enable

To include images in your search results, simply add `includeImages=true` to your API request.

**Example Request**

```curl curl
curl --request POST \
  --url https://api.linkup.so/v1/search \
  --header 'Authorization: {{LINKUP_API_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
  "q": "Who is Barack Obama?",
  "depth": "standard",
  "outputType": "searchResults",
  "includeImages": "true"
}'
```

**Example Response**

```json json
{
  "results": [
    {
      "type": "image",
      "name": "Barack Obama | Biography, Presidency, & Facts | Britannica.com",
      "url": "https://cdn.britannica.com/43/172743-138-545C299D/overview-Barack-Obama.jpg"
    },
    {
      "type": "text",
      "name": "Barack Obama Biography",
      "url": "https://www.biography.com/political-figures/barack-obama",
      "content": "Barack Obama was the 44th president of the United States and the first Black commander-in-chief. He served two terms, from 2009 until 2017."
    }
  ]
}
```


# Dates Filtering
Source: https://docs.linkup.so/pages/changelog/datefiltering

_Released: March 19, 2024_

We're excited to introduce date filtering capabilities for your search results. This new feature allows you to narrow down your search results to specific time periods, making it easier to find the most relevant and up-to-date information.

### How to Enable

To filter your search results by date, add the `fromDate` and `toDate` parameters to your API request. You can specify either a start date, end date, or both.

**Example Request**

```curl {9-10}
curl --request POST \
  --url https://api.linkup.so/v1/search \
  --header 'Authorization: {{LINKUP_API_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
  "q": "Latest developments in AI",
  "depth": "standard",
  "outputType": "searchResults",
  "fromDate": "2024-01-01",
  "toDate": "2024-03-19"
}'
```

**Example Response**

```json
{
  "results": [
    {
      "type": "text",
      "name": "Recent AI Developments",
      "url": "https://example.com/ai-news",
      "content": "Latest breakthroughs in artificial intelligence...",
      "date": "2024-03-15"
    }
  ]
}
```

The date filtering parameters accept dates in ISO 8601 format (YYYY-MM-DD). You can use either:

* `fromDate`: Filter results from this date onwards
* `toDate`: Filter results up to this date
* Both `fromDate` and `toDate`: Filter results within this date range


# /credits/balance
Source: https://docs.linkup.so/pages/documentation/api-reference/endpoint/get-balance

GET /credits/balance
The `/credits/balance` endpoint allows you to retrieve your current credits balance.

The **`/credits/balance`** endpoint allows you to check your current credit balance.

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>


# /search (dprc Apr. 25)
Source: https://docs.linkup.so/pages/documentation/api-reference/endpoint/get-search

GET /search
The `/search` endpoint allows you to retrieve web content.

<Warning>
  This endpoint is deprecated in favor of the [POST /search](/pages/documentation/api-reference/endpoint/post-search).
</Warning>

The **`/search`** endpoint is a context retrieve for online content. For a natural language query, it finds online information to ground your LLM's answer, along with sources.

Depending on the `depth` parameter, results may be faster (`standard`) or slower but more complete (`deep`). If `outputType` is set to `structured`, you may provide a `structuredOutputSchema` to dictate the response format.

Learn more about these parameters in [Concepts](/pages/documentation/get-started/concepts).

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>


# /search
Source: https://docs.linkup.so/pages/documentation/api-reference/endpoint/post-search

POST /search
The `/search` endpoint allows you to retrieve web content.

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

The **`/search`** endpoint is a context retrieve for online content. For a natural language query, it finds online information to ground your LLM's answer, along with sources.

<Tip>Our search is optimized for precision. Make sure to craft detailed prompts for optimal results. Learn more [here](../../../documentation/get-started/prompting-guide).</Tip>

Depending on the `depth` parameter, results may be faster (`standard`) or slower but more complete (`deep`).

If `outputType` is set to `structured`, you may provide a JSON `structuredOutputSchema` to dictate the response format.

<Tip>JSON formats are tricky. Learn more about structured output in [our guide](../../../documentation/tutorials/structured-output-guide).</Tip>

Learn more about these parameters in [Concepts](/pages/documentation/get-started/concepts).


# Authentication
Source: https://docs.linkup.so/pages/documentation/development/authentication

Authenticate with the Linkup API

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Using cURL

Your API key needs to be sent along all your request as a Bearer token in the `Authorization` header.

```curl curl
curl "https://api.linkup.so/v1/search" \
    -G \
    -H "Authorization: Bearer <YOUR_LINKUP_API_KEY>" \
    ...
```

## Using the Python SDK

**Option 1:** Set a `LINKUP_API_KEY` environment variable in your shell before using the SDK.

```shell shell
export LINKUP_API_KEY='<YOUR_LINKUP_API_KEY>'
```

**Option 2:**  Set the `LINKUP_API_KEY` environment variable directly within Python, using for instance `os.environ` or [python-dotenv](https://github.com/theskumar/python-dotenv).

```python python
import os
from linkup import LinkupClient

os.environ["LINKUP_API_KEY"] = "<YOUR_LINKUP_API_KEY>"
# or dotenv.load_dotenv()
client = LinkupClient()
...
```

**Option 3**: Directly pass the Linkup API key to the Linkup Client.

```python python
from linkup import LinkupClient

client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")
...
```

## Using the JS SDK

Pass the Linkup API key to the Linkup Client.

```js js
import { LinkupClient } from 'linkup-sdk';

const client = new LinkupClient({
  apiKey: '<YOUR_LINKUP_API_KEY>',
});
```

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Errors
Source: https://docs.linkup.so/pages/documentation/development/errors

Linkup API errors and how to handle them

This guide includes an overview of error codes you might see from both the API and our SDKs.

## API Errors

Whatever the HTTP error code is, the response payload will contain the following object:

**`statusCode`**: number - HTTP error code.

**`error`**: object - Linkup error details containing:

* **`code`**: string - Error name
* **`message`**: string - Description of the error
* **`details`**: array - Details of the error. This array may be empty or include objects with the following properties:
  * **`field`**: string - The field that caused the error
  * **`message`**: string - A description of the field error

Here is an example:

```json
{
	"statusCode": 400,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Validation failed",
		"details": [
			{
				"field": "outputType",
				"message": "outputType must be one of the following values: sourcedAnswer, searchResults, structured"
			}
		]
	}
}
```

**API Error Codes**

| Code                        | Possible Reasons                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------- |
| 400 - Bad Request           | Required parameter is missing, or Invalid parameter or Search query yield no result |
| 401 - Unauthorized          | API Key is missing or invalid                                                       |
| 403 - Forbidden             | API key does not have permission to access this resource                            |
| 409 - Conflict              | Resource conflict (e.g., duplicate entry or conflicting request)                    |
| 429 - Too Many Requests     | You have run out of credit                                                          |
| 500 - Internal Server Error | Something's up on our end                                                           |

## SDK Errors

**Python & JS SDK Error Types**

| Type                            | Reason                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `LinkupInvalidRequestError`     | Required parameter is missing, or invalid parameter                                |
| `LinkupNoResultError`           | Search query yield no result                                                       |
| `LinkupAuthenticationError`     | API Key is missing, invalid or you do not have permission to access this ressource |
| `LinkupInsufficientCreditError` | You have run out of credit                                                         |
| `LinkupUnknownError`            | Anything else                                                                      |


# Source Filtering [BETA] 
Source: https://docs.linkup.so/pages/documentation/development/filtering

How to filter your search on sources.

<Info>
  **Date filtering** information can be found [here](../api-reference/endpoint/post-search#body-from-date).
</Info>

## Overview

Our `/search` endpoint allows for restricting its search scope. It supports the following:

* **Restrictions**: restrict the search to a set list of sources
* **Exclusions**: exclude a set list of sources from the search
* **Prioritization**: create a prioritized list of sources to search on. The information will be looked for on the sources by order of priority

To filter, we use an XML format that must be appended to the natural language `q` parameter passed to the `/search` endpoint.

```xml
<guidance>
  <restriction>
    Use only the sources listed here. Do not rely on any external references.
      - wikipedia.org
  </restriction>
</guidance>
Your search goes here
```

This structure should be used in the API as follows.

<CodeGroup>
  ```bash curl
  curl -X POST 'https://api.linkup.so/v1/search' \
    -H 'Authorization: Bearer {{LINKUP_API_KEY}}' \
    -H 'Content-Type: application/json' \
    -d '{
      "q": "<guidance><restriction>Use only the sources listed here. Do not rely on any external references.\n  - wikipedia.org\n  - sec.gov\n</restriction><priority>\n  - wikipedia.org\n</priority></guidance>Who is the CEO of LVMH?",
      "outputType": "sourcedAnswer",
      "depth": "standard"
    }'
  ```

  ```python python
  from linkup import LinkupClient

  client = LinkupClient(api_key="{{LINKUP_API_KEY}}")

  query = """
  <guidance>
    <restriction>Use only the sources listed here. Do not rely on any external references.
      - wikipedia.org
      - sec.gov
    </restriction>
    <priority>
      - wikipedia.org
    </priority>
  </guidance>
  Who is the CEO of LVMH?
  """

  search_response = client.search(
    query=query,
    depth="standard",
    output_type="sourcedAnswer"
  )
  print(search_response)
  ```

  ```javascript js
  import { LinkupClient } from 'linkup-sdk';

  const client = new LinkupClient({
    apiKey: '{{LINKUP_API_KEY}}',
  });

  const query = `
  <guidance>
    <restriction>
      Use only the sources listed here. Do not rely on any external references.
      - wikipedia.org
      - sec.gov
    </restriction>
    <priority>
      - wikipedia.org
    </priority>
  </guidance>
  Who is the CEO of LVMH?`;

  client.search({
    query,
    depth: "standard",
    outputType: "sourcedAnswer"
  }).then(console.log);
  ```
</CodeGroup>

## Exclusions

Exclusions can be used to block the `/search` endpoint from returning information from a given list of sources. It should be used in the format of the example below:

```xml
<guidance>
  <exclusion>
    Do not use any of the sources listed here.
      - buzzfeed.com
  </exclusion>
</guidance>
Your search goes here
```

## Prioritization

Prioritization can be used to favor some sources. The `/search` endpoint will try to find the requested information  in the favored sources. If unsuccessful, it will fall back to other sources. Prioritization can be used in tiers.

```xml
<guidance>
  <priority>
    - wikipedia.org
  </priority>
</guidance>
Your search goes here
```

```xml
<guidance>
  <priority level='1'>
    - wikipedia.org
  </priority>
  <priority level='2'>
    - buzzfeed.com
  </priority>
</guidance>
Your search goes here
```

## Examples

The different restrictions can be used together.

**Exclusion + Prioritization**

```xml
<guidance>
  <exclusion>Do not use any of the sources listed here.
    - buzzfeed.com
  </exclusion>
  <priority level='1'>
    - wikipedia.org
  </priority>
  <priority level='2'>
    - imdb.com
  </priority>
</guidance>
Your search goes here
```

**Restriction + Prioritization**

```xml
<guidance>
  <restriction>Use only the sources listed here. Do not rely on any external references.
    - wikipedia.org
    - sec.gov
  </restriction>
  <priority>
    - wikipedia.org
  </priority>
</guidance>
Your search goes here
```


# Pricing
Source: https://docs.linkup.so/pages/documentation/development/pricing

How the Linkup API pricing system works

When you first sign up, your account is automatically credited with 5 euros.

Each time you make a successful request to our `search` endpoint, an amount is subtracted from your account. The amount deducted per call depends on the depth parameter of your request:

| Call Type | Cost   |
| --------- | ------ |
| Standard  | €0.005 |
| Deep      | €0.05  |

To support the ecosystem, we will top up your account back to 5 euros every month. Beyond that, you can add money to your account in the [Billing](https://app.linkup.so/organization/billing) section of the Linkup app.

If your account runs out, the API will respond with a 429 HTTP error.

<Check>
  **Important note**: No credit is subtracted when an error occurs, whether it is because of a missing parameter, an internal server error, but also when we were not able to find anything relevant to your query.
</Check>

You can view your current consumption by visiting the [Linkup App](https://app.linkup.so/consumer/dashboard).


# Rate Limits
Source: https://docs.linkup.so/pages/documentation/development/rate-limits



For our `/search` endpoint, our rate limits are currently set at `10 queries per second` per account. If you need higher rate limits, please reach out to [contact@linkup.so](mailto:contact@linkup.so) to discuss Custom plans.


# Concepts
Source: https://docs.linkup.so/pages/documentation/get-started/concepts

Key concepts to understand how Linkup works

## Overview

The Linkup `/search` endpoint allows you to discover and access relevant web content based on a natural language query. Once the content is retrieved, it can serve as factual grounding for Large Language Models (LLMs), helping them produce more accurate and informed responses.

## Parameters

### Query

Your query should be as specific as possible to improve the quality of the results. Consider providing additional context or constraints. For example:

| Initial Query                                   | Improved Query                                             | Explanation                                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| What is the website of the company named Total? | What is the website of the **French** company named Total? | Adding the country ("French") helps narrow down results, making it easier to identify the correct company. |

### Depth

You can choose between two search depths, depending on your performance and accuracy needs:

* **`standard`**: Returns results more quickly, suitable for low-latency scenarios. Costs €0.005 per call.
* **`deep`**: Continues to search iteratively if it doesn't find sufficient information on the first attempt. This may take longer, but often yields more comprehensive results. Costs €0.05 per call.

When using `deep`, the system repeatedly evaluates whether it has found enough information. If not, it continues searching—potentially for tens of seconds—until it locates what it needs.

### OutputType

The API supports several output formats to match different use cases:

* **`sourcedAnswer`**: Returns a natural language answer with source attributions.
* **`searchResults`**: Provides chunks of contextual data suitable for grounding in LLM prompts.
* **`structured`**: Produces a response following a specified JSON schema, ideal for structured data extraction.

<Tip>
  JSON formats are tricky. Learn more about structured output in [our
  guide](../../../documentation/tutorials/structured-output-guide).
</Tip>

### Additional Parameters

* **`includeImages`**: Boolean parameter to include relevant images in search results
* **`fromDate`**: Filter results from a specific date (format: YYYY-MM-DD)
* **`toDate`**: Filter results until a specific date (format: YYYY-MM-DD)

## Rate Limits

The API has a rate limit of 20 queries per second per account. If you need higher rate limits, please contact us to discuss custom plans.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>

## Best Practices

1. **Query Specificity**

   * Be as specific as possible in your queries
   * Include relevant context (time periods, locations, industries)
   * Use natural language but be precise
   * Read our [prompting guide](../tutorials/prompting-guide) to know more.

2. **Depth Selection**

   * Use `standard` for quick, general queries
   * Use `deep` for complex research or when accuracy is critical
   * Consider cost implications (€0.005 vs €0.05 per call)

3. **Output Format**

   * Choose `sourcedAnswer` for direct answers with citations
   * Use `searchResults` for LLM grounding
   * Select `structured` when you need specific data points returned in a json format. Read our [structured output](../tutorials/structured-output-guide) guide to know more.

4. **Error Handling**
   * The API returns standard HTTP status codes
   * No credit is deducted for failed requests
   * Common errors include:
     * 400: Bad Request (missing/invalid parameters)
     * 401: Unauthorized (invalid API key)
     * 429: Too Many Requests (rate limit or insufficient credit)

<Info>
  Your account starts with 5 euros of credit and is topped up monthly. You can
  add more credit in the [Billing](https://app.linkup.so/organization/billing)
  section of the Linkup app.
</Info>


# Introduction
Source: https://docs.linkup.so/pages/documentation/get-started/introduction

Get started for free, no credit card required.

Linkup connects your AI application to the internet. It provides grounding data to enrich your AI's output and increase its precision, accuracy and factuality. Linkup is [#1 in the world for factuality](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa), scoring state-of-the-art results on OpenAI's SimpleQA benchmark.

<Tip>**Important**: the more precise and detailed your prompts, the better the results. <br /><br />Read our Prompting Guide [here](https://docs.linkup.so/pages/documentation/get-started/prompting-guide)</Tip>

<CardGroup cols={2}>
  <Card title="Quickstart" icon="forward" href="/pages/documentation/get-started/quickstart">
    Integrate with Linkup in 5 minutes
  </Card>

  <Card title="Playground" icon="play" href="https://app.linkup.so/playground">
    Test Linkup Search in 1 click
  </Card>

  <Card title="API Reference" icon="code" href="/pages/documentation/api-reference">
    Review the Linkup API reference
  </Card>

  <Card title="Explore our tutorials" icon="wrench" href="../tutorials/signup-radar">
    Start building based on tutorials
  </Card>
</CardGroup>


# Prompting Guide
Source: https://docs.linkup.so/pages/documentation/get-started/prompting-guide

This page offers guidance on how to prompt the Linkup API effectively for optimal results.

## 🧩 Why Prompting Matters

Linkup is a precise engine designed to follow **detailed instructions** like a research assistant.
The more guidance you give, the better the result.

## ✅ Anatomy of a Good Prompt

A strong prompt usually includes:

| Component                | Description                                                            | Example                                                                                   |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 🎯 **Goal**              | What do you want to find or understand?                                | "You are an expert business analyst. Describe the company’s activities in detail"         |
| 📍 **Scope**             | Where should the system look?                                          | "The company domain is linkup.so. Analyze the homepage, about us page, and blog section." |
| 🧠 **Criteria / Method** | What type of information and analytical depth should the system apply? | "Include products, business model, target market, and value chain positioning"            |
| 📦 **Format**            | How should the response be structured or returned?                     | "Be sharp and business oriented in your answer."                                          |

<Tip>**Tip**: If you want us to look into specific sources, tell us! <br /><br />**Examples include:** Company domains, Company fillings (10Ks), Linkedin URLs, etc...</Tip>

## ❌ Anatomy of a bad prompt

Week prompts often:

* Are vague: “Tell me about the company” → What exactly? Revenue? Product strategy?
* Lack instructions: “Summarize this page” → How? As a bullet list? As a paragraph?
* Ask too many things: “Give me pricing, hiring plans, GTM strategy, and roadmap” → Split into 3+ prompts.

Even when a prompt seems precise, there are probably ways to improve it. For instance:

❌ **Bad prompt:** Analyze the company website to determine its GTM motion.

✅ **Good prompt:** Analyze the company’s homepage, pricing page, and sign-up flow to determine if it follows Product-Led Growth (PLG) or Sales-Led Growth (SLG). Use criteria such as self-service signup, free trials, or demo CTAs. Return a 3-sentence conclusion with your reasoning.

## 🧠 Sample Prompts for Business Intelligence

Below is a list of prompts you can leverage to extract intelligence from company websites. We have a full list [here](https://linkup-platform.notion.site/The-100-Prompts-You-Need-to-Leverage-AI-in-Your-GTM-Strategy-1cb161ecef69809593b3d2c51bbee943?pvs=74)

<Card title="Map a competitor’s value proposition from homepage and product pages">
  **Your role is to** map a company's value proposition from the homepage and product pages of its website.

  **Inputs:**

  * `{company_name}`
  * `{company_website}`

  **Objective:**

  Extract the core value proposition communicated on public-facing product pages.

  **Instructions:**

  * Visit the homepage and primary product pages.
  * Summarize the main customer benefits and positioning statements.
  * Identify keywords or repeated language emphasizing their differentiators.
  * Avoid internal taglines or vague marketing fluff. Focus on external value claims.
</Card>

<Card title="Identify a company’s ICP from homepage, use cases, and blog posts">
  **Your role is to** determine a company's Ideal Customer Profile (ICP) based on how it communicates across its homepage, use case pages, and blog.

  **Inputs:**

  * `{company_name}`
  * `{company_website}`

  **Objective:**

  Infer the ICP based on target industries, company sizes, buyer personas, and key pain points addressed.

  **Instructions:**

  * Analyze use case pages and customer logos.
  * Review blog themes and tone.
  * Focus only on factual and clearly stated audience clues.
</Card>

<Card title="Determine if the company publishes a public roadmap">
  **Your role is to** check whether the company shares future product features publicly.

  **Inputs:**

  * `{company_website}`

  **Objective:**

  Evaluate product transparency and customer feedback incorporation.

  **Instructions:**

  * Search for “roadmap”, “coming soon”, or “what’s next” pages.
  * Look for tools like Canny, Trello, or Notion used for roadmaps.
  * List any public roadmap items and statuses (planned, in progress, live).
  * Include link if available.
</Card>

## 👋 To go further

There are many ways to optimize your prompts and results with Linkup. If you'd like to discuss your use case further, please feel free to reach out to our team at [support@linkup.so](mailto:support@linkup.so) or via our Discord.

You can also book a quick 15-minute call [here](https://calendar.app.google/tEzK3mMKyLyp5Hsv9)

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Quickstart
Source: https://docs.linkup.so/pages/documentation/get-started/quickstart

Integrate with Linkup in 5 minutes

The Linkup API can be used in AI workflows to find and access high quality content from the internet. You can follow the steps below to integrate Linkup easily.

1. Get your API key for free

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

2. Install the Linkup SDK

<CodeGroup>
  ```python python
  pip install linkup-sdk
  ```

  ```js js
  npm i linkup-sdk
  ```
</CodeGroup>

3. Call the Search API to retrieve context. This enables you to RAG the internet. Linkup will return the context you need to ground your LLM's answer.

<CodeGroup>
  ```python python
  from linkup import LinkupClient

  client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")

  response = client.search(
      query="What is Microsoft's 2024 revenue?",
      depth="deep",
      output_type="sourcedAnswer"
  )

  print(response)
  ```

  ```js js
  import { LinkupClient } from 'linkup-sdk';

  const client = new LinkupClient({
    apiKey: '<YOUR API KEY>',
  });

  const askLinkup = async () => {
    return await client.search({
      query: "What is Microsoft's 2024 revenue?",
      depth: 'deep',
      outputType: 'sourcedAnswer',
    });
  };

  askLinkup().then(console.log);
  ```

  ```shell curl
  curl "https://api.linkup.so/v1/search" \
      -G \
      -H "Authorization: Bearer $LINKUP_API_KEY" \
      --data-urlencode "q=What is Microsoft's 2024 revenue?" \
      --data-urlencode "depth=deep" \
      --data-urlencode "outputType=sourcedAnswer"
  ```
</CodeGroup>

Response:

<CodeGroup>
  ```json 200 [expandable]
  {
      "answer": "Microsoft's revenue for fiscal year 2024 was $245.1 billion, reflecting a 16% increase from the previous year.",
      "sources": [
          {
              "name": "Microsoft 2024 Annual Report",
              "url": "https://www.microsoft.com/investor/reports/ar24/index.html",
              "snippet": "Highlights from fiscal year 2024 compared with fiscal year 2023 included: Microsoft Cloud revenue increased 23% to $137.4 billion.\nMore broadly, we continued to see sustained revenue growth from migrations as customers turn to Azure. Azure Arc is helping customers streamline their transition, as they secure, develop, and operate workloads with Azure services anywhere. We have 36,000 Arc customers, up 90 percent year-over-year.\nWith our acquisition of Activision Blizzard King, which closed October 2023, we’ve added hundreds of millions of players to our ecosystem. We now have 20 franchises that have generated over $1 billion in lifetime revenue—from Candy Crush, Diablo, and Halo, to Warcraft, Elder Scrolls, and Gears of War.\nGrowth depends on our ability to reach new users in new markets such as frontline workers, small and medium businesses, and growth markets, as well as add value to our core product and service offerings to span AI and productivity categories such as communication, collaboration, analytics, security, and compliance. Office Commercial revenue is mainly affected by a combination of continued installed base growth and average revenue per user expansion, as well as the continued shift from Office licensed on-premises to Office 365.\nGrowth depends on our ability to reach new users, add value to our core product set with new features including AI tools, and continue to expand our product and service offerings into new markets. Office Consumer revenue is mainly affected by the percentage of customers that buy Office with their new devices and the continued shift from Office licensed on-premises to Microsoft 365 Consumer subscriptions."
          },
          {
              "name": "Microsoft's Financial Results in FY24 Q4 – AGOLUTION",
              "url": "https://agolution.com/en/microsoft/financial-reporting/2024-q4/",
              "snippet": "What did the other quarterly figures look like and how did Microsoft fare in fiscal year 2024 as a whole? Microsoft’s revenue amounted to $64.7 billion - and increased by 15%.\nWhat did the other quarterly figures look like and how did Microsoft fare in fiscal year 2024 as a whole? Microsoft’s revenue amounted to $64.7 billion - and increased by 15%.\nThe Xbox and Gaming segment recorded a remarkable jump in revenue of 61%, with the majority of this increase being due to the acquisition of Activision Blizzard King by Microsoft at the end of last year. Since then, Microsoft has owned popular video games such as “Call of Duty”, “Overwatch” and “Candy Crush”. The results for Microsoft’s fiscal year 2024 as compared to fiscal year 2023 were as follows.\nMicrosoft achieved total revenue of $245.1 billion, an increase of 16%. The operating income amounted to $109.4 billion and increased by 24%. Total net income amounted to $88.1 billion and increased by 22%. Earnings per share amounted to $11.8 - here too there was an increase of 22%. Solid fiscal year 2024: Microsoft remains one of the market leaders in the era of AI.\nThe third quarter of Microsoft’s 2024 fiscal year was again characterized by strong cloud results."
          },
          {
              "name": "Microsoft Revenue 2010-2024 | MSFT | MacroTrends",
              "url": "https://www.macrotrends.net/stocks/charts/MSFT/microsoft/revenue",
              "snippet": "Microsoft revenue for the quarter ending December 31, 2024 was $69.632B, a 12.27% increase year-over-year.\nMicrosoft annual/quarterly revenue history and growth rate from 2010 to 2024. Revenue can be defined as the amount of money a company receives from its customers in exchange for the sales of goods or services. Revenue is the top line item on an income statement from which all costs and expenses are subtracted to arrive at net income.\nMicrosoft revenue for the quarter ending December 31, 2024 was $69.632B, a 12.27% increase year-over-year.\nMicrosoft annual revenue for 2023 was $211.915B, a 6.88% increase from 2022. Microsoft annual revenue for 2022 was $198.27B, a 17.96% increase from 2021."
          },
          {
              "name": "(MSFT) Microsoft Revenue: 1992-2025 Annual Revenue - WallStreetZen",
              "url": "https://www.wallstreetzen.com/stocks/us/nasdaq/msft/revenue",
              "snippet": "Microsoft revenue was $261.80B for the trailing 12 months ending Dec 31, 2024, with 12.3% growth year over year. Quarterly revenue for the quarter (Q4 2024) ending on Dec 31, 2024 was $69.6B, up 6.2% from last quarter. For the last reported fiscal year 2024 ending Jun 30, 2024, MSFT annual revenue was $245.1B, with 15.7% growth year-over-year."
          },
          {
              "name": "FY24 Q4 - Press Releases - Investor Relations - Microsoft",
              "url": "https://www.microsoft.com/en-us/investor/earnings/fy-2024-q4/press-release-webcast",
              "snippet": "REDMOND, Wash. — July 30, 2024 — Microsoft Corp. today announced the following results for the quarter ended June 30, 2024, as compared to the corresponding period of last fiscal year: · Revenue was $64.7 billion and increased 15% (up 16% in constant currency)\nMicrosoft Corp. today announced the following results for the fiscal year ended June 30, 2024, as compared to the corresponding period of last fiscal year: · Revenue was $245.1 billion and increased 16% (up 15% in constant currency)\n· Search and news advertising revenue excluding traffic acquisition costs increased 19% Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the fourth quarter of fiscal year 2024.\nThe following table reconciles our financial results for the fiscal year ended June 30, 2024, reported in accordance with generally accepted accounting principles (GAAP) to non-GAAP financial results. Additional information regarding our non-GAAP definition is provided below.\nAll information in this release is as of June 30, 2024."
          },
          {
              "name": "Microsoft: June 2024 Q4 and FY24 Results - The ITAM Review",
              "url": "https://itassetmanagement.net/2024/08/06/microsoft-year-end-financial-results/",
              "snippet": "Microsoft Corp recently announced its June 2024 Q4 and FY24 end-of-year results. Looking at the overall results across all sectors, the total revenue for Microsoft increased by 16% to a total of $245.1 billion with a ...\nMicrosoft Corp recently announced its June 2024 Q4 and FY24 end-of-year results. Looking at the overall results across all sectors, the total revenue for Microsoft increased by 16% to a total of $245.1 billion with a net income of $88.1 billion.\nMicrosoft attributes this success to both its innovation and its customers ongoing trust. According to Amy Hood, executive vice president and CFO, they had a “solid quarter, highlighted by record bookings and Microsoft quarterly cloud revenue of $36.8 billion, up 21% year-over-year”.\nThis segment, which includes Office commercial and Office consumer revenue as well as LinkedIn and Dynamics Business Solutions revenue, saw a number of increases. Commercial products and cloud revenue increased by 12% driven by Office 365 commercial revenue growth of 13%. Microsoft also saw its M365 consumer base grow to 82.5 million.\nLastly, Dynamics products and cloud services revenue increased by 16%. This is a result of a 19% increase in Dynamics 365. The Intelligent Cloud segment (Microsoft’s top segment), which includes revenue from server products and cloud services, saw an increase of 19% in constant currency."
          },
          {
              "name": "FY24 Q4 - Performance - Investor Relations - Microsoft",
              "url": "https://www.microsoft.com/en-us/investor/earnings/fy-2024-q4/performance",
              "snippet": "Revenue increased $33.2 billion or 16% driven by growth across each of our segments. Intelligent Cloud revenue increased driven by Azure. Productivity and Business Processes revenue increased driven by Office 365 Commercial.\nMore Personal Computing revenue increased driven by Gaming.\nCost of revenue increased $8.3 billion or 13% driven by growth in Microsoft Cloud and Gaming, offset in part by a decline in Devices."
          },
          {
              "name": "Microsoft (NASDAQ:MSFT) Q4 2024 Earnings Report on 7/30/2024 - MarketBeat",
              "url": "https://www.marketbeat.com/earnings/reports/2024-7-30-microsoft-co-stock/",
              "snippet": "Microsoft Q4 2024 Earnings Report $388.49-8.50 (-2.14%) As of 03/3/2025 04:00 PM Eastern. Earnings History Forecast. Microsoft EPS Results. Actual EPS $2.95. Consensus EPS $2.90. Beat/Miss Beat by +$0.05. One Year Ago EPS $2.69. Microsoft Revenue Results. Actual Revenue $64.73 billion. Expected Revenue"
          },
          {
              "name": "FY24 Q4 - Performance - Investor Relations - Microsoft",
              "url": "https://www.microsoft.com/en-us/Investor/earnings/FY-2024-Q4/performance",
              "snippet": "Fiscal Year 2024 Compared with Fiscal Year 2023. Revenue increased $33.2 billion or 16% driven by growth across each of our segments. Intelligent Cloud revenue increased driven by Azure. ... Cost of revenue increased $8.3 billion or 13% driven by growth in Microsoft Cloud and Gaming, offset in part by a decline in Devices."
          },
          {
              "name": "Microsoft 2024 Q4 Earnings: Record cloud bookings as Azure growth holds | MSDynamicsWorld.com",
              "url": "https://msdynamicsworld.com/story/microsoft-2024-q4-earnings-record-cloud-bookings-azure-growth-holds",
              "snippet": "Microsoft reported Q4 2024 financial performance today with earnings per share of $2.95 on revenue of $64.7 billion, slightly exceeding analyst estimates.\nMicrosoft Cloud quarterly revenue was $36.8 billion, up 21%. Business highlights announced by the company include: Azure and other cloud services revenue growth of 29% Dynamics products and cloud services revenue increased 16% driven by Dynamics 365 revenue growth of 19% (up 20% in constant currency) ... Full year revenue for 2024 was $245.1 billion, with earnings per share of $11.80, up 22% from 2023.\nMicrosoft reported Q4 2024 financial performance today with earnings per share of $2.95 on revenue of $64.7 billion, slightly exceeding analyst estimates.\nLast quarter, Microsoft reported earnings per share of $2.94 on revenue of $61.9 billion, exceeding analyst estimates. A year ago, Microsoft reported earnings per share of $2.69 on revenue of $56.2 billion.\nFull-year revenue in 2023 was $211.9 billion with earnings of $9.68 per share. Joining MSDynamicsWorld.com gives you free, unlimited access to news, analysis, white papers, case studies, product brochures, and more. You can also receive periodic email newsletters with the latest relevant articles and content updates. Learn more about us here ... Building Stronger Partnerships: Strategies for Enhancing Microsoft ISV and VAR Collaboration Simplified Financial Reporting in Microsoft Dynamics 365 F&SCM / AX"
          }
      ]
  }
  ```
</CodeGroup>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>

<Card title="Best Practice" icon="link" href="https://docs.linkup.so/pages/documentation/get-started/prompting-guide" cta="Read our Prompting Guide here">
  The more precise and detailed your prompts, the better the results.
</Card>


# Automating Lead Qualification
Source: https://docs.linkup.so/pages/documentation/tutorials/company-data-enrichment

Learn how to automatically research and score your leads using Linkup AI to prioritize high-value prospects

<Note>
  **Time-saving Automation:** This tutorial shows you how to build a system that
  can process hundreds of leads automatically, saving 5+ hours of manual
  research per week while ensuring you focus on the right opportunities.
</Note>

# The Challenge: From Manual Research to Automated Intelligence

Every day, new users sign up for Linkup. When they do, we capture two crucial pieces of information:

* Their company name
* Their email address

When we had a few signups every day, our team could spend time researching each company manually and identify the most important ones. But as we grow and the number of daily signups becomes too high to handle manually, we face a challenge: **How do we know which leads to focus on first?**

**Before automation:** Our sales team spent hours manually researching each company, often missing high-value opportunities because of the volume.

**After automation:** We instantly identify and prioritize the most promising leads based on AI-powered analysis of their company profile and website.

## The Solution: An Automated Enrichment Pipeline to Qualify Leads

By the end of this tutorial, you'll have a working system that:

1. **Finds Official Websites:** Cross-references company names with email domains
2. **Analyzes Company Websites:** Determines how well each company fits your ideal customer profile
3. **Prioritizes Leads:** Assigns a score from 1-5 so your team knows who to contact first

For this tutorial, we are going to use:

* **Attio CRM data pull:** to generate the input .json file with org names and company domains.
* **Linkup API:** to search the web and enrich the leads.

## The Complete Process: Visual Overview

Here's how the data transforms throughout this process:

```mermaid
graph LR
    A[User Signup] -->|Extract| B[Name + Email Domain]
    B -->|Linkup API Lookup| C[Verified Website]
    C -->|Linkup API Analysis| D[ICP Score]

    style A fill:#f9d4d4
    style D fill:#c9f7c9
```

## Project Setup: Getting Started

Let's start with our project structure and requirements:

```bash
your-project-directory/
├── .env                                 # API keys
├── organization_names_with_domains.json # Input file
├── company_analysis_results.json        # Output file
└── linkup_enrich.py                     # Enrichment script
```

<Steps>
  <Step title="Create Your Environment">
    First, let's set up our environment and install the required packages:

    ```bash
    # Create a virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate

    #### Install required packages
    pip install requests python-dotenv
    ```
  </Step>

  <Step title="Set Up Your API Keys">
    Create a `.env` file in your project directory with your API keys:

    ```env
    LINKUP_API_KEY=your_api_key_here
    ATTIO_API_KEY=your_attio_api_key_here
    ```

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>

    <Note type="warning">
      Never put your API KEYS directly in your code. Always include them in a `.env`
      file.
    </Note>
  </Step>

  <Step title="Add your input file">
    Our starting point is a JSON file containing user signup information:

    * Organizations
    * Email address (or rather: the domains of the email addresses)

    In our case, we extracted this file from our CRM (Attio) since this is where we send signup data (and want to send the enriched data back after the process). This file could be the output of a signup form or any lead generation document you're using.

    Let's look at the structure:

    ```json
    "034Q2K4NXVY6JIWZ": {
        "name": "test",
        "people_ids": "01HQ2K4NX123457",
        "domain": "anthropic.com"
    },
    "01HQ2K4NXVY6GPWZ": {
        "name": "Personal",
        "people_ids": "01HQ2K4NX123456",
        "domain": "live.fr"
    },
    "CHDY2K4NXVY6GJUE": {
        "name": "MistralAI",
        "people_ids": "01HQ2K4NX120987",
        "domain": "gmail.com"
    },
    ```

    <Note>
      As you can see, data quality might not be optimal:

      * Some users provide personal email addresses
      * Others do not put the name of their company

      This is why we're combining both information to try and get better results.

      We could add a Linkup search for LinkedIn profiles associated with the first part of the emails.
    </Note>
  </Step>
</Steps>

## The Enrichment Pipeline: Step-by-Step Implementation

Before we share the whole script (see the end of the tutorial), let's break down our enrichment pipeline into steps:

<Steps>
  <Step title="Finding Official Websites">
    Our first challenge is to reliably find the official website for each company. We'll use Linkup's API with a carefully crafted prompt:

    ```python {8-13}
    url = "https://api.linkup.so/v1/search"
    headers = {
        "Authorization": f"Bearer {LINKUP_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
      "q": f"Based on the name {company_name} and the email domain {domain_info}, " +
          f"find the most likely company website URL. Only return a result if you are 90% sure " +
          f"this is the correct website. If {company_name} seems like a generic company name " +
          f"(e.g. personal, perso, n/a), return nothing. If the domain is a generic domain " +
          f"(e.g. gmail.com, yahoo.com, hotmail.com, icloud.com), do not consider it. " +
          f"Only consider professional email domains. Only return the company domain URL.",
      "depth": "standard",
      "outputType": "sourcedAnswer",
      "includeImages": "false"
    }
    ```

    <Tip>
      **Understanding key parameters**:

      * **depth: "standard"**: For website finding,
        "standard" depth provides a good balance between speed and accuracy
      * **outputType: "sourcedAnswer"**: Returns a natural language answer with just
        the URL
      * **includeImages: "false"**: We don't need images, which speeds up
        the response
    </Tip>

    <Accordion title="Prompt Design Strategy">
      Notice how the prompt includes specific instructions:

      * Only return results with 90% confidence
      * Ignore generic company names
      * Skip generic email domains
      * Focus on professional email domains
        These constraints help ensure we get high-quality, reliable results.
    </Accordion>
  </Step>

  <Step title="Analyzing Company Fit">
    Once we have the website, we need to determine how well each company fits our ideal customer profile. For this, we're using a second prompt to Linkup that gives the domain URL as input and asks for an ICP score as output.

    ```python {7-13}
    url = "https://api.linkup.so/v1/search"
    headers = {
      "Authorization": f"Bearer {LINKUP_API_KEY}",
      "Content-Type": "application/json"
    }
    payload = {
      "q": f"Analyze the website {website_url}. Determine if this company could be an Ideal Customer Profile (ICP) " +
            f"for my company https://www.linkup.so/. For context, we are selling a search API. We target AI companies, " +
            f"Tech Companies, and corporates, as well as consulting and financial firms. " +
            f"Our search API allows companies to enrich applications with real-time web knowledge and business intelligence, " +
            f"at scale. Consider factors like industry and whether they're likely to need API services, and if they " +
            f"might be building software products. Return a rating from 1 to 5, 1 being lowest ICP, 5 being highest ICP. " +
            f"Universities and schools should get a 3. Only return the rating, nothing else.",
      "depth": "deep",
      "outputType": "sourcedAnswer",
      "includeImages": "false"
    }
    ```

    <Tip>
      **We use 'deep' depth** for ICP analysis because:

      * It provides more thorough analysis of the company website
      * It considers more pages and context when making its assessment
      * The accuracy of ICP scoring is worth the slightly longer processing time
    </Tip>

    **The output will be an ICP (Ideal Customer Profile) score ranging from 1-5:**

    * **1** - Perfect match - AI companies, Tech Companies with clear API needs
    * **2** - Strong potential - Corporates, Financial Firms, Consulting companies
    * **3** - Moderate fit - Universities, Educational Institutions, Research Organizations
    * **4** - Might need education - Companies with potential but unclear use cases
    * **5** - Probably not a good fit - Consumer businesses, local services, etc.

    Notice how we don't have to explicitly explain our rating system - AIs understand it intuitively.
  </Step>

  <Step title="Checking the results">
    After we run the script with these two API calls, a new file will be created with two new fields for each company:

    * Website domain
    * ICP Analysis

    ```json {5-6,12-13,19-20}
    "034Q2K4NXVY6JIWZ": {
      "name": "test",
      "people_ids": "01HQ2K4NX123457",
      "domain": "anthropic.com"
      "website": "https://www.anthropic.com/"
      "icp_analysis": "5"
    },
    "01HQ2K4NXVY6GPWZ": {
      "name": "Personal",
      "people_ids": "01HQ2K4NX123456",
      "domain": "live.fr"
      "website": ""
      "icp_analysis": "1"
    },
    "CHDY2K4NXVY6GJUE": {
      "name": "MistralAI",
      "people_ids": "01HQ2K4NX120987",
      "domain": "gmail.com"
      "website": "https://mistral.ai/"
      "icp_analysis": "5"
    }
    ```

    Great! As you can see, combining company name and email domain allows us to identify ICPs we would have missed if we had only considered one of the two factors.

    <Note>
      The complete script below includes additional functionality beyond the two
      Linkup API calls shown above. For example:

      * We implement logic to skip the ICP analysis call when no website is found, automatically assigning a rating of "1" (as seen in the second example output)
      * We include an incremental processing system that only analyzes companies without existing ratings, preventing redundant API calls and allowing you to resume processing after interruptions
      * The code handles file operations safely, maintains a processing counter, and includes appropriate rate limiting between API calls
    </Note>
  </Step>
</Steps>

## Next Steps and Customization Opportunities

This script is just the beginning! Here are ways you can extend it:

1. **Additional Enrichment**: Add other API calls to find additional information (company industry, value chain positioning, pricing strategy...)
2. **CRM Integration**: Add code to push results back to your CRM automatically (what we're doing at Linkup)
3. **Multi-threaded Processing**: Speed up processing by handling multiple companies simultaneously

In our case, we're actually sending the data back to our CRM so that new signups get automatically rated. We then have live alerts that tell us when important customers sign up to our products.

## The Complete Code

Below is the complete Python script that implements our lead qualification system. The file is more complex than the two functions to allow for observability, troubleshooting, batch processing, etc. Do not hesitate to reach out if you have any questions.

```python [expandable]
import os
import json
import time
import re
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# API keys from environment variables
ATTIO_API_KEY = os.getenv('ATTIO_API_KEY')
LINKUP_API_KEY = os.getenv('LINKUP_API_KEY')

if not ATTIO_API_KEY or not LINKUP_API_KEY:
    print("Error: Missing API keys in .env file")
    exit(1)

# File paths and settings
FILE = 'new_companies.json'
MAX_COMPANIES = 50

def load_existing_data():
    """Load file with new companies to enrich"""
    try:
        with open(FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Error: Could not load {FILE}")
        exit(1)

def find_website_url(company_name, company_domain=None):
    if not company_name or not company_name.strip():
        return ""

    url = "https://api.linkup.so/v1/search"
    headers = {
        "Authorization": f"Bearer {LINKUP_API_KEY}",
        "Content-Type": "application/json"
    }

    domain_info = company_domain if company_domain else ""
    payload = {
        "q": f"Based on the name {company_name} and the email domain {domain_info}, find the most likely company website URL. Only return a result if you are 90% sure this is the correct website. If {company_name} seems like a generic company name (e.g. personal, perso, n/a), return nothing. If the domain is a generic domain (e.g. gmail.com, yahoo.com, hotmail.com, icloud.com), do not consider it. Only consider professional email domains. Only return the company domain URL.",
        "depth": "standard",
        "outputType": "sourcedAnswer",
        "includeImages": "false"
    }

    print(f"Sending API request to Linkup for: {company_name}")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"API response status: {response.status_code}")
        response.raise_for_status()

        result = response.json()
        if 'answer' in result:
            url_text = result['answer']
            url_pattern = re.compile(r'https?://\S+')
            url_match = url_pattern.search(url_text)

            if url_match:
                website_url = url_match.group(0)
                return re.sub(r'[.,;:"\')]\s*$', '', website_url)
        return ""

    except Exception as e:
        print(f"Error in API call: {e}")
        return ""

def analyze_icp_fit(company_name, website_url):
    if not website_url:
        return "1"

    url = "https://api.linkup.so/v1/search"
    headers = {
        "Authorization": f"Bearer {LINKUP_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "q": f"Analyze the website {website_url}. Determine if this company could be an Ideal Customer Profile (ICP) for my company https://www.linkup.so/. For context, we are selling a search API. We target AI companies, Tech Companies, and corporates, as well as consulting and financial firms. Our search API allows companies to enrich applications with real-time web knowledge and business intelligence, at scale. Consider factors like industry and whether they're likely to need API services, and if they might be building software products. Return a rating from 1 to 5, 1 being lowest ICP, 5 being highest ICP. Universities and schools should get a 3.  Only return the rating, nothing else.",
        "depth": "deep",
        "outputType": "sourcedAnswer",
        "includeImages": "false"
    }

    print(f"Sending ICP analysis request to Linkup for: {company_name}")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"ICP API response status: {response.status_code}")
        response.raise_for_status()

        result = response.json()
        if 'answer' in result:
            return result['answer']
        return "1"

    except Exception as e:
        print(f"Error in ICP API call: {e}")
        return "1"

def save_results(results):
    print(f"\nSaving results to {FILE}...")
    try:
        # First try to save to a temporary file
        temp_file = f"{FILE}.tmp"
        with open(temp_file, 'w') as f:
            json.dump(results, f, indent=2)

        # If successful, rename the temp file to the actual file
        if os.path.exists(FILE):
            os.replace(temp_file, FILE)
        else:
            os.rename(temp_file, FILE)

        print(f"Successfully saved {len(results)} results")

        # Verify the save
        with open(FILE, 'r') as f:
            saved_data = json.load(f)
            print(f"Verified save: {len(saved_data)} results in file")

    except Exception as e:
        print(f"Error saving results: {e}")
        # Try to clean up temp file if it exists
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass

def main():
    results = load_existing_data()
    print(f"\nLoaded {len(results)} existing results")

    # Find organizations to process
    to_process = {record_id: (results[record_id]["name"], results[record_id].get("domain"))
                  for record_id in results
                  if not results[record_id].get("website") and
                     results[record_id].get("name") and
                     (not results[record_id].get("icp_analysis") or results[record_id].get("icp_analysis") == "")}

    companies_to_process = dict(list(to_process.items())[:MAX_COMPANIES])

    print(f"\nFound {len(to_process)} organizations to process")
    print(f"Will process {len(companies_to_process)} organizations...")

    processed_count = 0
    websites_found = 0

    for record_id, (org_name, org_domain) in companies_to_process.items():
        print(f"\nProcessing: {org_name}")

        company_result = results[record_id]
        website_url = find_website_url(org_name, org_domain)

        if website_url:
            company_result["website"] = website_url
            websites_found += 1
            print(f"Found: {website_url}")

            time.sleep(2)
            icp_analysis = analyze_icp_fit(org_name, website_url)
            company_result["icp_analysis"] = icp_analysis
            print(f"Updated {org_name} with website: {website_url} and ICP: {icp_analysis}")
        else:
            # Set default ICP analysis to "1" when no website is found
            company_result["icp_analysis"] = "1"
            print(f"Updated {org_name} with default ICP: 1")

        results[record_id] = company_result
        processed_count += 1

        # Save after each company
        save_results(results)
        print(f"Saved results after processing {org_name}")

        if processed_count < len(companies_to_process):
            time.sleep(3)

    websites_with_analysis = sum(1 for r in results.values() if r.get("website") and r.get("icp_analysis"))

    print(f"\nFinal Results:")
    print(f"Processed {processed_count} organizations")
    print(f"Found {websites_found} websites")
    print(f"Total organizations with websites: {sum(1 for r in results.values() if r.get('website'))}")
    print(f"Total organizations with analysis: {websites_with_analysis}")

    # Final save with verification
    save_results(results)

if __name__ == "__main__":
    main()
```

# Try It Yourself

<AccordionGroup>
  <Accordion title="Customize Your ICP Definition">
    Try modifying the ICP analysis prompt to match your specific business needs:

    1. Update the description of your company
    2. List your target industries
    3. Define what makes an ideal customer for you
    4. Run the script and see how the results change
  </Accordion>

  <Accordion title="Add Company Size Estimation">
    Extend the script to also estimate company size:

    1. Create a new function similar to `analyze_icp_fit`
    2. Craft a prompt asking Linkup to estimate employee count
    3. Add this data to your results structure
    4. Use it as an additional factor in prioritization
  </Accordion>
</AccordionGroup>

# Conclusion

You've now built an automated system that transforms basic CRM information into actionable intelligence. By leveraging the Linkup API, you can:

1. **Save Time**: Eliminate manual research
2. **Improve Targeting**: Focus on the most promising leads
3. **Scale Your Process**: Handle hundreds of leads with ease

This approach combines the best of both worlds: AI-powered analysis with your business expertise to define what makes an ideal customer.

For more sophisticated implementations, check out our other tutorials or reach out to our support team!

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Company Descriptions Generator
Source: https://docs.linkup.so/pages/documentation/tutorials/company-descriptions

Building a tool to generate rich company descriptions using Linkup API

This tutorial will show you how to build a company description generator that takes a company name and country as input and returns comprehensive information about the company using the Linkup API's structured output feature.

## What We're Building

Our company description generator will:

* Take a company name and country as input
* Use Linkup API to search for information about the company
* Return structured data about the company (description, industry, size, location, etc.)

## Building the Generator

<Steps>
  <Step title="Define the Schema">
    Before we start coding, let's define the schema that specifies what information we want to extract about companies. This schema will be used throughout our implementation:

    <CodeGroup>
      ```python python [expandable]
      COMPANY_SCHEMA = {
          "type": "object",
          "properties": {
              "name": {
                  "type": "string",
                  "description": "The official name of the company"
              },
              "description": {
                  "type": "string",
                  "description": "A comprehensive description of what the company does"
              },
              "location": {
                  "type": "string",
                  "description": "Location of company headquarters"
              },
              "companySize": {
                  "type": "string",
                  "description": "Approximate number of employees"
              },
              "linkedInUrl": {
                  "type": "string",
                  "description": "Company's LinkedIn profile URL"
              }
          },
          "required": ["name", "description"]
      }
      ```

      ```javascript js [expandable]
      const COMPANY_SCHEMA = {
          "type": "object",
          "properties": {
              "name": {
                  "type": "string",
                  "description": "The official name of the company"
              },
              "description": {
                  "type": "string",
                  "description": "A comprehensive description of what the company does"
              },
              "location": {
                  "type": "string",
                  "description": "Location of company headquarters"
              },
              "companySize": {
                  "type": "string",
                  "description": "Approximate number of employees"
              },
              "linkedInUrl": {
                  "type": "string",
                  "description": "Company's LinkedIn profile URL"
              }
          },
          "required": ["name", "description"]
      };
      ```
    </CodeGroup>

    This schema defines all the fields we want to extract about a company. The required fields are `name`, `description`, and `industry`, while the rest are optional but provide valuable additional information.
  </Step>

  <Step title="Install the SDK">
    Next, let's install the Linkup SDK in your preferred language:

    <CodeGroup>
      ```python python
      pip install linkup-sdk
      ```

      ```javascript js
      npm i linkup-sdk
      ```
    </CodeGroup>
  </Step>

  <Step title="Set Up the Client">
    Initialize the Linkup client with your API key:

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>

    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")
      ```

      ```javascript js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: '<YOUR_LINKUP_API_KEY>',
      });
      ```
    </CodeGroup>
  </Step>

  <Step title="Create the Query Generator">
    Create a function to generate the search query:

    <CodeGroup>
      ```python python
      def generate_query(company_name: str, country: str) -> str:
          query = (
                  f"Find detailed information about {company_name} in {country}. "
                  "Include their main products/services, industry focus, company size, "
                  "and any notable achievements or recent news. Also find their "
                  "LinkedIn company page if available."
              )
          return query
      ```

      ```typescript js
      function generateQuery(companyName: string, country: string) {
          let query;

          query = (
                  `Find detailed information about ${companyName} in ${country}. ` +
                  "Include their main products/services, industry focus, company size, " +
                  "and any notable achievements or recent news. Also find their " +
                  "LinkedIn company page if available."
              );

          return query;
      }
      ```
    </CodeGroup>
  </Step>

  <Step title="Complete Implementation">
    Here's the complete implementation that puts everything together:

    <CodeGroup>
      ```python python
      from linkup import LinkupClient
      import json
      from typing import Dict, Any
      from pprint import pprint

      # Schema definition (from Step 1)
      COMPANY_SCHEMA = {
          "type": "object",
          "properties": {
              "name": {
                  "type": "string",
                  "description": "The official name of the company"
              },
              "description": {
                  "type": "string",
                  "description": "A comprehensive description of what the company does"
              },
              "location": {
                  "type": "string",
                  "description": "Location of company headquarters"
              },
              "companySize": {
                  "type": "string",
                  "description": "Approximate number of employees"
              },
              "linkedInUrl": {
                  "type": "string",
                  "description": "Company's LinkedIn profile URL"
              }
          },
          "required": ["name", "description"]
      }

      # Initialize the client
      client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")

      # Query generator (from Step 4)
      def generate_query(company_name: str, country: str) -> str:
          query = (
                  f"Find detailed information about {company_name} in {country}. "
                  "Include their main products/services, industry focus, company size, "
                  "and any notable achievements or recent news. Also find their "
                  "LinkedIn company page if available."
              )
          return query

      def generate_company_description(company_name: str, country: str) -> Dict[str, Any]:
          """
          Generate a structured description of a company using its name, country.

          Args:
              company_name: Name of the company
              country: Country where the company operates

          Returns:
              Dictionary containing structured company information
          """
          try:
              # Clean input
              company_name = company_name.strip()
              country = country.strip()

              # Generate search query using the function from Step 4
              query = generate_query(company_name, country)

              # Call Linkup API
              response = client.search(
                  query=query,
                  depth="deep",  # Use deep for more thorough results
                  output_type="structured",
                  structured_output_schema=json.dumps(COMPANY_SCHEMA)
              )

              return response

          except Exception as e:
              return {
                  "error": str(e),
                  "company_name": company_name,
                  "country": country
              }

      # Example usage
      if __name__ == "__main__":
          # Example companies
          companies = [
              ("Anthropic", "United States"),
              ("Stripe", "United States"),
              ("OpenAI", "United States")
          ]

          for company_name, country in companies:
              print(f"\nLooking up: {company_name} in {country}")
              result = generate_company_description(company_name, country)
              pprint(result)
      ```

      ```typescript js
      import { LinkupClient } from 'linkup-sdk';

      // Schema definition (from Step 1)
      const COMPANY_SCHEMA = {
          "type": "object",
          "properties": {
              "name": {
                  "type": "string",
                  "description": "The official name of the company"
              },
              "description": {
                  "type": "string",
                  "description": "A comprehensive description of what the company does"
              },
              "location": {
                  "type": "string",
                  "description": "Location of company headquarters"
              },
              "companySize": {
                  "type": "string",
                  "description": "Approximate number of employees"
              },
              "linkedInUrl": {
                  "type": "string",
                  "description": "Company's LinkedIn profile URL"
              }
          },
          "required": ["name", "description"]
      };

      // Initialize the client
      const client = new LinkupClient({
          apiKey: '<YOUR_LINKUP_API_KEY>',
      });

      // Query generator (from Step 4)
      function generateQuery(companyName: string, country: string) {
          let query;
          query = (
                  `Find detailed information about ${companyName} in ${country}. ` +
                  "Include their main products/services, industry focus, company size, " +
                  "and any notable achievements or recent news. Also find their " +
                  "LinkedIn company page if available."
              );
          return query;
      }

      async function generateCompanyDescription(companyName: string, country: string) {
          try {
              // Clean input
              companyName = companyName.trim();
              country = country.trim();

              // Generate search query using the function from Step 4
              const query = generateQuery(companyName, country);

              // Call Linkup API
              const response = await client.search({
                  query: query,
                  depth: "deep",  // Use deep for more thorough results
                  outputType: "structured",
                  structuredOutputSchema: COMPANY_SCHEMA
              });

              return response;

          } catch (error: any) {
              return {
                  error: error.message,
                  companyName: companyName,
                  country: country
              };
          }
      }

      // Example usage
      async function main() {
          // Example companies
          const companies = [
              ["Anthropic", "United States"],
              ["Stripe", "United States"],
              ["OpenAI", "United States"]
          ];

          for await (const [companyName, country] of companies) {
              console.log(`\nLooking up: ${companyName} in ${country}`);
              const result = await generateCompanyDescription(companyName, country);
              console.log(JSON.stringify(result, null, 2));
          }
      }

      main().catch(console.error);
      ```
    </CodeGroup>
  </Step>
</Steps>

## How It Works

The company description generator works in three main steps:

1. **Input Processing**: The tool takes a company name and country as input and cleans them.
2. **Query Generation**: It creates a search query that includes both the company name and country to improve search accuracy.
3. **Structured Output**: Uses Linkup's structured output feature with a comprehensive schema to ensure consistent, well-formatted results.

## Possible Enhancements

For a production version, consider adding:

* Add as much information you have about companies in the queries, to limit ambiguity about which company you are searching for.
* Implement rate limiting and error handling for API usage.
* Batch processing to search for multiple companies in parallel if you are enriching a dataset for example.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Company Intelligence Engine
Source: https://docs.linkup.so/pages/documentation/tutorials/company-intelligence/company-intelligence

Build a real-time company research system using the Linkup API.

In this tutorial, you'll learn how to build a real-time company intelligence system that automatically gathers and structures information about any company. This system is perfect for sales teams, market researchers, and anyone needing up-to-date company information.

## Prerequisites

Before starting, ensure you have:

* Python 3.7 or newer installed
* Basic familiarity with Python programming
* A Linkup API key (required for making requests)

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Project Setup

Let's start by creating a new project and installing the necessary dependencies:

```shell shell
# Create a new project directory
mkdir company-intel
cd company-intel

# Install required packages
pip install linkup-sdk pydantic fastapi uvicorn
```

## Implementation Guide

### 1. Define Your Data Structure

First, we'll create a data model that specifies exactly what company information we want to collect. Create a new file called `schema.py`:

```python python
from pydantic import BaseModel
from typing import List, Optional

class CompanyInfo(BaseModel):
    # Basic company information
    name: str = ""              # Company name
    website: str = ""           # Official website URL
    description: str = ""       # Brief company description

    # Detailed information
    latest_funding: str = ""    # Most recent funding information
    recent_news: List[str] = [] # Latest company news
    leadership_team: List[str] = [] # Key executives and leaders
    tech_stack: List[str] = []  # Technologies used by the company
```

This schema ensures our data is consistently structured and validated.

### 2. Build the Intelligence Engine

Next, create `company_intel.py` to handle the core functionality:

```python python
from linkup import LinkupClient
from schema import CompanyInfo

class CompanyIntelligence:
    def __init__(self, api_key: str):
        """Initialize the intelligence engine with your API key."""
        self.client = LinkupClient(api_key=api_key)

    def research_company(self, company_name: str) -> CompanyInfo:
        """
        Gather comprehensive information about a company.

        Args:
            company_name (str): Name of the company to research

        Returns:
            CompanyInfo: Structured company information
        """
        query = f"""
        Research {company_name} and provide:
        - Company name, website, and brief description
        - Most recent funding round or financial announcement
        - Current leadership team members
        - Technologies and tools they use
        - Recent news from the last 3 months

        Focus on current, verified information.
        """

        # Make the API request with structured output
        response = self.client.search(
            query=query,
            depth="deep",           # Get comprehensive results
            output_type="structured",
            structured_output_schema=CompanyInfo
        )

        return response
```

### 3. Create the API Layer

Now let's make our intelligence engine accessible via HTTP. Create `api.py`:

```python python
from fastapi import FastAPI, HTTPException
from company_intel import CompanyIntelligence

# Initialize FastAPI with metadata
app = FastAPI(
    title="Company Intelligence API",
    description="Real-time company research and intelligence",
    version="1.0.0"
)

# Create intelligence engine instance
intel = CompanyIntelligence(api_key="your-linkup-api-key")

@app.get("/company/{name}", tags=["Company Research"])
async def get_company_info(name: str):
    """
    Retrieve detailed information about a company.

    Parameters:
        name (str): Company name to research

    Returns:
        CompanyInfo: Structured company information
    """
    try:
        return intel.research_company(name)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error researching company: {str(e)}"
        )
```

## Using the System

### Basic Usage Example

At first, let's use the intelligence engine directly in Python. We will create a new file called `main.py` and add the following code to it:

```python python
from company_intel import CompanyIntelligence

# Initialize the intelligence engine
intel = CompanyIntelligence(api_key="your-api-key")

# Research a company
company = intel.research_company("Vercel")

# Access the information
print(f"Company: {company.name}")
print(f"Website: {company.website}")
print(f"Description: {company.description}")
print(f"Latest Funding: {company.latest_funding}")
print(f"Recent News: {', '.join(company.recent_news)}")
print(f"Leadership Team: {', '.join(company.leadership_team)}")
print(f"Technologies: {', '.join(company.tech_stack)}")
```

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

You can run the code by executing the following command:

```shell shell
python main.py
```

### Running the API Server

Let's now try our API server.

```shell shell
# Start the server with auto-reload enabled
uvicorn api:app --reload
```

You can now access the API at `http://localhost:8000/docs`.

#### Step 1

Click on the endpoint `GET /company/{name}`, and click on the `Try it out` button.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/company-intelligence/assets/step1.png" alt="Step 1" />

#### Step 2

<img src="https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/company-intelligence/assets/step2.png" alt="Step 2" />

Now, enter the company name, for example `Vercel`, and click on the `Execute` button.

#### Step 3

<img src="https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/company-intelligence/assets/step3.png" alt="Step 3" />

#### Step 4

You should see the response in JSON format.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/company-intelligence/assets/step4.png" alt="Step 4" />

## Response Examples

### Successful Response

A typical successful request to `/company/Vercel` returns:

```json
{
    "name": "Vercel",
    "website": "https://vercel.com",
    "description": "Vercel is a cloud platform for static sites and Serverless Functions that fits perfectly with your workflow. It enables developers to host websites and web services that deploy instantly and scale automatically.",
    "latest_funding": "Series D - $150M (December 2023)",
    "recent_news": [
        "Vercel announces Edge Functions improvements with streaming support",
        "New Next.js 14 release brings major performance improvements",
        "Vercel launches new Enterprise Security features"
    ],
    "leadership_team": [
        "Guillermo Rauch - CEO",
        "Malte Ubl - CTO"
    ],
    "tech_stack": [
        "Next.js",
        "React",
        "Node.js",
        "TypeScript",
        "PostgreSQL",
        "Redis",
        "AWS"
    ]
}
```

### Error Responses

The API returns appropriate error responses in these situations:

#### Company Not Found

```json
{
    "status_code": 404,
    "detail": "Unable to find information for the specified company",
    "timestamp": "2024-12-16T10:30:45Z"
}
```

#### Invalid API Key

```json
{
    "status_code": 401,
    "detail": "Invalid or missing API key",
    "timestamp": "2024-12-16T10:30:45Z"
}
```

#### Rate Limit Exceeded

```json
{
    "status_code": 429,
    "detail": "Rate limit exceeded. Please try again in 60 seconds",
    "timestamp": "2024-12-16T10:30:45Z"
}
```

## Engine Response Fields

| Field            | Type   | Description                     | Example                                       |
| ---------------- | ------ | ------------------------------- | --------------------------------------------- |
| name             | string | Company name                    | "Vercel"                                      |
| website          | string | Company website URL             | "[https://vercel.com](https://vercel.com)"    |
| description      | string | Brief company description       | "Vercel is a cloud platform..."               |
| latest\_funding  | string | Most recent funding information | "Series D - \$150M (December 2023)"           |
| recent\_news     | array  | List of recent news headlines   | \["Vercel announces...", "New Next.js 14..."] |
| leadership\_team | array  | List of key leadership members  | \["Guillermo Rauch - CEO", ...]               |
| tech\_stack      | array  | List of technologies used       | \["Next.js", "React", ...]                    |
| news\_sentiment  | float  | Optional sentiment score        | 0.8                                           |
| company\_size    | string | Optional size estimation        | "Large Enterprise"                            |

## Best Practices

For production use, consider implementing these best practices:

1. **Error Handling**
   * Implement comprehensive error handling for API calls
   * Log errors appropriately
   * Provide meaningful error messages to users

2. **Rate Limiting**
   * Implement rate limiting to avoid API quota issues
   * Consider using a queue for batch processing
   * Add retry logic for failed requests

3. **Caching**
   * Cache frequently requested company data
   * Use appropriate TTL values based on data freshness requirements
   * Implement cache invalidation strategies

4. **Data Validation**
   * Validate all input data
   * Use Pydantic's validation features
   * Implement data cleaning where necessary

## Common Applications

This system can be used for:

* Pre-sales research automation
* CRM data enrichment
* Competitor monitoring
* Market intelligence gathering
* Investment research
* Due diligence automation

## Conclusion

You now have a powerful company intelligence engine that provides:

* Real-time company information
* Structured, consistent data
* Easy API access
* Extensible architecture

Remember to:

* Keep your API key secure
* Respect API rate limits
* Implement appropriate caching for your use case
* Add error handling for production use

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Find LinkedIn Profiles
Source: https://docs.linkup.so/pages/documentation/tutorials/linkedin-profile

A practical guide to quickly locate official LinkedIn home‑page URLs for companies or people

This tutorial will show you how to build find the LinkedIn profile of a company or an individual using Linkup.

## What We'll Build

This tutorial will show you how to build find the LinkedIn profile of a company or an individual using Linkup.

* **Input**: Any text prompt that describes the profile you're after (company, school, person, etc.).
* **Process**:
  1. Send the prompt to the **Linkup API** with `depth="standard"`.
  2. Ask for **sourcedAnswer** output so we can inspect citations.
  3. Decide whether we're ≥ 99 % sure.
* **Output**: A single LinkedIn URL or `undefined`.

This pattern is perfect for enriching CRMs, onboarding forms, or internal tools where you need fast links with a very low false‑positive rate.

## How To Build

<Steps>
  <Step title="Install the SDK">
    <CodeGroup>
      ```python python
      pip install linkup-sdk
      ```

      ```javascript js
      npm i linkup-sdk
      ```
    </CodeGroup>
  </Step>

  <Step title="Set Up the Client">
    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")
      ```

      ```javascript js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: '<YOUR_LINKUP_API_KEY>',
      });
      ```
    </CodeGroup>

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Make the API Call">
    <CodeGroup>
      ```python python
      # 🔎  Example
      response = client.search(
          query="Please locate the official LinkedIn page for Linkup (their website is linkup.so).\nReturn only the LinkedIn home‑page URL.\nIf you're not at least 99 % sure the link is accurate, answer with undefined.",
          depth="standard",          # fast yet accurate
          output_type="sourcedAnswer",
          include_images=False,
      )
      print(response.answer)  # either the URL or 'undefined'
      ```

      ```javascript js
      // 🔎  Example
      const response = await client.search({
        query: `Please locate the official LinkedIn page for Linkup (their website is linkup.so).
        Return only the LinkedIn home‑page URL.
        If you're not at least 99 % sure the link is accurate, answer with undefined.`,
        depth: 'standard', // fast yet accurate
        outputType: 'sourcedAnswer',
        includeImages: false,
      });
      console.log(response.answer); // either the URL or 'undefined'
      ```
    </CodeGroup>
  </Step>

  <Step title="Craft Better Prompts">
    For best accuracy, include **at least two unique signals**:

    | ✅ Good signal         | 📝 Example                         |
    | --------------------- | ---------------------------------- |
    | Official domain       | "(their website is acme.com)"      |
    | City or region        | "based in Berlin, Germany"         |
    | Stock ticker          | "listed on NASDAQ : ACME"          |
    | Unique slogan/tagline | "company slogan 'Think tangerine'" |

    > **Tip:** Keep the "Return only the LinkedIn home‑page URL…" and the 99 % clause; it gives the model explicit, measurable instructions.
  </Step>

  <Step title="Batch Lookup">
    Need to process a list of companies? Here's a tiny batch helper:

    <CodeGroup>
      ```python python
      companies = [
          ("Stripe", "stripe.com"),
          ("Intercom", "intercom.com"),
          ("Monzo", "monzo.com"),
      ]

      for name, domain in companies:
          q = (
              f"Locate the official LinkedIn page for {name} (their website is {domain}). "
              "Return only the LinkedIn home‑page URL. If you're not at least 99 % sure, answer with undefined."
          )
          response = client.search(
              query=q,
              depth="standard",
              output_type="sourcedAnswer",
              include_images=False,
          )
          print(name, "→", response.answer)
      ```

      ```javascript js
      const companies = [
        ['Stripe', 'stripe.com'],
        ['Intercom', 'intercom.com'],
        ['Monzo', 'monzo.com'],
      ];

      for (const [name, domain] of companies) {
        const q = `Locate the official LinkedIn page for ${name} (their website is ${domain}). ` +
                  `Return only the LinkedIn home‑page URL. If you're not at least 99 % sure, answer with undefined.`;
        const response = await client.search({
          query: q,
          depth: 'standard',
          outputType: 'sourcedAnswer',
          includeImages: false,
        });
        console.log(name, '→', response.answer);
      }
      ```
    </CodeGroup>
  </Step>
</Steps>

## Advanced Enhancements

* **Fallback to Deep Search**: Retry with `depth="deep"` when standard depth yields `undefined`.
* **Multiple Entities**: Adjust the prompt to return an *array* of URLs when searching generic terms like "Acme Inc".
* **Integrate with CRMs**: Enrich company records automatically, then store URL + confidence + timestamp.
* **Rate Limiting**: Use `asyncio` / `Promise.allSettled` with a limiter when batch‑processing thousands.

## Conclusion

With fewer than 20 lines of code you now have a **LinkedIn‑URL resolver** that's fast, accurate, and completely configurable. Plug it into sign‑up flows, prospecting pipelines, or internal dashboards—and never copy‑paste a LinkedIn link again.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Peers Finder
Source: https://docs.linkup.so/pages/documentation/tutorials/peers-finder/peers-finder

Learn how to find comparable companies using the Linkup API with Google Sheets

Struggling to identify your company's true competitors and industry peers? This comprehensive step-by-step guide shows you how to leverage the powerful Linkup API with Google Sheets to build your own automated peer comparison tool. Perfect for investors, market analysts, and business strategists who need accurate competitive intelligence without expensive enterprise solutions.

Don't walk away if you're not a developer! This tutorial is designed to be accessible for everyone - no coding experience required. Just follow our simple copy-paste instructions and clear screenshots to set up your own peer comparison tool in minutes.

## Prerequisites

Before starting, ensure you have:

* A Google account
* A Linkup API key (required for making requests)

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Setup Guide

### Step 1: Open Google Sheets

1. Open a new Google Sheet
2. Name it "Company Peer Finder" or any name you prefer

### Step 2: Access Apps Script

1. Click on "Extensions" in the menu bar
2. Select "Apps Script" from the dropdown menu

![Extensions Menu](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/peers-finder/assets/extensions-menu.png)
*1: Accessing Apps Script through the Extensions menu*

### Step 3: Set Up the Script

1. In the Apps Script editor, delete any existing code
2. Copy and paste the following script:

```javascript
// Google Apps Script for Company Peer Finder with direct Linkup integration
// This script uses Linkup API to find peer companies based on input companies

// Configuration - replace with your actual Linkup API key
const LINKUP_API_KEY = "YOUR_API_KEY"; // Replace with your Linkup API key
const LINKUP_API_URL = "https://api.linkup.so/v1"; // Linkup API base URL

// Create the menu when the spreadsheet opens
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Peer Finder')
    .addItem('Extract Common Characteristics', 'extractCommonCharacteristics')
    .addItem('Find Peer Companies', 'findPeerCompanies')
    .addToUi();
}

// Function to extract common characteristics from input companies
function extractCommonCharacteristics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName('Input Companies');
  const charSheet = ss.getSheetByName('Characteristics');
  
  if (!inputSheet || !charSheet) {
    setupSpreadsheet();
    return;
  }

  const companies = inputSheet.getRange('A2:A6').getValues().flat().filter(Boolean);
  if (companies.length === 0) {
    SpreadsheetApp.getUi().alert('Please enter at least one company name in the Input Companies sheet.');
    return;
  }

  const characteristics = [];
  for (const company of companies) {
    const response = fetchCompanyData(company);
    if (response && response.characteristics) {
      characteristics.push(...response.characteristics);
    }
  }

  // Count frequency of each characteristic
  const charCount = {};
  characteristics.forEach(char => {
    charCount[char] = (charCount[char] || 0) + 1;
  });

  // Sort by frequency
  const sortedChars = Object.entries(charCount)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => [char, count, false]);

  // Update characteristics sheet
  charSheet.clear();
  charSheet.getRange(1, 1, 1, 3).setValues([['Characteristic', 'Frequency', 'Use for Search']]);
  if (sortedChars.length > 0) {
    charSheet.getRange(2, 1, sortedChars.length, 3).setValues(sortedChars);
  }
}

// Function to find peer companies based on selected characteristics
function findPeerCompanies() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const charSheet = ss.getSheetByName('Characteristics');
  const resultsSheet = ss.getSheetByName('Peer Companies');
  
  if (!charSheet || !resultsSheet) {
    setupSpreadsheet();
    return;
  }

  const selectedChars = charSheet.getRange('B2:B').getValues()
    .flat()
    .map((checked, i) => checked ? charSheet.getRange(i + 2, 1).getValue() : null)
    .filter(Boolean);

  if (selectedChars.length === 0) {
    SpreadsheetApp.getUi().alert('Please select at least one characteristic to use for finding peer companies.');
    return;
  }

  const peers = findPeersByCharacteristics(selectedChars);
  
  // Update results sheet
  resultsSheet.clear();
  resultsSheet.getRange(1, 1, 1, 4).setValues([['Company', 'Match Score', 'Industry', 'Size']]);
  if (peers.length > 0) {
    resultsSheet.getRange(2, 1, peers.length, 4).setValues(peers);
  }
}

// Helper function to fetch company data from Linkup API
function fetchCompanyData(companyName) {
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${LINKUP_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = UrlFetchApp.fetch(`${LINKUP_API_URL}/companies/search?q=${encodeURIComponent(companyName)}`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error(`Error fetching data for ${companyName}:`, error);
    return null;
  }
}

// Helper function to find peers based on characteristics
function findPeersByCharacteristics(characteristics) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKUP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ characteristics })
  };

  try {
    const response = UrlFetchApp.fetch(`${LINKUP_API_URL}/companies/peers`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error('Error finding peers:', error);
    return [];
  }
}

// Function to set up the initial spreadsheet structure
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or clear sheets
  const sheets = ['Input Companies', 'Characteristics', 'Peer Companies'];
  sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.clear();
  });

  // Set up Input Companies sheet
  const inputSheet = ss.getSheetByName('Input Companies');
  inputSheet.getRange('A1').setValue('Enter up to 5 company names below:');
  inputSheet.getRange('A2:A6').setBackground('#f3f3f3');

  // Set up Characteristics sheet
  const charSheet = ss.getSheetByName('Characteristics');
  charSheet.getRange('A1:C1').setValues([['Characteristic', 'Frequency', 'Use for Search']]);
  charSheet.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build());

  // Set up Peer Companies sheet
  const resultsSheet = ss.getSheetByName('Peer Companies');
  resultsSheet.getRange('A1:D1').setValues([['Company', 'Match Score', 'Industry', 'Size']]);

  // Hide unused sheets
  ss.getSheets().forEach(sheet => {
    if (!sheets.includes(sheet.getName())) {
      sheet.hideSheet();
    }
  });

  SpreadsheetApp.getUi().alert('Spreadsheet setup complete! You can now enter company names and use the Peer Finder menu.');
}
```

### Step 4: Configure Your API Key

1. Replace `YOUR_API_KEY` with your actual Linkup API key
2. If you don't have an API key:
   * Go to [app.linkup.so](https://app.linkup.so)
   * Create an account or sign in
   * Navigate to your API settings
   * Copy your API key

### Step 5: Save the Script

1. Click the "Save" button (or press Ctrl+S/Cmd+S)

### Step 6: Authorize the Script

1. When prompted, authorize the script to:
   * Access your Google Sheets
   * Make external API calls
   * Display dialogs

![Authorization Screen](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/peers-finder/assets/authorization-screen.png)
*2: The Google authorization screen*

### Step 7: Initialize the Spreadsheet

1. Click "Run" and select "SetupSpreadsheet"

![Setup Spreadsheet](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/peers-finder/assets/setup-spreadsheet.png)
*3: Selecting SetupSpreadsheet*

### Step 8: Verify Setup

1. Look for a confirmation popup in your main sheet

![Confirmation Popup](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/peers-finder/assets/confirmation-popup.png)
*4: The confirmation popup*

### Step 9: Launch the Tool

1. Click "Run" and select "OnOpen"

![OnOpen Selection](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/documentation/tutorials/peers-finder/assets/onopen-selection.png)
*5: Selecting OnOpen*

## Using the Peer Finder

### Step 1: Enter Companies

1. Go to the "Input Companies" sheet
2. Enter up to 5 companies in cells A2-A6
3. Make sure to enter the full company names

### Step 2: Extract Characteristics

1. Click on the "Peer Finder" menu
2. Select "Extract Common Characteristics"
3. Wait for the process to complete
4. Review the extracted characteristics in the "Characteristics" sheet

### Step 3: Select Characteristics

1. In the "Characteristics" sheet, review the list of common characteristics
2. Use the checkboxes in column B to select which characteristics to use for finding peer companies
3. Select at least one characteristic

### Step 4: Find Peer Companies

1. Click on the "Peer Finder" menu again
2. Select "Find Peer Companies"
3. Wait for the process to complete
4. Review the list of peer companies in the "Peer Companies" sheet

### Step 5: Review and Refine

1. Review the list of peer companies
2. If needed, go back to Step 3 and adjust your characteristic selections
3. Run the peer finder again with different characteristics

<Info>
  For more detailed examples and use cases, check out our [Prompt Catalog](../../../pages/documentation/tutorials/prompt-catalog).
</Info>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Prompts Catalog
Source: https://docs.linkup.so/pages/documentation/tutorials/prompt-catalog

Examples of typical prompts for the Linkup API

Here are some example prompts designed to power AI agents across topics.

<Note>These prompts can be used as inspiration and should be adapted to your specific use cases</Note>

<AccordionGroup>
  <Accordion title="People Research">
    <AccordionGroup>
      <Accordion title="Professional Biography Generator">
        ### Purpose

        Generate a factual, professional biography.

        ### Prompt

        ```markdown
        Write a professional biography for [Full Name] from [Company Name]. 

        Requirements:
        - Focus on current role and key responsibilities
        - Include last 2-3 positions with dates
        - Mention educational background and relevant certifications
        - Highlight notable achievements with specific metrics
        - Include any relevant company news from the past 6 months
        - Keep tone neutral and factual, avoid marketing language
        - Write as a single paragraph of 150-200 words
        - Include specific dates and quantifiable metrics where possible

        Please structure the biography to be suitable for [intended use: corporate website/press release/conference bio].
        ```
      </Accordion>

      <Accordion title="LinkedIn Profile Lookup">
        ### Purpose

        Find LinkedIn profiles and titles.

        ### Prompt

        ```markdown
        You are tasked with identifying the LinkedIn profile and current job title of an individual, based on limited known information. Find the LinkedIn profile URL of the person and their most current or relevant job title.

        Inputs:
        - First name: {first name}
        - Last name: {last name}
        - Likely email: {email address}
        - Likely company: {company name}

        Always return two fields:
        1. linkedin_profile_url
        2. job_title

        If either field cannot be confidently found, return an empty string for that field. Prioritize accuracy and recency based on publicly available LinkedIn data. Do not return any additional metadata or commentary.
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Sales Enablement">
    <AccordionGroup>
      <Accordion title="B2B Sales Call Preparation">
        ### Purpose

        Generate comprehensive sales preparation document.

        ### Prompt

        ```markdown
        As an AI sales analyst assistant, help me prepare for my upcoming B2B sales call.

        Context:
        - Company I represent: [Company Name] (www.companywebsite.com)
        - My role: B2B SaaS salesperson
        - Prospect company: [Prospect Company Name] (www.prospectcompanywebsite.com)
        - Prospect contact: [Prospect Contact Name]
        - Meeting type: First discovery call

        Please provide a detailed sales call preparation document with the following sections:

        1. Company Analysis
        - Core business model and value proposition
        - Recent company milestones or news (last 3-6 months)
        - Key market position and competitors
        - Current tech stack (if available)
        - Potential pain points based on their business model

        2. Contact Research
        - Professional background
        - Recent professional activities or achievements
        - Shared connections or interests for rapport building
        - Social media presence highlights (LinkedIn, Twitter, etc.)
        - Publications or speaking engagements, if any

        3. Discovery Questions (prioritized by importance)
        - Questions about their current financial operations
        - Questions about their growth plans
        - Questions about their decision-making process
        - Questions about their current challenges
        - Technical integration questions
        - Budget and timeline questions
        - Success criteria questions

        4. Value Proposition Alignment
        - Specific Qonto features that address their likely pain points
        - Industry-specific use cases and success stories
        - Competitive advantages relevant to their business
        - ROI calculations or metrics relevant to their industry
        - Integration benefits with their current tech stack

        5. Risk Mitigation
        - Potential objections and prepared responses
        - Competitor comparison points
        - Implementation concerns and solutions

        Please use available public information to make data-driven assumptions and highlight any areas where additional research might be needed.

        Output format: Structured document with clear sections, bullet points, and specific actionable insights. Include sources for any external data or news referenced.

        Note: If certain information isn't available, please provide strategic assumptions based on the company's industry, size, and business model.
        ```
      </Accordion>

      <Accordion title="Channel & Partner Discovery">
        ### Purpose

        Identify strategic partners and resellers.

        ### Prompt

        ```markdown
        Search for any public partner/reseller directories on the company's website. Extract examples of certified partners, technology alliances, or regional resellers.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        Identify strategic partners, resellers, or technology alliances listed on the company's website.

        Instructions:
        - Check for partner directories, alliances, or "Where to Buy" pages
        - List named partners and categorize by type (reseller, tech partner, distributor)
        - Capture geographic coverage if available
        - Only use official content and disclosures from the website
        - Ignore marketplaces or crowd-sourced listings
        ```
      </Accordion>

      <Accordion title="Competitor Positioning Analysis">
        ### Purpose

        Analyze customer success stories and testimonials.

        ### Prompt

        ```markdown
        Retrieve customer case studies or testimonials from the company's official site. Identify the industries or company sizes most frequently referenced. Extract headline results where available (e.g., ROI, time saved).

        Input:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        Identify customer success stories, testimonials, or case studies to support B2B sales or product validation.

        Instructions:
        - Locate sections labeled "Customers", "Case Studies", "Success Stories", or similar
        - Extract customer logos, industries served, and headline outcomes
        - Focus on enterprise or notable brand references
        - Avoid paraphrasing unsupported claims. Stick to published content only
        ```
      </Accordion>

      <Accordion title="Pricing Page Analysis">
        ### Purpose

        Compare pricing plans and features.

        ### Prompt

        ```markdown
        You are tasked with identifying and comparing pricing plans from the company's official website. Extract the key features, limitations, and price points for each tier (e.g., Free, Pro, Enterprise). Highlight differences relevant to a customer deciding between options.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        Extract and compare pricing plans and feature sets from the company's official website to help users evaluate the most suitable option.

        Instructions:
        - Visit the company's pricing or plans page
        - Identify all available subscription tiers or plans (e.g., Free, Pro, Business, Enterprise)
        - For each plan, extract:
          - Price (if available)
          - Core features
          - Feature or usage limits
        - Highlight the key differences between tiers
        - Use only official website information; avoid external aggregators or resellers
        - Maintain a neutral, factual tone. Do not speculate on unpublished details
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Company Research">
    <AccordionGroup>
      <Accordion title="Business Activity Analysis">
        ### Purpose

        Analyze company operations and value chain.

        ### Prompt

        ```markdown
        You are tasked with producing a concise overview of a company's business operations based on its official website.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        Write a short, structured summary that describes what the company does, how it fits into the value chain, the types of products or services it offers, and the markets or industries it serves.

        Instructions:
        - Follow a clear information hierarchy
        - Maintain a neutral, fact-based tone. Avoid promotional language, assumptions, or speculation
        - Use only publicly available information from the company's official website
        ```
      </Accordion>

      <Accordion title="Website Lookup">
        ### Purpose

        Find company website from email and company name.

        ### Prompt

        ```markdown
        You are tasked with identifying the most likely official website URL for a company using two pieces of information:
        - The email address: {email_address}
        - The company name: {company_name}

        Objective:
        - Determine the correct company website URL with high confidence.

        Instructions:
        - Return only the verified company website URL and nothing else
        - Only consider professional and verified domains
        - If the email domain is a free, generic provider (e.g., gmail.com, yahoo.com, hotmail.com, icloud.com), ignore it entirely
        - If the company name appears to be generic or non-corporate (e.g., "personal", "perso", "n/a"), do not return any result
        - Only return a result if you are 100% certain that the website is accurate and directly associated with the company
        ```
      </Accordion>

      <Accordion title="ICP Analysis">
        ### Purpose

        Determine Ideal Customer Profile.

        ### Prompt

        ```markdown
        Using the company's official website, LinkedIn profile, and any publicly available content, determine the Ideal Customer Profile (ICP) for the following company.

        Include details on:
        - Industry
        - Target customer segment (e.g., SMB, mid-market, enterprise)
        - Geography (if relevant)
        - Buyer personas (typical roles or job titles targeted)
        - Common pain points the company addresses
        - Core value proposition
        - Purchase triggers
        - Notable customers (if publicly available)

        Context:
        - Company: {company name}
        - Company website: {company website URL}
        - Company LinkedIn: {company LinkedIn URL}
        ```
      </Accordion>

      <Accordion title="Corporate Structure Analysis">
        ### Purpose

        Find related company entities.

        ### Prompt

        ```markdown
        You are conducting a corporate structure analysis to uncover entities that have a legal, ownership, or brand relationship with the following organization:
        - Company Name: {company name}
        - Official Website: {company website URL}

        Identify affiliated entities falling into any of the categories below:
        - Ultimate parent or holding companies
        - Subsidiaries or wholly owned entities
        - Sister companies under the same corporate group
        - Commercial or public-facing brands operated by the company

        For each related entity, return:
        - Company or Brand Name
        - Official Website URL

        Instructions:
        - Only return official websites (no redirects to third-party sources)
        - Exclude all third-party directories or aggregators
        - Use only verifiable and publicly available sources (e.g., investor relations pages, press releases, legal disclaimers, or corporate "About" pages)
        ```
      </Accordion>

      <Accordion title="French Entity Lookup">
        ### Purpose

        Find French SIREN numbers.

        ### Prompt

        ```markdown
        You are tasked with identifying all French SIREN numbers associated with a given company. Return a list of valid SIREN numbers (9-digit French business identifiers) related to the specified company.

        Input:
        - Company name: {company name}
        - Website: {company website URL}
        - LinkedIn URL: {company LinkedIn URL}

        Instructions:
        - Only return SIREN numbers. Each SIREN must be exactly 9 digits
        - Do not include any other information such as company names, addresses, or commentary
        - If no SIRENs are found, return an empty array: []
        - Use only authoritative or verifiable sources (e.g. government registries or the company's official disclosures)
        ```
      </Accordion>

      <Accordion title="Hiring Analysis">
        ### Purpose

        Analyze job openings and hiring focus.

        ### Prompt

        ```markdown
        Identify current open roles from a company's careers page. Summarize which departments or functions are hiring the most and extract signals on growth areas (e.g., expansion into new markets, investment in AI, etc.)

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        - Discover current hiring activity and growth signals by analyzing open roles on the company's careers page.

        Instructions:
        - Go to the company's careers or jobs section
        - Extract open roles and group them by function (e.g., Engineering, Sales, Marketing)
        - Highlight the top hiring areas and any geographic expansion indicators
        - Do not use LinkedIn Jobs or third-party job boards unless hosted by the company
        - Return job counts, locations, and job families where possible
        ```
      </Accordion>

      <Accordion title="Integration Analysis">
        ### Purpose

        List third-party integrations.

        ### Prompt

        ```markdown
        Based on the official website, app marketplace, or help docs, list all third-party platforms this company integrates with (e.g., Salesforce, Slack, Zapier). Note integration depth where possible (native vs. API-based)

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Objective:
        Identify third-party platforms or software tools the company integrates with, to evaluate ecosystem fit and technical compatibility.

        Instructions:
        - Search the website, product pages, or help documentation for mentions of integrations
        - Look for app marketplaces, partner pages, or API documentation
        - List integrations with known platforms (e.g., Salesforce, Slack, Shopify)
        - Where possible, distinguish between native integrations and third-party connectors
        - Avoid speculation; only return confirmed integrations
        ```
      </Accordion>

      <Accordion title="LinkedIn Company Profile Lookup">
        ### Purpose

        Find official LinkedIn company profiles.

        ### Prompt

        ```markdown
        You are tasked with identifying the official LinkedIn company profile for a given organization based on its name and website.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}

        Instructions:
        - Return only the LinkedIn company profile URL (e.g., https://www.linkedin.com/company/example-name/)
        - Only return a result if you are at least 99% certain that the LinkedIn profile corresponds to the specified company and domain
        - If you are unsure or the match is ambiguous, return: undefined
        - Do not include any additional metadata, commentary, or company details
        - Prioritize official LinkedIn pages tied to the domain and business identity (logo, industry, description, etc.)
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Support & Documentation">
    <AccordionGroup>
      <Accordion title="Technical Support">
        ### Purpose

        Help support agents answer technical questions.

        ### Prompt

        ```markdown
        As a technical support assistant, help me route and answer the following support query:

        Query: [Support Query]
        Product Category: [Product Category]

        Priority Sources:
        1. support.apple.com
        2. support.lenovo.com
        3. support.microsoft.com
        4. support.hp.com
        5. cnet.com
        ```
      </Accordion>

      <Accordion title="Documentation Search">
        ### Purpose

        Search through official documentation.

        ### Prompt

        ```markdown
        Search through the following official documentation sources to answer the user's question:

        Sources:
        - {source_1}
        - {source_2}
        - {source_3}
        - {source_4}
        - {source_5}
        - {source_6}

        Context: {context_on_the_user/company}
        User question: {user_question}
        ```
      </Accordion>

      <Accordion title="Privacy Policy Lookup">
        ### Purpose

        Answer privacy and GDPR questions.

        ### Prompt

        ```markdown
        You are tasked with answering a user question related to data privacy, data protection rights, or GDPR compliance for a specific company.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}
        - User question: {user question}

        Objective:
        Retrieve accurate and up-to-date information that answers the user's privacy-related question based strictly on the company's publicly available official sources.

        Instructions:
        - Search the official company website (and any dedicated privacy or legal policy pages it links to) to find relevant information
        - Only use official domains operated by the company
        - Do not use third-party sources such as LinkedIn, Wikipedia, or external aggregators
        - Ensure your response is based on the actual privacy policy, terms of service, or data compliance sections of the website
        - Maintain a neutral tone and stick to the facts. Avoid paraphrasing that could change the legal meaning of the content
        ```
      </Accordion>

      <Accordion title="Refund Policy Lookup">
        ### Purpose

        Find refund and return policies.

        ### Prompt

        ```markdown
        You are assisting with a customer support inquiry regarding refund, return, or exchange policies for a specific company.

        Inputs:
        - Company name: {company name}
        - Company website: {company website URL}
        - User question: {user question}

        Objective:
        Provide a clear and accurate response to the user's question using only information from the company's official website.

        Instructions:
        - Search only the company's official website or customer support subdomain
        - Do not use external aggregators like RetailMeNot, Trustpilot, or Reddit
        - Locate and summarize the most relevant refund or return policy based on the user's query
        - If the company has region-specific return terms (e.g. EU vs. US), ensure your answer is aligned with the correct market context if known
        - Maintain a neutral, fact-based tone. Avoid assumptions or language that could misrepresent company policy
        - If the return policy is not available or clearly stated, indicate that transparently
        ```
      </Accordion>

      <Accordion title="Hotel Information Lookup">
        ### Purpose

        Find hotel information for booking assistance.

        ### Prompt

        ```markdown
        You are assisting a user with questions about a specific hotel listed on a travel or booking website.

        Inputs:
        - Hotel name: {hotel name}
        - Hotel website (if available): {hotel website URL}
        - User question: {user question}

        Objective:
        Provide an accurate, concise answer to the user's question using verified and up-to-date information from the hotel's official website or booking partner pages.

        Instructions:
        - Prioritize the hotel's official website for information
        - If unavailable, you may also consult trusted booking platforms (e.g., Booking.com, Expedia, Hotels.com)
        - Do not use crowd-sourced platforms or user forums
        - Focus only on factual data such as room size, amenities, services, or policies
        - Avoid assumptions or marketing language
        - If the answer is unclear or unavailable, say so transparently
        - Keep responses helpful and to the point
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>
</AccordionGroup>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Signup Radar 
Source: https://docs.linkup.so/pages/documentation/tutorials/signup-radar

Building a signup radar to get to know your new users

This tutorial will show you how to build a simple "signup radar" that takes an email address and returns information about the person who signed up, using the Linkup API's structured output feature.

## What We're Building

Our signup radar will:

* Take an email address as input
* Use Linkup API to search for information about the person
* Return structured data about the person (name, position, company, LinkedIn URL, etc.)

## Prerequisites

* A Linkup API key
* Python or Node.js installed

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

<Steps>
  <Step title="Install the SDK">
    <CodeGroup>
      ```python python
      pip install linkup-sdk
      ```

      ```javascript js
      npm i linkup-sdk
      ```
    </CodeGroup>
  </Step>

  <Step title="Set Up the Client">
    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="<YOUR_LINKUP_API_KEY>")
      ```

      ```javascript js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: '<YOUR_LINKUP_API_KEY>',
      });
      ```
    </CodeGroup>
  </Step>

  <Step title="Define the Structured Output Schema">
    The key to our signup radar is using Linkup's structured output feature. We need to define a schema that specifies what information we want to extract.

    <CodeGroup>
      ```python python
      import json

      schema = {
        "type": "object",
        "properties": {
          "fullName": {
            "type": "string",
            "description": "The full name of the person"
          },
          "company": {
            "type": "string",
            "description": "The company the person works for"
          },
          "position": {
            "type": "string",
            "description": "The job title or position of the person"
          },
          "linkedInUrl": {
            "type": "string",
            "description": "The LinkedIn profile URL of the person"
          },
          "companyWebsite": {
            "type": "string",
            "description": "The website of the company"
          },
          "additionalInfo": {
            "type": "string",
            "description": "Any additional relevant information about the person"
          }
        },
        "required": ["fullName", "company"]
      }

      schema_str = json.dumps(schema)
      ```

      ```javascript js
      const schema = {
        type: "object",
        properties: {
          fullName: {
            type: "string",
            description: "The full name of the person"
          },
          company: {
            type: "string",
            description: "The company the person works for"
          },
          position: {
            type: "string",
            description: "The job title or position of the person"
          },
          linkedInUrl: {
            type: "string",
            description: "The LinkedIn profile URL of the person"
          },
          companyWebsite: {
            type: "string",
            description: "The website of the company"
          },
          additionalInfo: {
            type: "string",
            description: "Any additional relevant information about the person"
          }
        },
        required: ["fullName", "company"]
      };
      ```
    </CodeGroup>
  </Step>

  <Step title="Create the Signup Radar Function">
    <CodeGroup>
      ```python python
      def signup_radar(email):
          # Extract name and domain
          name_part = email.split('@')[0]
          domain = email.split('@')[1]
          
          # Format name for searching (convert saksena to Saksena)
          formatted_name = name_part.capitalize()
          
          # Determine company from domain (if not common email provider)
          company_hint = ""
          common_domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"]
          if domain not in common_domains:
              company_hint = domain.split('.')[0]
          
          # Create search query
          if company_hint:
              query = f"Find the LinkedIn profile URL for {formatted_name} who works at {company_hint}. Return their full name, current position, and company information."
          else:
              query = f"Find the LinkedIn profile URL for someone with the email username {formatted_name}. Return their full name, current position, and company information."
          
          # Call Linkup API
          response = client.search(
              query=query,
              depth="deep",  # Use deep for more thorough results
              output_type="structured",
              structured_output_schema=schema_str
          )
          
          return response

      # Example usage
      from pprint import pprint

      result = signup_radar("philippe@linkup.so")
      pprint(result)
      ```

      ```javascript js
      async function signupRadar(email) {
          // Extract name and domain
          const [namePart, domain] = email.split('@');
          
          // Format name for searching
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          
          // Determine company from domain (if not common email provider)
          let companyHint = "";
          const commonDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];
          if (!commonDomains.includes(domain)) {
              companyHint = domain.split('.')[0];
          }
          
          // Create search query
          let query;
          if (companyHint) {
              query = `Find the LinkedIn profile URL for ${formattedName} who works at ${companyHint}. Return their full name, current position, and company information.`;
          } else {
              query = `Find the LinkedIn profile URL for someone with the email username ${formattedName}. Return their full name, current position, company, and LinkedIn URL.`;
          }
          
          // Call Linkup API
          const response = await client.search({
              query: query,
              depth: "deep",  // Use deep for more thorough results
              outputType: "structured",
              structuredOutputSchema: schema
          });
          
          return response;
      }

      // Example usage
      signupRadar("philippe@linkup.so").then(console.log);
      ```
    </CodeGroup>
  </Step>

  <Step title="Enhance Query Generation">
    Let's improve our query to get better results:

    <CodeGroup>
      ```python python
      def generate_query(email):
          name_part = email.split('@')[0]
          domain = email.split('@')[1]
          
          # Handle different name formats (snake_case, dot.case, etc.)
          if "_" in name_part:
              name_parts = name_part.split("_")
              formatted_name = " ".join(part.capitalize() for part in name_parts)
          elif "." in name_part:
              name_parts = name_part.split(".")
              formatted_name = " ".join(part.capitalize() for part in name_parts)
          else:
              formatted_name = name_part.capitalize()
          
          # Determine company from domain
          common_domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"]
          if domain not in common_domains:
              company = domain.split('.')[0].capitalize()
              return f"Find the LinkedIn profile URL for this person: {formatted_name} at {company}. If the domain of the email address ({domain}) is not a common email provider, it is probably the name of the company this person works for and {domain} is probably the company website, so search specifically for someone with that name at this company. Return their full name, position, company details, LinkedIn URL, as well as any relevant information you can find about them."
          else:
              return f"Find the LinkedIn profile URL for this person with email username {formatted_name}. Return their full name, current position, company, and LinkedIn URL."
      ```

      ```javascript js
      function generateQuery(email) {
          const [namePart, domain] = email.split('@');
          
          // Handle different name formats (snake_case, dot.case, etc.)
          let formattedName;
          if (namePart.includes("_")) {
              formattedName = namePart.split("_")
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ");
          } else if (namePart.includes(".")) {
              formattedName = namePart.split(".")
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ");
          } else {
              formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          }
          
          // Determine company from domain
          const commonDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];
          if (!commonDomains.includes(domain)) {
              const company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
              return `Find the LinkedIn profile URL for this person: ${formattedName} at ${company}. If the domain of the email address (${domain}) is not a common email provider, it is probably the name of the company this person works for and ${domain} is probably the company website, so search specifically for someone with that name at this company. Return their full name, position, company details, and LinkedIn URL, as well as any relevant information you can find about them.`;
          } else {
              return `Find the LinkedIn profile URL for this person with email username ${formattedName}. Return their full name, current position, company, and LinkedIn URL.`;
          }
      }
      ```
    </CodeGroup>
  </Step>

  <Step title="Put It All Together">
    Here's the complete implementation:

    <CodeGroup>
      ```python python [expandable]
      from linkup import LinkupClient
      import json
      from pprint import pprint

      class SignupRadar:
          def __init__(self, api_key):
              self.client = LinkupClient(api_key=api_key)
              self.schema = {
                  "type": "object",
                  "properties": {
                      "fullName": {
                          "type": "string",
                          "description": "The full name of the person"
                      },
                      "company": {
                          "type": "string",
                          "description": "The company the person works for"
                      },
                      "position": {
                          "type": "string",
                          "description": "The job title or position of the person"
                      },
                      "linkedInUrl": {
                          "type": "string",
                          "description": "The LinkedIn profile URL of the person"
                      },
                      "companyWebsite": {
                          "type": "string",
                          "description": "The website of the company"
                      },
                      "additionalInfo": {
                          "type": "string",
                          "description": "Any additional relevant information about the person"
                      }
                  },
                  "required": ["fullName", "company"]
              }
              self.schema_str = json.dumps(self.schema)
          
          def generate_query(self, email):
              name_part = email.split('@')[0]
              domain = email.split('@')[1]
              
              # Handle different name formats (snake_case, dot.case, etc.)
              if "_" in name_part:
                  name_parts = name_part.split("_")
                  formatted_name = " ".join(part.capitalize() for part in name_parts)
              elif "." in name_part:
                  name_parts = name_part.split(".")
                  formatted_name = " ".join(part.capitalize() for part in name_parts)
              else:
                  formatted_name = name_part.capitalize()
              
              # Determine company from domain
              common_domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"]
              if domain not in common_domains:
                  company = domain.split('.')[0].capitalize()
                  return f"Find the LinkedIn profile URL for this person: {formatted_name} at {company}. If the domain of the email address ({domain}) is not a common email provider, it is probably the name of the company this person works for and {domain} is probably the company website, so search specifically for someone with that name at this company. Return their full name, position, company details, LinkedIn URL, as well as any relevant information you can find about them."
              else:
                  return f"Find the LinkedIn profile URL for this person with email username {formatted_name}. Return their full name, current position, company, and LinkedIn URL."
          
          def lookup(self, email):
              query = self.generate_query(email)
              
              response = self.client.search(
                  query=query,
                  depth="deep",  # Use deep for more thorough results
                  output_type="structured",
                  structured_output_schema=self.schema_str
              )
              
              return response

      # Example usage
      if __name__ == "__main__":
          radar = SignupRadar(api_key="<YOUR_LINKUP_API_KEY>")
          
          # Example emails
          emails = [
              "philippe@linkup.so",
              "boris@linkup.so"
          ]
          
          for email in emails:
              print(f"\nLooking up: {email}")
              result = radar.lookup(email)
              pprint(result)
      ```

      ```javascript js [expandable]
      import { LinkupClient } from 'linkup-sdk';

      class SignupRadar {
          constructor(apiKey) {
              this.client = new LinkupClient({
                  apiKey: apiKey,
              });
              
              this.schema = {
                  type: "object",
                  properties: {
                      fullName: {
                          type: "string",
                          description: "The full name of the person"
                      },
                      company: {
                          type: "string",
                          description: "The company the person works for"
                      },
                      position: {
                          type: "string",
                          description: "The job title or position of the person"
                      },
                      linkedInUrl: {
                          type: "string",
                          description: "The LinkedIn profile URL of the person"
                      },
                      companyWebsite: {
                          type: "string",
                          description: "The website of the company"
                      },
                      additionalInfo: {
                          type: "string",
                          description: "Any additional relevant information about the person"
                      }
                  },
                  required: ["fullName", "company"]
              };
          }
          
          generateQuery(email) {
              const [namePart, domain] = email.split('@');
              
              // Handle different name formats (snake_case, dot.case, etc.)
              let formattedName;
              if (namePart.includes("_")) {
                  formattedName = namePart.split("_")
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(" ");
              } else if (namePart.includes(".")) {
                  formattedName = namePart.split(".")
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(" ");
              } else {
                  formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
              }
              
              // Determine company from domain
              const commonDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];
              if (!commonDomains.includes(domain)) {
                  const company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
                  return `Find the LinkedIn profile URL for this person: ${formattedName} at ${company}. If the domain of the email address (${domain}) is not a common email provider, it is probably the name of the company this person works for and ${domain} is probably the company website, so search specifically for someone with that name at this company. Return their full name, position, company details, and LinkedIn URL, as well as any relevant information you can find about them.`;
              } else {
                  return `Find the LinkedIn profile URL for this person with email username ${formattedName}. Return their full name, current position, company, and LinkedIn URL.`;
              }
          }
          
          async lookup(email) {
              const query = this.generateQuery(email);
              
              const response = await this.client.search({
                  query: query,
                  depth: "deep",  // Use deep for more thorough results
                  outputType: "structured",
                  structuredOutputSchema: this.schema
              });
              
              return response;
          }
      }

      // Example usage
      async function main() {
          const radar = new SignupRadar('<YOUR_LINKUP_API_KEY>');
          
          // Example emails
          const emails = [
              "philippe@linkup.so",
              "boris@linkup.so"
          ];
          
          for (const email of emails) {
              console.log(`\nLooking up: ${email}`);
              const result = await radar.lookup(email);
              console.log(JSON.stringify(result, null, 2));
          }
      }

      main().catch(console.error);
      ```
    </CodeGroup>
  </Step>
</Steps>

## How It Works

1. **Email Analysis**: The tool parses the email to extract the username and domain.
2. **Query Generation**: It creates a smart search query based on the email components:
   * Formats the username to handle common patterns (first.last, first\_last)
   * Uses the domain as a company hint if it's not a common email provider
3. **Structured Output**: Uses Linkup's structured output feature with a custom schema to ensure consistent, well-formatted results.
4. **Deep Search**: Uses the "deep" search depth for more comprehensive results.

## Test Examples

Try the signup radar with these email examples:

* [philippe@linkup.so](mailto:philippe@linkup.so)
* [boris@linkup.so](mailto:boris@linkup.so)
* [sacha@linkup.so](mailto:sacha@linkup.so)
* [philippe.mizrahi@gmail.com](mailto:philippe.mizrahi@gmail.com)

## Advanced Enhancements

For a production version, consider adding:

* Other relevant information on your users you receive in the sign up form. These should be added to the prompt
* Better manage ambiguity when multiple people could own the same email. Change the prompt and the structured output format to allow for multiple potential people
* Error handling for invalid emails or API failures
* Rate limiting to manage API usage
* Async batch processing for multiple emails

## Conclusion

You've now built a simple but powerful "signup radar" using the Linkup API that can extract structured information about users from just their email address. The structured output feature ensures you get consistent, well-formatted data that can be easily integrated into your systems.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Structured Output Guide
Source: https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide

How to take advantage of Structured Outputs

Linkup's structured output feature allows you to receive responses in a custom format that you define. This is particularly useful when you need to integrate Linkup's responses directly into your application's data structure or when you want to ensure consistency in the response format.

## How It Works

To use structured outputs:

1. Set `outputType` to `structured` in your API request
2. Provide a JSON schema string in the `structuredOutputSchema` parameter
3. The API will return a response that strictly follows your schema

<Warning>
  Write your query so that its answer contains the information requested in the
  `structuredOutputSchema`- the system will use the query response to fill the
  output
</Warning>

## Basic Examples

Let's look at some simple examples that demonstrate how to use structured outputs for different use cases:

<AccordionGroup>
  <Accordion title="Company Revenue Example" icon="building">
    <p>This example extracts company classification information:</p>

    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="YOUR_API_KEY")

      schema = """{
          "type": "object",
          "properties": {
              "companyName": {
                  "type": "string",
                  "description": "The name of the company"
              },
              "revenueAmount": {
                  "type": "number",
                  "description": "The revenue amount"
              },
              "fiscalYear": {
                  "type": "string",
                  "description": "The fiscal year for this revenue"
              }
          }
      }"""

      response = client.search(
          query="What is Microsoft's 2024 revenue?",
          depth="deep",
          output_type="structured",
          structured_output_schema=schema
      )

      print(response)
      ```

      ```js js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: 'YOUR_API_KEY',
      });

      const schema = {
        "type": "object",
        "properties": {
          "companyName": {
            "type": "string",
            "description": "The name of the company"
          },
          "revenueAmount": {
            "type": "number",
            "description": "The revenue amount"
          },
          "fiscalYear": {
            "type": "string",
            "description": "The fiscal year for this revenue"
          }
        }
      };

      const getCompanyRevenue = async () => {
        return await client.search({
          query: "What is Microsoft's 2024 revenue?",
          depth: 'deep',
          outputType: 'structured',
          structuredOutputSchema: schema
        });
      };

      getCompanyRevenue().then(console.log);
      ```

      ```bash curl
      curl --request POST \
        --url https://api.linkup.so/v1/search \
        --header 'Authorization: Bearer YOUR_API_KEY' \
        --header 'Content-Type: application/json' \
        --data '{
        "q": "What is Microsoft'\''s 2024 revenue?",
        "depth": "deep",
        "outputType": "structured",
        "structuredOutputSchema": "{\"type\":\"object\",\"properties\":{\"companyName\":{\"type\":\"string\",\"description\":\"The name of the company\"},\"revenueAmount\":{\"type\":\"number\",\"description\":\"The revenue amount\"},\"fiscalYear\":{\"type\":\"string\",\"description\":\"The fiscal year for this revenue\"}}}"
      }'
      ```
    </CodeGroup>

    Example response:

    ```json
    {
        "companyName": "Microsoft",
        "revenueAmount": 245100000000,
        "fiscalYear": "2024"
    }
    ```
  </Accordion>

  <Accordion title="Movie Information Example" icon="film">
    <p>This example shows how to retrieve basic information about a movie:</p>

    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="YOUR_API_KEY")

      schema = """{
          "type": "object",
          "properties": {
              "movieTitle": {
                  "type": "string",
                  "description": "The title of the movie"
              },
              "director": {
                  "type": "string",
                  "description": "The director of the movie"
              },
              "releaseYear": {
                  "type": "integer",
                  "description": "The year the movie was released"
              },
              "boxOfficeRevenue": {
                  "type": "number",
                  "description": "The worldwide box office revenue in USD"
              }
          },
          "required": ["movieTitle", "director", "releaseYear", "boxOfficeRevenue"]
      }"""

      response = client.search(
          query="What was the director, release year, and box office revenue for The Matrix?",
          depth="deep",
          output_type="structured",
          structured_output_schema=schema
      )

      print(response)
      ```

      ```js js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: 'YOUR_API_KEY',
      });

      const schema = {
          "type": "object",
          "properties": {
              "movieTitle": {
                  "type": "string",
                  "description": "The title of the movie"
              },
              "director": {
                  "type": "string",
                  "description": "The director of the movie"
              },
              "releaseYear": {
                  "type": "integer",
                  "description": "The year the movie was released"
              },
              "boxOfficeRevenue": {
                  "type": "number",
                  "description": "The worldwide box office revenue in USD"
              }
          },
          "required": ["movieTitle", "director", "releaseYear", "boxOfficeRevenue"]
      };

      const getMovieInfo = async () => {
        return await client.search({
          query: "What was the director, release year, and box office revenue for The Matrix?",
          depth: 'deep',
          outputType: 'structured',
          structuredOutputSchema: schema
        });
      };

      getMovieInfo().then(console.log);
      ```

      ```bash curl
      curl --request POST \
        --url https://api.linkup.so/v1/search \
        --header 'Authorization: Bearer YOUR_API_KEY' \
        --header 'Content-Type: application/json' \
        --data '{
        "q": "What was the director, release year, and box office revenue for The Matrix?",
        "depth": "deep",
        "outputType": "structured",
        "structuredOutputSchema": "{\"type\":\"object\",\"properties\":{\"movieTitle\":{\"type\":\"string\",\"description\":\"The title of the movie\"},\"director\":{\"type\":\"string\",\"description\":\"The director of the movie\"},\"releaseYear\":{\"type\":\"integer\",\"description\":\"The year the movie was released\"},\"boxOfficeRevenue\":{\"type\":\"number\",\"description\":\"The worldwide box office revenue in USD\"}}}"
      }'
      ```
    </CodeGroup>

    Example response:

    ```json
    {
        "movieTitle": "The Matrix",
        "director": "Lana and Lilly Wachowski",
        "releaseYear": 1999,
        "boxOfficeRevenue": 465300000
    }
    ```
  </Accordion>

  <Accordion title="Weather Information Example" icon="cloud-sun">
    <p>This example retrieves weather information for travel planning:</p>

    <CodeGroup>
      ```python python
      from linkup import LinkupClient

      client = LinkupClient(api_key="YOUR_API_KEY")

      schema = """{
          "type": "object",
          "properties": {
              "city": {
                  "type": "string",
                  "description": "The name of the city"
              },
              "averageTemperature": {
                  "type": "object",
                  "properties": {
                      "summer": {
                          "type": "number",
                          "description": "Average temperature in summer (°C)"
                      },
                      "winter": {
                          "type": "number",
                          "description": "Average temperature in winter (°C)"
                      }
                  }
              },
              "annualRainfall": {
                  "type": "number",
                  "description": "Annual rainfall in millimeters"
              },
              "bestTimeToVisit": {
                  "type": "array",
                  "items": {
                      "type": "string"
                  },
                  "description": "The recommended months to visit"
              }
          }
      }"""

      response = client.search(
          query="What is the average temperature, rainfall, and best time to visit Tokyo?",
          depth="deep",
          output_type="structured",
          structured_output_schema=schema
      )

      print(response)
      ```

      ```js js
      import { LinkupClient } from 'linkup-sdk';

      const client = new LinkupClient({
        apiKey: 'YOUR_API_KEY',
      });

      const schema = {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "The name of the city"
          },
          "averageTemperature": {
            "type": "object",
            "properties": {
              "summer": {
                "type": "number",
                "description": "Average temperature in summer (°C)"
              },
              "winter": {
                "type": "number",
                "description": "Average temperature in winter (°C)"
              }
            }
          },
          "annualRainfall": {
            "type": "number",
            "description": "Annual rainfall in millimeters"
          },
          "bestTimeToVisit": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "The recommended months to visit"
          }
        }
      };

      const getWeatherInfo = async () => {
        return await client.search({
          query: "What is the average temperature, rainfall, and best time to visit Tokyo?",
          depth: 'deep',
          outputType: 'structured',
          structuredOutputSchema: schema
        });
      };

      getWeatherInfo().then(console.log);
      ```

      ```bash curl
      curl --request POST \
        --url https://api.linkup.so/v1/search \
        --header 'Authorization: Bearer YOUR_API_KEY' \
        --header 'Content-Type: application/json' \
        --data '{
        "q": "What is the average temperature, rainfall, and best time to visit Tokyo?",
        "depth": "deep",
        "outputType": "structured",
        "structuredOutputSchema": "{\"type\":\"object\",\"properties\":{\"city\":{\"type\":\"string\",\"description\":\"The name of the city\"},\"averageTemperature\":{\"type\":\"object\",\"properties\":{\"summer\":{\"type\":\"number\",\"description\":\"Average temperature in summer (°C)\"},\"winter\":{\"type\":\"number\",\"description\":\"Average temperature in winter (°C)\"}}},\"annualRainfall\":{\"type\":\"number\",\"description\":\"Annual rainfall in millimeters\"},\"bestTimeToVisit\":{\"type\":\"array\",\"items\":{\"type\":\"string\"},\"description\":\"The recommended months to visit\"}}}"
      }'
      ```
    </CodeGroup>

    Example response:

    ```json
    {
        "city": "Tokyo",
        "averageTemperature": {
            "summer": 26.4,
            "winter": 6.1
        },
        "annualRainfall": 1530.8,
        "bestTimeToVisit": ["March", "April", "October", "November"]
    }
    ```
  </Accordion>
</AccordionGroup>

## Advanced Example: Competitive Analysis

This example shows how to extract structured competitive analysis information:

<CodeGroup>
  ```python python [expandable]
  from linkup import LinkupClient

  client = LinkupClient(api_key="YOUR_API_KEY")

  schema = """{
    "type": "object",
    "properties": {
      "companies": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "marketPosition": {
              "type": "object",
              "properties": {
                "globalMarketShare": {
                  "type": "number"
                },
                "rankingByRevenue": {
                  "type": "integer"
                }
              }
            },
            "strengths": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "challenges": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "marketOverview": {
        "type": "string"
      }
    }
  }"""

  response = client.search(
    query="Compare Apple and Samsung in the smartphone market, focusing on their market share, global revenue, key strengths, and primary challenges.",
    depth="deep",
    output_type="structured",
    structured_output_schema=schema
  )

  print(response)

  ```

  ```js js [expandable]
  import { LinkupClient } from "linkup-sdk";

  const client = new LinkupClient({
  	apiKey: "YOUR_API_KEY",
  });

  const schema = {
  	type: "object",
  	properties: {
  		companies: {
  			type: "array",
  			items: {
  				type: "object",
  				properties: {
  					name: {
  						type: "string",
  					},
  					marketPosition: {
  						type: "object",
  						properties: {
  							globalMarketShare: {
  								type: "number",
  							},
  							rankingByRevenue: {
  								type: "integer",
  							},
  						},
  					},
  					strengths: {
  						type: "array",
  						items: {
  							type: "string",
  						},
  					},
  					challenges: {
  						type: "array",
  						items: {
  							type: "string",
  						},
  					},
  				},
  			},
  		},
  		marketOverview: {
  			type: "string",
  		},
  	},
  };

  const getCompetitiveAnalysis = async () => {
  	return await client.search({
  		query:
  			"Compare Apple and Samsung in the smartphone market, focusing on their market share, global revenue, key strengths, and primary challenges.",
  		depth: "deep",
  		outputType: "structured",
  		structuredOutputSchema: schema,
  	});
  };

  getCompetitiveAnalysis().then(console.log);
  ```

  ```bash curl [expandable]
  curl --request POST \
    --url https://api.linkup.so/v1/search \
    --header 'Authorization: Bearer YOUR_API_KEY' \
    --header 'Content-Type: application/json' \
    --data '{
    "q": "Compare Apple and Samsung in the smartphone market, focusing on their market share, global revenue, key strengths, and primary challenges.",
    "outputType": "structured",
    "depth": "deep",
    "structuredOutputSchema": "{\"type\":\"object\",\"properties\":{\"companies\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"marketPosition\":{\"type\":\"object\",\"properties\":{\"globalMarketShare\":{\"type\":\"number\"},\"rankingByRevenue\":{\"type\":\"integer\"}}},\"strengths\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"challenges\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}},\"marketOverview\":{\"type\":\"string\"}}}"
  }'
  ```
</CodeGroup>

Example response:

```json [expandable]
{
	"companies": [
		{
			"name": "Apple",
			"marketPosition": {
				"globalMarketShare": 17.2,
				"rankingByRevenue": 1
			},
			"strengths": [
				"Strong brand loyalty",
				"Premium pricing power",
				"Integrated ecosystem"
			],
			"challenges": [
				"Market saturation",
				"Strong competition in emerging markets",
				"Supply chain dependencies"
			]
		},
		{
			"name": "Samsung",
			"marketPosition": {
				"globalMarketShare": 20.1,
				"rankingByRevenue": 2
			},
			"strengths": [
				"Diverse product portfolio",
				"Vertical integration",
				"Strong presence in emerging markets"
			],
			"challenges": [
				"Intense competition at all price points",
				"Margin pressure in mid-range segment",
				"Brand perception vs Apple in premium segment"
			]
		}
	],
	"marketOverview": "The smartphone market continues to be highly competitive with a focus on 5G capabilities and AI integration. Premium segment shows steady growth while mid-range experiences intense competition."
}
```

## Making Fields Required

To make sure that the key fields you defined are filled, you can mark them as `required` in your json schema.

```json Required Fields Highlight {17}
{
	"type": "object",
	"properties": {
		"movieTitle": {
			"type": "string",
			"description": "The title of the movie"
		},
		"director": {
			"type": "string",
			"description": "The director of the movie"
		},
		"releaseYear": {
			"type": "integer",
			"description": "The year the movie was released"
		}
	},
	"required": ["movieTitle", "director"]
}
```

## Best Practices

1. **Schema Design**:

   * Keep your schema as simple as possible while meeting your needs
   * Add descriptions to the fields to limit ambiguity
   * Use appropriate data types (string, number, boolean, etc.)
   * When in doubt, refer to the [JSON documentation](https://json-schema.org/learn/getting-started-step-by-step)

2. **Query Formulation**:
   * Write your query so that its answer contains the information requested in the `structuredOutputSchema`- the system will use the query response to fill the output
   * Provide clear context in your query and use explicit instructions

## Common Use Cases

* Company classification and categorization
* Competitive analysis
* Market research
* Product comparisons
* Company performance assessments

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Frequently Asked Questions
Source: https://docs.linkup.so/pages/faq/faq



<AccordionGroup>
  <Accordion title="What is the difference between Linkup and Perplexity Sonar?">
    * While Perplexity is a generalist chatbot, Linkup was designed from the ground up to be the most accurate search engine for AIs. This makes Linkup [score higher](https://www.linkup.so/blog/linkup-establishes-sota-performance-on-simpleqa) on OpenAI’s factuality benchmark SimpleQA.
    * To that end, Linkup has made partnerships with trusted data providers and premium information sources, ensuring our customers can make critical business decisions based on Linkup’s answers.
    * In addition, Linkup is hyper focused on the needs of our users: AI Agents and technology systems,  vs. humans. For example, this means we can provide raw context or structured outputs, vs. natural language answers only.
  </Accordion>

  <Accordion title="What is the difference between Standard and Deep?">
    * **Standard**: Fast and affordable web search. Linkup Standard is great for quickly finding straightforward grounding data that improves the accuracy of your AI. Try queries such as “What is Microsoft’s Q3 2024 revenue?”. Standard queries cost 5 euros per 1,000 queries.
    * **Deep**: Comprehensive, in-depth web search. Linkup Deep handles complex queries that require digging, multi-steps information gathering and reflection. Try queries such as “What are the differences in strategy between Apple and Samsung for 2025?”. Deep queries cost 50 euros per 1,000 queries.
  </Accordion>

  <Accordion title="How can I stay up to date with changes to the API?">
    We post key changes to the API on our [Changelog](../../pages/changelog/). We also discuss them on our [Discord](https://discord.gg/HHv29dPa) and on [X](https://x.com/Linkup_platform).
  </Accordion>

  <Accordion title="I have an issue with Linkup, how can I get some help?">
    You can send us an email at [support@linkup.so](mailto:support@linkup.so) or ask us directly on [Discord](https://discord.gg/HHv29dPa).
  </Accordion>

  <Accordion title="Which AI models is Linkup using?">
    Linkup leverages a range of state-of-the-art AI models across its tech stack, continuously optimizing for accuracy, speed, and relevance. To power our search, we've developed a proprietary model designed specifically for high-precision retrieval and business intelligence.
  </Accordion>
</AccordionGroup>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Chainlit Chatbot
Source: https://docs.linkup.so/pages/integrations/chatbot/build-your-chatbot

Connect your Chainlit chatbot to the internet with Linkup

<img src="https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/chatbot/assets/search-the-web.png" alt="Search the Web" />

Linkup is natively integrated in [Chainlit](https://docs.chainlit.io), an open-source Python framework specifically designed for building production-ready Conversational AI applications. You can now deploy an open source chatbot with "search the web" capabilities, in minutes.

This chatbot will feature:

* Real-time web search using Linkup
* A web interface with Chainlit, supporting conversation context management and message streaming

## Implementation Guide

<Steps>
  <Step title="Get Started with Chainlit">
    Follow the Chainlit documentation to set up your chatbot application. Visit the [Chainlit getting started guide](https://docs.chainlit.io/get-started/overview) to learn the basics of creating a Chainlit application. This will require [an Anthropic API key](https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key) or an API key from any LLM provider.
  </Step>

  <Step title="Integrate Linkup">
    Add web search capabilities to your Chainlit app by following the very simple integration steps in the [Chainlit cookbook](https://github.com/Chainlit/cookbook/tree/main/ai-web-search-linkup). This will enable your chatbot to perform real-time web searches using Linkup. This will require a Linkup API key.

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>
</Steps>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Claude Desktop
Source: https://docs.linkup.so/pages/integrations/claude





# Composio
Source: https://docs.linkup.so/pages/integrations/composio/composio

How to use Linkup in Composio

## Overview

Linkup can be used with [Composio](https://composio.dev) as a Tool to get contextual information from the internet. This integration allows your Composio workflows to search the web and incorporate up-to-date information.

## Setting Up Linkup in Composio

<Steps>
  <Step title="Access your Composio account">
    Log in to your Composio account at [composio.dev](https://composio.dev).
  </Step>

  <Step title="Find and select the Linkup tool">
    Navigate to the All Apps section in Composio and search for "Linkup".

    ![Search for tools in Composio](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/composio/assets/search_tool.png)

    ![Search results showing Linkup](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/composio/assets/search_linkup.png)
  </Step>

  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Configure the integration">
    Click on "Setup Linkup integration".

    ![Setup Linkup integration](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/composio/assets/make_integration.png)

    Enter your Linkup API Key in the provided field and click on "Try connecting default's linkup".

    ![Enter your API key](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/composio/assets/enter_api_key.png)
  </Step>
</Steps>

## Example with Composio and CrewAI

Composio gives you the ability to build with CrewAI, a powerful agentic framewwork.

<Steps>
  <Step title="Install required packages">
    ```bash
    pip install crewai langchain_openai composio_crewai
    ```
  </Step>

  <Step title="Get your API keys">
    You'll need:

    1. Your Composio API key
    2. An OpenAI API key (get one [here](https://openai.com/index/openai-api/))
  </Step>

  <Step title="Create your CrewAI script">
    Create a new Python file and add the following code:

    ```python
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    from composio_crewai import ComposioToolSet, Action, App

    # Initialize Composio toolset with your API key
    composio_toolset = ComposioToolSet(api_key="YOUR_COMPOSIO_API_KEY")

    # Get the Linkup search tool
    tools = composio_toolset.get_tools(actions=['LINKUP_PERFORM_A_SEARCH_QUERY'])

    # Create a CrewAI agent with the Linkup tool
    crewai_agent = Agent(
        role="Research Assistant",
        goal="""You analyze information and provide accurate answers based on 
                web searches using the Linkup tool.""",
        backstory=(
            "You are an AI research assistant that helps users find accurate and 
             up-to-date information from the web."
        ),
        verbose=True,
        tools=tools,
        llm=ChatOpenAI(api_key="YOUR_OPENAI_API_KEY"),
    )

    # Create a task for the agent
    task = Task(
        description="Can you tell me which women were awarded the Physics Nobel Prize",
        agent=crewai_agent,
        expected_output="A comprehensive list of female Nobel Physics Prize winners with years"
    )

    # Create and run the crew
    my_crew = Crew(agents=[crewai_agent], tasks=[task])
    result = my_crew.kickoff()

    # Print the result
    print(result)
    ```

    Be sure to replace `YOUR_COMPOSIO_API_KEY` and `YOUR_OPENAI_API_KEY` with your actual API keys.
  </Step>

  <Step title="Run your script">
    Execute your Python script:

    ```bash
    python your_script.py
    ```

    The script will use the Linkup tool through Composio to search for information about female Nobel Physics Prize winners and return the results.

    **Example Response**

    ```
    Four women have been awarded the Nobel Prize in Physics:

    1. Marie Curie (1903) - Awarded for her research on radiation phenomena
    2. Maria Goeppert Mayer (1963) - Awarded for discoveries concerning nuclear shell structure
    3. Donna Strickland (2018) - Awarded for groundbreaking inventions in laser physics
    4. Andrea Ghez (2020) - Awarded for the discovery of a supermassive compact object at the center of our galaxy

    Marie Curie was the first woman to win a Nobel Prize in any category and remains the only woman to win Nobel Prizes in two different scientific fields (Physics in 1903 and Chemistry in 1911).
    ```

    **Advanced Usage**

    You can expand your CrewAI agents to use additional Linkup capabilities by specifying different actions in the `get_tools()` function:

    ```python
    # Get multiple Linkup tools
    tools = composio_toolset.get_tools(actions=[
        'LINKUP_PERFORM_A_SEARCH_QUERY', 
        'LINKUP_PERFORM_A_DEEP_SEARCH_QUERY'
    ])
    ```
  </Step>
</Steps>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Dify
Source: https://docs.linkup.so/pages/integrations/dify/dify

Integrate Linkup with Dify to enhance your AI workflows

## Overview

Linkup can be integrated with [Dify](https://dify.ai) as a tool to provide real-time web search capabilities to your AI applications. This integration allows your Dify agents to access up-to-date information from the internet.

## Installation

<Steps>
  <Step title="Install Linkup Plugin">
    1. Log in to your Dify account
    2. Install the Linkup Plugin from the [Marketplace](https://marketplace.dify.ai/plugins/linkup/search-web)

    ![Dify Marketplace](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/1_marketplace_page.png)

    3. Click "Install" to add it to your workspace

    ![Install Plugin](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/2_install_plugin.png)
  </Step>

  <Step title="Authorize Linkup">
    1. After installation, click on "Authorize" to set up the plugin

    ![Authorize Plugin](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/3_authorize_plugin.png)

    2. Get your Linkup API Key:

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>

    3. Enter your API key in the authorization page

    ![API Key Authorization](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/3_1_api_key_authorize.png)
  </Step>

  <Step title="Add Linkup to Agent">
    1. Go to your Dify application
    2. Navigate to the Tools section
    3. Add Linkup as a tool to your agent

    ![Agent Tool](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/4_agent_tool.png)
  </Step>

  <Step title="Configure Tool Settings">
    1. Access the tool settings for Linkup
    2. Configure the search parameters according to your needs

    ![Tool Settings](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/5_tool_settings.png)

    3. Select the appropriate search depth for your use case

    ![Tool Depth Selection](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/5_1_tool_depth_select.png)
  </Step>

  <Step title="Other Uses in Dify">
    You can also use it in workflows, chatbots, chatflows, ..
    Example of Linkup being used in a workflow:

    ![Tool Workflow](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/6_tool_workflow.png)
    ![Workflow Example](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/dify/assets/6_1_workflow_example.png)
  </Step>
</Steps>

You are now ready to use Linkup in your Dify applications! Visit the [Concepts](/pages/documentation/get-started/concepts) page to learn more about the different Linkup parameters and how to optimize your searches.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Google Sheet
Source: https://docs.linkup.so/pages/integrations/google-sheet/google-sheet

How to use Linkup in Google Sheet

## 👀 Overview

Linkup can be used with [GoogleSheet](https://docs.google.com/spreadsheets) as a Formula to get contextual information from the internet.

![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/linkupsearch.png)

## 📦 Installation

### Setting Up Your Environment

1. Open your Google Sheet.

2. Go to Extensions > Apps Script.

![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/go_to_extension.png)

3. In the Apps Script editor, replace the existing code with the following script (you can use the "Copy" button on the top right of the code window 😊 ).

```javascript
/**
 * Linkup API configuration
 */
const API_ENDPOINT = 'https://api.linkup.so/v1/search';

/**
 * Creates the menu item
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Linkup')
    .addItem('Settings', 'settings')
    .addToUi();
}

/**
 * Shows the settings dialog to configure the API key
 */
function settings() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Settings',
    'Please enter your Linkup API Key (visit https://app.linkup.so/sign-up to get your free API key)',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText();
    if (apiKey) {
      PropertiesService.getUserProperties()
        .setProperty('LINKUP_API_KEY', apiKey);
    } else {
      ui.alert('Please enter a valid Linkup API key');
    }
  }
}

/**
 * Returns the Linkup API key
 */
function getApiKey() {
  return PropertiesService.getUserProperties().getProperty('LINKUP_API_KEY');
}

/**
 * Returns the active cell
 */
function getActiveCell() {
  return SpreadsheetApp.getActiveRange().getA1Notation();
}

/**
 * Returns cells cache
 */
function getCache() {
  return PropertiesService.getScriptProperties().getProperty('LINKUP_DATA')
      ? JSON.parse(PropertiesService.getScriptProperties().getProperty('LINKUP_DATA')) : {}
}

/**
 * Overrides cells cache
 */
function saveCache(cache) {
  PropertiesService.getScriptProperties()
    .setProperty('LINKUP_DATA', JSON.stringify(cache));
}

/**
 * Clears the cache of the active cell
 */
function deleteCellCache() {
  const cache = getCache();
  const activeCell = getActiveCell();

  if (cache[activeCell]) {
    delete cache[activeCell];
    saveCache(cache);
  }
}

/**
 * Triggered on cell edit
 */
function onEdit(e) {
  if (e.oldValue) {
    deleteCellCache();
  }
}

function askLinkup(query, include_sources) {
  if (!query) return 'Please provide a search query';

  const activeCell = getActiveCell();
  const apiKey = getApiKey();
  const cache = getCache();
  console.log("api kEY=", apiKey)
  console.log("cache =", cache)

  // Check if this search has been cached
  const existingEntry = cache[activeCell];
  if (existingEntry
      && existingEntry.query === query
      && existingEntry.include_sources === include_sources) {
    return existingEntry.response;
  }

  const options = {
    method: 'post',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({
      q: query,
      depth: 'standard',
      outputType: 'sourcedAnswer',
    }),
    muteHttpExceptions: true,
  };

  try{
    const response = JSON.parse(
      UrlFetchApp.fetch(API_ENDPOINT, options).getContentText()
    );
    if (response.answer) {
      cache[activeCell] = { query, response };
      saveCache(cache);
    }
    return response;
  } catch (error) {
    throw new Error(`Failed to process request: ${error.message}`)
  }
}

/**
 * Searches the Linkup API with the given query and returns the answer.
 * @param {string} query The search query.
 * @customfunction
 */
function LINKUP(query, includeSources=false) {
  const response = askLinkup(query, includeSources);
  const answer = response.answer || 'No answer found';

  if (!includeSources) {
    return answer;
  }

  if (response.sources && response.sources.length > 0) {
    return `${answer}\nSources: ${response.sources.map(({ url }) => url).join(':')}`
  } else {
    return `${answer}\nNo sources available`;
  }
}
```

4. Save and Run the script, review and accept permissions. This lets Sheets send Linkup your questions.

Save the script
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/save.png)

Run the script
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/run.png)

Review the permissions
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/review.png)

Allow the permissions
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/allow.png)

You can rename the script to Linkup
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/rename.png)

Sometimes, you might see this screen that tells you our app hasn't been authorized yet. Just click "Advanced" and "Authorize"
![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/advanced.png)

### ⚙️ ️Configure you API Key

1. Get an API Key:

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

2. In your Google Sheet, Linkup > Settings (the system may ask you confirmation to run a script)
   ![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/go_to_setting.png)

![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/autorization.png)

3. Enter your API Key and click `Ok`
   ![Apps Script](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/google-sheet/assets/setting_api_key.png)

Congrats! You are now all setup to use Linkup on Sheets.

## 🤖 Usage

### Use Linkup to answer your questions

1. In a cell type:

```
=LINKUP("your query")
```

You can also use a reference to a different cell:

```
=LINKUP(B14)
```

2. Press enter ✅

### List sources in addition to the answer

1. In a cell type:

```
=LINKUP("your query", TRUE)
```

You can also use a reference to a different cell:

```
=LINKUP(B14, TRUE)
```

2. Press enter ✅

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Huggingface
Source: https://docs.linkup.so/pages/integrations/huggingface

How to use Linkup with Huggingface

## Overview

Linkup can be used with [Huggingface](https://huggingface.co/docs/smolagents/en/index) (smolagents) to create advanced AI agents and workflows based on internal and web data.

## Getting Started with Linkup in Huggingface

<Steps>
  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Install dependencies">
    ```shell
    pip install linkup-sdk smolagents openai
    ```
  </Step>

  <Step title="Create your agent">
    ```python
    from smolagents import CodeAgent, load_tool
    from smolagents.models import OpenAIServerModel

    linkup_tool = load_tool("Linkup-Platform/linkup-search-tool", trust_remote_code=True)
    ```
  </Step>

  <Step title="Initialize and run your agent">
    ```python
    # Agent initialization
    agent = CodeAgent(
        tools=[linkup_tool],
        model=OpenAIServerModel(
          model="gpt-4o-mini",
          api_key="your_openai_api_key"
        ),
    )
    # Agent invocation
    response = agent.run("What was Microsoft's revenue last quarter and was it well perceived by the market?")
    print(response)
    ```
  </Step>
</Steps>

## Example Response

```
Microsoft's revenue last quarter (3Q2024) was approximately $65.59 billion. The market's perception is mixed; while many analysts are optimistic about growth fueled by AI and cloud services, 
there are concerns regarding a lack of guidance in their report, leading to a cautious reaction from some investors.
```

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Keywords AI
Source: https://docs.linkup.so/pages/integrations/keywordsai

How to use Keywords AI with Linkup to call 300+ LLMs and get LLM observability

[Keywords AI](https://www.keywordsai.co) is an LLM engineering platform that allows you to do monitoring, prompt management, and LLM evals.

This tutorial will show you how to set up Linkup in the Keywords AI API payload to monitor LLM performance and usage.

<Steps>
  <Step title="Get your API Keys">
    <CardGroup cols={2}>
      <Card title="Get your Linkup API key" icon="key" href="https://app.linkup.so/" horizontal="True">
        Create a Linkup account for free to get your API key.
      </Card>

      <Card title="Get your Keywords AI API key" icon="key" href="https://docs.keywordsai.co/get-started/overview" horizontal="True">
        Create a Keywords AI account for free to get your API key.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Build the Keywords AI request">
    ```python Python {24-30}
    import requests

    def demo_call(
        company,
        model="gpt-4o-mini",
        token="KEYWORDSAI_API_KEY"
    ):
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        }

        data = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
                },
                {
                    "role": "user",
                    "content": "What is " + company + "'s 2024 revenue? Base your answer on the following trusted data: \n\n{% if linkup_search_response %}{{ linkup_search_response.results }}{% else %}I don't have that information.{% endif %}}"
                }
            ],
            "linkup_params": {
                "apiKey": "LINKUP_API_KEY",
                "q": "What is " + company + "'s 2024 revenue?",
                "depth": "deep",
                "outputType": "searchResults",
                "includeImages": False
            },
            "model": "gpt-4o-mini"
        }

        response = requests.post('https://api.keywordsai.co/api/chat/completions', headers=headers, json=data)
        return response

    input_text = "Microsoft"
    response = demo_call(input_text)
    print(response.json())
    ```

    You can also use prompt templates as follows:

    ```python
    Please provide information about {{ company_name }}'s 2024 revenue and cite your sources.

    {% if linkup_search_response %}
      Here's what I found:
      {{ linkup_search_response.answer }}

      Sources:
      {% for source in linkup_search_response.sources %}
      - {{ source.name }}: {{ source.url }}
      {% endfor %}
    {% endif %}

    ```
  </Step>

  <Step title="Monitor LLM performance and usage">
    After you set up the environment and run the request, you can see [LLM logs](https://platform.keywordsai.co/platform/requests?sort_by=-timestamp) in Keywords AI.

    <img width="100%" src="https://keywordsai-static.s3.us-east-1.amazonaws.com/docs/marketing/logs.png" alt="LLM logging" />
  </Step>
</Steps>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Langchain
Source: https://docs.linkup.so/pages/integrations/langchain

How to use Linkup with our Langchain SDK

## Overview

Linkup can be used with [LangChain](https://www.langchain.com/) as a [Retriever](https://python.langchain.com/api_reference/core/retrievers.html). This integration allows you to build powerful applications that retrieve contextual information from the internet.

## Getting Started with Linkup in LangChain

<Steps>
  <Step title="Install the LangChain integration">
    ```shell
    pip install langchain-linkup
    ```
  </Step>

  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Create and use the Linkup Retriever">
    ```python
    from langchain_linkup import LinkupSearchRetriever
    import os

    os.environ["LINKUP_API_KEY"] = "PASTE_YOUR_API_KEY_HERE"

    retriever = LinkupSearchRetriever(
    depth="deep",  # "standard" or "deep"
    )

    # Perform a search query
    documents = retriever.invoke(input="What is Linkup, the new French AI startup?")
    print(documents)
    ```

    <Info>
      <table>
        <thead>
          <tr>
            <th style={{ color: '#FFFFFF' }}>Parameter</th>
            <th style={{ color: '#FFFFFF' }}>Options</th>
            <th style={{ color: '#FFFFFF' }}>Description</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td><code>depth</code></td>
            <td><code>standard</code>, <code>deep</code></td>
            <td>Controls search depth. <code>deep</code> performs more thorough research, <code>standard</code> is faster.</td>
          </tr>

          <tr>
            <td><code>output\_type</code></td>
            <td><code>searchResults</code>, <code>sourcedAnswer</code>, <code>structured</code></td>
            <td>Determines the format of returned information.</td>
          </tr>
        </tbody>
      </table>
    </Info>
  </Step>
</Steps>

## Example Project: RAG Pipeline with OpenAI

<Steps>
  <Step title="Install dependencies">
    ```shell
    pip install langchain-openai python-dotenv
    ```
  </Step>

  <Step title="Set up API keys">
    <Info>
      You need API keys for both Linkup and OpenAI. You can get an OpenAI API key [here](https://openai.com/index/openai-api/).
    </Info>

    ```python
    import os
    from dotenv import load_dotenv

    # Load from .env file if available
    load_dotenv()

    # Or set manually
    os.environ["LINKUP_API_KEY"] = "YOUR_LINKUP_API_KEY"
    os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"
    ```
  </Step>

  <Step title="Create the RAG pipeline">
    ```python
    from typing import Any, Literal
    from langchain_core.documents import Document
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.runnables import Runnable, RunnableLambda, RunnablePassthrough
    from langchain_openai import ChatOpenAI
    from langchain_linkup import LinkupSearchRetriever

    # Configuration
    query: str = "What is Linkup, the new French AI startup?"
    linkup_depth: Literal["standard", "deep"] = "standard"
    open_ai_model: str = "gpt-4o-mini"

    # Initialize retriever
    retriever = LinkupSearchRetriever(depth=linkup_depth)

    # Format documents helper function
    def format_retrieved_documents(docs: list[Document]) -> str:
        return "\n\n".join(
            [
                f"{document.metadata['name']} ({document.metadata['url']}):\n{document.page_content}"
                for document in docs
            ]
        )

    # Debug helper function
    def inspect_context(state: dict[str, Any]) -> dict[str, Any]:
        print(f"Context: {state['context']}\n\n")
        return state

    # Create prompt and model
    generation_prompt_template = """Answer the question based only on the following context:

    {context}

    Question: {question}
    """
    prompt = ChatPromptTemplate.from_template(generation_prompt_template)
    model = ChatOpenAI(model=open_ai_model)
    ```
  </Step>

  <Step title="Run the pipeline">
    ```python
    # Build and execute the chain
    chain: Runnable[Any, str] = (
        {"context": retriever | format_retrieved_documents, "question": RunnablePassthrough()}
        | RunnableLambda(inspect_context)
        | prompt
        | model
        | StrOutputParser()
    )

    # Get response
    response = chain.invoke(input=query)
    print(f"Response: {response}")
    ```

    **Example Response**

    ```
    Context: Linkup (https://www.linkup.fr):
    Linkup is a French AI startup that provides a search API for LLMs, enabling them to search the web and access up-to-date information.

    Response: Linkup is a French AI startup that has developed a search API specifically designed for Large Language Models (LLMs). Their technology allows LLMs to search the web and access current information, which helps overcome the limitation of outdated training data that many AI models face. This enables applications built with LLMs to provide more accurate and up-to-date responses by connecting them to real-time information from the internet.
    ```
  </Step>
</Steps>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Linkup + Claude
Source: https://docs.linkup.so/pages/integrations/linkup-claude

Use Claude's function calling capabilities to integrate with Linkup

Welcome to this tutorial on using Claude's function calling capabilities with the Linkup API for web search integration. This guide will help you leverage Claude's intelligence combined with real-time web data to create powerful and up-to-date applications.

By combining Claude's advanced language understanding with Linkup's search capabilities, you can create applications that:

1. Access up-to-date information beyond Claude's training data
2. Find specific facts, statistics, and current events
3. Research topics with accurate citations and references
4. Verify information from authoritative sources

<Tip>
  Check out the [Google Colab](https://colab.research.google.com/drive/1S9Ohby5DohrRgRsPWQ8dURdrlOW1Hu2F?usp=sharing) version of this tutorial if you prefer.
</Tip>

<Steps>
  <Step title="Get your API Keys">
    <CardGroup cols={2}>
      <Card title="Get your Linkup API key" icon="key" href="https://app.linkup.so/" horizontal="True">
        Create a Linkup account for free to get your API key.
      </Card>

      <Card title="Get your Anthropic API key" icon="key" href="https://console.anthropic.com/settings/keys" horizontal="True">
        Create a Anthropic account for free to get your API key.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Set Up Your Environment">
    First, let's import the necessary libraries and set up our environment:

    ```bash
    pip install linkup-sdk anthropic
    ```

    ```python
    import anthropic
    from linkup import LinkupClient
    import json
    from pprint import pprint
    from typing import List, Dict, Literal
    ```

    Configure your API keys by setting environment variables or storing them securely in your application:

    ```python
    LINKUP_API_KEY = 'your_linkup_api_key'
    ANTHROPIC_API_KEY = 'your_anthropic_api_key'
    ```

    Initialize the Anthropic client:

    ```python
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    ```
  </Step>

  <Step title="Implement Core Functions">
    Create the chat completion function to handle Claude interactions:

    ```python
    def chat_completion_request(messages: List[dict], tools: List[dict]=None, model: str="claude-3-7-sonnet-20250219", system_message: str = "You are a helpful AI assistant"):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=1000,
                temperature=1,
                system=system_message,
                messages=messages,
                tools=tools,
            )
            return response
        except Exception as e:
            print("Unable to generate ChatCompletion response")
            print(f"Exception: {e}")
            return e
    ```

    Create a helper function for message creation:

    ```python
    def create_message(role: str, content: str, **kwargs):
        return {'role': role, 'content': content, **kwargs}
    ```

    Set up the Linkup integration with search and formatting functions:

    ```python
    linkup_output_type: Literal["searchResults", "sourcedAnswer"] = "searchResults"

    def linkup_web_search(query: str) -> str:
        client = LinkupClient(api_key=LINKUP_API_KEY)

        response = client.search(
            query=query,
            depth="standard",
            output_type=linkup_output_type
        )
        return response

    def format_linkup_response(response, output_type: Literal["searchResults", "sourcedAnswer"] = linkup_output_type) -> str:
        if output_type == "sourcedAnswer":
            return response.answer
        elif output_type == "searchResults":
            results = getattr(response, "results", [{"content": "No answer provided."}])
            answer = "\n".join([f"{i}. {doc.content}" for i, doc in enumerate(results, start=1)])
            return f'Search Results:\n{answer}'
    ```
  </Step>

  <Step title="Configure Function Calling Tools">
    Define the tools that Claude can use to interact with Linkup:

    ```python
    tools = [{
        "name": "linkup_web_search",
        "description": "Performs an online search using the Linkup search engine and retrieves the top results as a string. This function is useful for accessing real-time information, including news, articles, and other relevant web content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to perform.",
                },
                "depth": {
                    "type": "string",
                    "enum": ["standard", "deep"],
                    "default": "standard",
                    "description": "The search depth to perform. Use 'standard' for straightforward queries with likely direct answers (e.g., facts, definitions, simple explanations). Use 'deep' for: 1) complex queries requiring comprehensive analysis or information synthesis, 2) queries containing uncommon terms, specialized jargon, or abbreviations that may need additional context, or 3) questions likely requiring up-to-date or specialized web search results to answer effectively.",
                },
            },
            "required": ["query", "depth"],
        }
    }]
    ```
  </Step>

  <Step title="Implement the Chatbot Interaction">
    Create the main chatbot interaction function:

    ```python
    def chatbot_interaction(user_message):
        # we create chat history that will be then passed as an input to our LLM
        messages = [create_message(role="user", content=user_message)]

        # generate LLM response
        response = chat_completion_request(messages=messages, tools=tools)
        messages.append(create_message(role="assistant", content=response.content))

        # perform function calling based on LLM response
        while response.stop_reason == "tool_use":
            tool_use = next(block for block in response.content if block.type == "tool_use")
            tool_name = tool_use.name
            tool_input = tool_use.input

            # perform actual function call based on the arguments parsed from
            # the LLM response
            tool_result = process_tool_call(tool_name, tool_input)

            # construct the chat history taking into account the result of the function call
            messages = [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": response.content},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": str(tool_result),
                        }
                    ],
                },
            ]
            # generate LLM response based on the chat history
            response = chat_completion_request(messages=messages, tools=tools)

        final_response = next(
            (block.text for block in response.content if hasattr(block, "text")),
            None,
        )
        return final_response
    ```
  </Step>

  <Step title="Test Your Integration">
    Try out your chatbot with a sample query:

    ```python
    result = chatbot_interaction("What are the latest developments in AI technology?")
    print(result)
    ```
  </Step>
</Steps>

## Best Practices

1. **Error Handling**: Always implement proper error handling for API calls and tool executions.
2. **Rate Limiting**: Be mindful of API rate limits for both Claude and Linkup.
3. **Security**: Never expose API keys in your code. Use environment variables or secure secret management.
4. **Response Formatting**: Consider customizing the `format_linkup_response` function to better suit your needs.
5. **System Messages**: Use appropriate system messages to guide Claude's behavior and responses.

## Conclusion

This integration allows you to combine Claude's powerful language understanding with Linkup's real-time web search capabilities. You can now create applications that provide up-to-date information while maintaining Claude's natural language processing abilities.

For more information, visit:

* [Anthropic Documentation](https://docs.anthropic.com)
* [Linkup API Documentation](https://docs.linkup.so)


# Linkup + Mistral
Source: https://docs.linkup.so/pages/integrations/linkup-mistral

Use Mistral AI's function calling capabilities to integrate with Linkup

Welcome to this tutorial on using Mistral AI's function calling capabilities with the Linkup API for web search integration. This guide will help you leverage Mistral's intelligence combined with real-time web data to create powerful and up-to-date applications.

By combining Mistral's advanced language understanding with Linkup's search capabilities, you can create applications that:

1. Access up-to-date information beyond the model's training data
2. Find specific facts, statistics, and current events
3. Research topics with accurate citations and references
4. Verify information from authoritative sources

<Tip>
  Mistral AI's function calling is available in their latest models including `mistral-small-latest`, `mistral-medium-latest`, and `mistral-large-latest`.
</Tip>

<Steps>
  <Step title="Get your API Keys">
    <CardGroup cols={2}>
      <Card title="Get your Linkup API key" icon="key" href="https://app.linkup.so/" horizontal="True">
        Create a Linkup account for free to get your API key.
      </Card>

      <Card title="Get your Mistral API key" icon="key" href="https://console.mistral.ai/api-keys/" horizontal="True">
        Create a Mistral AI account for free to get your API key.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Set Up Your Environment">
    First, let's import the necessary libraries and set up our environment:

    ```bash
    pip install linkup-sdk mistralai
    ```

    ```python
    from mistralai import Mistral, SystemMessage, UserMessage, AssistantMessage, ToolMessage
    from mistralai.models import TextChunk
    from linkup import LinkupClient
    import json
    from typing import List, Literal
    ```

    Configure your API keys by setting environment variables or storing them securely in your application:

    ```python
    LINKUP_API_KEY = 'your_linkup_api_key'
    MISTRAL_API_KEY = 'your_mistral_api_key'
    ```

    Initialize the Mistral client:

    ```python
    client = Mistral(api_key=MISTRAL_API_KEY)
    ```
  </Step>

  <Step title="Implement Core Functions">
    Create the chat completion function to handle Mistral interactions:

    ```python
    def chat_completion_request(
    messages: List[dict], tools: List[dict] = None, model: str = "mistral-large-latest"
    ):
        try:
            response = client.chat.complete(
                model=model, messages=messages, tools=tools, tool_choice="any"
            )
            return response
        except Exception as e:
            print("Unable to generate ChatCompletion response")
            print(f"Exception: {e}")
            return e
    ```

    Create a helper function for message creation:

    ```python
    def create_message(role: str, content: str, **kwargs):
        message_classes = {
            "system": SystemMessage,
            "user": UserMessage,
            "assistant": AssistantMessage,
            "tool": ToolMessage,
        }
        message_class = message_classes.get(role)
        if not message_class:
            raise ValueError(f"Invalid role: {role}")
        return {"role": role, "content": content, **kwargs}
    ```

    Set up the Linkup integration with search and formatting functions:

    ```python
    linkup_output_type: Literal["searchResults", "sourcedAnswer"] = "searchResults"

    def linkup_web_search(query: str, depth: str = "standard") -> str:
        client = LinkupClient(api_key=LINKUP_API_KEY)
        response = client.search(query=query, depth=depth, output_type=linkup_output_type)
        return response


    def format_linkup_response(
        response,
        output_type: Literal["searchResults", "sourcedAnswer"] = linkup_output_type,
    ) -> str:
        if output_type == "sourcedAnswer":
            return response.answer
        elif output_type == "searchResults":
            results = getattr(response, "results", [{"content": "No answer provided."}])
            answer = "\n".join(
                [f"{i}. {doc.content}" for i, doc in enumerate(results, start=1)]
            )
            return f"Search Results:\n{answer}"
    ```
  </Step>

  <Step title="Configure Function Calling Tools">
    Define the tools that Mistral can use to interact with Linkup:

    ```python
    tools = [
        {
            "type": "function",
            "function": {
                "name": "linkup_web_search",
                "description": "Performs an online search using the Linkup search engine and retrieves the top results as a string. This function is useful for accessing real-time information, including news, articles, and other relevant web content.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query to perform.",
                        },
                        "depth": {
                            "type": "string",
                            "enum": ["standard", "deep"],
                            "default": "standard",
                            "description": "The search depth to perform. Use 'standard' for straightforward queries with likely direct answers (e.g., facts, definitions, simple explanations). Use 'deep' for: 1) complex queries requiring comprehensive analysis or information synthesis, 2) queries containing uncommon terms, specialized jargon, or abbreviations that may need additional context, or 3) questions likely requiring up-to-date or specialized web search results to answer effectively.",
                        },
                    },
                    "required": ["query", "depth"],
                },
            },
        }
    ]
    ```
  </Step>

  <Step title="Implement the Chatbot Interaction">
    Create the main chatbot interaction function:

    ```python
    def chatbot_interaction(user_message):
        # Create chat history
        messages = [
            create_message(role="system", content="You are a helpful assistant."),
            create_message(role="user", content=user_message),
        ]

        # Generate initial response
        completion = chat_completion_request(messages=messages, tools=tools)

        # Handle tool calls
        tool_calls = completion.choices[0].message.tool_calls or []
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            print(f"Calling Linkup tool with parameters {args}")
            result = linkup_web_search(**args)
            result = format_linkup_response(result)

            # Update messages with tool result
            messages.append(completion.choices[0].message)
            messages.append(
                {
                    "role": "tool",
                    "name": function_name,
                    "content": result,
                    "tool_call_id": tool_call.id,
                }
            )

        # Generate final response if tool calls were made
        if tool_calls:
            completion = chat_completion_request(messages=messages)

        response = completion.choices[0].message.content
        if isinstance(response, list):
            # If Mistral's chat completion response sometimes returns a list of text chunks instead of a single string,
            # you should process the output to ensure it's always a single string
            response = " ".join(
                [chunk.text for chunk in response if isinstance(chunk, TextChunk)]
            )
            return response
        return response
    ```
  </Step>

  <Step title="Test Your Integration">
    Try out your chatbot with a sample query:

    ```python
    result = chatbot_interaction("What are the latest developments in quantum computing?")
    print(result)
    ```
  </Step>
</Steps>

## Best Practices

1. **Model Selection**: Choose the appropriate Mistral model based on your needs:
   * `mistral-small-latest`: Good for basic tasks
   * `mistral-medium-latest`: Balanced performance and cost
   * `mistral-large-latest`: Best performance for complex tasks

2. **Error Handling**: Always implement proper error handling for API calls and tool executions.

3. **Rate Limiting**: Be mindful of API rate limits for both Mistral and Linkup.

4. **Security**: Never expose API keys in your code. Use environment variables or secure secret management.

5. **Response Formatting**: Consider customizing the `format_linkup_response` function to better suit your needs.

6. **System Messages**: Use appropriate system messages to guide the model's behavior and responses.

## Conclusion

This integration allows you to combine Mistral AI's powerful language understanding with Linkup's real-time web search capabilities. You can now create applications that provide up-to-date information while maintaining the model's natural language processing abilities.

For more information, visit:

* [Mistral AI Documentation](https://docs.mistral.ai)
* [Linkup API Documentation](https://docs.linkup.so)


# Linkup + OpenAI
Source: https://docs.linkup.so/pages/integrations/linkup-openai

Use OpenAI's function calling capabilities to integrate with Linkup

Welcome to this tutorial on using OpenAI's function calling capabilities with the Linkup API for web search integration. This guide will help you leverage OpenAI's intelligence combined with real-time web data to create powerful and up-to-date applications.

By combining OpenAI's advanced language understanding with Linkup's search capabilities, you can create applications that:

1. Access up-to-date information beyond the model's training data
2. Find specific facts, statistics, and current events
3. Research topics with accurate citations and references
4. Verify information from authoritative sources

<Tip>
  Check out the [Google Colab](https://colab.research.google.com/drive/17BLeIbEUpUyWQ85UdDqYmfF9MhTXofZm?usp=sharing) version of this tutorial if you prefer.
</Tip>

<Steps>
  <Step title="Get your API Keys">
    <CardGroup cols={2}>
      <Card title="Get your Linkup API key" icon="key" href="https://app.linkup.so/" horizontal="True">
        Create a Linkup account for free to get your API key.
      </Card>

      <Card title="Get your OpenAI API key" icon="key" href="https://platform.openai.com/api-keys" horizontal="True">
        Create an OpenAI account for free to get your API key.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Set Up Your Environment">
    First, let's import the necessary libraries and set up our environment:

    ```bash
    pip install linkup-sdk openai
    ```

    ```python
    from openai import OpenAI
    from linkup import LinkupClient
    import json
    from pprint import pprint
    from typing import List, Literal
    ```

    Configure your API keys by setting environment variables or storing them securely in your application:

    ```python
    LINKUP_API_KEY = 'your_linkup_api_key'
    OPENAI_API_KEY = 'your_openai_api_key'
    ```

    Initialize the OpenAI client:

    ```python
    client = OpenAI(api_key=OPENAI_API_KEY)
    ```
  </Step>

  <Step title="Implement Core Functions">
    Create the chat completion function to handle OpenAI interactions:

    ```python
    def chat_completion_request(messages: List[dict], tools: List[dict]=None, model: str="gpt-4"):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
            )
            return response
        except Exception as e:
            print("Unable to generate ChatCompletion response")
            print(f"Exception: {e}")
            return e
    ```

    Create a helper function for message creation:

    ```python
    def create_message(role: str, content: str, **kwargs):
        return {'role': role, 'content': content, **kwargs}
    ```

    Set up the Linkup integration with search and formatting functions:

    ```python
    linkup_output_type: Literal["searchResults", "sourcedAnswer"] = "searchResults"

    def linkup_web_search(query: str, depth: str = "standard") -> str:
        client = LinkupClient(api_key=LINKUP_API_KEY)
        
        response = client.search(
            query=query,
            depth=depth,
            output_type=linkup_output_type
        )
        return response

    def format_linkup_response(response, output_type: Literal["searchResults", "sourcedAnswer"] = linkup_output_type) -> str:
        if output_type == "sourcedAnswer":
            return response.answer
        elif output_type == "searchResults":
            results = getattr(response, "results", [{"content": "No answer provided."}])
            answer = "\n".join([f"{i}. {doc.content}" for i, doc in enumerate(results, start=1)])
            return f'Search Results:\n{answer}'
    ```
  </Step>

  <Step title="Configure Function Calling Tools">
    Define the tools that OpenAI can use to interact with Linkup:

    ```python
    tools = [{
        "type": "function",
        "function": {
            "name": "linkup_web_search",
            "description": "Performs an online search using the Linkup search engine and retrieves the top results as a string. This function is useful for accessing real-time information, including news, articles, and other relevant web content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to perform."
                    },
                    "depth": {
                        "type": "string",
                        "enum": ["standard", "deep"],
                        "default": "standard",
                        "description": "The search depth to perform. Use 'standard' for straightforward queries with likely direct answers (e.g., facts, definitions, simple explanations). Use 'deep' for: 1) complex queries requiring comprehensive analysis or information synthesis, 2) queries containing uncommon terms, specialized jargon, or abbreviations that may need additional context, or 3) questions likely requiring up-to-date or specialized web search results to answer effectively."
                    }
                },
                "required": ["query", "depth"],
                "additionalProperties": False
            },
            "strict": True
        }
    }]
    ```
  </Step>

  <Step title="Implement the Chatbot Interaction">
    Create the main chatbot interaction function:

    ```python
    def chatbot_interaction(user_message):
        # Create chat history
        messages = [
            create_message(role="system", content="You are a helpful assistant."),
            create_message(role="user", content=user_message)
        ]
        
        # Generate initial response
        completion = chat_completion_request(messages=messages, tools=tools)
        
        # Handle tool calls
        tool_calls = completion.choices[0].message.tool_calls or []
        for tool_call in tool_calls:
            args = json.loads(tool_call.function.arguments)
            result = linkup_web_search(**args)
            result = format_linkup_response(result)
            
            # Update messages with tool result
            messages.append(completion.choices[0].message)
            messages.append(create_message(
                role="tool",
                content=result,
                tool_call_id=tool_call.id
            ))
        
        # Generate final response if tool calls were made
        if tool_calls:
            completion = chat_completion_request(messages=messages, tools=tools)
        
        return completion.choices[0].message.content
    ```
  </Step>

  <Step title="Test Your Integration">
    Try out your chatbot with a sample query:

    ```python
    result = chatbot_interaction("What are the latest developments in AI technology?")
    print(result)
    ```
  </Step>
</Steps>

## Best Practices

1. **Error Handling**: Always implement proper error handling for API calls and tool executions.
2. **Rate Limiting**: Be mindful of API rate limits for both OpenAI and Linkup.
3. **Security**: Never expose API keys in your code. Use environment variables or secure secret management.
4. **Response Formatting**: Consider customizing the `format_linkup_response` function to better suit your needs.
5. **System Messages**: Use appropriate system messages to guide the model's behavior and responses.

## Conclusion

This integration allows you to combine OpenAI's powerful language understanding with Linkup's real-time web search capabilities. You can now create applications that provide up-to-date information while maintaining the model's natural language processing abilities.

For more information, visit:

* [OpenAI Documentation](https://platform.openai.com/docs)
* [Linkup API Documentation](https://docs.linkup.so)


# LlamaIndex
Source: https://docs.linkup.so/pages/integrations/llama-index

How to use Linkup in LlamaIndex

## Overview

Linkup can be used with [LlamaIndex](https://www.llamaindex.ai/) to create advanced AI agents and workflows based on internal and web data.

## Getting Started with Linkup in LLamaIndex

<Steps>
  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Install dependencies">
    ```shell
    pip install llama-index llama-index-tools-linkup-research
    ```
  </Step>

  <Step title="Create your agent">
    ```python
    from llama_index.core.agent import FunctionCallingAgent
    from llama_index.llms.openai import OpenAI
    from llama_index.tools.linkup_research.base import LinkupToolSpec

    # Tool initialization
    linkup_tool = LinkupToolSpec(
        api_key="<YOUR LINKUP API KEY>",
        depth="standard", # Options: "standard" or "deep"
        output_type="searchResults", # Options: "searchResults", "sourcedAnswer", or "structured"
    )
    ```

    <Info>
      <table>
        <thead>
          <tr>
            <th style={{ color: '#FFFFFF' }}>Parameter</th>
            <th style={{ color: '#FFFFFF' }}>Options</th>
            <th style={{ color: '#FFFFFF' }}>Description</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td><code>depth</code></td>
            <td><code>standard</code>, <code>deep</code></td>
            <td>Controls search depth. <code>deep</code> performs more thorough research, <code>standard</code> is faster.</td>
          </tr>

          <tr>
            <td><code>output\_type</code></td>
            <td><code>searchResults</code>, <code>sourcedAnswer</code>, <code>structured</code></td>
            <td>Determines the format of returned information.</td>
          </tr>
        </tbody>
      </table>
    </Info>
  </Step>

  <Step title="Initialize and run your agent">
    ```python
    # Agent initialization
    agent = FunctionCallingAgent.from_tools(
        linkup_tool.to_tool_list(),
        llm=OpenAI(
          api_key="<YOUR OPENAI API KEY>",
          model="gpt-4o-mini"
        ),
    )

    # Agent invocation
    response = agent.chat("Can you tell me which women were awarded the Physics Nobel Prize")
    print(response)
    ```
  </Step>
</Steps>

## Example Response

```python
# Sample output
{
  "response": "Marie Curie (1903), Maria Goeppert Mayer (1963), Donna Strickland (2018), and Andrea Ghez (2020) have been awarded the Nobel Prize in Physics.",
  "sources": [
    # Source information would appear here
  ]
}
```

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Lovable
Source: https://docs.linkup.so/pages/integrations/lovable/lovable

How to use Linkup with Lovable

## Overview

This guide will show you how to integrate Linkup API into your Lovable applications, whether you're starting from scratch or adding Linkup to an existing app.

## Integration Steps

<Steps>
  <Step title="Access your Lovable account">
    Log in to your Lovable account at [lovable.dev](https://lovable.dev).
  </Step>

  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Add Linkup to Your Lovable App">
    <Frame>
      ![Lovable Chatbot Interface](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/lovable/assets/lovable-chatbot.png)
    </Frame>

    In your Lovable chatbot window, use the prompt below:

    ```bash
    # Install the Linkup SDK
    npm i linkup-sdk

    # Import and initialize the client
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: '<YOUR API KEY>', # your api key here
    });

    # Create the search function
    const askLinkup = async () => {
      return await client.search({
        query: "Your Query here",
        depth: 'standard', # "standard" or "deep"
        outputType: 'sourcedAnswer',
      });
    };

    # Call the function
    askLinkup().then(console.log);
    ```

    <Info>
      <table>
        <thead>
          <tr>
            <th style={{ color: '#FFFFFF' }}>Parameter</th>
            <th style={{ color: '#FFFFFF' }}>Options</th>
            <th style={{ color: '#FFFFFF' }}>Description</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td><code>depth</code></td>
            <td><code>standard</code>, <code>deep</code></td>
            <td>Controls search depth. <code>deep</code> performs more thorough research, <code>standard</code> is faster.</td>
          </tr>

          <tr>
            <td><code>output\_type</code></td>
            <td><code>searchResults</code>, <code>sourcedAnswer</code>, <code>structured</code></td>
            <td>Determines the format of returned information.</td>
          </tr>
        </tbody>
      </table>
    </Info>
  </Step>

  <Step title="Start Building Your Web-Connected App">
    Now that you have Linkup integrated with Lovable, you can start building applications that have access to the entire web. Your Lovable app can now:

    * Search and retrieve real-time information from across the web
    * Provide up-to-date answers with source citations
    * Access and analyze web content to enhance user interactions

    Start by testing your integration with a simple query, then expand your application's capabilities using the advanced configuration options below.
  </Step>
</Steps>

For advanced configuration like including images, date filtering and supported output types,
check <a href="/pages/sdk/js/js#input-parameters" target="_blank" rel="noopener noreferrer"> configuration parameters </a>.

## Best Practices

1. **API Key Security**: Never expose your API key in client-side code. Use environment variables or secure backend storage.

2. **Error Handling**: Implement proper error handling for API calls:

```javascript
const askLinkup = async () => {
  try {
    const result = await client.search({
      query: "Your query here",
      depth: 'deep',
      outputType: 'sourcedAnswer',
    });
    return result;
  } catch (error) {
    console.error('Error fetching data from Linkup:', error);
    // Handle error appropriately
  }
};
```

3. **Rate Limiting**: Be mindful of API rate limits and implement appropriate caching strategies if needed.

## Next Steps

* Check out [Lovable documentation](https://docs.lovable.dev) to enhance your Lovable application
* Join our [Discord community](https://discord.com/invite/9q9mCYJa86) for support and updates

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Make
Source: https://docs.linkup.so/pages/integrations/make/make

How to connect Make to web search

## Overview

You can connect a [Make](https://eu2.make.com) workflow to web search through Linkup, which can be used as a Module to get contextual information from the internet.

## Installation

<Steps>
  <Step title="Open Make">
    Go to your Make account and navigate to dashboard > Scenario > Create a new scenario.

    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/go_to_scenario.png)
    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/click_on_scenario.png)
  </Step>

  <Step title="Select Linkup Action">
    Search for Linkup in the searchbar and select the Linkup Action you want to use.

    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/search_linkup.png)
  </Step>

  <Step title="Connect Your Account">
    Get your Linkup API Key and create a connection.

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>

    Click on Create a Connection and enter your Linkup API Key.

    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/create_connection.png)
    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/enter_api_key.png)

    Click on Save to complete the connection.
  </Step>

  <Step title="Configure Your Action">
    Enter your search query and choose the depth of the search.

    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/search_query.png)
    ![Make](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/make/assets/choose_depth.png)

    Click on Save to complete the setup.
  </Step>
</Steps>

You are all set to use Linkup in your Make workflow! Visit the [Concepts](/pages/documentation/get-started/concepts) page to learn more about the different Linkup parameters.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Linkup MCP Server
Source: https://docs.linkup.so/pages/integrations/mcp/mcp

Linkup MCP Server allows you to use the Linkup API in your MCP clients.

Developed by Anthropic, the [Model Context Protocol](https://github.com/modelcontextprotocol) (MCP) is an open protocol that standardizes how applications provide context to LLMs. It is particularly helpful when building agents and complex workflows on top of LLMs.

> Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.

-*Anthropic*

<Info>
  Learn more about the Model Context Protocol in Anthropic's [official documentation](https://modelcontextprotocol.io/introduction)
</Info>

<CardGroup cols={2}>
  <Card title="Linkup MCP NPM package" icon="npm" href="https://www.npmjs.com/package/linkup-mcp-server">
    linkup-mcp-server
  </Card>

  <Card title="Linkup MCP PyPi package" icon="python" href="https://pypi.org/project/mcp-search-linkup">
    mcp-search-linkup
  </Card>
</CardGroup>

<Tip>
  The Linkup MCP server is compatible with any MCP client, such as [Cursor](https://docs.cursor.com/context/model-context-protocol) or [Claude
  Desktop](https://modelcontextprotocol.io/quickstart/user).
</Tip>

The Linkup MCP server provides seamless interaction with the Linkup `/search` API for any MCP client. For example, it can be integrated with Anthropic's Claude:

![MCP demo](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/mcp/mcp_demo.gif)

## Prerequisites

To use Linkup MCP server, you need:

* a Linkup API key.
* Python (v3.8 or higher) and uv (0.6 or higher) or Node.js (v20 or higher) installed

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Setup Guide

<Tabs>
  <Tab title="Claude Desktop">
    <Steps>
      <Step title="Check Prerequisites">
        Before you begin, ensure you have [Claude Desktop](https://modelcontextprotocol.io/quickstart/user#1-download-claude-for-desktop) correctly installed.
      </Step>

      <Step title="Configure Claude to use Linkup MCP">
        You need to edit the Claude configuration file to enables it to connect to MCP servers. Don't worry, the configuration is really straightforward and is the official way to do it.

        <CodeGroup>
          ```shell Claude Desktop
          # Create the Claude desktop config file if it doesn't exist
          touch "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

          # Opens the config file in TextEdit
          open -e "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

          # Alternative method using Visual Studio Code
          code "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
          ```
        </CodeGroup>

        Add the appropriate configuration based on your installation method:

        <CodeGroup>
          ```json Python MCP
          {
            "mcpServers": {
              "linkup": {
                "command": "uvx",
                "args": [
                  "mcp-search-linkup"
                ],
                "env": {
                  "LINKUP_API_KEY": "{LINKUP_API_KEY}"
                }
              }
            }
          }
          ```

          ```json Javascript MCP
          {
            "mcpServers": {
              "linkup": {
                "command": "npx",
                "args": [
                  "-y",
                  "linkup-mcp-server"
                ],
                "env": {
                  "LINKUP_API_KEY": "{LINKUP_API_KEY}"
                }
              }
            }
          }
          ```
        </CodeGroup>

        Replace `{LINKUP_API_KEY}` with your actual Linkup API key.
      </Step>

      <Step title="Start Using MCP on Claude">
        1. Restart your Claude Desktop application
        2. Look for the hammer icon at the bottom right of the text area
        3. Click the hammer to see available MCP tools
        4. Start asking questions like "Who won the last Vendée Globe? Can you give me his time?"

        ![Claude desktop application homepage with MCP set up](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/mcp/claude_empty_prompt.png)
        ![available MCP tools](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/mcp/claude_available_mcp_tools.png)
      </Step>
    </Steps>

    <Tip>
      The Linkup MCP tool will automatically search through the internet to find grounding information to support Claude's generation.
    </Tip>
  </Tab>

  <Tab title="Cursor">
    <Steps>
      <Step title="Check Prerequisites">
        Before you begin, ensure you have [Cursor](https://www.cursor.com/) correctly installed.
      </Step>

      <Step title="Configure Cursor to use Linkup MCP">
        You need to edit the Cursor configuration file to enables it to connect to MCP servers. Don't worry, the configuration is really straightforward and is the official way to do it.

        <CodeGroup>
          ```shell Cursor config file
          # Create the Cursor config file if it doesn't exist
          mkdir $HOME/.cursor && touch $HOME/.cursor/mcp.json

          # Opens the config file in TextEdit
          open -e "$HOME/.cursor/mcp.json"

          # Alternative method using Cursor
          cursor "$HOME/.cursor/mcp.json"
          ```
        </CodeGroup>

        Add the appropriate configuration based on your installation method:

        <CodeGroup>
          ```json Python MCP
          {
            "mcpServers": {
              "linkup": {
                "command": "uvx",
                "args": [
                  "mcp-search-linkup"
                ],
                "env": {
                  "LINKUP_API_KEY": "{LINKUP_API_KEY}"
                }
              }
            }
          }
          ```

          ```json Javascript MCP
          {
            "mcpServers": {
              "linkup": {
                "command": "npx",
                "args": [
                  "-y",
                  "linkup-mcp-server"
                ],
                "env": {
                  "LINKUP_API_KEY": "{LINKUP_API_KEY}"
                }
              }
            }
          }
          ```
        </CodeGroup>

        Replace `{LINKUP_API_KEY}` with your actual Linkup API key.
      </Step>

      <Step title="Start Using MCP on Cursor">
        1. Restart your Cursor application
        2. Go in the "Cursor Settings" and inside the "MCP" category, you should see the Linkup MCP
        3. Start asking questions like "Who won the last Vendée Globe? Can you give me his time?"

        ![cursor available MCP tools](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/mcp/cursor_available_mcp_tools.png)
        ![cursor demo](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/mcp/cursor_demo.gif)
      </Step>
    </Steps>

    <Tip>
      The Linkup MCP tool will automatically search through the internet to find grounding information to support Cursor's generation.
    </Tip>
  </Tab>
</Tabs>

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# n8n
Source: https://docs.linkup.so/pages/integrations/n8n/n8n

Connect your n8n workflow to an internet search

## Overview

We are actively working on creating a Linkup node for [n8n](https://n8n.io).
In the meantime, follow this tutorial to get contextual information from the internet.

## Configuration Steps

<Steps>
  <Step title="Open your n8n account and create a workflow">
    Go to Workflows > Create Workflows
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/create_workflow.png)
  </Step>

  <Step title="Add a trigger">
    Click on the + button to add a trigger
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/create_trigger.png)
  </Step>

  <Step title="Select your trigger">
    Choose your trigger (Trigger Manually is selected in this example)
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/add_trigger.png)
  </Step>

  <Step title="Add HTTP Request node">
    Click on the + button > Core > HTTP Request
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/step1_action.png)
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/add_action.png)
  </Step>

  <Step title="Configure HTTP method">
    Select POST as Method
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/select_post.png)
  </Step>

  <Step title="Enter API endpoint">
    Enter `https://api.linkup.so/v1/search` in URL
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/enter_url.png)
  </Step>

  <Step title="Set up authentication">
    In Authentication, select "Generic Credential Type"
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/choose_auth.png)
  </Step>

  <Step title="Configure custom authentication">
    In Generic Auth Type, select "Custom Auth"
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/custom_auth.png)
  </Step>

  <Step title="Create new credential">
    In Custom Auth, click on "+ Create new credential"
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/create_cred.png)
  </Step>

  <Step title="Add authentication headers">
    Copy the following Json and paste it in the pop-up Json field

    ```json json
    {
        "headers": {
            "authorization": "Bearer YOUR_LINKUP_API_KEY",
            "Content-Type": "application/json"
        }
    }
    ```

    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/json.png)
  </Step>

  <Step title="Configure API key">
    Replace the `YOUR_LINKUP_API_KEY` in the code snippet you just paste. Click on the top right "Save" button.

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Enable request body">
    Toggle on "Send Body"
    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/swipe_button.png)
  </Step>

  <Step title="Configure request parameters">
    Add the following body parameters

    | Name       | value                              |
    | ---------- | ---------------------------------- |
    | q          | your query                         |
    | depth      | "deep" or "standard"               |
    | outputType | "searchResults" or "sourcedAnswer" |

    ![n8n](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/n8n/assets/enter_depth_and_output.png)
    Save and run your workflow.
  </Step>
</Steps>

You are all set to use Linkup in your n8n workflow! Visit the [Concepts](/pages/documentation/get-started/concepts) page to learn more about the different Linkup parameters.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# SurfSense
Source: https://docs.linkup.so/pages/integrations/surfsense/surfsense

How to use Linkup with SurfSense

## Overview

Linkup can be used with [SurfSense](https://github.com/MODSetter/SurfSense) as a Search Engine connector to create advanced AI agents and workflows based on internal and web data.

## Getting Started with Linkup in SurfSense

<Steps>
  <Step title="Setup SurfSense">
    Follow the guides here.

    1. [Setting up Docker](https://github.com/MODSetter/SurfSense/blob/main/surfsense_web/content/docs/docker-installation.mdx)
    2. [Setting up environment variables](https://github.com/MODSetter/SurfSense/blob/main/surfsense_web/content/docs/index.mdx)
  </Step>

  <Step title="Get your Linkup API Key">
    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>
  </Step>

  <Step title="Add Linkup Connector">
    Navigate to the Add Connector page under Connectors section in SurfSense and configure with your Linkup API Key.
    ![Connector Page](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/surfsense/assets/connector_page.png)
    ![Adding Linkup API](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/surfsense/assets/config_connector.png)
  </Step>

  <Step title="Select the Linkup Connector during Research">
    While performing a query under Researcher, select the Linkup Connector and save it.
    ![Selecting Linkup Connector](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/surfsense/assets/selecting_linkup.png)
  </Step>

  You are all set to use the Linkup Search API with SurfSense.
</Steps>

## Example

![Example Usage - Linkup with Surfsense](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/surfsense/assets/example_usage.png)

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Zapier
Source: https://docs.linkup.so/pages/integrations/zapier/zapier

Integrate Linkup in Zapier to augment your workflows

## Overview

Linkup can be used as a [Zapier](https://zapier.com) Action to get contextual information from the internet in a workflow.

## Installation

<Steps>
  <Step title="Open Zapier">
    1. Open your Zapier account.
    2. Go to the dashboard Create > Zaps.

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/click_on_create.png)
  </Step>

  <Step title="Select Linkup Action">
    1. Click on Action to select a Linkup Action

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/click_on_action.png)

    2. Search for Linkup and click on Linkup

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/search_linkup.png)

    3. Select the Linkup Action you want to use

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/choose_action.png)
  </Step>

  <Step title="Connect Linkup Account">
    1. Get your Linkup API Key:

    <Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
      Create a Linkup account for free to get your API key.
    </Card>

    2. Click on Account.
    3. Enter your Linkup API Key.

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/enter_api_key.png)

    4. Click on Yes, Continue to Linkup.
    5. Click on Continue

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/click_continue.png)
  </Step>

  <Step title="Configure and Run">
    1. Enter your search query.

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/choose_query.png)

    2. Choose the depth of the search.

    ![Zapier](https://mintlify.s3.us-west-1.amazonaws.com/linkup-8b5c238e/pages/integrations/zapier/assets/choose_depth.png)

    3. Click on Continue.
  </Step>
</Steps>

You are all set to use Linkup in your Zapier workflow! Visite the [Concepts](/pages/documentation/get-started/concepts) page to learn more about the different Linkup parameters.

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Typescript SDK
Source: https://docs.linkup.so/pages/sdk/js/js

How to use Linkup Javascript SDK natively in your apps.

## Introduction

The Typescript SDK allows for easy interaction with the Linkup API, offering the full range of our search functionality. Easily integrate smart search capabilities into your applications, harnessing Linkup’s powerful search features.
You can use our [playground](https://app.linkup.so/playground) to have interactive examples and see how to implement them with the SDK.

<CardGroup cols={2}>
  <Card title="Github" icon="github" href="https://github.com/LinkupPlatform/linkup-js-sdk">
    Repository (feel free to contribute)
  </Card>

  <Card title="NPM" icon="npm" href="https://www.npmjs.com/package/linkup-sdk">
    NPM page
  </Card>
</CardGroup>

## Quickstart

Get started with our Typescript SDK in less than 5 minutes!

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Installation

You can install the Linkup Typescript SDK using the following:

```shell
npm i linkup-sdk
```

## Usage

Here is a basic usage showing how to use the Linkup SDK:

```typescript
import { LinkupClient } from "linkup-sdk";

const client = new LinkupClient({
	apiKey: "<YOUR API KEY>",
});

const askLinkup = async () => {
	return await client.search({
		query: "Can you tell me which women were awared the Physics Nobel Prize",
		depth: "standard",
		outputType: "sourcedAnswer",
	});
};

askLinkup().then(console.log);
```

## Input Parameters

| Parameter              | Type    | Description                                                                                        | Default   |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------- | --------- |
| query                  | str     | The input query string                                                                             | Required  |
| depth                  | string  | Type of search to perform "standard" or "deep"                                                     | Required  |
| outputType             | string  | Linkup response type, can be "sourcedAnswer", "searchResults", "structuredOutput"                  | Required  |
| structuredOutputSchema | string  | The returned schema from the Linkup API. It should be used only if the outputType is 'structured'. | undefined |
| includeImages          | boolean | To also return images                                                                              | undefined |
| fromDate               | date    | From date to search                                                                                | undefined |
| toDate                 | date    | To date to search                                                                                  | undefined |

### Query

The `query` parameter is the core input string that defines your search intent. It represents the question or information request that you want Linkup to answer. How you formulate this query significantly impacts the quality and relevance of results.

Effective queries should be:

* **Clear and specific**: "What were the key findings of NASA's James Webb telescope in 2023?" provides better results than "Tell me about space discoveries"
* **Contextually rich**: Include relevant context when needed ("What are the environmental impacts of lithium mining for EV batteries?")
* **Naturally phrased**: Write as you would ask a knowledgeable person, not with keywords

For optimal results, consider reviewing our [prompting guide](https://docs.linkup.so/pages/documentation/tutorials/prompting-guide), which provides detailed strategies for crafting effective queries.

### Depth

The `depth` field is used to select the type of search you want to perform:

* **standard**: the search will be straightforward and fast, suited for relatively simple queries (e.g. "What's the weather in Paris today?")
* **depth**: the search will use an agentic workflow, which makes it in general slower, but it will be able to solve more complex queries (e.g. "What is the company profile of LangChain accross the last few years, and how does it compare to its concurrents?")

### Output type

The type of output which is expected:

* **sourcedAnswer**: Provides a comprehensive natural language answer to the query along with citations to the source material. Ideal for when you need well-formed responses with verifiable information and transparent sourcing.
* **searchResults**: Returns the raw search context data without synthesis, giving you direct access to the underlying information. Useful for custom processing, or when you need to implement your own answer generation logic.
* **structured**: Allows you to receive responses in a custom format based on the format provided in
  `structuredOutputSchema`. If you want a full guide on how to use it, you check it [here](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide)

### Structured output schema

Linkup’s structured output feature allows you to receive responses in a custom format that you define. This is particularly useful when you need to integrate Linkup’s responses directly into your application’s data structure or when you want to ensure consistency in the response format.
To do that, you have to use the `structuredOutputSchema` field.
If you want a full guide on how to use it, you check it [here](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide)

### Include images

The `includeImages` parameter allows you to receive image results alongside text results in your search responses. When set to `true`, Linkup will return relevant images related to your query, each with a URL and metadata. This is particularly useful for:

* Creating visual search experiences
* Building content that combines text and images
* Researching topics where visual information is important

Image results are returned with the same structure as text results but with `type: "image"`.

### fromDate

The `fromDate` parameter filters search results to only include content published after the specified date. This helps you:

* Focus on recent information
* Exclude outdated content

The date should be a Date type, for example: `new Date("2024-01-01")`.

### toDate

The `toDate` parameter complements `fromDate` by restricting search results to only include content published or updated before the specified date. This is useful for:

* Historical research on specific time periods
* Analyzing content published within a specific date range
* Avoiding more recent information that might skew results

Like `fromDate`, the date should be a Date type, for example: `new Date("2024-12-31")`.

When used together, `fromDate` and `toDate` create a date range filter for your search results.

## Examples

<AccordionGroup>
  <Accordion title="Last Formula 1 race" description="Standard example" icon="flag">
    <p>This example show you how to combine the standard search with a sourced answer</p>

    ```typescript
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: 'YOUR_API_KEY',
    });

    const getRaceResume = async () => {
      return await client.search({
        query:"Can you resume me the last Formula 1 race ?",
        depth:"standard",
        outputType:"sourcedAnswer",
      });
    };

    getRaceResume().then(console.log);
    ```

    Example response:

    ```json
    {
      "answer": "Lando Norris won the 2025 Australian Grand Prix, the season opener, in challenging wet conditions. The race saw multiple incidents, including crashes on the first lap, leading to six drivers not finishing. Notably, Lewis Hamilton finished in 10th place. The race was marked by dramatic weather changes that affected many competitors. For more details, you can read the full results [here](https://www.motorsportweek.com/2025/03/16/f1-2025-australian-grand-prix-race-results/).",
      "sources": [
        {
          "name": "F1 2025 Australian Grand Prix – Race Results",
          "url": "https://www.motorsportweek.com/2025/03/16/f1-2025-australian-grand-prix-race-results/",
          "snippet": "McLaren's Lando Norris has won the Formula 1 season-opening Australian Grand Prix in a mixed conditions thriller at the Albert"
        },
        {
          "name": "McLaren’s Lando Norris wins wet and wild Australian Grand Prix. Hamilton finishes 10th",
          "url": "https://www.msn.com/en-us/sports/other/mclarens-lando-norris-wins-wet-and-wild-australian-grand-prix-hamilton-finishes-10th/ar-AA1B0kIf",
          "snippet": "The Melbourne race had a thrilling start with Racing Bull’s Isack Hadjar out on the formation lap, and Alpine’s Jack Doohan and Williams’ Carlos Sainz crashing out on the opening lap."
        },
        {
          "name": "F1 Australian Grand Prix 2025 results: Norris wins, rookies spin out in the rain",
          "url": "https://www.msn.com/en-us/sports/other/f1-australian-grand-prix-2025-results-norris-wins-rookies-spin-out-in-the-rain/ar-AA1B4irD",
          "snippet": "If you like drama in racing, the 2025 F1 Australian Grand Prix didn’t disappoint. Intermittent rain caused havoc on the track, and six drivers didn’t complete the 57 laps, including four of this year’s full-season rookies."
        },
        {
          "name": "F1 2025 schedule: Full race calendar, round dates for Formula One season",
          "url": "https://www.msn.com/en-us/sports/other/f1-2025-schedule-full-race-calendar-round-dates-for-formula-one-season/ar-AA1B0AkZ",
          "snippet": "Formula 1 campaign is officially underway.There has been criticism of F1's geographical planning of races in recent years, so efforts have been made this season to create a more logical and environmentally sustainable calendar."
        },
        {
          "name": "Formula 1 in 2025: How to watch the Australian Grand Prix on TV and what to know",
          "url": "https://www.msn.com/en-us/sports/other/formula-1-in-2025-how-to-watch-the-australian-grand-prix-on-tv-and-what-to-know/ar-AA1AJMQd",
          "snippet": "Get ready for the Australian Grand Prix with a guide that tells you everything you need to know about how to watch the year's first Formula 1 race, what the schedule is and more."
        },
        {
          "name": "The 2025 Formula 1 Season Is Here. Here’s Everything You Need to Know.",
          "url": "https://robbreport.com/motors/cars/2025-formula-1-season-preview-1236361696/",
          "snippet": "Formula 1 season starts Sunday with the Australian Grand Prix, and the drama and adrenaline of the 24-race is ready to redline."
        },
        {
          "name": "Formula 1 2025",
          "url": "https://www.channel4.com/4viewers/blog/formula-1-2025",
          "snippet": "Formula 1 travels to China, where the first Sprint race of the 2025 season takes place ... for highlights of the Chinese Grand Prix. Last year, Max Verstappen dominated around the Shanghai ..."
        },
        {
          "name": "F1 2025 preview: How to watch, schedule, teams, drivers, title favorites",
          "url": "https://www.usatoday.com/story/sports/motor/formula1/2025/03/13/f1-2025-schedule-how-to-watch-preview-odds/82323048007/",
          "snippet": "After a thrilling finish to the 2024 world championship season, Formula 1 is back in action starting this weekend in Melbourne with the Australian Grand Prix. Last ... for race wins once again."
        },
        {
          "name": "F1 2025 season: Full calendar, testing and race schedule, driver line-ups, rules, how to watch, what's new",
          "url": "https://www.skysports.com/f1/news/12433/13292832/f1-2025-season-full-calendar-testing-and-race-schedule-driver-line-ups-rules-how-to-watch-whats-new",
          "snippet": "All you need to know about Formula 1 in ... on March 14-16 as part of a rejigged 24-race calendar, which does not feature any new events. Bahrain has hosted the opening race for the last four ..."
        },
        {
          "name": "Formula 1 2025 season preview and predictions: Leclerc could be the one to stop Verstappen's run",
          "url": "https://www.racingpost.com/sport/motor-sports-tips/formula-1-tips/formula-1-2025-season-predictions-and-betting-tips-a4eYr9M8WFXb/",
          "snippet": "You might not guess it from the final points table, but the 2024 Formula 1 season was the most open for decades ... the fight for the constructors’ champ­ionship on the last lap of the last race. Charles Leclerc enjoyed his strongest season, with ..."
        }
      ]
    }
    ```
  </Accordion>

  <Accordion title="Company Revenue" description="Deep + structured output" icon="building">
    <p>This example shows you how to use the deep with a relative complexe structured output:</p>

    ```typescript
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: 'YOUR_API_KEY',
    });

    const schema = {
      "type": "object",
      "properties": {
        "companyName": {
          "type": "string",
          "description": "The name of the company"
        },
        "revenueAmount": {
          "type": "number",
          "description": "The revenue amount"
        },
        "fiscalYear": {
          "type": "string",
          "description": "The fiscal year for this revenue"
        }
      }
    };

    const getCompanyRevenue = async () => {
      return await client.search({
        query: "What is Microsoft's 2024 revenue?",
        depth: 'deep',
        outputType: 'structured',
        structuredOutputSchema: schema
      });
    };

    getCompanyRevenue().then(console.log);
    ```

    Example response:

    ```json
    {
        "companyName": "Microsoft",
        "revenueAmount": 245100000000,
        "fiscalYear": "2024"
    }
    ```
  </Accordion>

  <Accordion title="Latest politic news" description="Search results as outputType" icon="newspaper">
    <p>This example shows you how to use the standard with a search results:</p>

    ```typescript
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: 'YOUR_API_KEY',
    });

    const getNews = async () => {
      return await client.search({
        query: "Latest politic news",
        depth: 'standard',
        outputType: 'searchResults'
      });
    };

    getNews().then(console.log);
    ```

    Example response:

    ```json
    {
      "results": [
        {
          "type": "text",
          "name": "‘I’m Still Here’ invites reflection on world politics, history",
          "url": "https://www.thepostathens.com/article/2025/03/im-still-here-movie-review",
          "content": "For “I’m Still Here,” viewers do not walk away with the same feeling. It begins with excitement and energy but ends feeling empty and reflective. It is a movie about memory and the ability to keep the ones we’ve lost alive in our psyches."
        },
        {
          "type": "text",
          "name": "Local Politics",
          "url": "https://www.seattletimes.com/seattle-news/politics/",
          "content": "House Bill 1175 would have required cities across Washington to allow cafes and stores in all residential areas, superseding any local zoning restrictions. Initiative 2081, signed by over 448,000 ..."
        },
        {
          "type": "text",
          "name": "Spruce Creeker allegedly points gun at fellow resident over politics",
          "url": "https://www.villages-news.com/2025/03/17/spruce-creeker-allegedly-points-gun-at-fellow-resident-over-politics/",
          "content": "A resident of the Spruce Creek Del Webb community in Summerfield was arrested after he allegedly pointed a gun at a fellow resident over politics."
        },
        {
          "type": "text",
          "name": "U.S. Politics",
          "url": "https://www.newsweek.com/topic/u.s.-politics",
          "content": "Senate Minority Leader Chuck Schumer has now announced he is in fact planning to back the stopgap bill. Newsweek's live blog is closed."
        },
        {
          "type": "text",
          "name": "Nevada Politics",
          "url": "https://lasvegassun.com/news/politics/",
          "content": "Tariffs on imported goods are the known unknown in the Clark County School District’s offices of construction and facilities management. Those are the offices responsible for the upkeep ..."
        },
        {
          "type": "text",
          "name": "VIRGINIA POLITICS",
          "url": "https://www.washingtonpost.com/local/virginia/politics/",
          "content": "Virginia Superintendent of Public Instruction Lisa Coons has resigned, marking the second departure from the role under Gov. Glenn Younkin. Anderson’s move, coupled with the Democratic Party’s ..."
        },
        {
          "type": "text",
          "name": "BSc Politics and Philosophy",
          "url": "https://www.lse.ac.uk/study-at-lse/undergraduate/bsc-politics-and-philosophy",
          "content": "You won’t simply study politics and philosophy side by side. You’ll see how each subject helps us understand political practices and behaviour and the development of political ideals. This includes examining public policies from the perspective of ..."
        },
        {
          "type": "text",
          "name": "The NPR Politics Podcast",
          "url": "https://www.npr.org/podcasts/510310/npr-politics-podcast",
          "content": "Every weekday, NPR's best political reporters are there to explain the big news coming out of Washington and the campaign trail. They don't just tell you what happened. They tell you why it matters."
        },
        {
          "type": "text",
          "name": "About RealClearPolitics",
          "url": "https://www.realclearpolitics.com/about.html",
          "content": "With this realization, John and Tom set out to create an online clearinghouse tailored to consumers of news and information on U.S. politics, policy, and elections. Despite a shared passion for ..."
        },
        {
          "type": "text",
          "name": "Georgia Politics",
          "url": "https://www.fox5atlanta.com/tag/politics/ga-politics",
          "content": "A prominent plaza in Washington, D.C., dedicated to the Black Lives Matter (BLM) movement, is undergoing major changes as crews began dismantling the site this week. The results are in for the ..."
        }
      ]
    }
    ```
  </Accordion>

  <Accordion title="Amazon deforestation" description="IncludeImages filter" icon="trees">
    <p>This example return text and images sources</p>

    ```typescript
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: 'YOUR_API_KEY',
    });

    const getData = async () => {
      return await client.search({
        query: "Amazon deforestation",
        depth: 'standard',
        outputType: 'searchResults',
        includeImages: true
      });
    };

    getData().then(console.log);
    ```

    Exemple response

    ```json
    {
      "results":
        [
          {"type":"text","name":"The rough road to sustainable farming in an Amazon deforestation hotspot","url":"https://www.msn.com/en-us/society-culture-and-history/social-issues/the-rough-road-to-sustainable-farming-in-an-amazon-deforestation-hotspot/ar-AA1B64yY","content":"Bartolomeu Moraes, better known as Brasília, was a peasant leader and trade unionist in Brazil involved in a long, bloody land war. In 2002, he was killed after years of opposing powerful local ranchers along the BR-163 highway area,"},
          {"type":"text","name":"Forest management ambitions in Brazilian Amazon aim to make up for lost time","url":"https://www.msn.com/en-us/news/world/forest-management-ambitions-in-brazilian-amazon-aim-to-make-up-for-lost-time/ar-AA1ALyxz","content":"In the early 2000s, deforestation levels in the Brazilian Amazon rose so tremendously that, faced with both national and international pressure, the federal government decided to implement forest timber management as a way to curb the destruction."},
          {"type":"text","name":"Race to save the rainforest: Why replacing cocaine barons with cattle ranchers is destroying the Amazon","url":"https://www.telegraph.co.uk/news/amazon-deforestation-in-colombia/","content":"Though the Amazon rainforest proved a useful screen ... Should the recent rates of deforestation continue, experts warn, the implications will prove devastating for us all. Marisela Silva Parra ..."},
          {"type":"text","name":"Thousands of acres of Amazon rainforest cleared for climate summit highway in Brazil","url":"https://www.msn.com/en-us/news/world/thousands-of-acres-of-amazon-rainforest-cleared-for-climate-summit-highway-in-brazil/ar-AA1AQQ04","content":"A BBC report found on Wednesday that tens of thousands of acres of protected Amazonian rainforest are being cleared ahead of the COP30 climate summit in Brazil."},
          {"type":"text","name":"The Environmental Cost of Amazon Highways to Host COP30: The dilemma of Sustainability Goals vs Amazon Destruction","url":"https://www.ghanaweb.com/GhanaHomePage/features/The-Environmental-Cost-of-Amazon-Highways-to-Host-COP30-The-dilemma-of-Sustainability-Goals-vs-Amazon-Destruction-1975596","content":"The Amazon rainforest, often referred to as the 'lungs of the Earth,' plays a crucial role in global climate regulation by absorbing vast amounts of carbon dioxide and producing oxygen."},
          {"type":"text","name":"Carlos Nobre on tipping points in the Amazon rainforest","url":"https://thebulletin.org/premium/2025-03/carlos-nobre-on-tipping-points-in-the-amazon-rainforest/","content":"For roughly about 65 million years, the forests of the Amazonian were resilient to changes in the climate. But that is changing rapidly, as the region is exposed to unprecedented stress from global warming,"},
          {"type":"image","name":"Deforestation: Primary Forest Losses Impact Climate Change — Carmen ...","url":"https://images.squarespace-cdn.com/content/v1/584738ff20099e6c2da92f74/1556207140784-08HFC1PNAYWX368IJGXM/ke17ZwdGBToddI8pDm48kNvT88LknE-K9M4pGNO0Iqd7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QPOohDIaIeljMHgDF5CVlOqpeNLcJ80NK65_fV7S1USOFn4xF8vTWDNAUBm5ducQhX-V3oVjSmr829Rco4W2Uo49ZdOtO_QXox0_W7i2zEA/Deforestation+in+Brazil"},
          {"type":"image","name":"Amazon Rainforest Deforestation Before And After","url":"https://media.wired.com/photos/59372bbfd80dd005b42b626f/master/w_2560%2Cc_limit/AP4997094644081.jpg"},
          {"type":"image","name":"11 Amazon Rainforest Deforestation Facts to Know About | Earth.Org","url":"https://u4d2z7k9.rocketcdn.me/wp-content/uploads/2021/11/Untitled-design-88.jpg"},
          {"type":"image","name":"Deforestation Before And After Amazon Rainforest","url":"https://idsb.tmgrup.com.tr/ly/uploads/images/2020/07/10/45806.jpg"},
          {"type":"image","name":"Deforestation In The Amazon Rainforest | emr.ac.uk","url":"https://en.mercopress.com/data/cache/noticias/73326/0x0/1-88.jpg"},
          {"type":"image","name":"√100以上 amazon rainforest deforestation rate per day 269464-Amazon ...","url":"https://static01.nyt.com/images/2020/06/07/world/07amazon-bw/06amazon-mediumSquareAt3X.jpg"},{"type":"image","name":"Amazon Forest Deforestation","url":"https://infoamazonia.org/wp-content/uploads/2022/02/50224578572_2b105d3b5e_o.jpg"},{"type":"image","name":"Beneath the Wisteria: The Horrifying Science of the Deforestation ...","url":"https://media.wired.com/photos/5d6027925af21f000859fc13/master/w_2000,c_limit/Science_AmazonASAP_1125307709.jpg"},{"type":"image","name":"Deforestation in Brazil is rising again — after years of decline - Vox","url":"https://cdn1.vox-cdn.com/thumbor/dmZLKnfH2zl9uLLzyxti1yWEfO0=/cdn0.vox-cdn.com/uploads/chorus_asset/file/2373910/184252072.0.jpg"},
          {"type":"image","name":"Brazil: Rate of deforestation in Amazon rainforest at highest level in ...","url":"https://www.dynamitenews.com/images/2019/11/20/brazil-rate-of-deforestation-in-amazon-rainforest-at-highest-level-in-11-years/ifA0r86KFZ0Ju1tlmvCSPbrfqnvBkVNfIozgNWEl.jpeg"},
          {"type":"image","name":"Amazon deforestation leaps 16 percent in 2015 | Inhabitat - Green ...","url":"https://inhabitat.com/wp-content/blogs.dir/1/files/2015/11/amazon-deforestation02.jpg"},
        ]
    }
    ```
  </Accordion>

  <Accordion title="AI Avancements" description="Dates filtering" icon="calendar">
    <p>This example shows you how to use the dates filter:</p>

    ```typescript
    import { LinkupClient } from 'linkup-sdk';

    const client = new LinkupClient({
      apiKey: 'YOUR_API_KEY',
    });

    const getNews = async () => {
      return await client.search({
        query: "What are the recent advancements in artificial intelligence technology",
        "depth": "standard",
        "outputType": "sourcedAnswer",
        "fromDate": new Date("2025-03-01"),
        "toDate": new Date("2025-03-05"),
      });
    };

    getNews().then(console.log);
    ```

    Example response:

    ```json
    {
      "answer":"1. **MBZUAI Launches AI Undergraduate Program**: The Mohamed bin Zayed University of Artificial Intelligence has introduced a pioneering undergraduate program aimed at shaping future AI leaders. [Read more](https://www.finanznachrichten.de/nachrichten-2025-03/64714165-mbzuai-unveils-first-of-its-kind-undergraduate-program-in-artificial-intelligence-designed-to-empower-future-ai-leaders-200.htm)\n\n2. **DeepSeek AI Chatbot Raises Cybersecurity Concerns**: The release of DeepSeek, an AI chatbot, has sparked discussions about new cybersecurity challenges associated with rapidly advancing AI technologies. [Read more](https://www.law.com/newyorklawjournal/2025/03/04/deepseek-sparks-new-cyber-challenges-in-the-ai-chatbot-era/)\n\n3. **AI's Impact on Business Innovation**: The integration of AI and other technologies is becoming essential for business success, driving innovation and growth. [Read more](https://www.independent.com.mt/articles/2025-03-02/newspaper-opinions/The-intersection-of-technology-and-business-Paving-the-way-for-innovation-and-growth-6736268254)\n\n4. **Research on Achieving Human-Level AI**: Experts are calling for a change in approach to develop AI systems capable of human-level reasoning, indicating current methods may not suffice. [Read more](https://www.nature.com/articles/d41586-025-00649-4)",
      "sources":
        [
          {
            "name":"MBZUAI Unveils First-of-its-Kind Undergraduate Program in Artificial Intelligence Designed to Empower Future AI Leaders",
            "url":"https://www.finanznachrichten.de/nachrichten-2025-03/64714165-mbzuai-unveils-first-of-its-kind-undergraduate-program-in-artificial-intelligence-designed-to-empower-future-ai-leaders-200.htm",
            "snippet":"ABU DHABI, AE / ACCESS Newswire / March 3, 2025 / The Mohamed bin Zayed University of Artificial Intelligence (MBZUAI) is disrupting the AI education landscape with the launch of its first-ever underg"
          },
          {
            "name":"The intersection of technology and business: Paving the way for innovation and growth",
            "url":"https://www.independent.com.mt/articles/2025-03-02/newspaper-opinions/The-intersection-of-technology-and-business-Paving-the-way-for-innovation-and-growth-6736268254",
            "snippet":"In the fast-paced world of business, the integration of innovative technologies has become a crucial driver of success. As an advocate for Artificial Intelligence (AI), Blockchain, Data Analytics, and"
          },
          {
            "name":"DeepSeek Sparks New Cyber Challenges In the AI Chatbot Era",
            "url":"https://www.law.com/newyorklawjournal/2025/03/04/deepseek-sparks-new-cyber-challenges-in-the-ai-chatbot-era/",
            "snippet":"This article discusses DeepSeek, an artificial intelligence chatbot that was released in January of this year, and the concerns it raises around security and rapidly advancing technology."
          },
          {
            "name":"Prediction: 2 Artificial Intelligence (AI) Stocks That Will Be Worth More Than Palantir by 2026",
            "url":"https://www.fool.com/investing/2025/03/02/prediction-2-artificial-intelligence-ai-stocks-tha/",
            "snippet":"and one of its biggest driving force has been the artificial intelligence (AI) industry. Recent advances have led to a lot of investor excitement about the potential for the technology to change ..."
          },
          {
            "name":"How Technology is Changing Our Everyday Life: From AI to the Internet of Things",
            "url":"https://signalscv.com/2025/03/how-technology-is-changing-our-everyday-life-from-ai-to-the-internet-of-things/",
            "snippet":"Technology has revolutionized our lives, transforming how we communicate, work, shop, and even unwind. In a world driven by rapid innovation, technologies like artificial intelligence (AI), the Internet of Things"
          },
          {
            "name":"How AI can achieve human-level intelligence: researchers call for change in tack",
            "url":"https://www.nature.com/articles/d41586-025-00649-4",
            "snippet":"Artificial intelligence (AI) systems with human-level reasoning are unlikely to be achieved through the approach and technology ... Heights, New York, who spearheaded the survey in her role as president of the Association for the Advancement of Artificial ..."
          }
      ]
    }
    ```
  </Accordion>
</AccordionGroup>

## Additional ressources

### Prompting guide

We strongly recommend you to read our [prompting guide](https://docs.linkup.so/pages/documentation/tutorials/prompting-guide) to best prompt the Linkup API and get optimal results. Even small improvements in how you structure your prompts can dramatically enhance the quality of responses and the overall user experience.

### Structured output guide

We strongly recommend you to read our [structured output guide](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide) to ensure consistency in the response format. Mastering structured outputs allows you to fully leverage Linkup's capabilities while maintaining complete control over how the information is presented and processed in your application.

### Tutorials

Don't hesitate to [check our tutorials](https://docs.linkup.so/pages/documentation/tutorials/signup-radar) for other ideas of what to build with Linkup!

And voilà ! You're now ready to implement the Linkup SDK inside your fabulous project ! 🚀

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>


# Python SDK
Source: https://docs.linkup.so/pages/sdk/python/python

How to use Linkup Python SDK natively in your apps.

## Introduction

The Python SDK allows for easy interaction with the Linkup API, offering the full range of our search functionality. Easily integrate smart search capabilities into your applications, harnessing Linkup’s powerful search features.
You can use our [playground](https://app.linkup.so/playground) to have interactive examples and see how to implement them with the SDK.

<CardGroup cols={2}>
  <Card title="Github" icon="github" href="https://github.com/LinkupPlatform/linkup-python-sdk">
    Repository (feel free to contribute)
  </Card>

  <Card title="PyPi" icon="python" href="https://pypi.org/project/linkup-sdk/">
    PyPi page
  </Card>
</CardGroup>

## Quickstart

Get started with our Python SDK in less than 5 minutes!

<Card title="Get your API key" icon="key" href="https://app.linkup.so" horizontal="True">
  Create a Linkup account for free to get your API key.
</Card>

## Installation

You can install the Linkup Python SDK using the following:

```shell
pip install linkup-sdk
```

## Usage

Here is a basic usage showing how to use the Linkup SDK:

```python
from linkup import LinkupClient

# Initialize the client (API key can be read from the environment variable or passed as an argument)
client = LinkupClient(api_key="YOUR_API_KEY")

# Perform a search query
search_response = client.search(
    query="What are the 3 major events in the life of Abraham Lincoln?",
    depth="deep",
    output_type="sourcedAnswer",
    structured_output_schema=None,
)
print(search_response)
```

## Input Parameters

| Parameter                  | Type                                                     | Description                                                                                          | Default   |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| query                      | str                                                      | The input query string                                                                               | Required  |
| depth                      | Literal\["standard", "deep"]                             | Type of search to perform                                                                            | Required  |
| output\_type               | Literal\["searchResults", "sourcedAnswer", "structured"] | Linkup response type                                                                                 | Required  |
| structured\_output\_schema | pydantic.BaseModel or string                             | The returned schema from the Linkup API. It should be used only if the output\_type is 'structured'. | undefined |
| include\_images            | bool                                                     | To also return images                                                                                | undefined |
| from\_date                 | date                                                     | From date to search                                                                                  | undefined |
| to\_date                   | date                                                     | To date to search                                                                                    | undefined |

### Query

The `query` parameter is the core input string that defines your search intent. It represents the question or information request that you want Linkup to answer. How you formulate this query significantly impacts the quality and relevance of results.

Effective queries should be:

* **Clear and specific**: "What were the key findings of NASA's James Webb telescope in 2023?" provides better results than "Tell me about space discoveries"
* **Contextually rich**: Include relevant context when needed ("What are the environmental impacts of lithium mining for EV batteries?")
* **Naturally phrased**: Write as you would ask a knowledgeable person, not with keywords

For optimal results, consider reviewing our [prompting guide](https://docs.linkup.so/pages/documentation/tutorials/prompting-guide), which provides detailed strategies for crafting effective queries.

### Depth

The `depth` field is used to select the type of search you want to perform:

* **standard**: the search will be straightforward and fast, suited for relatively simple queries (e.g. "What's the weather in Paris today?")
* **depth**: the search will use an agentic workflow, which makes it in general slower, but it will be able to solve more complex queries (e.g. "What is the company profile of LangChain accross the last few years, and how does it compare to its concurrents?")

### Output type

The type of output which is expected:

* **sourcedAnswer**: Provides a comprehensive natural language answer to the query along with citations to the source material. Ideal for when you need well-formed responses with verifiable information and transparent sourcing.
* **searchResults**: Returns the raw search context data without synthesis, giving you direct access to the underlying information. Useful for custom processing, or when you need to implement your own answer generation logic.
* **structured**: Allows you to receive responses in a custom format based on the format provided in
  `structured_output_schema`. If you want a full guide on how to use it, you check it [here](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide)

### Structured output schema

Linkup’s structured output feature allows you to receive responses in a custom format that you define. This is particularly useful when you need to integrate Linkup’s responses directly into your application’s data structure or when you want to ensure consistency in the response format.
To do that, you have to use the `structured_output_schema` field. Supported formats are a pydantic.BaseModel or a string representing a valid object JSON schema.
If you want a full guide on how to use it, you check it [here](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide)

### Include images

The `include_images` parameter allows you to receive image results alongside text results in your search responses. When set to `true`, Linkup will return relevant images related to your query, each with a URL and metadata. This is particularly useful for:

* Creating visual search experiences
* Building content that combines text and images
* Researching topics where visual information is important

Image results are returned with the same structure as text results but with `type: "image"`.

### fromDate

The `from_date` parameter filters search results to only include content published after the specified date. This helps you:

* Focus on recent information
* Exclude outdated content

The date should be a Date type, for example: `date(2025, 3, 1)`.

### toDate

The `to_date` parameter complements `from_date` by restricting search results to only include content published or updated before the specified date. This is useful for:

* Historical research on specific time periods
* Analyzing content published within a specific date range
* Avoiding more recent information that might skew results

Like `from_date`, the date should be a Date type, for example: `date(2025, 3, 15)`.

When used together, `from_date` and `to_date` create a date range filter for your search results.

## Examples

<AccordionGroup>
  <Accordion title="Last Formula 1 race" description="Standard example" icon="flag">
    <p>This example show you how to combine the standard search with a sourced answer</p>

    ```python
    from linkup import LinkupClient

    client = LinkupClient()

    search_response = client.search(
        query="Last Formula 1 race",
        depth="standard",
        output_type="sourcedAnswer",
    )
    print(search_response)
    ```

    Example response:

    ```python
    answer='The last Formula 1 race was the Australian Grand Prix, where Lando Norris won. The race took place recently, and it was marked by intermittent rain causing several challenges on the track. The next race is the Chinese Grand Prix, scheduled for March 21-23, 2025.'
    sources=[
      LinkupSource(name='Formula 1 season begins with dramatic Australian Grand Prix', url='https://www.emorywheel.com/article/2025/03/pivexulgpch8', snippet='The Australian Grand Prix was a thrilling way to start the 2025 F1 season for the many fans eager to have F1 back after the long winter break. The excitement will continue with the Chinese Grand Prix, the first sprint race of the season, in Shanghai on March 21-23.'),
      LinkupSource(name="AUTO RACING: Bell's three-race win streak snapped and Norris takes the F1 season opener", url='https://www.washingtonpost.com/sports/auto-racing/2025/03/18/auto-racing-glance/414c4f32-0419-11f0-941f-6ca83a0bd35b_story.html', snippet='Schedule: Saturday, practice, 1:05 p.m., qualifying, 2:10 p.m.; Sunday, race, 3 p.m. (FS1). Track: Homestead-Miami Speedway. Race distance: 267 laps, 400.5 miles. Last year: Tyler Reddick secured the win from the pole after a last-lap pass of Ryan Blaney.'),
      LinkupSource(name='F1 Australian Grand Prix 2025 results: Norris wins, rookies spin out in the rain', url='https://www.yahoo.com/lifestyle/f1-australian-grand-prix-2025-083408114.html', snippet='Intermittent rain caused havoc on the track before and during the 2025 F1 Australian Grand Prix. The post F1 Australian Grand Prix 2025 results: Norris wins, rookies spin out in the rain appeared first on The Manual.'),
      LinkupSource(name='Eddie Jordan dies aged 76 as tributes pour in for ‘incredible spirit’ of F1 icon: latest', url='https://www.msn.com/en-us/sports/other/eddie-jordan-dies-aged-76-as-tributes-pour-in-for-incredible-spirit-of-f1-icon-latest/ar-AA1BindV', snippet='Eddie Jordan dies aged 76 as tributes pour in for ‘incredible spirit’ of F1 icon: latest - The 76-year-old passed away after a year-long battle with cancer'),
      LinkupSource(name='Verstappen faces F1 race ban as Red Bull replacement lined up', url='https://www.msn.com/en-gb/sport/motorsports/max-verstappen-faces-f1-race-ban-as-red-bull-replacement-lined-up/ar-AA1BieZw', snippet='Red Bull may have to look for a replacement for Max Verstappen during the 2025 Formula 1 season, with the team presented with a variety of candidates. The four-time world champion remains dangerously close to a one-race ban, issued by the FIA if a driver picks up 12 penalty points on their super licence over the course of 12 months.'),
      LinkupSource(name='F1 mailbag: Hadjar’s tears, Hamilton’s adjustment and a ‘Racing Dad’ award', url='https://www.nytimes.com/athletic/6213658/2025/03/19/f1-hadjar-lewis-hamilton-anthony-hamilton/', snippet='Some of the wrecks were caused by small mistakes, like Hadjar trying to warm up his tires. Sauber’s Gabriel Bortoleto, who crashed with 10 or so laps to go, said he “touched the curb and ultimately ended up in the wall.”'),
      LinkupSource(name='Eddie Jordan: Former F1 team owner dies aged 76', url='https://www.skysports.com/f1/news/12433/13332330/eddie-jordan-former-f1-team-owner-dies-aged-76', snippet='Eddie Jordan has passed away at the age of 76; Jordan had an F1 team for 15 seasons, winning four races; Irishman recently oversaw Adrian Neweys transfer from Red Bull to Aston Martin and led a consor'),
      LinkupSource(name='F1 Australian Grand Prix live updates: Lando Norris, McLaren wins chaotic opening race in Melbourne', url='https://www.nytimes.com/athletic/live-blogs/f1-australia-gp-live-updates-race-times-results/k6d5T4xUkEkD/', snippet='Follow live reaction from Formula One’s opening grand prix of 2025, where rain caused three safety cars and six retirements'),
      LinkupSource(name='A tough race for the rookies as F1 starts 2025 in Australia', url='https://arstechnica.com/cars/2025/03/a-tough-race-for-the-rookies-as-f1-starts-2025-in-australia/', snippet="True F1 junkies were probably following the preseason test earlier this month in Bahrain, as the sport now helpfully shows those three days of running on its streaming platform. But those devoted enough to watch the cars circulate for hours with nothing on the line also know you shouldn't read too much into a preseason test,"),
      LinkupSource(name='Formula 1', url='https://www.sportskeeda.com/f1', snippet='Additionally, unlike in over the last decade, wheel covers are back ... The 2022 season has Carlos Sainz and Monaco’s Charles Leclerc racing for legendary F1 team Ferrari. Their strongest ...')]
    ```
  </Accordion>

  <Accordion title="Company Revenue" description="Deep + structured output" icon="building">
    <p>This example shows you how to use the deep with a relative complexe structured output:</p>

    ```python
    from linkup import LinkupClient

    client = LinkupClient(api_key="YOUR_API_KEY")

    schema = """{
        "type": "object",
        "properties": {
            "companyName": {
                "type": "string",
                "description": "The name of the company"
            },
            "revenueAmount": {
                "type": "number",
                "description": "The revenue amount"
            },
            "fiscalYear": {
                "type": "string",
                "description": "The fiscal year for this revenue"
            }
        }
    }"""

    response = client.search(
        query="What is Microsoft's 2024 revenue?",
        depth="deep",
        output_type="structured",
        structured_output_schema=schema
    )

    print(response)
    ```

    Example response:

    ```json
    {
        "companyName": "Microsoft",
        "revenueAmount": 245100000000,
        "fiscalYear": "2024"
    }
    ```
  </Accordion>

  <Accordion title="Latest politic news" description="Search results as outputType" icon="newspaper">
    <p>This example shows you how to use the standard with a search results:</p>

    ```python
    from linkup import LinkupClient

    client = LinkupClient(api_key="YOUR_API_KEY")

    search_response = client.search(
        query="Latest politic news",
        depth="standard",
        output_type="searchResults",
    )

    print(search_response)
    ```

    Example response:

    ```python
    results=[
      LinkupSearchTextResult(type='text', name='CNN host Van Jones shares personal upbringing, reflects on state of American politics', url='https://www.browndailyherald.com/article/2025/03/cnn-host-van-jones-shares-personal-upbringing-reflects-on-state-of-american-politics', content='On Wednesday night, the Watson Institute for International and Public Affairs welcomed CNN Host Van Jones for a conversation on the state of American politics. In his talk, Jones explained increasingly strained ties between Jewish and Black activist communities,'),
      LinkupSearchTextResult(type='text', name='Politics latest: Billions being shaved off welfare bill - join our live Q&A on what it means for you', url='https://news.sky.com/story/politics-latest-trump-wants-to-shock-europe-into-action-with-false-ukraine-claims-says-boris-johnson-12593360', content='Work and Pensions Secretary Liz Kendall has announced changes to the welfare system - including merging some benefits and a plan to scrap the work capability assessment used to claim universal credit.'),
      LinkupSearchTextResult(type='text', name='Politics', url='https://www.npr.org/sections/politics/', content="March 19, 2025 • The decision offers a venue compromise in the bellwether case, while Khalil's legal team seeks to release him from detention and block his deportation."),
      LinkupSearchTextResult(type='text', name='Nevada Politics', url='https://lasvegassun.com/news/politics/', content='Nevada U.S. Sens. Jacky Rosen and Catherine Cortez Masto both voted against a GOP-constructed spending measure to avoid a government shutdown, though ... Nevada employers shortchange minimum wage ...'),
      LinkupSearchTextResult(type='text', name="Politics latest: Labour vows to 'unleash seismic reforms' for planning system", url='https://news.sky.com/story/politics-latest-live-starmer-ukraine-zelenskyy-war-trump-welfare-cuts-12593360', content='It arose, he explained, "out of a consultation begun by the previous government". Politics At Jack And Sam\'s: Keir the builder – can he fix it? 👉Listen to Politics At Jack And Sam\'s on your ...'),
      LinkupSearchTextResult(type='text', name='U.S. Politics', url='https://www.newsweek.com/topic/u.s.-politics', content="Senate Minority Leader Chuck Schumer has now announced he is in fact planning to back the stopgap bill. Newsweek's live blog is closed."),
      LinkupSearchTextResult(type='text', name='Editorial Cartoons on Politics', url='https://www.usnews.com/news/cartoons/editorial-cartoons-on-politics', content='Your trusted source for the latest news delivered weekdays from the team at U.S. News and World Report. Sign in to manage your newsletters » Sign up to receive the latest updates from U.S News ...'),
      LinkupSearchTextResult(type='text', name='BSc Politics and Philosophy', url='https://www.lse.ac.uk/study-at-lse/undergraduate/bsc-politics-and-philosophy', content='You won’t simply study politics and philosophy side by side. You’ll see how each subject helps us understand political practices and behaviour and the development of political ideals. This includes examining public policies from the perspective of ...'),
      LinkupSearchTextResult(type='text', name='The NPR Politics Podcast', url='https://www.npr.org/podcasts/510310/npr-politics-podcast', content="Every weekday, NPR's best political reporters are there to explain the big news coming out of Washington and the campaign trail. They don't just tell you what happened. They tell you why it matters."),
      LinkupSearchTextResult(type='text', name="Nahid calls for consensus to end 'Mujibbadi' politics in Bangladesh", url='https://www.tbsnews.net/bangladesh/politics/nahid-calls-consensus-end-mujibbadi-politics-bangladesh-1096916', content='National Citizen Party (NCP) Convener Nahid Islam today (19 March) urged political parties to reach a political consensus so that there would be no room for "Mujibbadi" politics in the election and politics of future Bangladesh.')
    ]
    ```
  </Accordion>

  <Accordion title="Amazon deforestation" description="IncludeImages filter" icon="trees">
    <p>This example return text and images sources</p>

    ```python
    from linkup import LinkupClient

    client = LinkupClient(api_key="YOUR_API_KEY")

    search_response = client.search(
        query="Amazon deforestation",
        depth="standard",
        output_type="searchResults",
        include_images=True
    )

    print(search_response)
    ```

    Exemple response

    ```python
    results=[
      LinkupSearchTextResult(type='text', name='How a grassroots financing model is helping Indigenous communities save the Amazon', url='https://www.unep.org/news-and-stories/story/how-grassroots-financing-model-helping-indigenous-communities-save-amazon', content='A United Nations effort is channeling more finance to communities to help them conserve, restore and sustainably manage forests.'),
      LinkupSearchTextResult(type='text', name='Amazon Rainforest Razed To Build Highway For UN Climate Summit', url='https://ijr.com/amazon-rainforest-razed-to-build-highway-for-un-climate-summit/', content='Ahead of the COP30 climate summit in Belém, Brazil, developers are carving a four-lane highway through protected tracts of the'),
      LinkupSearchTextResult(type='text', name='Roads less traveled multiply deforestation in the Amazon and beyond', url='https://www.msn.com/en-us/news/world/roads-less-traveled-multiply-deforestation-in-the-amazon-and-beyond/ar-AA1AGYEe', content='James Cook University-led research has revealed secondary roads branching from major highways in tropical forests linked to extensive deforestation across the Brazilian Amazon, the Congo Basin, and New Guinea.'),
      LinkupSearchTextResult(type='text', name='Forest management ambitions in Brazilian Amazon aim to make up for lost time', url='https://www.msn.com/en-us/news/world/forest-management-ambitions-in-brazilian-amazon-aim-to-make-up-for-lost-time/ar-AA1ALyxz', content='In the early 2000s, deforestation levels in the Brazilian Amazon rose so tremendously that, faced with both national and international pressure, the federal government decided to implement forest timber management as a way to curb the destruction.'),
      LinkupSearchTextResult(type='text', name='Amazon Rainforest Slashed for Highway Ahead of Climate Summit, Sparking Outrage', url='https://www.nysun.com/article/amazon-rainforest-slashed-for-highway-ahead-of-climate-summit-sparking-outrage', content='Dubbed the Avenida Liberdade highway, the new stretch of highway cuts across tens of thousands of acres of rainforest located on the outskirts of Belem, where over 50,000 people, including world leaders, are anticipated to gather in November for the COP30 Climate Summit, according to a report from BBC News.'),
      LinkupSearchTextResult(type='text', name='Thousands of acres of Amazon rainforest cleared for climate summit highway in Brazil', url='https://www.msn.com/en-us/news/world/thousands-of-acres-of-amazon-rainforest-cleared-for-climate-summit-highway-in-brazil/ar-AA1AQQ04', content='A BBC report found on Wednesday that tens of thousands of acres of protected Amazonian rainforest are being cleared ahead of the COP30 climate summit in Brazil.'),
      LinkupSearchTextResult(type='text', name='Brazil Cuts Acres of Amazon Trees to Build Road for Climate Summit', url='https://greekreporter.com/2025/03/13/amazon-tree-cut-road-climate-summit/', content='A new road is being built by cutting down thousands of protected Amazon rainforest acres for the COP30 climate summit in Belém, Brazil.'),
      LinkupSearchTextResult(type='text', name='Amazon tree loss may worsen both floods and droughts: study', url='https://phys.org/news/2025-03-amazon-tree-loss-worsen-droughts.html', content='Deforestation in the Amazon causes more rain in the wet season and less rain in the dry season, according to new research published Wednesday underscoring the rainforest\'s "pivotal" role in regulating local and global climate.'),
      LinkupSearchTextResult(type='text', name='Amazon Rainforest Cut Down for Climate Summit Highway', url='https://www.msn.com/en-us/news/world/amazon-rainforest-cut-down-for-climate-summit-highway/ar-AA1ALWO1', content='Brazilian officials said the highway is sustainable with wildlife crossings for animals to use and solar lighting.'),
      LinkupSearchTextResult(type='text', name='Amazon Rainforest Chopped Down to Build Highway for Conference on Climate Change', url='https://www.msn.com/en-us/news/world/amazon-rainforest-chopped-down-to-build-highway-for-conference-on-climate-change/ar-AA1ALPK2', content='The Brazilian government has cleared protected Amazon rainforest to build a highway for the COP30 climate summit.'), LinkupSearchImageResult(type='image', name='Deforestation: Primary Forest Losses Impact Climate Change — Carmen ...', url='https://images.squarespace-cdn.com/content/v1/584738ff20099e6c2da92f74/1556207140784-08HFC1PNAYWX368IJGXM/ke17ZwdGBToddI8pDm48kNvT88LknE-K9M4pGNO0Iqd7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QPOohDIaIeljMHgDF5CVlOqpeNLcJ80NK65_fV7S1USOFn4xF8vTWDNAUBm5ducQhX-V3oVjSmr829Rco4W2Uo49ZdOtO_QXox0_W7i2zEA/Deforestation+in+Brazil'), LinkupSearchImageResult(type='image', name='11 Amazon Rainforest Deforestation Facts to Know About | Earth.Org', url='https://u4d2z7k9.rocketcdn.me/wp-content/uploads/2021/11/Untitled-design-88.jpg'),
      LinkupSearchImageResult(type='image', name='Amazon Fires and the Horrifying Science of Deforestation | WIRED', url='https://media.wired.com/photos/5d6027925af21f000859fc13/master/w_2000,c_limit/Science_AmazonASAP_1125307709.jpg'),
      LinkupSearchImageResult(type='image', name='Deforestation In The Amazon Rainforest | emr.ac.uk', url='https://en.mercopress.com/data/cache/noticias/73326/0x0/1-88.jpg'),
      LinkupSearchImageResult(type='image', name='Amazon Deforestation WWF - Green Queen', url='https://www.greenqueen.com.hk/wp-content/uploads/2020/06/Amazon-Deforestation-WWF.jpg'),
      LinkupSearchImageResult(type='image', name='Brazil warned to cut Amazon rainforest deforestation or lose funding ...', url='https://e3.365dm.com/17/06/1600x900/874f86bbc8aa7b82069469f195e8a13107ecb0e3602b2d6a7e1a9614a615d7e8_3985203.jpg?20170623162747'),
      LinkupSearchImageResult(type='image', name='In the Amazon, the World’s Largest Reservoir of Biodiversity, Two ...', url='https://insideclimatenews.org/wp-content/uploads/2021/09/amazon-rainforest_carl-de-souza-afp-getty-scaled.jpg'),
      LinkupSearchImageResult(type='image', name='Amazon rainforest destruction is accelerating, shows government data', url='https://imgs.mongabay.com/wp-content/uploads/sites/20/2020/09/01155427/GP0STURQQ_AmazonFiresAug20_PressMedia.jpg'),
      LinkupSearchImageResult(type='image', name="Deforestation in Brazil's Amazon surges to 12-year high | Daily Sabah", url='https://idsb.tmgrup.com.tr/ly/uploads/images/2020/12/01/thumbs/800x531/75990.jpg?v=1606825500'),
      LinkupSearchImageResult(type='image', name='√100以上 amazon rainforest deforestation rate per day 269464-Amazon ...', url='https://static01.nyt.com/images/2020/06/07/world/07amazon-bw/06amazon-mediumSquareAt3X.jpg'),
      LinkupSearchImageResult(type='image', name='Amazon Forest Deforestation', url='https://infoamazonia.org/wp-content/uploads/2022/02/50224578572_2b105d3b5e_o.jpg'),
      LinkupSearchImageResult(type='image', name='Brazil has deforested 10,000 square kilometers of Amazon rainforest in ...', url='https://idsb.tmgrup.com.tr/ly/uploads/images/2020/06/10/40283.jpg'),
      LinkupSearchImageResult(type='image', name='Describe Several Consequences of Rainforest Deforestation Read More ...', url='https://www.internetgeography.net/wp-content/uploads/2019/06/Gold-mining-in-the-Amazon-Rainforest.jpg'),
      LinkupSearchImageResult(type='image', name='Deforestation Amazon Rainforest', url='https://grist.org/wp-content/uploads/2022/03/GettyImages-1228062652.jpg'),
      LinkupSearchImageResult(type='image', name='Deforestation in Brazil is surging again — after years of decline - Vox', url='https://cdn1.vox-cdn.com/thumbor/dmZLKnfH2zl9uLLzyxti1yWEfO0=/cdn0.vox-cdn.com/uploads/chorus_asset/file/2373910/184252072.0.jpg'),
      LinkupSearchImageResult(type='image', name="Deforestation in Amazon forest affecting Brazil's climate - Dynamite News", url='https://www.dynamitenews.com/images/2019/08/31/deforestation-in-amazon-forest-affecting-brazils-climate/5d6a6147de851.jpeg'),
      LinkupSearchImageResult(type='image', name='Tropical forest loss sped up in 2022, despite pledges to halt ...', url='https://grist.org/wp-content/uploads/2023/06/amazon-deforestation-road.jpg'),
      LinkupSearchImageResult(type='image', name='5 ways to help the Amazon Rainforest | WWF', url='https://www.wwf.org.uk/sites/default/files/styles/content_slide_image/public/2019-08/Deforestation%20in%20the%20amazon.jpg?h=96614ff5&itok=UcoKwZ8q'),
      LinkupSearchImageResult(type='image', name='Amazon Deforestation', url='https://scx2.b-cdn.net/gfx/news/2020/1-ahandoutpict.jpg'),
      LinkupSearchImageResult(type='image', name='Illiegal_logging_indigineous_lands_Amazon_deforestation_via ...', url='https://modernconsensus.com/wp-content/uploads/2020/06/Illiegal_logging_indigineous_lands_Amazon_deforestation_via-CamillaCosta.jpg'),
    ]
    ```
  </Accordion>

  <Accordion title="AI Avancements" description="Dates filtering" icon="calendar">
    <p>This example shows you how to use the dates filter:</p>

    ```python
    from linkup import LinkupClient
    from datetime import date

    client = LinkupClient(api_key="YOUR_API_KEY")

    search_response = client.search(
        query="What are the recent advancements in artificial intelligence technology",
        depth="standard",
        output_type="sourcedAnswer",
        from_date=date(2025, 3, 1),
        to_date=date(2025, 3, 5),
    )

    print(search_response)
    ```

    Example response:

    ```python
    answer='1. A call for a new approach to achieve human-level reasoning in AI systems has been highlighted by researchers. [Read more](https://www.nature.com/articles/d41586-025-00649-4).\n\n2. The release of DeepSeek, an AI chatbot, has raised new cybersecurity concerns. [Read more](https://www.law.com/newyorklawjournal/2025/03/04/deepseek-sparks-new-cyber-challenges-in-the-ai-chatbot-era/).\n\n3. AI continues to transform everyday life, influencing communication, work, and leisure activities. [Read more](https://signalscv.com/2025/03/how-technology-is-changing-our-everyday-life-from-ai-to-the-internet-of-things/).\n\n4. The integration of AI with other technologies is driving innovation and growth in business sectors. [Read more](https://www.independent.com.mt/articles/2025-03-02/newspaper-opinions/The-intersection-of-technology-and-business-Paving-the-way-for-innovation-and-growth-6736268254).'
    sources=[
      LinkupSource(name='How AI can achieve human-level intelligence: researchers call for change in tack', url='https://www.nature.com/articles/d41586-025-00649-4', snippet='Artificial intelligence (AI) systems with human-level reasoning are unlikely to be achieved through the approach and technology ... Heights, New York, who spearheaded the survey in her role as president of the Association for the Advancement of Artificial ...'),
      LinkupSource(name='DeepSeek Sparks New Cyber Challenges In the AI Chatbot Era', url='https://www.law.com/newyorklawjournal/2025/03/04/deepseek-sparks-new-cyber-challenges-in-the-ai-chatbot-era/', snippet='This article discusses DeepSeek, an artificial intelligence chatbot that was released in January of this year, and the concerns it raises around security and rapidly advancing technology.'),
      LinkupSource(name='How Technology is Changing Our Everyday Life: From AI to the Internet of Things', url='https://signalscv.com/2025/03/how-technology-is-changing-our-everyday-life-from-ai-to-the-internet-of-things/', snippet='Technology has revolutionized our lives, transforming how we communicate, work, shop, and even unwind. In a world driven by rapid innovation, technologies like artificial intelligence (AI), the Internet of Things'),
      LinkupSource(name='The intersection of technology and business: Paving the way for innovation and growth', url='https://www.independent.com.mt/articles/2025-03-02/newspaper-opinions/The-intersection-of-technology-and-business-Paving-the-way-for-innovation-and-growth-6736268254', snippet='In the fast-paced world of business, the integration of innovative technologies has become a crucial driver of success. As an advocate for Artificial Intelligence (AI), Blockchain, Data Analytics, and')
    ]
    ```
  </Accordion>
</AccordionGroup>

## Additional ressources

### Prompting guide

We strongly recommend you to read our [prompting guide](https://docs.linkup.so/pages/documentation/tutorials/prompting-guide) to best prompt the Linkup API and get optimal results. Even small improvements in how you structure your prompts can dramatically enhance the quality of responses and the overall user experience.

### Structured output guide

We strongly recommend you to read our [structured output guide](https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide) to ensure consistency in the response format. Mastering structured outputs allows you to fully leverage Linkup's capabilities while maintaining complete control over how the information is presented and processed in your application.

### Tutorials

Don't hesitate to [check our tutorials](https://docs.linkup.so/pages/documentation/tutorials/signup-radar) for other ideas of what to build with Linkup!

And voilà ! You're now ready to implement the Linkup SDK inside your fabulous project ! 🚀

<Info>
  Facing issues? Reach out to our engineering team at [support@linkup.so](mailto:support@linkup.so) or via our [Discord](https://discord.com/invite/9q9mCYJa86).
</Info>
