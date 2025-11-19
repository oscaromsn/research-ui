---
modified: 2025-09-18T07:01:30-03:00
---
# Learning Effect: Building Robust AI Systems at Markprompt
## By Elliot Dauber - Effect Meetup SF 2024

### Executive Summary
Elliot Dauber, a recent Stanford graduate and founding engineer at Markprompt, shares his journey learning Effect while building production AI infrastructure for customer support. Despite being new to TypeScript and Effect, he demonstrates how Effect's composable primitives, dependency injection, and error handling enable building reliable systems on top of inherently unreliable AI providers. The presentation provides both practical implementation patterns and candid reflections on the challenges of learning and adopting Effect, offering valuable insights for engineers considering or beginning their Effect journey.

---

## Part 1: Context and Background

### The Speaker's Journey

#### Academic to Industry Transition
- **Education**: 5 years at Stanford - Bachelor's and Master's in Computer Science
- **Previous Experience**: Humane (Java/Android development)
- **Current Role**: Founding engineer at Markprompt (2 months at time of talk)

#### Technical Background

> "I had not really written much TypeScript before this, but I have played around with JavaScript and I kind of shied away from it because anytime I built something reasonably large, it just became a huge mess."

This perspective is crucial - Elliot represents developers coming to Effect without the burden of legacy JavaScript patterns but also without deep TypeScript experience.

### Why Markprompt Chose Effect

#### The Business Need

> "We were really here for building things for the long term and doing it right... I'm young, I'm in my early 20s, this is what I wanna learn as an engineer."

Markprompt's requirements:
- Building AI infrastructure for enterprise customer support
- High-growth companies demanding reliability
- Constant iteration with customers
- Fast movement without sacrificing safety

#### The Technical Challenge

> "We are building them specifically on top of very unreliable systems."

The core problem: Building reliable systems on unreliable foundations (AI providers).

---

## Part 2: The Reliability Challenge

### OpenAI's Unreliability

#### The Reality of AI APIs
- OpenAI uptime graph shows "pretty good" availability with periodic outages
- When OpenAI goes down, dependent services also fail without proper handling
- Similar issues across all providers (Anthropic, etc.)

#### Common Problems
1. **Complete API Outages**: Services become unavailable
2. **Timing Issues**: Unreliable response times
3. **Malformed Responses**: Tool calls returning unexpected parameters
4. **Quality Degradation**: Models performing below expectations

### Effect as the Solution

#### Core Benefits for AI Systems
- **Extremely simple fallback and retry logic**
- **Easy concurrency management**
- **Explicit error handling**
- **Powerful streaming support**
- **Dependency injection framework**
- **Built-in observability**

> "Every time you wanna reach for something, there's something there that will solve your problem and it's all native to the same library. So it all just works really well together."

---

## Part 3: Building the LLM Interface

### Service Architecture

#### Basic Service Definition

```typescript
interface ChatCompletionsServiceType {
  getChatCompletions: (
    payload: Payload,
  ) => LLMReturn;

  streamChatCompletions: (
    payload: Payload,
  ) => LLMStream;
}
```

```typescript
class ChatCompletionsService extends Context.Tag(
  '@markprompt/ChatCompletionsService',
)<ChatCompletionsService, ChatCompletionsServiceType>() {}
```

The key insight: Treat AI providers as black boxes with uniform interfaces.

#### Single Model Implementation

```typescript
export const singleForModel = (
  model: string,
) =>
  Effect.gen(function* () {
    const OpenAI = yield* OpenAICompletions;
    const Anthropic = yield* AnthropicCompletions;
    const Groq = yield* GroqCompletions;

    if (S.is(OpenAIModel)(model)) {
      return ChatCompletionsService.of({
        getChatCompletions: (payload) => OpenAI.get(payload),
        streamChatCompletions: (payload) => OpenAI.stream(payload)
      });
    }

    if (S.is(AnthropicModel)(model)) {
      return ChatCompletionsService.of({
        getChatCompletions: (payload) => Anthropic.get(payload),
        streamChatCompletions: (payload) => Anthropic.stream(payload)
      });
    }
  });
```

### Implementing Fallback Strategies

#### The Fallback Pattern

> "What if we want to say, okay, I want to make a request to OpenAI, but I want to fall back to Anthropic if there's some failure in OpenAI's API."

```typescript
const fallbackAndRetry = (
  primaryService: ChatCompletionsService['Type'],
  secondaryService: ChatCompletionsService['Type'],
  retryPolicy: Schedule.Schedule<unknown>,
) =>
  Effect.gen(function* () {
    // Used to track whether the primary service has already failed
    const ref = yield* Ref.make(false);

    return ChatCompletionsService.of({
      getChatCompletions: (payload) =>
        Effect.gen(function* () {
          const primaryFailed = yield* Ref.get(ref);

          return yield* Effect.if(primaryFailed, {
            onFalse: () =>
              Effect.retryOrElse(
                pipe(
                  primaryService.getChatCompletions(payload),
                  retryPolicy,
                  () => Effect.gen(function* () {
                    yield* Ref.update(ref, () => true);
                    return yield* secondaryService.getChatCompletions(payload);
                  }),
                ),
              ),
            onTrue: () =>
              secondaryService.getChatCompletions(payload),
          });
        }),
    });
  });
```

Key features:

- Stateful tracking of primary service failures
- Automatic fallback to secondary
- Retry policies before failing over
- Clean, readable composition

#### Composable Fallback Chains

```typescript
const retryPolicy = Schedule.addDelay(
  Schedule.recurs(2),
  () => '500 millis'
);

const fallbackAndDefaultRetry = (
  primary: ChatCompletionsService['Type'],
  secondary: ChatCompletionsService['Type'],
) => fallbackAndRetry(primary, secondary, retryPolicy);

const chatCompletionsService = yield* fallbackAndRetry(
  yield* singleForModel('gpt-4o-mini'),
  yield* fallbackAndDefaultRetry(
    yield* singleForModel('claude-3-5-sonnet-20240620'),
    yield* singleForModel('groq-llama-3.1-70b-versatile'),
  ),
);
```

> "These things start to be very, very composable. So you can just say, oh, so this is an example of that. Then you start to be able to just nest these things. And this is like very common functional programming style of just being able to have these primitives and just build things up in a really, really, really simple way and it becomes so readable. Like you read this and it's so obvious what is happening."

---

## Part 4: Testing with Dependency Injection

### The Power of DI for Testing

> "This is where I love the dependency injection framework in Effect. It is so, so powerful to be able to model very, very fine-grained error states and also higher level error states."

#### Creating Test Services

```typescript
export class FetchService extends Context.Tag('@markprompt/FetchService')
  FetchService,
  {
    fetch: (
      input: RequestInfo | URL,
    ) => Effect.Effect<Response, FetchClientError | FetchError, never>;
  }
>() {
  static Live = Layer.succeed(FetchService, { fetch: fetchEff });
}
```

#### Integration Test Pattern

```typescript
switch (testName) {
  case 'openai-completions-down': {
    return Layer.mergeAll(
      OpenAIChatCompletionsService.Live.pipe(
        Layer.provide(FetchService.Always500sLive),
      ),
      AnthropicChatCompletionsService.Live.pipe(
        Layer.provide(FetchService.Live)
      ),
    );
  }
  // etc
}
```

> "We just provide the actual OpenAI Completion service with a faulty fetch service. So we just provide the error state of this. And we could provide a OpenAI service with an actual like OpenAI error. You could provide any type of service to this."

#### Benefits

> "The really, really nice thing is that all of this stuff happens at the top level of your program. And you don't have to worry about like all this like testing code within your program. You just have these really nice interfaces and you get to just build things the way you want them and then kind of separate the testing out."

- Testing logic separated from business logic
- Fine-grained control over failure scenarios
- No mocking libraries needed
- Type-safe test doubles

### End-to-End Testing Example

> "Say we have like some API route and there's, we do a lot of stuff with, excuse me, with LLMs, we do post-processing on our data with LLMs to generate sentiment analysis of a conversation that a customer has. And you can just provide this faulty OpenAI service to the entire system, right? And you don't have to worry about it anywhere else."

```typescript
// Test entire API route with faulty OpenAI
const testAPIRoute = apiRoute.pipe(
  Effect.provideService(OpenAIService, faultyOpenAIService)
)

// Verify graceful degradation
expect(result).toHaveProperty('fallbackUsed', true)
```

---

## Part 5: Advanced Patterns

### Stream Processing

> "Really quickly, also just so nice that Effect has all of this streaming capabilities."

#### Split Stream Pattern

```typescript
Stream.broadcast(2, 5).
Effect.flatMap((userStream, dataStream) =>
  // now userStream and dataStream are copies
  // of the original OpenAI stream!
```

> "This is a beautiful, I didn't write this code, but this is like a very, very beautiful thing you can do with Effect is just split the stream and just say, I want two copies of the stream. One is just going to go directly to the user and one is going to go to our analytics endpoint."

Challenge solved:

> "We were actually having an issue where the user stream was ending early because, sorry, the side of the stream that went to the user was ending before the side of the stream, since these things are happening concurrently, before the database call was made. And so our messages weren't getting stored."

#### Synchronization with Deferred

```typescript
const dataStreamDone = yield* Deferred.make<boolean>();

Stream.broadcast(2, 5),
Effect.flatMap(([userStream, dataStream]) =>
  // now userStream and dataStream are copies
  // of the original OpenAI stream!

return userStream.pipe(
  Stream.ensuring(Deferred.await(dataStreamDone))

pipe(
  processStream,
  Stream.runDrain,
  Effect.onExit(() =>
    Effect. (
      Deferred.succeed(dataStreamDone, true)
    ),
  ),
)
```

> "You don't have to deal with other concurrency libraries, you can just deal with this all in Effect."

### Structured Outputs

#### Type-Safe AI Responses

```typescript
const prompt = `Your task is to read a conversation between a customer support agent and a customer, and give a score to the agent on how well they answered the question.`;
  
GetStructuredOutputCompletion({
  prompt,
  structuredOutputSchema: S.Struct({
    score: S.Number,
    rationale: S.String,
  }),
}).pipe(
  Effect.provideService(
    ChatCompletionsService,
    chatCompletionsService
  )
)
```

```typescript
(parameter) output: {
  readonly score: number;
  readonly rationale: string;
}
```

> "We can just build this very, very easily with Effect, just give it a schema, like an Effect schema, just say I want the score and rationale, again, provide this kind of opaque service to it. And your output is just nicely typed."

> "That is such a beautiful way to interact with LLMs because you just ask it for some object and you just get that. And it's such a nice abstraction. And again, all of this is just completely in Effect native. And so everything fits together really well."

Benefits:
- No manual JSON parsing
- Type safety from AI responses
- Schema validation built-in
- Clean abstraction over provider differences

### Agentic Workflows

> "Say we're building like an agentic workflow like Max is talking about. So going from just doing RAG when a customer asks a question, but actually doing multiple steps, maybe extracting feedback from previous runs and maybe want to do these things in parallel."

#### Dynamic Service Provision

> "Say we have this generic OpenAI to Anthropic fallback that we want for, that's our default service that we're going to provide. And then at each different step, maybe there's a different model that's better for structured outputs. Something new comes out. We just very easily, few lines of code provide that service and nothing else in our program changes."

> "Say there's a model that comes out that's really good at reflecting. We just do the same thing. And so this stuff becomes so simple."

> "When you build stuff in Effect, I think what's really nice is it is harder at the beginning, but the changes that you have to make to your system when you want to do new things are just so much easier. Which I think is so powerful for us when we're trying to move fast and a customer asks for something or some new technology comes out because this stuff is moving so fast. To just be able to plug that in is just so powerful."

```typescript
const agentWorkflow = Effect.gen(function* () {
  // Default service for most steps
  const defaultService = openAIToAnthropicFallback
  
  // Step 1: Reflection - use specialized model
  const reflection = yield* reflectStep.pipe(
    Effect.provideService(LLMService, claudeOpusService)
  )
  
  // Step 2: Action - use model good at structured outputs
  const action = yield* actionStep.pipe(
    Effect.provideService(LLMService, gpt4TurboService)
  )
  
  // Step 3: Observation - use default
  const observation = yield* observeStep
  
  return { reflection, action, observation }
}).pipe(
  Effect.provideService(LLMService, defaultService)
)
```

#### Concurrent Operations

```typescript
Effect.all([
  RetrieveKnowledge,
  ExtractFeedback
], 
{ concurrency: 'unbounded' }
);
```

> "When you build stuff in Effect... the changes that you have to make to your system when you want to do new things are just so much easier."

---

## Part 6: Reflections on Learning Effect

### The Positives

#### Composability

> "I think the reason that I've really enjoyed working with Effect and it's so fun is because it's composable. This is what we do as engineers is we build systems that we can piece together and be creative. And it gives us the tools to be confident when we're being creative and not be afraid that every change that we make is going to just completely break our system."

#### Functional Programming Reality

> "Everybody in the back of their head wants to be able to write their code in functional languages. But you just can't because there's not the ecosystems."

Effect bridges this gap - functional programming with TypeScript's ecosystem.

#### Discovery and Learning

> "There is so much stuff going on in Effect that I have not even touched... You show up to work and there's problems you have to solve and you don't really know what to do. But... there's definitely something."

#### Team Scalability

> "You can have people working on different subsystems and be sure... that you know what is happening there. And it's not just going to throw a bunch of errors."

### The Challenges and Lessons

#### Not a Silver Bullet

> "It's definitely not a silver bullet... Just use Effect and things are going to work. I think that was more of the mindset that I brought to it. But things can go wrong. And you need to use your brain."

#### Hidden Error Paths

Common beginner mistake:

```typescript
// ❌ BAD - Catch-all hides specific errors
const topLevel = pipe(
  apiHandler,
  Effect.catchAll((e) =>
    Effect.succeed(res.error(500, e.message))
  ),
);
```

```typescript
// ✅ GOOD - Handle specific error tags
const topLevel = pipe(
  apiHandler,
  Effect.catchTags({
    FetchError: (e) => {
      // handle fetch error
    },
    ParseError: (e) => {
      // handle parse error
    },
    CustomError: (e) => {
      // handle custom error
    },
  })
);

const apiHandler = Effect.gen(function* () {
  // do a bunch of stuff
  yield* someFunction();
  // CustomErrors should be handled within
  yield* someOtherFunction();
  // do a bunch of other stuff
});
```

#### The Catch-All Trap
Real scenario described:
1. Developer adds catch-all at API boundary for compilation
2. New error type added deep in handler
3. Error meant to be handled locally gets caught at boundary
4. Customer sees generic 500 error instead of proper handling

> "As a beginner, I was like, yeah, I want my code to compile."

#### Service Discovery Challenges

> "Sometimes it can be very hard to track down where a service is provided... it's not always clear where things are being provided."

Solutions mentioned:
- Better documentation
- Proper naming conventions
- Clear code organization

#### Style Proliferation

> "There are so many ways to do things in Effect... you're going to see so many different styles."

This is both a feature and a challenge for teams.

#### API Overwhelm

> "There's so many functions, it can be overwhelming to figure out where to start."

But the flip side:

> "There is always something."

---

## Part 7: Practical Adoption Advice

### Incremental Adoption Strategy

#### Starting Small

> "You can incrementally adopt Effect, especially if you have one API route, one backend route that you want to make more robust."

#### The Depth Principle

> "You get way more benefit when you... do things all as deep as possible. Because otherwise, at the boundaries of your Effect code, you lose a lot of that."

#### Full Adoption Benefits

> "The full benefit does really come from full adoption."

### On Prototyping with Effect

Counter to common perception:

> "I actually disagree a bit [that prototyping with Effect is hard]. When you're prototyping... I'm spending half the time debugging. If you can start using Effect at the beginning... you actually save yourself a huge amount of time."

The key insight: Effect front-loads complexity but saves debugging time later.

---

## Part 8: Key Implementation Insights

### Service Design Principles

1. **Black Box Services**: Hide provider complexity behind uniform interfaces
2. **Composable Primitives**: Build complex behaviors from simple pieces
3. **State Management**: Use Ref for simple, effective state tracking
4. **Testing at Boundaries**: Inject failures at service boundaries, not in business logic

### Error Handling Best Practices

1. **Avoid catch-all patterns** except at absolute boundaries
2. **Handle errors as specifically as possible**
3. **Let Effect track error types** through the system
4. **Test error scenarios explicitly** with dependency injection

### Team Collaboration

1. **Establish style guides** early to avoid proliferation
2. **Document service provision points** clearly
3. **Use consistent patterns** across the codebase
4. **Leverage type system** for team communication

---

## Conclusion

### The Journey Summary

Elliot's experience demonstrates that Effect is approachable even for developers new to TypeScript, provided they have:
- Curiosity and willingness to learn
- Commitment to building robust systems
- Patience with initial learning curve

### The Business Value

For Markprompt, Effect enabled:
- Reliable AI systems despite unreliable providers
- Rapid iteration with customer requirements
- Confident refactoring and feature addition
- Testable, maintainable codebase

### Final Reflection

> "Effect has been a joy to learn and work with. It just makes sense. I think as engineers, it gives us the tools to focus on really building systems in a creative and fun and correct way."

### The Learning Mindset

> "You have to want to do that. And you have to be curious and want to learn. But when you start to move things over, it is way, way more rewarding to build these things in a way that you are confident about."

### Call to Action

For those considering Effect:

> "If you're new to Effect or thinking about adopting Effect, I'd highly recommend looking into it."

The presentation serves as both a technical guide and an honest assessment of the Effect learning journey, providing valuable insights for teams considering adoption and beginners starting their Effect journey. Elliot's fresh perspective, coming to Effect without JavaScript baggage, offers a unique viewpoint on the framework's approachability and power.

---

### Key Takeaways

1. **Effect shines when building on unreliable foundations** (APIs, external services)
2. **The learning curve is real but worthwhile** - front-loaded complexity pays dividends
3. **Dependency injection is Effect's killer feature** for testing and flexibility
4. **Composability enables rapid iteration** when requirements change
5. **Full adoption provides maximum benefit** but incremental adoption is viable
6. **Effect is not magic** - it requires thoughtful application
7. **The ecosystem is rich** - there's always an Effect-native solution

The presentation effectively balances enthusiasm with pragmatism, providing both inspiration and practical warnings for teams adopting Effect.
