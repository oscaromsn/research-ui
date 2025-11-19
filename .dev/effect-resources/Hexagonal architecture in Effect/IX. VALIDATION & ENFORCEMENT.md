---
modified: 2025-11-04T05:25:39-03:00
---
# IX. VALIDATION & ENFORCEMENT

## A. Static Analysis

Static analysis tools help enforce architectural patterns at development time, catching violations before code is committed. Properly configured ESLint rules and TypeScript settings act as guardrails that guide developers toward correct architectural decisions.

### 1. ESLint Rules

#### 1.1 Restrict Imports Between Layers

Enforce dependency direction rules using ESLint import restrictions:

**Pattern**: Prevent layers from importing from layers they shouldn't depend on.

**Complete ESLint Configuration**:

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json"
  },
  plugins: [
    "@typescript-eslint",
    "import"
  ],
  rules: {
    // Enforce import restrictions between architectural layers
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["**/infrastructure/**"],
          message: "Domain layer cannot import from infrastructure layer. Domain must remain pure."
        },
        {
          group: ["**/adapters/**"],
          message: "Domain layer cannot import from adapters layer. Domain must remain pure."
        },
        {
          group: ["**/entrypoints/**"],
          message: "Domain layer cannot import from entrypoints layer. Domain must remain pure."
        },
        {
          group: ["**/application/**"],
          message: "Domain layer cannot import from application layer. Domain must remain pure."
        }
      ]
    }]
  },
  overrides: [
    // Domain layer - strictest rules
    {
      files: ["src/domain/**/*.ts"],
      rules: {
        "no-restricted-imports": ["error", {
          patterns: [
            {
              group: ["**/application/**", "**/infrastructure/**", "**/adapters/**", "**/entrypoints/**"],
              message: "Domain layer cannot import from any other layer. Keep domain pure."
            },
            {
              group: ["effect", "!effect/Brand", "!effect/Data"],
              message: "Domain layer should minimize Effect imports. Use only Brand and Data for value objects and errors."
            }
          ]
        }]
      }
    },
    
    // Application layer - can import domain, but not infrastructure
    {
      files: ["src/application/**/*.ts"],
      rules: {
        "no-restricted-imports": ["error", {
          patterns: [
            {
              group: ["**/infrastructure/**"],
              message: "Application layer cannot import concrete infrastructure. Depend on ports only."
            },
            {
              group: ["**/adapters/**"],
              message: "Application layer cannot import adapters. Depend on ports only."
            },
            {
              group: ["**/entrypoints/**"],
              message: "Application layer cannot import entrypoints. This violates dependency direction."
            }
          ]
        }]
      }
    },
    
    // Ports layer - can only import domain
    {
      files: ["src/ports/**/*.ts"],
      rules: {
        "no-restricted-imports": ["error", {
          patterns: [
            {
              group: ["**/application/**"],
              message: "Ports cannot import from application layer. Ports are contracts only."
            },
            {
              group: ["**/infrastructure/**"],
              message: "Ports cannot import from infrastructure layer. Ports define interfaces, not implementations."
            },
            {
              group: ["**/adapters/**"],
              message: "Ports cannot import from adapters layer. Ports are interface definitions only."
            }
          ]
        }]
      }
    },
    
    // Infrastructure layer - can import domain and ports
    {
      files: ["src/infrastructure/**/*.ts"],
      rules: {
        "no-restricted-imports": ["error", {
          patterns: [
            {
              group: ["**/entrypoints/**"],
              message: "Infrastructure cannot import from entrypoints. This violates dependency direction."
            }
          ]
        }]
      }
    },
    
    // Test files - more permissive
    {
      files: ["**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "no-restricted-imports": "off"
      }
    }
  ]
}
```

**Example Violations and Fixes**:

```typescript
// ❌ VIOLATION: Domain importing from infrastructure
// domain/models/Order.model.ts
import { Database } from "../../infrastructure/persistence/Database"  // ❌ ESLint error!

// ✅ CORRECT: Domain remains pure
// domain/models/Order.model.ts
import { Schema } from "@effect/schema"

export class Order extends Schema.Class<Order>("Order")({
  // Pure domain definition
}) {}

// ❌ VIOLATION: Application importing concrete adapter
// application/services/OrderService.ts
import { OrderRepositoryPostgres } from "../../infrastructure/persistence/OrderRepository.postgres"  // ❌ ESLint error!

// ✅ CORRECT: Application depends on port
// application/services/OrderService.ts
import { OrderRepository } from "../../ports/secondary/OrderRepository/OrderRepository.port"

export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [OrderRepository.Default],  // ✅ Port dependency
    // ...
  }
) {}
```

---

#### 1.2 Enforce Dependency Direction

Use ESLint to ensure dependencies only flow in the correct direction:

**Custom ESLint Rule - Dependency Direction**:

```javascript
// eslint-rules/enforce-dependency-direction.js
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce correct dependency direction in hexagonal architecture",
      category: "Architecture",
      recommended: true
    },
    messages: {
      wrongDirection: "Import violates dependency direction: {{from}} cannot import from {{to}}"
    }
  },
  
  create(context) {
    const filename = context.getFilename()
    
    // Define layer hierarchy
    const layerOrder = {
      domain: 0,
      ports: 1,
      application: 2,
      infrastructure: 3,
      adapters: 3,
      entrypoints: 4
    }
    
    // Get layer from filename
    const getLayer = (path) => {
      if (path.includes("/domain/")) return "domain"
      if (path.includes("/ports/")) return "ports"
      if (path.includes("/application/")) return "application"
      if (path.includes("/infrastructure/")) return "infrastructure"
      if (path.includes("/adapters/")) return "adapters"
      if (path.includes("/entrypoints/")) return "entrypoints"
      return null
    }
    
    const currentLayer = getLayer(filename)
    if (!currentLayer) return {}
    
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        
        // Skip node_modules
        if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
          return
        }
        
        const importedLayer = getLayer(importPath)
        if (!importedLayer) return
        
        const currentLevel = layerOrder[currentLayer]
        const importedLevel = layerOrder[importedLayer]
        
        // Dependency can only flow inward (lower level to higher level is forbidden)
        if (importedLevel > currentLevel) {
          context.report({
            node,
            messageId: "wrongDirection",
            data: {
              from: currentLayer,
              to: importedLayer
            }
          })
        }
      }
    }
  }
}
```

**Enable Custom Rule**:

```javascript
// .eslintrc.js
module.exports = {
  // ... other config
  plugins: [
    "@typescript-eslint",
    "import",
    "./eslint-rules"  // Custom rules directory
  ],
  rules: {
    // ... other rules
    "enforce-dependency-direction": "error"
  }
}
```

---

#### 1.3 Prevent Circular Dependencies

Use `eslint-plugin-import` to detect and prevent circular dependencies:

**Configuration**:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["import"],
  rules: {
    // Prevent circular dependencies
    "import/no-cycle": ["error", {
      maxDepth: Infinity,  // Check all depths
      ignoreExternal: true  // Ignore node_modules
    }],
    
    // Ensure imports resolve
    "import/no-unresolved": ["error", {
      commonjs: true,
      caseSensitive: true
    }],
    
    // Ensure consistent import order
    "import/order": ["error", {
      groups: [
        "builtin",   // Node.js built-in modules
        "external",  // npm packages
        "internal",  // Aliased modules
        "parent",    // Parent directory imports
        "sibling",   // Same directory imports
        "index"      // Index imports
      ],
      pathGroups: [
        {
          pattern: "@effect/**",
          group: "external",
          position: "before"
        },
        {
          pattern: "effect",
          group: "external",
          position: "before"
        }
      ],
      "newlines-between": "always",
      alphabetize: {
        order: "asc",
        caseInsensitive: true
      }
    }]
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json"
      }
    }
  }
}
```

**Example Circular Dependency Detection**:

```typescript
// ❌ CIRCULAR DEPENDENCY DETECTED
// services/OrderService.ts
import { UserService } from "./UserService"

export class OrderService {
  constructor(private userService: UserService) {}
}

// services/UserService.ts
import { OrderService } from "./OrderService"  // ❌ ESLint error: Circular dependency!

export class UserService {
  constructor(private orderService: OrderService) {}
}

// ✅ FIXED: Break circular dependency
// services/OrderService.ts
import { UserRepository } from "../ports/UserRepository"  // Depend on port instead

export class OrderService {
  constructor(private userRepo: UserRepository) {}
}

// services/UserService.ts
import { OrderRepository } from "../ports/OrderRepository"  // Depend on port instead

export class UserService {
  constructor(private orderRepo: OrderRepository) {}
}
```

---

#### 1.4 Validate Naming Conventions

Enforce naming conventions for files and exports:

**Configuration**:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Enforce naming conventions
    "@typescript-eslint/naming-convention": ["error",
      // Service classes must end with "Service"
      {
        selector: "class",
        filter: {
          regex: "Service$",
          match: false
        },
        format: ["PascalCase"],
        custom: {
          regex: "^[A-Z][a-zA-Z]*Service$",
          match: true
        },
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid"
      },
      
      // Repository classes must end with "Repository"
      {
        selector: "class",
        filter: {
          regex: "Repository$",
          match: false
        },
        format: ["PascalCase"]
      },
      
      // Error classes must end with "Error"
      {
        selector: "class",
        filter: {
          regex: "Error$",
          match: false
        },
        format: ["PascalCase"],
        suffix: ["Error"]
      },
      
      // Tag classes must end with "Tag"
      {
        selector: "class",
        filter: {
          regex: "Tag$",
          match: false
        },
        format: ["PascalCase"],
        suffix: ["Tag"]
      },
      
      // Layer exports must end with "Layer"
      {
        selector: "variable",
        filter: {
          regex: "Layer$",
          match: true
        },
        format: ["PascalCase"],
        suffix: ["Layer"]
      },
      
      // Interfaces should not have "I" prefix
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false
        }
      },
      
      // Type aliases should be PascalCase
      {
        selector: "typeAlias",
        format: ["PascalCase"]
      },
      
      // Branded types convention
      {
        selector: "typeAlias",
        filter: {
          regex: "Id$",
          match: true
        },
        format: ["PascalCase"],
        suffix: ["Id"]
      }
    ]
  }
}
```

**Custom Rule - File Naming Convention**:

```javascript
// eslint-rules/enforce-file-naming.js
const path = require("path")

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce file naming conventions for hexagonal architecture",
      category: "Architecture"
    },
    messages: {
      invalidFileName: "File name '{{actual}}' does not match expected pattern '{{expected}}'"
    }
  },
  
  create(context) {
    const filename = context.getFilename()
    const basename = path.basename(filename, path.extname(filename))
    
    // Define naming patterns by directory
    const patterns = {
      "/domain/models/": /^[A-Z][a-zA-Z]+\.model$/,
      "/domain/errors/": /^[A-Z][a-zA-Z]+Errors?\.error$/,
      "/domain/value-objects/": /^[A-Z][a-zA-Z]+\.value$/,
      "/ports/primary/": /^[A-Z][a-zA-Z]+\.port$/,
      "/ports/secondary/": /^[A-Z][a-zA-Z]+\.port$/,
      "/application/services/": /^[A-Z][a-zA-Z]+\.service$/,
      "/infrastructure/": /^[A-Z][a-zA-Z]+\.(live|memory|postgres|redis|stripe|mock)$/,
      "/adapters/primary/http/": /^[A-Z][a-zA-Z]+\.http-adapter$/,
      "/adapters/primary/cli/": /^[A-Z][a-zA-Z]+\.cli-adapter$/
    }
    
    for (const [dir, pattern] of Object.entries(patterns)) {
      if (filename.includes(dir)) {
        if (!pattern.test(basename)) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "invalidFileName",
            data: {
              actual: basename,
              expected: pattern.toString()
            }
          })
        }
        break
      }
    }
    
    return {}
  }
}
```

---

### 2. TypeScript Configuration

#### 2.1 Strict Mode Enabled

Enable TypeScript strict mode for maximum type safety:

**Complete tsconfig.json**:

```json
{
  "compilerOptions": {
    // Strict Type Checking Options
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Module Resolution
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    
    // Emit Options
    "target": "ES2022",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "importHelpers": true,
    "downlevelIteration": true,
    
    // Advanced Options
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    
    // Path Mappings (see next section)
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@ports/*": ["src/ports/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@adapters/*": ["src/adapters/*"],
      "@entrypoints/*": ["src/entrypoints/*"],
      "@test/*": ["test/*"]
    }
  },
  
  "include": [
    "src/**/*"
  ],
  
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Test-Specific Configuration**:

```json
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "types": ["vitest", "node"]
  },
  "include": [
    "src/**/*",
    "test/**/*",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

---

#### 2.2 Path Mappings for Clean Imports

Configure path mappings to enforce clean, absolute imports:

**Benefits**:
- No relative import hell (`../../../..`)
- Clear layer boundaries
- Easy refactoring
- Better readability

**Configuration**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Domain layer
      "@domain/models/*": ["src/domain/models/*"],
      "@domain/errors/*": ["src/domain/errors/*"],
      "@domain/value-objects/*": ["src/domain/value-objects/*"],
      "@domain/rules/*": ["src/domain/rules/*"],
      
      // Ports layer
      "@ports/primary/*": ["src/ports/primary/*"],
      "@ports/secondary/*": ["src/ports/secondary/*"],
      
      // Application layer
      "@application/services/*": ["src/application/services/*"],
      "@application/use-cases/*": ["src/application/use-cases/*"],
      
      // Infrastructure layer
      "@infrastructure/persistence/*": ["src/infrastructure/persistence/*"],
      "@infrastructure/messaging/*": ["src/infrastructure/messaging/*"],
      "@infrastructure/external/*": ["src/infrastructure/external/*"],
      "@infrastructure/config/*": ["src/infrastructure/config/*"],
      
      // Adapters layer
      "@adapters/primary/http/*": ["src/adapters/primary/http/*"],
      "@adapters/primary/cli/*": ["src/adapters/primary/cli/*"],
      "@adapters/secondary/*": ["src/adapters/secondary/*"],
      
      // Entrypoints layer
      "@entrypoints/*": ["src/entrypoints/*"],
      
      // Test utilities
      "@test/fixtures/*": ["test/fixtures/*"],
      "@test/helpers/*": ["test/helpers/*"]
    }
  }
}
```

**Usage Examples**:

```typescript
// ❌ Before: Relative import hell
import { Order } from "../../../../domain/models/Order.model"
import { OrderRepository } from "../../../../ports/secondary/OrderRepository/OrderRepository.port"
import { OrderNotFoundError } from "../../../../domain/errors/OrderErrors.error"

// ✅ After: Clean absolute imports
import { Order } from "@domain/models/Order.model"
import { OrderRepository } from "@ports/secondary/OrderRepository/OrderRepository.port"
import { OrderNotFoundError } from "@domain/errors/OrderErrors.error"

// ✅ Layer boundaries are immediately clear from imports
// Can see at a glance which layers are being used
```

**Bundle Configuration** (for runtime):

```javascript
// vite.config.ts
import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@domain": path.resolve(__dirname, "./src/domain"),
      "@ports": path.resolve(__dirname, "./src/ports"),
      "@application": path.resolve(__dirname, "./src/application"),
      "@infrastructure": path.resolve(__dirname, "./src/infrastructure"),
      "@adapters": path.resolve(__dirname, "./src/adapters"),
      "@entrypoints": path.resolve(__dirname, "./src/entrypoints"),
      "@test": path.resolve(__dirname, "./test")
    }
  }
})
```

---

#### 2.3 Module Resolution

Configure module resolution for optimal type checking:

**Configuration**:

```json
// tsconfig.json
{
  "compilerOptions": {
    // Use bundler resolution for modern projects
    "moduleResolution": "bundler",
    
    // Or use Node16/NodeNext for Node.js projects
    // "moduleResolution": "node16",
    
    // Allow JSON imports
    "resolveJsonModule": true,
    
    // Better interop with CommonJS modules
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // Ensure all imports are explicit
    "allowImportingTsExtensions": false,
    
    // Type checking for imports
    "checkJs": false,
    "allowJs": false
  }
}
```

---

#### 2.4 Type Checking Rigor

Enable maximum type checking for architectural enforcement:

**Configuration**:

```json
// tsconfig.json
{
  "compilerOptions": {
    // Core strict options
    "strict": true,
    
    // Catch unused code
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    
    // Catch logic errors
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Catch index access errors
    "noUncheckedIndexedAccess": true,
    
    // Ensure override keyword
    "noImplicitOverride": true,
    
    // Strict property access
    "noPropertyAccessFromIndexSignature": true,
    
    // Exact optional properties
    "exactOptionalPropertyTypes": true,
    
    // Consistent casing
    "forceConsistentCasingInFileNames": true
  }
}
```

**Benefits**:

```typescript
// ✅ Catches unused code
function processOrder(order: Order, unused: string) {  // Error: unused parameter
  return order.total
}

// ✅ Catches missing returns
function getStatus(order: Order): string {
  if (order.status === "pending") {
    return "Pending"
  }
  if (order.status === "completed") {
    return "Completed"
  }
  // Error: Not all code paths return a value
}

// ✅ Catches unchecked index access
const userMap: Record<string, User> = {}
const user = userMap["123"]  // Type: User | undefined (not just User)

// ✅ Enforces override keyword
class BaseService {
  execute() {}
}

class OrderService extends BaseService {
  override execute() {}  // Must use 'override' keyword
}

// ✅ Exact optional properties
interface Config {
  port?: number
}

const config: Config = {
  port: undefined  // Error with exactOptionalPropertyTypes
}
```

---

## B. Architectural Validation

Automated validation ensures architectural rules are followed consistently across the codebase.

### 1. Validation Script

#### 1.1 Check File Naming Conventions

Automated script to validate file naming patterns:

**Implementation**:

```typescript
// scripts/validate-architecture.ts
import * as fs from "fs"
import * as path from "path"
import { glob } from "glob"

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate file naming conventions
 */
export async function validateFileNaming(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Define naming patterns by directory
  const patterns: Record<string, RegExp> = {
    "src/domain/models": /^[A-Z][a-zA-Z]+\.model\.ts$/,
    "src/domain/errors": /^[A-Z][a-zA-Z]+Errors?\.error\.ts$/,
    "src/domain/value-objects": /^[A-Z][a-zA-Z]+\.value\.ts$/,
    "src/ports/primary": /^[A-Z][a-zA-Z]+\.port\.ts$/,
    "src/ports/secondary": /^[A-Z][a-zA-Z]+\.port\.ts$/,
    "src/application/services": /^[A-Z][a-zA-Z]+\.service\.ts$/,
    "src/infrastructure": /^[A-Z][a-zA-Z]+\.(live|memory|postgres|redis|stripe|mock)\.ts$/,
    "src/adapters/primary/http": /^[A-Z][a-zA-Z]+\.http-adapter\.ts$/,
    "src/adapters/primary/cli": /^[A-Z][a-zA-Z]+\.cli-adapter\.ts$/
  }
  
  // Check each directory
  for (const [dir, pattern] of Object.entries(patterns)) {
    const files = await glob(`${dir}/**/*.ts`, {
      ignore: ["**/*.test.ts", "**/*.spec.ts", "**/index.ts"]
    })
    
    for (const file of files) {
      const basename = path.basename(file)
      
      if (!pattern.test(basename)) {
        errors.push(
          `Invalid file name: ${file}\n` +
          `  Expected pattern: ${pattern}\n` +
          `  Actual: ${basename}`
        )
      }
    }
  }
  
  // Check test file naming
  const testFiles = await glob("src/**/*.test.ts")
  for (const file of testFiles) {
    const basename = path.basename(file)
    
    if (!basename.match(/\.(unit|contract|integration|system|e2e)\.test\.ts$/)) {
      warnings.push(
        `Test file should specify test type: ${file}\n` +
        `  Expected: *.unit.test.ts, *.contract.test.ts, *.integration.test.ts, *.system.test.ts, or *.e2e.test.ts`
      )
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Main validation runner
 */
async function main() {
  console.log("🔍 Validating architecture...\n")
  
  const fileNamingResult = await validateFileNaming()
  
  // Print results
  if (fileNamingResult.errors.length > 0) {
    console.error("❌ File naming validation failed:\n")
    fileNamingResult.errors.forEach(error => console.error(error + "\n"))
  }
  
  if (fileNamingResult.warnings.length > 0) {
    console.warn("⚠️  Warnings:\n")
    fileNamingResult.warnings.forEach(warning => console.warn(warning + "\n"))
  }
  
  if (fileNamingResult.valid && fileNamingResult.warnings.length === 0) {
    console.log("✅ All validations passed!")
    process.exit(0)
  } else if (fileNamingResult.valid) {
    console.log("⚠️  Validation passed with warnings")
    process.exit(0)
  } else {
    console.error("❌ Validation failed")
    process.exit(1)
  }
}

main().catch(error => {
  console.error("Error running validation:", error)
  process.exit(1)
})
```

---

#### 1.2 Verify Layer Dependencies

Validate that layers only import from allowed layers:

**Implementation**:

```typescript
// scripts/validate-dependencies.ts
import * as fs from "fs"
import * as path from "path"
import { glob } from "glob"
import * as ts from "typescript"

interface LayerDependency {
  file: string
  layer: string
  imports: string[]
  violations: string[]
}

/**
 * Get layer from file path
 */
function getLayer(filePath: string): string | null {
  if (filePath.includes("/domain/")) return "domain"
  if (filePath.includes("/ports/")) return "ports"
  if (filePath.includes("/application/")) return "application"
  if (filePath.includes("/infrastructure/")) return "infrastructure"
  if (filePath.includes("/adapters/")) return "adapters"
  if (filePath.includes("/entrypoints/")) return "entrypoints"
  return null
}

/**
 * Get allowed dependencies for a layer
 */
function getAllowedDependencies(layer: string): string[] {
  const rules: Record<string, string[]> = {
    domain: [],  // Domain depends on nothing
    ports: ["domain"],
    application: ["domain", "ports"],
    infrastructure: ["domain", "ports", "application"],
    adapters: ["domain", "ports", "application", "infrastructure"],
    entrypoints: ["domain", "ports", "application", "infrastructure", "adapters"]
  }
  
  return rules[layer] || []
}

/**
 * Extract imports from TypeScript file
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )
  
  const imports: string[] = []
  
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push(moduleSpecifier.text)
      }
    }
    
    ts.forEachChild(node, visit)
  }
  
  visit(sourceFile)
  return imports
}

/**
 * Validate layer dependencies
 */
export async function validateLayerDependencies(): Promise<ValidationResult> {
  const errors: string[] = []
  const files = await glob("src/**/*.ts", {
    ignore: ["**/*.test.ts", "**/*.spec.ts", "**/index.ts"]
  })
  
  for (const file of files) {
    const layer = getLayer(file)
    if (!layer) continue
    
    const allowedLayers = getAllowedDependencies(layer)
    const imports = extractImports(file)
    
    for (const importPath of imports) {
      // Skip external imports
      if (!importPath.startsWith(".") && !importPath.startsWith("@")) {
        continue
      }
      
      // Resolve import path
      const importedLayer = getLayer(importPath)
      if (!importedLayer) continue
      
      // Check if import is allowed
      if (!allowedLayers.includes(importedLayer)) {
        errors.push(
          `Dependency violation in ${file}:\n` +
          `  Layer '${layer}' cannot import from '${importedLayer}'\n` +
          `  Import: ${importPath}\n` +
          `  Allowed dependencies: ${allowedLayers.join(", ") || "none"}`
        )
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  }
}
```

---

#### 1.3 Validate Port Contracts

Ensure all port implementations satisfy their contracts:

**Implementation**:

```typescript
// scripts/validate-ports.ts
import * as fs from "fs"
import * as path from "path"
import { glob } from "glob"
import * as ts from "typescript"

interface PortValidation {
  port: string
  methods: string[]
  implementations: Array<{
    file: string
    methods: string[]
    missing: string[]
  }>
}

/**
 * Extract interface methods
 */
function extractInterfaceMethods(filePath: string, interfaceName: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )
  
  const methods: string[] = []
  
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      node.members.forEach(member => {
        if (ts.isMethodSignature(member) || ts.isPropertySignature(member)) {
          const name = member.name?.getText(sourceFile)
          if (name) {
            methods.push(name)
          }
        }
      })
    }
    
    ts.forEachChild(node, visit)
  }
  
  visit(sourceFile)
  return methods
}

/**
 * Validate port implementations
 */
export async function validatePortContracts(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Find all port files
  const portFiles = await glob("src/ports/**/*.port.ts")
  
  for (const portFile of portFiles) {
    const portName = path.basename(portFile, ".port.ts")
    const portMethods = extractInterfaceMethods(portFile, portName)
    
    if (portMethods.length === 0) {
      warnings.push(`No methods found in port: ${portFile}`)
      continue
    }
    
    // Find implementations
    const implementations = await glob(`src/**/*${portName}*.{live,memory,postgres,redis,mock}.ts`)
    
    for (const implFile of implementations) {
      const implMethods = extractInterfaceMethods(implFile, portName)
      const missing = portMethods.filter(m => !implMethods.includes(m))
      
      if (missing.length > 0) {
        errors.push(
          `Incomplete port implementation: ${implFile}\n` +
          `  Port: ${portName}\n` +
          `  Missing methods: ${missing.join(", ")}`
        )
      }
    }
    
    if (implementations.length === 0) {
      warnings.push(`No implementations found for port: ${portName}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
```

---

#### 1.4 Ensure Test Coverage

Validate that all services have corresponding tests:

**Implementation**:

```typescript
// scripts/validate-tests.ts
import * as fs from "fs"
import * as path from "path"
import { glob } from "glob"

interface TestCoverage {
  file: string
  hasUnitTest: boolean
  hasContractTest: boolean
  hasIntegrationTest: boolean
}

/**
 * Check test coverage
 */
export async function validateTestCoverage(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check domain models have unit tests
  const models = await glob("src/domain/models/*.model.ts")
  for (const model of models) {
    const basename = path.basename(model, ".ts")
    const testFile = model.replace(".model.ts", ".model.unit.test.ts")
    
    if (!fs.existsSync(testFile)) {
      warnings.push(`Missing unit test for domain model: ${model}`)
    }
  }
  
  // Check ports have contract tests
  const ports = await glob("src/ports/**/*.port.ts")
  for (const port of ports) {
    const contractTest = port.replace(".port.ts", ".port.contract.test.ts")
    
    if (!fs.existsSync(contractTest)) {
      errors.push(`Missing contract test for port: ${port}`)
    }
  }
  
  // Check services have integration tests
  const services = await glob("src/application/services/**/*.service.ts")
  for (const service of services) {
    const integrationTest = service.replace(".service.ts", ".service.integration.test.ts")
    
    if (!fs.existsSync(integrationTest)) {
      warnings.push(`Missing integration test for service: ${service}`)
    }
  }
  
  // Check HTTP adapters have system tests
  const httpAdapters = await glob("src/adapters/primary/http/**/*.http-adapter.ts")
  for (const adapter of httpAdapters) {
    const systemTest = adapter.replace(".http-adapter.ts", ".http-adapter.system.test.ts")
    
    if (!fs.existsSync(systemTest)) {
      warnings.push(`Missing system test for HTTP adapter: ${adapter}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
```

---

### 2. CI/CD Integration

#### 2.1 Automated Architecture Checks

**GitHub Actions Workflow**:

```yaml
# .github/workflows/architecture.yml
name: Architecture Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npm run type-check
      
      - name: Validate architecture
        run: npm run validate:architecture
      
      - name: Check test coverage
        run: npm run test:coverage
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const report = fs.readFileSync('architecture-report.md', 'utf8')
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            })
```

---

#### 2.2 Test Suite Execution

**Complete CI Pipeline**:

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        test-type: [unit, contract, integration, system]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-${{ matrix.test-type }}.xml
          flags: ${{ matrix.test-type }}
```

---

#### 2.3 Dependency Graph Analysis

**Dependency Cruiser Configuration**:

```javascript
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "No circular dependencies allowed",
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: "no-domain-to-infrastructure",
      severity: "error",
      comment: "Domain cannot depend on infrastructure",
      from: {
        path: "^src/domain"
      },
      to: {
        path: "^src/(infrastructure|adapters|entrypoints)"
      }
    },
    {
      name: "no-application-to-infrastructure",
      severity: "error",
      comment: "Application cannot depend on infrastructure directly",
      from: {
        path: "^src/application"
      },
      to: {
        path: "^src/(infrastructure|adapters|entrypoints)"
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.json"
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+"
      },
      archi: {
        collapsePattern: "^(src/[^/]+)"
      }
    }
  }
}
```

**NPM Script**:

```json
{
  "scripts": {
    "validate:deps": "depcruise --config .dependency-cruiser.js src",
    "validate:deps:graph": "depcruise --config .dependency-cruiser.js --output-type dot src | dot -T svg > dependency-graph.svg"
  }
}
```

---

#### 2.4 Breaking Change Detection

**API Extractor Configuration**:

```json
// api-extractor.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  
  "apiReport": {
    "enabled": true,
    "reportFolder": "<projectFolder>/etc/",
    "reportFileName": "api.md"
  },
  
  "docModel": {
    "enabled": true,
    "apiJsonFilePath": "<projectFolder>/etc/api.json"
  },
  
  "dtsRollup": {
    "enabled": true,
    "publicTrimmedFilePath": "<projectFolder>/dist/public.d.ts"
  },
  
  "messages": {
    "compilerMessageReporting": {
      "default": {
        "logLevel": "warning"
      }
    },
    "extractorMessageReporting": {
      "default": {
        "logLevel": "warning",
        "addToApiReportFile": true
      },
      "ae-missing-release-tag": {
        "logLevel": "error"
      }
    }
  }
}
```

**CI Integration**:

```yaml
# .github/workflows/api-check.yml
name: API Breaking Changes

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Generate API report
        run: npm run api:extract
      
      - name: Check for breaking changes
        run: |
          git diff --exit-code etc/api.md || {
            echo "API breaking changes detected!"
            echo "Please review the changes in etc/api.md"
            exit 1
          }
```

---

**Complete Package.json Scripts**:

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    
    "validate:architecture": "tsx scripts/validate-architecture.ts",
    "validate:deps": "depcruise --config .dependency-cruiser.js src",
    "validate:ports": "tsx scripts/validate-ports.ts",
    "validate:tests": "tsx scripts/validate-tests.ts",
    "validate:all": "npm run lint && npm run type-check && npm run validate:architecture && npm run validate:deps && npm run validate:ports",
    
    "test:unit": "vitest run --config vitest.config.unit.ts",
    "test:contract": "vitest run --config vitest.config.contract.ts",
    "test:integration": "vitest run --config vitest.config.integration.ts",
    "test:system": "vitest run --config vitest.config.system.ts",
    "test:all": "npm run test:unit && npm run test:contract && npm run test:integration && npm run test:system",
    "test:coverage": "vitest run --coverage",
    
    "api:extract": "api-extractor run --local --verbose",
    "api:check": "api-extractor run --local --verbose && git diff --exit-code etc/api.md"
  }
}
```

This comprehensive validation and enforcement strategy ensures architectural patterns are followed consistently, violations are caught early, and the codebase maintains high quality standards throughout its evolution.
