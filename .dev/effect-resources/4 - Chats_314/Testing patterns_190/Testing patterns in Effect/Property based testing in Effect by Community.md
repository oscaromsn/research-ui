---
modified: 2025-11-03T18:49:01-03:00
---
## Property based testing in Effect by Community

### by mike arnaldi

```typescript
import { it } from "@effect/vitest"
import { Schema } from "effect"

const Letter = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1),
    Schema.filter((s) => s.match(/^[a-z]+$/) !== null)
  ),
  age: Schema.Int.pipe(
    Schema.between(1, 77)
  )
})

function sortLetters(letters: ReadonlyArray<Schema.Schema.Type<typeof Letter>>) {
  const clonedLetters = [...letters]
  return clonedLetters.sort((la, lb) => la.age - lb.age || la.name.codePointAt(0)! - lb.name.codePointAt(0)!)
}

it.prop(
  "day #1: should properly sort letters",
  [Schema.Array(Letter)],
  ([unsortedLetters]) => {
    const letters = sortLetters(unsortedLetters)
    for (let i = 1; i < letters.length; ++i) {
      const prev = letters[i - 1]
      const curr = letters[i]
      if (prev.age < curr.age) continue // properly ordered
      if (prev.age > curr.age) throw new Error("Invalid on age")
      if (prev.name > curr.name) throw new Error("Invalid on name")
    }
  },
  { fails: true, fastCheck: { seed: 1485455336, path: "352:3:7:9:9:13:12:11", endOnFailure: true } }
)
```

### by Johannes Schikling

Gave property based testing a first try today. Absolutely magical in combination with Effect Schema. Bonus: The Effect vitest integration provides fast-check support out of the box.

```typescript
const Delay = Schema.Int.pipe(Schema.between(0, 200))
const ChannelType = Schema.Literal('message', 'broadcast')

Vitest.scoped.prop(
  'a / b connect at different times',
  [Delay, Delay, ChannelType],
  ([delayA, delayB, channelType], test) =>
    Effect.gen(function* () {
      const nodeA = yield* makeMeshNode('nodeA')
      const nodeB = yield* makeMeshNode('nodeB')

      // ...
    })
)
```

## by @andersonandrue

Effect's built-in capabilities for property-based testing make it simple to generate test data and test edge cases you'd never think about.

Let's use an ecommerce checkout system as an example. As usual, we'll start with Effect Schema and define our domain. This also unlocks the ability to generate arbitrary data fitting the Schemas!

```typescript
// testing-arbitrary/schemas.ts
import { Schema } from "effect";

// Shared
export const SkuSchema = Schema.NonEmptyString.pipe(Schema.pattern(/^[A-Z0-9]{8}$/), Schema.trimmed());

// Cart
export class CartItem extends Schema.Class<CartItem>("CartItem")({
  sku: SkuSchema,
  price: Schema.NonNegative,
  quantity: Schema.NonNegativeInt,
}) {}

export const CartSchema = Schema.ReadonlySet(CartItem);

// Promotions
export class PercentageDiscount extends Schema.Class<PercentageDiscount>("PercentageDiscount")({
  percentage: Schema.NonNegative.pipe(Schema.between(0, 1)),
}) {}

export class FixedDiscount extends Schema.Class<FixedDiscount>("FixedDiscount")({
  amount: Schema.NonNegative,
}) {}

export class BuyOneGetOneFree extends Schema.Class<BuyOneGetOneFree>("BuyOneGetOneFree")({
  sku: SkuSchema,
}) {}

export const PromotionSchema = Schema.Union(PercentageDiscount, FixedDiscount, BuyOneGetOneFree);

export const PromotionSetSchema = Schema.ReadonlySet(PromotionSchema);

// Order
export class Order extends Schema.Class<Order>("Order")({
  cart: CartSchema,
  promotions: PromotionSetSchema,
}) {}

export class ProcessedOrder extends Schema.Class<ProcessedOrder>("ProcessedOrder")({
  cart: CartSchema,
  promotions: PromotionSetSchema,
  total: Schema.NonNegative,
}) {}
```

Next, we'll define the business logic for processing an order. Pretty straightforward in our simple example, just calculate the total and apply the discounts right?

```typescript
//testing-arbitrary/business-logic.ts
import { Array, Effect, Schema } from "effect";
import {
  BuyOneGetOneFree,
  CartSchema,
  FixedDiscount,
  PercentageDiscount,
  ProcessedOrder,
  PromotionSetSchema,
} from "./schemas";

type Cart = typeof CartSchema.Type;
type Promotions = typeof PromotionSetSchema.Type;

export const processOrder = (cart: Cart, promotions: Promotions) =>
  Effect.gen(function* () {
    // 1. Initial total
    const initialTotal = Array.reduce(cart, 0, (acc, item) => acc + item.price * item.quantity);

    // 2. Calculate total after BOGO discount
    const bogoPromotions = Array.filter(promotions, Schema.is(BuyOneGetOneFree));
    const bogoDiscount = yield* Effect.reduce(bogoPromotions, 0, (acc, promotion) =>
      Effect.gen(function* () {
        const item = yield* Array.findFirst(cart, (item) => item.sku === promotion.sku);
        const discountedQuantity = item.quantity > 1 ? Math.floor(item.quantity / 2) : 1;
        return acc + item.price * discountedQuantity;
      })
    );

    // 3. Calculate percentage discount
    const percentagePromotions = Array.filter(promotions, Schema.is(PercentageDiscount));
    const percentageDiscount = Array.reduce(percentagePromotions, 0, (acc, promotion) => acc + promotion.percentage);

    // 4. Calculate fixed discount
    const fixedPromotions = Array.filter(promotions, Schema.is(FixedDiscount));
    const fixedDiscount = Array.reduce(fixedPromotions, 0, (acc, promotion) => acc + promotion.amount);

    // 5. Final total
    const totalAfterBogoDiscount = initialTotal - bogoDiscount;
    const totalAfterPercentageDiscount = totalAfterBogoDiscount * (1 - percentageDiscount);
    const finalTotal = totalAfterPercentageDiscount - fixedDiscount;

    return new ProcessedOrder({
      cart,
      promotions,
      total: finalTotal,
    });
  });
```

Finally, we write some tests! Effect has an awesome built-in integration with FastCheck for arbitrary data generation from Schemas!

```typescript
//testing-arbitrary/tests.spec.ts
import { expect, test } from "vitest";
import { processOrder } from "../business-logic";
import { Arbitrary, Effect, FastCheck, Random } from "effect";
import { CartSchema, PromotionSetSchema } from "./schemas";

const arbitraryCart = Arbitrary.make(CartSchema);
const arbitraryPromotions = Arbitrary.make(PromotionSetSchema);

test("processOrder should calculate the correct total", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const carts = FastCheck.sample(arbitraryCart, 100);
      for (const cart of carts) {
        const promotionSets = FastCheck.sample(arbitraryPromotions, yield* Random.nextIntBetween(0, 10));
        for (const promotions of promotionSets) {
          const result = yield* processOrder(cart, promotions);
          expect(result.cart).toEqual(cart);
          expect(result.promotions).toEqual(promotions);
          expect(result.total).toBeGreaterThanOrEqual(0);
        }
      }
    })
  );
});
```

And just like that, tests doing their job, we're alerted to a mistake!

```console
RERUN examples/testing-arbitrary/tests.spec.ts x5

> examples/testing-arbitrary/tests.spec.ts (1 test | 1 failed) 21ms
  × processOrder should calculate the correct total 20ms
    → An error has occurred

-------------------------------- Failed Tests 1 --------------------------------

FAIL examples/testing-arbitrary/tests.spec.ts > processOrder should calculate the correct total
(FiberFailure) NoSuchElementException: An error has occurred
  FiberRuntime.None node_modules/effect/src/internal/fiberRuntime.ts:1106:22
  f node_modules/effect/src/internal/fiberRuntime.ts:1960:49
  Object.<anonymous> node_modules/effect/src/internal/tracer.ts:147:14
  FiberRuntime.runLoop node_modules/effect/src/internal/fiberRuntime.ts:1387:42
  FiberRuntime.evaluateEffect node_modules/effect/src/internal/fiberRuntime.ts:996:27
  FiberRuntime.start node_modules/effect/src/internal/fiberRuntime.ts:590:14
  f node_modules/effect/src/internal/fiberRuntime.ts:1387:23
  node_modules/effect/src/internal/runtime.ts:38:46
  node_modules/effect/src/internal/runtime.ts:145:38

                                                                        [1/1]

Test Files  1 failed (1)
     Tests  1 failed (1)
  Start at  14:55:00
  Duration  159ms

FAIL Tests failed. Watching for file changes...
     press h to show help, press q to quit
```

The `NoSuchElementException` indicates that `Array.findFirst` in the business logic is failing when trying to find a cart item matching a BOGO promotion's SKU. This happens because the arbitrary generators are creating BOGO promotions with random SKUs that don't necessarily exist in the cart.

We don't want an error when no item can be found for a given BOGO discount, we should just ignore that discount.

Quick fix and run the tests again.

```
-------------------------------- Failed Tests 1 --------------------------------

FAIL examples/testing-arbitrary/tests.spec.ts > processOrder should calculate the correct total
(FiberFailure) ParseError: ProcessedOrder (Constructor)
└─ ["total"]
   └─ NonNegative
      └─ Predicate refinement failure
         └─ Expected a non-negative number, actual -7075467275901338000
  onLeft node_modules/effect/src/Either.ts:261:22
  body node_modules/effect/src/Either.ts:117:18
  Module.getOrThrowWith node_modules/effect/src/Function.ts:245:10
  node_modules/effect/src/ParseResult.ts:194:31
  new Klass node_modules/effect/src/Schema.ts:2429:60
  new ProcessedOrder examples/testing-arbitrary/schemas.ts:38:8
    36| }) {}
    37|
    38| export class ProcessedOrder extends Schema.Class<ProcessedOrder>("ProcessedOrder")({
    39|   cart: CartSchema,
    40|   promotions: PromotionSetSchema,
  next examples/testing-arbitrary/business-logic.ts:44:12

                                                                        [1/1]

Test Files  1 failed (1)
     Tests  1 failed (1)
  Start at  15:13:34
  Duration  372ms (transform 29ms, setup 0ms, collect 195ms, tests 32ms, environment 0ms, prepare 40ms)

FAIL Tests failed. Watching for file changes...
     press h to show help, press q to quit
```

Another mistake, this time even more significant, but caught automatically by our Schema definitions.

This is a different failure! The schema validation caught that the `total` field became **negative** (`-7075467275901338000`) after applying discounts, violating the `NonNegative` constraint. This reveals a bug in the business logic: the discount calculation doesn't ensure the final total stays at or above zero. The schema's runtime validation is doing its job by catching this invalid state.

These discounts can add up to a greater value than the total! We'd be paying the customer to take our goods! We forgot to define a minimum total! Whoops!

Finally, bulletproof business logic and tests passing.

```typescript
// testing-arbitrary/business-logic.ts
import { Array, Effect, Option, Schema } from "effect";
import {
  BuyOneGetOneFree,
  CartSchema,
  FixedDiscount,
  PercentageDiscount,
  ProcessedOrder,
  PromotionSetSchema,
} from "./schemas";

type Cart = typeof CartSchema.Type;
type Promotions = typeof PromotionSetSchema.Type;

export const processOrder = (cart: Cart, promotions: Promotions) =>
  Effect.gen(function* () {
    // 1. Initial total
    const initialTotal = Array.reduce(cart, 0, (acc, item) => acc + item.price * item.quantity);

    // 2. Calculate total after BOGO discount
    const bogoPromotions = Array.filter(promotions, Schema.is(BuyOneGetOneFree));
    const bogoDiscount = yield* Effect.reduce(bogoPromotions, 0, (acc, promotion) =>
      Effect.gen(function* () {
        const maybeItem = Array.findFirst(cart, (item) => item.sku === promotion.sku);
        if (Option.isNone(maybeItem)) return acc;
        const item = maybeItem.value;
        const discountedQuantity = item.quantity > 1 ? Math.floor(item.quantity / 2) : 1;
        return acc + item.price * discountedQuantity;
      })
    );

    // 3. Calculate percentage discount
    const percentagePromotions = Array.filter(promotions, Schema.is(PercentageDiscount));
    const percentageDiscount = Array.reduce(percentagePromotions, 0, (acc, promotion) => acc + promotion.percentage);

    // 4. Calculate fixed discount
    const fixedPromotions = Array.filter(promotions, Schema.is(FixedDiscount));
    const fixedDiscount = Array.reduce(fixedPromotions, 0, (acc, promotion) => acc + promotion.amount);

    // 5. Final total
    const totalAfterBogoDiscount = initialTotal - bogoDiscount;
    const totalAfterPercentageDiscount = totalAfterBogoDiscount * (1 - percentageDiscount);
    const finalTotal = Math.max(0, totalAfterPercentageDiscount - fixedDiscount);

    return new ProcessedOrder({
      cart,
      promotions,
      total: finalTotal,
    });
  });
```

**Key fixes:**
1. **Lines 23-25**: Handles the `NoSuchElementException` by checking if the BOGO promotion's SKU exists in the cart using `Option.isNone()`, returning early if not found
2. **Line 42**: Ensures the final total never goes negative by using `Math.max(0, ...)` to clamp the value

And the tests are now passing! ✅

```
Test Files  1 passed (1)
     Tests  1 passed (1)
  Start at  15:19:34
  Duration  198ms
```

This is a perfect example of property-based testing catching edge cases that would be easy to miss with example-based tests. The neat part about this is that our Schemas actually saved us from ourselves, we were never in any danger of constructing a processed order with a negative number. Testing just showed us before it hit prod
