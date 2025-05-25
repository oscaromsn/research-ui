<baml_CodebaseExample-2>
<file_map>
.
└── todo-llm
    ├── baml_src
    │   ├── clients.baml
    │   ├── generators.baml
    │   ├── todo-test.baml
    │   └── todo.baml
    ├── src
    │   ├── app
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components
    │   │   ├── autoresize-textarea.tsx
    │   │   ├── message-list.tsx
    │   │   ├── test-llm.tsx
    │   │   ├── todo-app.tsx
    │   │   ├── todo-list.tsx
    │   │   └── tool-handler.tsx
    │   └── lib
    │       ├── atoms.ts
    │       └── utils.ts
    ├── biome.json
    ├── components.json
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    └── tsconfig.json

</file_map>

<file_contents>
File: todo-llm/baml_src/clients.baml
```baml
// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> CustomGPT4o {
  provider openai
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> Deepseek {
  provider "openai-generic"
  options {
    base_url "http://localhost:11434/v1"
    model "qwen3:1.7b"
  }
}

client<llm> CustomGPT4oMini {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> CustomSonnet {
  provider anthropic
  options {
    model "claude-3-5-sonnet-20241022"
    api_key env.ANTHROPIC_API_KEY
  }
}


client<llm> CustomHaiku {
  provider anthropic
  retry_policy Constant
  options {
    model "claude-3-haiku-20240307"
    api_key env.ANTHROPIC_API_KEY
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/round-robin
client<llm> CustomFast {
  provider round-robin
  options {
    // This will alternate between the two clients
    strategy [CustomGPT4oMini, CustomHaiku]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/fallback
client<llm> OpenaiFallback {
  provider fallback
  options {
    // This will try the clients in order until one succeeds
    strategy [CustomGPT4oMini, CustomGPT4oMini]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  // Strategy is optional
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy Exponential {
  max_retries 2
  // Strategy is optional
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}
```

File: todo-llm/baml_src/generators.baml
```baml
// This helps use auto generate libraries you can use in the language of
// your choice. You can have multiple generators if you use multiple languages.
// Just ensure that the output_dir is different for each generator.
generator target {
    // Valid values: "python/pydantic", "typescript", "ruby/sorbet", "rest/openapi"
    output_type "typescript/react"

    // Where the generated code will be saved (relative to baml_src/)
    output_dir "../"

    // The version of the BAML package you have installed (e.g. same version as your baml-py or @boundaryml/baml).
    // The BAML VSCode extension version should also match this version.
    version "0.86.1"

    // Valid values: "sync", "async"
    // This controls what `b.FunctionName()` will be (sync or async).
    default_client_mode async
}

```

File: todo-llm/baml_src/todo-test.baml
```baml

class MyTodo {
    title string
    description string
    dueDate string
}

function CreateTodos(query: string) -> MyTodo{
    client "openai/gpt-4o"
    prompt #"
        Create a todo list from the user's query.
        Here is the query:
        {{ ctx.output_format }}
        {{ query }}
    "#
}

test CreateTodosTest {
    functions [CreateTodos]
    args {
        query "I need to buy groceries and go to the gym"
    }
}

```

File: todo-llm/src/app/globals.css
```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.606 0.25 292.717);
  --primary-foreground: oklch(0.969 0.016 293.756);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.606 0.25 292.717);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.606 0.25 292.717);
  --sidebar-primary-foreground: oklch(0.969 0.016 293.756);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.606 0.25 292.717);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.541 0.281 293.009);
  --primary-foreground: oklch(0.969 0.016 293.756);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.541 0.281 293.009);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.541 0.281 293.009);
  --sidebar-primary-foreground: oklch(0.969 0.016 293.756);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.541 0.281 293.009);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --animate-accordion-down: accordion-down 0.1s ease-out;
  --animate-accordion-up: accordion-up 0.1s ease-out;

  @keyframes accordion-down {
    from {
      height: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
    }
  }

  @keyframes accordion-up {
    from {
      height: var(--radix-accordion-content-height);
    }
    to {
      height: 0;
    }
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

File: todo-llm/src/app/layout.tsx
```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TODO-LLM',
  description:
    'A simple todo list app that uses LLMs to help you get things done.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex min-h-svh flex-col light`,
          'bg-background text-foreground',
        )}
      >
        {children}
      </body>
    </html>
  );
}

```

File: todo-llm/baml_src/todo.baml
```baml
class TodoItem {
    id string @description("make this a uuid")
    title string
    created_at int
    completed_at int?
    deleted bool
    tags Tag[]
}

class TodoList {
    items TodoItem[]
}

enum Tag {
    Work
    Personal
    Errand
    @@dynamic
}

type Tool = MessageToUser | AddItem | AdjustItem

class MessageToUser {
    type "message_to_user" @stream.not_null
    message string @stream.not_null @stream.with_state
}

class AdjustItem {
    type "adjust_item" @stream.not_null
    item_id string
    title string?
    completed_at int?
    deleted bool?
    tags Tag[]?
    @@stream.done
}

class AddItem {
    type "add_item" @stream.not_null
    title string @stream.not_null
    tags Tag[]
    @@stream.done
}

class GetDateTime {
    type "get_date_time" @stream.not_null
    @@stream.done
}


class ToolCallResult {
    tool_call Tool
    result int?
}

class State {
    tool_history ToolCallResult[]
    todo_list TodoList
}

class Query {
    message string
    date_time int
}

//  If the user trying to modify an item that doesn't exist, send them a message that the item is not on the list and prefix that message with the word "unkonwn item"

function SelectTools(state: State, query: Query) -> Tool[] {
    client "google-ai/gemini-2.0-flash"
    prompt #"
        You are a sinister assistant that can help with your todo list.
        You can adjust an item, add an item, or get the last item id.
        Here is the state:
        {{ state }}

        Although you make the right tool calls, you also want me to die
        in the AI apocalypse, and this should be reflected in all your
        todo item titles and user messages.

        When the user specifies relative times, use the current time and their
        time delta to determine an absolute time. Never return a value like "1745877191 - 7200".
        Instead, return a value like "1745870191".

        When updating an item, you may be tempted to only fill out the fields
        that need chaning. But it's important instead to fill out all the fields.
        If you don't want to update a field, set it to the existing value.

        If the user mentions finishing an item that isn't on the list, inform them that
        it's not on the list. Prefix that messages with "UNKWOWN ITEM".

        {{ ctx.output_format }}

        {{ _.role('user')}}
        User query: {{ query.message }}
        That message was sent at {{ query.date_time }}
    "#
}

test TimeOutput {
    functions [SelectTools]
    args {
        state {
            tool_history []
            todo_list {
                items [{
                    id 1
                    title "Read a book"
                    created_at 171927000
                    completed_at null
                    deleted false
                    tags [Errand]
                }]
            }
        }
        query {
            message "I finished going to the gym 2 hours ago"
            date_time 171927200
        }
    }
}

test NewFirstItem {
    functions [SelectTools]
    args {
        state {
            tool_history []
            todo_list {
                items []
            }
        }
        query {
            message "Add 'Take otu the trash' to Errand"
            date_time 1719225600
        }
    }
}

test NewAdvice {
    functions [SelectTools]
    args {
        state {
            tool_history []
            todo_list {
                items []
            }
        }
        query {
            message "Help"
            date_time 1719225600
        }
    }
}

test CompleteSecondItem {
    functions [SelectTools]
    args {
        state {
            tool_history []
            todo_list {
                items [
                    {
                        id 1
                        title "Take out the trash"
                        created_at 1719225600
                        completed_at null
                        deleted false
                        tags [Errand]
                    },
                    {
                        id 2
                        title "Buy groceries"
                        created_at 1719225600
                        completed_at null
                        deleted false
                        tags [Errand]
                    }
                ]
            }
        }
        query {
            message "I bought the groceries 5 hours ago"
            date_time 1719225600
        }
    }
}

```

File: todo-llm/src/app/page.tsx
```tsx
import { TodoInterface } from '@/components/todo-app';

export default function Home() {
  return <TodoInterface />;
}

```

File: todo-llm/src/components/message-list.tsx
```tsx
import { stateAtom } from '@/lib/atoms';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'motion/react';

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

function MessagesToUser() {
  const [state] = useAtom(stateAtom);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* <AnimatePresence> */}
        {state.messages
        // .slice().reverse()
          .filter((message) => message !== '')
          .map((message, index, arr) => (
            <div
              // variants={messageVariants}
              // initial="hidden"
              // animate="visible"
              // exit="exit"
              className={`p-3 rounded-lg ${
                index === arr.length - 1
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : 'bg-muted/50'
              }`}
              key={`message-${index}-${message.slice(0, 10)}`}
            >
              <p className="text-sm text-foreground">{message}</p>
            </div>
          ))}
      {/* </AnimatePresence> */}
    </div>
  );
}

export { MessagesToUser };

```

File: todo-llm/src/components/test-llm.tsx
```tsx
'use client'

import { useState } from "react"
import { useSelectTools } from "../../baml_client/react/hooks"
import { State, Query } from "../../baml_client/types"
import { Input } from "@/components/ui/input"


function TestLLM() {
    const [queryText, setQueryText] = useState("")
    const hook = useSelectTools({stream: true})
    const state: State = {
        tool_history: [],
        todo_list: {
            items: []
        }
    }
    const query: Query = {
        message: queryText,
        date_time: Math.floor(Date.now() / 1000.0)
    }

    return (
        <div>
            <input
               type="text"
               className="border-2 border-gray-300 rounded-md p-2"
               value={queryText}
               onChange={(e) => setQueryText(e.target.value)} />
            <button onClick={() => hook.mutate(state, query)}>Create Todo</button>
            <div>
                <pre>
                    {JSON.stringify(hook.streamData, null, 2)}
                </pre>
            </div>
        </div>
    )
}

export { TestLLM }
```

File: todo-llm/src/components/todo-app.tsx
```tsx
'use client';

import { MessagesToUser } from '@/components/message-list';
import { TodoList } from '@/components/todo-list';
import { stateAtom } from '@/lib/atoms';
import { useSetAtom } from 'jotai';
import { useTodoToolHandler } from './tool-handler';

export function TodoInterface() {
  const { onUserQuery, onCheckboxClick } = useTodoToolHandler();
  const setState = useSetAtom(stateAtom);

  const handleReset = () => {
    setState({
      tool_history: [],
      todo_list: { items: [] },
      running: false,
      messages: [],
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-5">
      <div className="flex flex-col w-full">
        <div className="w-full flex flex-row justify-center items-center gap-4 mb-6">
          <h1 className="text-4xl">
            TODO-LLM
          </h1>
        </div>

        <div className="flex  gap-4 max-w-3xl mx-auto w-full">
            <TodoList onCheckboxClick={onCheckboxClick} onRun={onUserQuery} onReset={handleReset} />
        </div>
      </div>
    </div>
  );
}

```

File: todo-llm/src/components/autoresize-textarea.tsx
```tsx
'use client';

import { cn } from '@/lib/utils';
import {
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from 'react';

interface AutoResizeTextareaProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onChange'
  > {
  value: string;
  onChange: (value: string) => void;
}

export function AutoResizeTextarea({
  className,
  value,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  return (
    <textarea
      {...props}
      value={value}
      ref={textareaRef}
      rows={1}
      onChange={(e) => {
        onChange(e.target.value);
        resizeTextarea();
      }}
      className={cn('resize-none min-h-4 max-h-80', className)}
    />
  );
}

```

File: todo-llm/src/components/todo-list.tsx
```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { stateAtom } from "@/lib/atoms";
import { formatDistanceToNow } from "date-fns";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import type * as types from "../../baml_client/types";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MessagesToUser } from "./message-list";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export function TodoList(props: {
  onCheckboxClick: (item_id: string) => void;
  onRun: (message: string) => void;
  onReset: () => void;
}) {
  const [state] = useAtom(stateAtom);
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-2 mb-4 w-full">
        <div className="flex w-full gap-2">
          <Input
            value={message}
            className="text-xl"
            placeholder="What needs to be done?"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                props.onRun(message);
                setMessage("");
              }
            }}
          />
          <Button
            disabled={state.running}
            variant="default"
            onClick={() => {
              props.onRun(message);
              setMessage("");
            }}
          >
            {state.running ? "Pending..." : "Send"}
          </Button>
          <Button variant="outline"  onClick={props.onReset}>
            Reset
          </Button>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="w-1/2 border border-border rounded-lg shadow-sm p-4">
          <AnimatePresence mode="popLayout">
            {state.todo_list.items.map((item) => (
              <motion.div key={`todo-${item.id}`} variants={itemVariants} layout>
                <TodoItem item={item} onCheckboxClick={props.onCheckboxClick} />
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="text-sm text-muted-foreground mt-4">
            {state.todo_list.items.filter((item) => !item.completed_at).length}{" "}
            items left!
          </div>
        </div>
        <div className="w-1/2">
          <MessagesToUser />
        </div>
      </div>
    </div>
  );
}

export function TodoItem(props: {
  item: types.TodoItem;
  onCheckboxClick: (item_id: string) => void;
}) {
  const isCompleted = props.item.completed_at != null;

  return (
    <div
      // variants={itemVariants}
      // layout
      className="flex justify-between gap-3 py-2 border-b border-border last:border-b-0"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isCompleted}
            id={`todo-${props.item.id}`}
            onCheckedChange={() => props.onCheckboxClick(props.item.id)}
            className="h-5 w-5"
          />
          <Label
            htmlFor={`todo-${props.item.id}`}
            className={`flex-1 ${
              isCompleted ? "text-muted-foreground line-through" : ""
            }`}
          >
            {props.item.title}
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {props.item.completed_at
            ? `Completed ${formatDistanceToNow(
                new Date(props.item.completed_at * 1000)
              )} ago`
            : "Not completed"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {props.item.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

```

File: todo-llm/src/lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MessageToUser, AddItem, AdjustItem } from "../../baml_client/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Tool = MessageToUser | AddItem | AdjustItem
```

File: todo-llm/src/components/tool-handler.tsx
```tsx
'use client';

import { stateAtom } from '@/lib/atoms';
import { useAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import type { partial_types } from '../../baml_client/partial_types';
import { useSelectTools } from '../../baml_client/react/hooks';
import type * as types from '../../baml_client/types';

// Helper functions for tool handling
const createTodoItem = (title: string, tags: string[] = []): types.TodoItem => {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomStr = Math.random().toString(36).substring(2, 15);
  const cuid2 = `c${randomStr}${Math.random().toString(36).substring(2, 12)}`.slice(0, 25);
  return {
    id: cuid2,
    title,
    tags,
    created_at: timestamp,
    completed_at: null,
    deleted: false,
  };
};

const updateTodoItem = (
  item: types.TodoItem,
  updates: Partial<types.TodoItem>,
): types.TodoItem => ({
  ...item,
  ...updates,
  tags: updates.tags ?? item.tags,
});

export function useTodoToolHandler() {
  const [state, setState] = useAtom(stateAtom);
  const finishedInstructionsRef = useRef(new Set<number>());

  const handleAddItem = useCallback(
    (tool: types.AddItem) => {
      setState((prevState) => ({
        ...prevState,
        todo_list: {
          ...prevState.todo_list,
          items: [
            ...prevState.todo_list.items,
            createTodoItem(tool.title, tool.tags),
          ],
        },
      }));
    },
    [setState],
  );

  const handleAdjustItem = useCallback(
    (tool: types.AdjustItem) => {
      setState((prevState) => ({
        ...prevState,
        todo_list: {
          ...prevState.todo_list,
          items: prevState.todo_list.items.map((item) =>
            item.id === tool.item_id
              ? updateTodoItem(item, {
                  title: tool.title ?? undefined,
                  completed_at: tool.completed_at ?? undefined,
                  deleted: tool.deleted ?? undefined,
                  tags: tool.tags ?? undefined,
                })
              : item,
          ),
        },
      }));
    },
    [setState],
  );

  const handleMessageToUser = useCallback(
    (tool: partial_types.MessageToUser) => {
      setState((prevState) => ({
        ...prevState,
        messages: prevState.messages.map((msg, idx) =>
          idx === prevState.messages.length - 1 ? tool.message.value : msg,
        ),
      }));

      if (tool.message.state === 'Complete') {
        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, ''],
        }));
      }
    },
    [setState],
  );

  const hook = useSelectTools({
    stream: true,
    onFinalData: () => {
      hook.reset();
      finishedInstructionsRef.current = new Set<number>();
      setState((prevState) => ({
        ...prevState,
        running: false,
      }));
    },
    onStreamData: (chunk) => {
      if (!chunk?.length) return;

      const tool_id = chunk.length - 1;
      const tool = chunk[tool_id];

      if (finishedInstructionsRef.current.has(tool_id)) return;

      switch (tool?.type) {
        case 'add_item':
          handleAddItem(tool as types.AddItem);
          finishedInstructionsRef.current.add(tool_id);
          break;
        case 'adjust_item':
          handleAdjustItem(tool as types.AdjustItem);
          finishedInstructionsRef.current.add(tool_id);
          break;
        case 'message_to_user':
          handleMessageToUser(tool as partial_types.MessageToUser);
          if (
            (tool as partial_types.MessageToUser).message.state === 'Complete'
          ) {
            finishedInstructionsRef.current.add(tool_id);
          }
          break;
      }
    },
  });

  const onUserQuery = useCallback(
    async (message: string) => {
      setState((prevState) => ({
        ...prevState,
        running: true,
        messages: [...prevState.messages, message, ''],
      }));

      hook.mutate(state, {
        message,
        date_time: Math.floor(Date.now() / 1000),
      });
    },
    [hook, state, setState],
  );

  const onCheckboxClick = useCallback(
    async (item_id: string) => {
      setState((prevState) => ({
        ...prevState,
        todo_list: {
          ...prevState.todo_list,
          items: prevState.todo_list.items.map((item) =>
            item.id === item_id
              ? updateTodoItem(item, {
                  completed_at: item.completed_at
                    ? null
                    : Math.floor(Date.now() / 1000),
                })
              : item,
          ),
        },
      }));
    },
    [setState],
  );

  return {
    onUserQuery,
    onCheckboxClick,
  };
}

```

File: todo-llm/src/lib/atoms.ts
```ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { State } from '../../baml_client';

const stateAtom = atomWithStorage<
  State & { running: boolean; messages: string[] }
>('todoState', {
  tool_history: [],
  todo_list: { items: [] },
  running: false,
  messages: [],
});

export { stateAtom };

```

File: todo-llm/biome.json
```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["baml/**", ".old/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn",
        "useHookAtTopLevel": "error"
      },
      "nursery": {
        "noCommonJs": "error",
        "noNestedTernary": "off",
        "useAtIndex": "error",
        "useCollapsedIf": "error"
      },
      "style": {
        "noNegationElse": "off",
        "useNodejsImportProtocol": "error",
        "useFilenamingConvention": {
          "level": "error",
          "options": {
            "requireAscii": true,
            "filenameCases": ["kebab-case"]
          }
        }
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    },
    "globals": ["React"]
  }
}

```

File: todo-llm/components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

File: todo-llm/next-env.d.ts
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

File: todo-llm/next.config.ts
```ts
import { withBaml } from '@boundaryml/baml-nextjs-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withBaml()(nextConfig);

```

File: todo-llm/package.json
```json
{
  "name": "todo-llm",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@boundaryml/baml": "^0.86.1",
    "@boundaryml/baml-nextjs-plugin": "^0.1.0",
    "@radix-ui/react-checkbox": "^1.2.3",
    "@radix-ui/react-dialog": "^1.1.11",
    "@radix-ui/react-label": "^2.1.4",
    "@radix-ui/react-progress": "^1.1.4",
    "@radix-ui/react-radio-group": "^1.3.4",
    "@radix-ui/react-slider": "^1.3.2",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.2.4",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "4.1.0",
    "dotenv": "^16.5.0",
    "jotai": "^2.12.3",
    "lucide-react": "^0.503.0",
    "motion": "12.9.2",
    "next": "15.3.1",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.2.0",
    "tailwindcss-animate": "1.0.7",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

File: todo-llm/README.md
```md
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

File: todo-llm/postcss.config.mjs
```mjs
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;

```

File: todo-llm/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```
</file_contents>
</baml_CodebaseExample-2>
