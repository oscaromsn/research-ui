# BAML Testing Guidelines

## Tests in BAML

Tests are first-class citizens in BAML, designed to make testing AI functions straightforward and robust. BAML tests can be written anywhere in your codebase and run with minimal setup.

### Overview

A BAML test consists of:
- Test name and metadata
- Functions under test
- Input arguments
- Optional testing configuration
- Optional assertions
- Optional type builders

```baml
test TestName {
    functions [FunctionName]
    args {
        paramName "value"
    }
}
```

### Test Declaration

#### Basic Syntax

```baml
test name {
    functions [function_list]
    args {
        parameter_assignments
    }
}
```

#### Optional Features

```baml {3-11, 15, 16}
test name {
    functions [function_list]
    type_builder {
        class NewType {
            // Props
        }
        dynamic class ExistingDynamicType {
            new_prop NewType
            // Inject Props Here
        }
    }
    args {
        parameter_assignments
    }
    @@check( check_length, {{ this.prop|length > 0 }} )
    @@assert( {{ this.prop|length < 255 }})
}
```

#### Components

- `name`: Test identifier (unique per function)
- `functions`: List of functions to test
- `args`: Input parameters for the test case
- `type_builder`: Block used to inject values into dynamic types
- `@@check`: Conditional check for test validity
- `@@assert`: Assertion for test result

### Input Types

#### Basic Types

Simple values are provided directly:

```baml
test SimpleTest {
    functions [ClassifyMessage]
    args {
        input "Can't access my account"
    }
}
```

#### Complex Objects

Objects are specified using nested structures:

```baml
test ComplexTest {
    functions [ProcessMessage]
    args {
        message {
            user "john_doe"
            content "Hello world"
            metadata {
                timestamp 1234567890
                priority "high"
            }
        }
    }
}
```

#### Arrays

Arrays use bracket notation:

```baml
test ArrayTest {
    functions [BatchProcess]
    args {
        messages [
            {
                user "user1"
                content "Message 1"
            }
            {
                user "user2"
                content "Message 2"
            }
        ]
    }
}
```

### Media Inputs

#### Images

Images can be specified using three methods:

1. **File Reference**

```baml {4-6}
test ImageFileTest {
    functions [AnalyzeImage]
    args {
        param {
            file "../images/test.png"
        }
    }
}
```

2. **URL Reference**

```baml {4-6}
test ImageUrlTest {
    functions [AnalyzeImage]
    args {
        param {
            url "https://example.com/image.jpg"
        }
    }
}
```

3. **Base64 Data**

```baml {4-7}
test ImageBase64Test {
    functions [AnalyzeImage]
    args {
        param {
            base64 "a41f..."
            media_type "image/png"
        }
    }
}
```

#### Audio

Similar to images, audio can be specified in three ways:

1. **File Reference**

```baml
test AudioFileTest {
    functions [TranscribeAudio]
    args {
        audio {
            file "../audio/sample.mp3"
        }
    }
}
```

2. **URL Reference**

```baml
test AudioUrlTest {
    functions [TranscribeAudio]
    args {
        audio {
            url "https://example.com/audio.mp3"
        }
    }
}
```

3. **Base64 Data**

```baml
test AudioBase64Test {
    functions [TranscribeAudio]
    args {
        audio {
            base64 "..."
            media_type "audio/mp3"
        }
    }
}
```

### Multi-line Strings

For long text inputs, use the block string syntax:

```baml
test LongTextTest {
    functions [AnalyzeText]
    args {
        content #"
            This is a multi-line
            text input that preserves
            formatting and whitespace
        "#
    }
}
```

### Testing Multiple Functions

This requires each function to have the exact same parameters:

```baml
test EndToEndFlow {
    functions [
        ExtractInfo
        ProcessInfo
        ValidateResult
    ]
    args {
        input "test data"
    }
}
```

### Testing Dynamic Types

Dynamic types can be tested using `type_builder` and `dynamic` blocks:

```baml {3, 12-16}
class DynamicClass {
    static_prop string
    @@dynamic
}

function ReturnDynamicClass(input: string) -> DynamicClass {
    // ...
}

test DynamicClassTest {
    functions [ReturnDynamicClass]
    type_builder {
        dynamic class DynamicClass {
            new_prop_here string
        }
    }
    args {
        input "test data"
    }
}
```

## `@assert attribute

The `@assert` attribute in BAML is used for strict validations. If a type fails an `@assert` validation, it will not be returned in the response, and an exception will be raised if it's part of the top-level type.

### Usage

Asserts can be named or unnamed.

#### Field Assertion

```baml BAML
class Foo {
  // @assert will be applied to the field with the name "bar"
  bar int @assert(between_0_and_10, {{ this > 0 and this < 10 }})
}
```

```baml BAML
class Foo {
  // @assert will be applied to the field with no name
  bar int @assert({{ this > 0 and this < 10 }})
}
```

```baml BAML
class MyClass {
  // @assert will be applied to each element in the array
  my_field (string @assert(is_valid_email, {{ this|regex_match("@") }}))[]
}
```

#### Parameter Assertion

Asserts can also be applied to parameters.

```baml BAML
function MyFunction(x: int @assert(between_0_and_10, {{ this > 0 and this < 10 }})) {
  client "openai/gpt-4o"
  prompt #"Hello, world!"#
}
```

#### Block Assertion

Asserts can be used in a block definition, referencing fields within the block.

```baml BAML
class Foo {
  bar int
  baz string
  @@assert(baz_length_limit, {{ this.baz|length < this.bar }})
}
```

See [Jinja in Attributes](/ref/attributes/jinja-in-attributes) for a longer description of the Jinja syntax
available in asserts.

## Jinja in Attributes
`@check` and `@assert` use [Jinja](/ref/prompt-syntax/what-is-jinja) syntax to specify the invariants
(properties that should always hold true) of a type.

### Checks and Asserts

This example demonstrates [@assert](/ref/attributes/assert) and [@check](/ref/attributes/check) on both class fields
and the class block itself, and it shows a few examples of Jinja syntax.

```baml BAML
class Student {
    first_name string @assert( {{ this|length > 0 }})
    last_name string @assert( {{ this|length > 0 }})
    age int @check(old_enough, {{ this > 5 }}) @check(u8, {{ this|abs < 255 }})
    concentration string @assert( {{ this.regex_match("[Math|Science]")}})
    @@check(age_threshold, {{ this.concentration != "calculus" or this.age > 12 }})
}
```

### `this` keyword

Inside a Jinja expression, `this` refers to the value of a class field, if the
`@assert` or `@check` is applied to a class field, and it applies to the whole
object if it is applied to the whole type with `@@assert()` or `@@check()`.

### Filters

In Jinja, functions are called "filters", and they are applied to arguments
by writing `some_argument|some_filter`. Filters can be applied one after the
other by chaining them with additional `|`s.

 - `abs`: Absolote value.
 - `capitalize`: Make the first letter uppercase
 - `escape`: Replace special HTML characters with their escaped counterparts
 - `first`: First item of a list
 - `last`: Last item of a list
 - `default(x)`: Returns `x` when applied to something undefined.
 - `float`: Convert to a float, or 0.0 if conversion fails
 - `int`: Convert to an int, or 0 if conversion fails
 - `join`: Concatenate a list of strings
 - `length`: List length
 - `lower`: Make the string lowercase
 - `upper`: Make the string uppercase
 - `map(filter)`: Apply a filter to each item in a list
 - `max`: Maximum of a list of numbers or Booleans
 - `min`: Minimum of a list of numbers or Booleans
 - `regex_match("regex")`: Return true if argument matches the regex
 - `reject("test")`: Filter out items that fail the test
 - `reverse`: Reverse a list or string
 - `round`: Round a float to the nearest int
 - `select("test_name")`: Retain the values of a list passing `test_name`
 - `sum`: Sum of a list of numbers
 - `title`: Convert a string to "Title Case"
 - `trim`: Remove leading and trailing whitespace from a string
 - `unique`: Remove duplicate entries in a list

### Common Patterns

#### Test that a substring appears inside some string

 ```baml BAML
 function GenerateStory(subject: string) -> string {
   client GPT4
   prompt #"Write a story about {{ subject }}"#
 }

 test HorseStory {
    functions [GenerateStory]
    args {
        subject "Equestrian team coming-of-age story"
    }
    @@assert( {{ this|lower|regex_match("horse") }} )
 }
 ```

 We use the `lower` filter to make the whole story lowercase, and pass
 the result to `regex_match()` to search for an occurrance of "horse".

#### Test that a string is an exact match

```baml BAML
class Person {
    first_name string
    last_name string
}

function ExtractPerson(description: string) -> Person {
    client GPT4
    prompt #"
      Extract a Person from the description {{ description }}.
      {{ ctx.output_format }}
    "#
}

test ExtractJohnDoe {
    functions [ExtractPerson]
    args {
        description "John Doe is a 5'6\" man riding a stolen horse."
    }
    @@assert( {{ this.first_name|regex_match("^John$") }} )
    @@assert( {{ this.last_name == "Doe" }} )
}
```

We can use `regex_match` with special control characters indicating
the beginning and end of a string, as in the first `@@assert`, or
simply check equality with a literal string as in the second `@@assert`.

#### Test that item prices add up to a total

```baml BAML
class Receipt {
    establishment string
    items Item[]
    tax_cents int
    total_cents int
}

class Item {
    name string
    price_cents int
}

function ExtractReceipt(text_receipt: string) -> Receipt {
    client GPT4
    prompt #"
      Extract the details of this receipt: {{ text_receipt }}
      {{ ctx.output_format }}
    "#
}

test SmallReceipt {
    functions [ExtractReceipt]
    args {
        text_receipt "Nutty Squirrel. Affogato: $8.50. Kids cone: $6.50. Tax: $1. Total: $16.00"
    }

    @@assert( {{ this.items|map(attribute="price_cents")|sum + this.tax_cents == this.total_cents }} )
}
```

To check that the numbers in our `Receipt` add up, we first
`map` over the items to get the price of each item, then sum
the list of prices, and check the sum of the items and the sales
tax against the receipt total.
