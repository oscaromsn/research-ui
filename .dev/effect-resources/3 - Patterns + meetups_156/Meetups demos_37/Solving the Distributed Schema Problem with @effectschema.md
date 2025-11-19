---
modified: 2025-09-14T22:25:40-03:00
---
# Solving the Distributed Schema Problem with @effect/schema
## By Jess Martin - Effect Days 2024

### Executive Summary
Jess Martin presents a paradigm shift in software architecture from traditional client-server models to local-first, peer-to-peer systems. The presentation demonstrates how Effect Schema solves the critical problem of schema proliferation across different layers of traditional applications by providing a single, unified schema definition that works across the entire stack. Through DXOS's Echo database integration, this approach enables offline-first applications with real-time collaboration, eliminating the need for separate schemas in database, ORM, API, and frontend layers while enabling unprecedented cross-application data sharing capabilities.

---

## Part 1: Rethinking Software Architecture

### The Monday Morning Scenario

#### The Default Mental Model
When tasked with building a new web or mobile application, developers automatically gravitate toward familiar patterns:
- **Technology choices**: TypeScript, React, Effect
- **Framework decisions**: Frontend frameworks, backend languages
- **Tool constraints**: Existing organizational tooling
- **Innovation opportunities**: "New hotness" platforms or libraries

#### The Universal Architecture Pattern
Despite varying technology choices, the architectural shape remains remarkably consistent:

```
Frontend → API → Backend → Database
```

This pattern dominates because:
- **Industry standard**: "Who writes to the database with their frontend? That's insane."
- **Separation of concerns**: Each layer has distinct responsibilities
- **Security model**: Backend mediates database access
- **Language flexibility**: JavaScript everywhere or polyglot approach

### Architecture as Constraint

> "Architecture is the stuff that's hard to change."

#### The Railroad Metaphor
Like railroad tracks, architectural decisions:
- **Enable certain paths**: Make some features trivially easy
- **Prohibit others**: Make some capabilities prohibitively difficult
- **Lock in assumptions**: Create fundamental constraints

#### Traditional Architecture Pain Points
The client-server model makes these features particularly challenging:
- **Offline support**: Requires complex caching and synchronization
- **Real-time collaboration**: Needs additional infrastructure (WebSockets, etc.)
- **Data ownership**: Users don't control their data
- **Network dependency**: Every operation requires connectivity

### The Radical Simplification

#### The One Change Experiment
"What if we made one change, just one change to this diagram?"

Moving the database from server to client:

```
Before: Frontend → API → Backend → Database
After:  Frontend ↔ Database
```

#### Cascading Simplifications
1. **Direct database access**: Frontend writes directly to database
2. **No backend needed**: Database doesn't require wrapping
3. **No API layer**: No intermediation required
4. **Fewer moving parts**: "Less boxes is usually good"

#### Historical Echo
This resembles pre-internet architecture:
- Desktop applications with local storage
- Direct file system access
- No network dependency

But with a crucial difference: **connected peer-to-peer synchronization**

### Local-First Software Architecture

#### The New Shape

```
Device A [Frontend + Database] ↔️ 
Device B [Frontend + Database] ↔️ 
Device C [Frontend + Database]
```

Each device:
- Has its own complete database
- Synchronizes with selected peers
- Works fully offline
- Shares data when connected

#### The Seven Ideals
Local-first software principles (referenced but not detailed):
- User ownership of data
- Offline functionality
- Seamless collaboration
- No spinners or loading states
- Network optional, not required

---

## Part 2: The Schema Problem and Effect Schema Solution

### The Pervasive Nature of Schema

#### Schema is Everywhere
Martin challenges the narrow database-centric view of schema:

1. **Function signatures**: Parameter and return types
2. **API contracts**: Endpoint specifications
3. **Type systems**: Language-level type definitions
4. **Network protocols**: HTTP, WebSocket specifications
5. **State management**: Frontend data structures

> "Computing is absolutely littered with schema, and we don't do a great job of handling that."

### Schema Proliferation in Client-Server Architecture

#### The Seven-Layer Schema Problem
Traditional architecture requires schema definitions at multiple layers:

1. **Database schema**: SQL table definitions
2. **Stored procedures**: Database-level validations
3. **ORM schema**: Object mapping and custom validations
4. **Backend models**: Business logic representations
5. **API schema**: REST/GraphQL contracts
6. **Frontend types**: TypeScript interfaces
7. **State management**: Redux/MobX schemas

#### The Simple Change Nightmare
Adding a middle name field requires:
- SQL migration script
- ORM model update
- API endpoint modification
- Frontend type changes
- State management updates
- Validation logic updates
- Documentation changes

> "There's changes in seven layers to just add another field to an existing object. This is crazy."

### The Single Schema Solution

#### Three Requirements Remain
Even in local-first architecture, we still need:
1. **Data at rest definition**: How data is stored
2. **Compile-time type checking**: Type safety
3. **Runtime validation**: Data integrity

#### The Breakthrough

> "We think we can do all of this with a single schema. One schema for the whole stack."

The schema of the database IS the schema of the API IS the schema of the frontend.

### Effect Schema Fundamentals (2x Speed Overview)

#### Three Core Capabilities
1. **Define shape**: Declarative data structure
2. **Validate data**: Runtime checking
3. **Encode/Decode**: Data transformation

#### Basic Definition

```typescript
import * as S from "@effect/schema/Schema"

const Task = S.struct({
  title: S.string,
  done: S.boolean
});
```

#### Advanced Validations

```typescript
const Task = S.struct({
  title: S.string.pipe(
    S.required,
    S.minLength(1)
  ),
  done: S.boolean.pipe(
  S.default(false)
  ),
});
```

#### Validation in Practice

```typescript
const badTask = { 
  title: "Finish talk slides",
  done: "maybe"  // Not a boolean!
};

const isTaks = S.is(Task);
isTask(badTask); // returns false

const assertsTask: S.Schema.ToAsserts<typeof Task> = S.asserts(Task);
assertsTask(badTask); // Throws: ParseError
```

#### Type Inference

```typescript
export type Task = S.Schema.To<typeof TaskSchema>;

const task: Task = {
title: "Do the dishes",
done: "false",
};

// Results in `Type 'string' is not assignable to type 'boolean'. ts (2322) Types.d.ts(64, 27): The expected type comes from property 'done' which is declared here on type '{ readonly title: string; readonly done: boolean; }' (property) done: boolean

```

---

## Part 3: DXOS Echo Integration

### Platform Overview

DXOS consists of three core components:
1. **Echo**: Client-side database with CRDT synchronization
2. **Halo**: Decentralized identity system
3. **Mesh**: Peer-to-peer networking layer

### Echo Schema Integration (Unreleased APIs)

#### The Magic Pipe

```typescript
import * as S from "@effect/schema/Schema"
import * as E from "@dxos/echo-schema"

export  const Contact = S.struct({
  name: S.string,
  email: S.string,
  emoji: S.string,
  color: S.string  // Hex color
}).pipe(
  E.echoObject(
    "dxos.org.contact",  // Type identifier
    "0.1.0"              // Version
  )
)
```

#### Why Custom Type Derivation?

```typescript
// E.Schema adds ECHO-specific fields to the type 
export type Contact = E.Schema.To<typeof Contact>;
```

```typescript
type Contact = E.EchoReactiveObject.Type<typeof ContactSchema>
```

Echo adds database-specific fields:
- Object IDs
- Replication metadata
- Version information
- Reactive properties

### Database Operations

#### Insertion with Validation

```typescript
const contact = await space.db.add(Contact, {
  name: "Jess Martin",
  email: "jess@example.com",
  color: "#FF5733",
  emoji: "☕"
});


// Directly mutate, triggering replication // to all other devices
contact.email = "johndoe@altavista.com";
```

#### Direct Mutation

```typescript
contact.email = "newemail@example.com"
// That's it. One line:
// - Updates database
// - Replicates to all devices  
// - Updates in memory
// - Triggers re-renders
```

### Reactive Programming Model

#### Automatic UI Updates

```typescript
const ContactCard = (< contact }) => ‹span>{contact. namer</span>;

// Automatically re-renders when contact.name changes
// No subscriptions, no hooks, no boilerplate
```

The objects are reactive using signals libraries, compatible with:
- Svelte
- Solid.js
- Other signal-capable frameworks

### Advanced Validation

#### Email Validation Example

```typescript
// Let's validate the email
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const Contact = S.struct({
  name: S.string,
  email: S.string.pipe(S.pattern(EMAIL_REGEX)),
  color: S.string,
  emoji: S.string,
}).pipe(
  // Give the schema a unique name and version
  E.echoObject("dxos.types.contact", "0.1.0")
);
```

#### Rich Error Messages

```javascript
// 🔥 throws a ParseError
contact.email = "NOT_AN_EMAIL";

/*
 * The @effect/schema ParseError
 * Parsing failed:
 * {
 *   email: "NOT_AN_EMAIL"
 * }
 * └─ ["email"]
 *    └─ does not match pattern
 */
```

Martin notes this reminds him of ActiveRecord from Rails - developer-friendly error messages that translate directly to user feedback.

---

## Part 4: Live Demonstrations

### Demo 1: Hello Application

#### The Experience
- **URL**: hello.dxos.org
- **Purpose**: Event networking contact exchange
- **No account required**: No email verification, no sign-up flow
- **Local persistence**: Data survives browser refresh
- **Offline capability**: Full functionality without internet

#### Technical Achievements Demonstrated
1. **Offline editing**: Turned off WiFi, made changes, turned back on
2. **Peer synchronization**: Two browsers acting as separate devices
3. **Invite mechanism**: Numeric codes for peer connection
4. **Instant sync**: Sub-second replication between devices

> "I just made an edit while offline. Who does that? You can't do that with most software?"

### Demo 2: Cross-Application Data Sharing

#### The Revelation
Two completely different applications:
- **Hello**: Contact management (hello.dxos.org)
- **Composer**: Notion/Airtable hybrid (composer.dxos.org)

Both reading and writing the same database with zero shared code.

#### How It Works
1. **Schema stored in database**: Using JSON Schema serialization
2. **Runtime discovery**: Composer finds contact schema
3. **Dynamic UI generation**: Creates table from schema
4. **Bidirectional sync**: Changes in either app reflected immediately

```typescript
// returns schema for "dxos.types.contact" const 
contactSchema = E.schemaOf (contact);
```

> "The Composer codebase knows nothing. There's no code that defines a contact schema inside the Composer database."

### Demo 3: AI Integration (Attempted)

#### The Vision
Using schema to structure LLM outputs:

```typescript
// Prompt: "List all people mentioned in the text below"
// Schema: dxos.org.contact
// Result: Structured contact objects
```

The demo encountered issues but illustrated the concept: when schemas are everywhere, AI can understand and produce structured data that integrates directly with applications.

---

## Part 5: Beyond Apps - The Paradigm Shift

### The Hidden Truth

The initial diagram was intentionally simplified:

```
Reality: Multiple Apps ↔ Shared Database ↔ Multiple Apps
```

Not just one frontend with one database, but:
- Multiple applications
- Shared schemas
- Common data space
- No application boundaries

### Schema as First-Class Citizens

#### JSON Schema Serialization
Effect Schema's ability to serialize to JSON Schema enables:
- Runtime schema discovery
- Dynamic UI generation
- Cross-application compatibility
- Schema versioning and migration

#### The Database Contains Both
1. **Data**: Actual objects and values
2. **Metadata**: Schema definitions themselves

This self-describing system enables applications to understand data they've never seen before.

### Challenges and Future Work

#### Schema Migration

> "That's a hard problem. We're working on it."

Challenges in decentralized systems:
- Version compatibility across peers
- Gradual migration strategies
- Offline devices returning with old schemas

#### Schema Distribution
- Serializing validation logic
- Arbitrary code in validators
- Cross-platform compatibility

> "How do you serialize arbitrary code for validations? We don't do that yet. In fact, schema doesn't do that yet."

---

## Technical Architecture Summary

### The Complete Stack

```typescript
// 1. Define schema once
const Schema = S.struct({...}).pipe(E.echoObject(...))

// 2. Use everywhere
type Type = E.Type<typeof Schema>        // TypeScript types
const object = space.db.add(Type, {...}) // Database operations
object.field = newValue                  // Reactive updates
<Component data={object} />              // UI rendering
validateData(Schema, unknown)            // Runtime validation
```

### Key Innovations

1. **Single Schema Definition**: One source of truth for entire stack
2. **Reactive Objects**: Database objects that trigger UI updates
3. **Transparent Replication**: Synchronization without explicit commands
4. **Cross-Application Sharing**: Apps discover and use shared schemas
5. **Offline-First**: Full functionality without network

---

## Implications and Conclusions

### The Fundamental Shift

> "A different shape of software makes some hard things easy."

#### From Many to One
- **Before**: 7+ schema definitions across layers
- **After**: 1 schema for everything

#### From Complex to Simple
- **Before**: Backend, API, ORM, migrations
- **After**: Direct database interaction

#### From Online-First to Local-First
- **Before**: Network required for every operation
- **After**: Network optional for synchronization

### Call to Action

> "I hope you guys rethink the shape of software the next time you're approaching one of your new projects."

Martin challenges developers to:
1. Question default architectural assumptions
2. Consider local-first alternatives
3. Embrace schema unification
4. Explore peer-to-peer patterns

### The Team

DXOS development team present at the conference:
- Jess Martin (presenter)
- Rich
- Yaroslav
- Dima

All available for questions and demos, actively seeking feedback on APIs.

### Future Development

The team is actively working on:
- Production release of Echo Schema APIs
- Schema migration strategies
- Enhanced validation serialization
- Expanded cross-application capabilities

> "We have loved working with Effect Schema and hoping to do more."

---

## Key Quotes and Insights

### On Architecture
- "Architecture is the stuff that's hard to change"
- "Less boxes is usually good when we're defining an architecture"
- "Like a railroad, this path will make certain things very easy to do. And it will make other things prohibitively difficult"

### On Schema
- "Computing is absolutely littered with schema, and we don't do a great job of handling that"
- "One schema for the whole stack, all the way from the data to the front end"
- "There's changes in seven layers to just add another field to an existing object. This is crazy"

### On Innovation
- "What is the shape of software to come?"
- "A different shape of software makes some hard things easy"
- "Once you have schema everywhere in your system, and it's the same schema, it enables all kinds of new and interesting things"

---

## Technical Resources

- **Hello Demo**: hello.dxos.org
- **Composer**: composer.dxos.org
- **DXOS Platform**: dxos.org
- **Local-First Podcast**: localfirst.fm
- **Personal Site**: jessmart.in

The presentation represents a fundamental rethinking of web application architecture, using Effect Schema as the cornerstone for achieving a unified, local-first, peer-to-peer future for software development.
