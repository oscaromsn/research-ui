# JurisConsulta Knip Integration Plan v2: Architecture-First Approach

## Executive Summary

This v2 plan incorporates comprehensive architectural guidance to create a **layered, incremental integration approach** that prioritizes immediate value, system stability, and maintainable complexity growth. Based on detailed architectural review, this plan emphasizes **validated incremental development** over comprehensive feature delivery.
/
**Project Status**: Development stage - no backward compatibility constraints
**Timeline**: 3 weeks with immediate value delivery
**Primary Goal**: Transform unused abstractions into production-ready features through proven architectural patterns
**Architecture Principle**: **Minimal → Validated → Enhanced → Advanced**

---

## Architectural Philosophy & Principles

### Core Architectural Insights

1. **Incremental Validation Protocol**: Every change must be immediately testable and provide measurable value
2. **Separation of Concerns**: UI state remains local, global atoms only for research data
3. **Composable Error Handling**: Build recovery strategies that can be combined, avoiding tight coupling
4. **Configuration Simplicity**: Start minimal, add complexity only when validated and needed
5. **Layered Integration**: Infrastructure → Reliability → Experience → Advanced Features

### Value-First Integration Criteria

Each integration must satisfy:
- **Immediate Value**: Provides clear benefit to users or developers now
- **Low Complexity**: Simple to implement and maintain
- **High Confidence**: Low risk of breaking existing functionality
- **Measurable Impact**: Success can be objectively validated

---

## Revised Implementation Strategy: Layered Architecture

### Layer 1: Infrastructure Foundation (Week 1)
**Focus**: Essential production readiness with minimal complexity

### Layer 2: Reliability Enhancement (Week 2)
**Focus**: Robust error handling and user experience improvements

### Layer 3: Experience Polish (Week 3)
**Focus**: Advanced UI features and optional automation

---

## Layer 1: Infrastructure Foundation (Week 1)

### 1.1 Minimal Environment Validation System

**Objective**: Replace ad-hoc `process.env` usage with type-safe, production-ready environment validation

**Architectural Pattern**: **Start minimal, build incrementally**

**Files Affected**:
- `lib/schemas/env.ts` (focused implementation)
- `app/layout.tsx` (startup validation)
- `baml_src/clients.baml` (environment integration)
- Search for all `process.env` usage (systematic replacement)

**Implementation Steps**:

1. **Minimal Environment Schema** (Day 1)
```typescript
// lib/schemas/env.ts - Start with essentials only
const minimalEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  CEREBRAS_API_KEY: z.string().min(1, "CEREBRAS_API_KEY is required"),
  EXA_API_KEY: z.string().min(1, "EXA_API_KEY is required"),
  // Optional keys for flexibility
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

// Simple validation without complex client schema
function validateEnvironment() {
  try {
    return minimalEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

export const env = validateEnvironment();
```

2. **Startup Validation** (Day 1)
```typescript
// app/layout.tsx - Fail fast on startup
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Validate environment immediately - will throw if invalid
  env; // This triggers validation

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

3. **Systematic Environment Variable Replacement** (Day 2)
```bash
# Search and replace pattern
# Find: process.env.CEREBRAS_API_KEY
# Replace: env.CEREBRAS_API_KEY

# Key files to update:
# - baml_src/clients.baml
# - lib/utils/exaSearchUtil.ts
# - Any test files using environment variables
```

**Validation Criteria**:
- Application fails fast with clear error message if API keys missing
- No direct `process.env` usage remains in codebase
- All environment variables are properly typed
- Zero TypeScript compilation errors

**Success Metrics**:
- Startup time remains unchanged (< 100ms overhead)
- Clear error messages guide developers to fix missing keys
- 100% environment variable coverage

### 1.2 Basic Configuration Integration

**Objective**: Replace magic numbers with simple, environment-aware configuration

**Architectural Pattern**: **Flat configuration structure**, avoid nested complexity

**Implementation Steps**:

1. **Simple Configuration Schema** (Day 2-3)
```typescript
// lib/config.ts - Flat structure, minimal complexity
const coreConfigSchema = z.object({
  // Search parameters
  maxQueriesPerIteration: z.number().int().positive().default(3),
  maxDocumentsPerQuery: z.number().int().positive().default(5),
  searchTimeoutMs: z.number().int().positive().default(30000),

  // Analysis parameters
  maxRetries: z.number().int().nonnegative().default(2),
  analysisTimeoutMs: z.number().int().positive().default(45000),

  // Feature flags - start simple
  enableDetailedLogging: z.boolean().default(false),
  enableProgressIndicators: z.boolean().default(true),
});

// Environment-specific overrides - minimal differences
const environmentOverrides = {
  development: {
    enableDetailedLogging: true,
    searchTimeoutMs: 10000, // Faster feedback in dev
  },
  test: {
    maxRetries: 1,
    searchTimeoutMs: 5000,
    maxDocumentsPerQuery: 2, // Smaller test data
  },
  production: {} // Use defaults
};

export const config = coreConfigSchema.parse({
  ...coreConfigSchema.parse({}), // Start with defaults
  ...environmentOverrides[env.NODE_ENV] // Apply environment overrides
});
```

2. **Orchestrator Integration** (Day 3)
```typescript
// app/actions/researchAgentOrchestrator.ts - Replace magic numbers
import { config } from "@/lib/config";

// Before: Hard-coded values
const queries = await b.GenerateLegalSearchQueries(question, { maxQueries: 5 });

// After: Configuration-driven
const queries = await b.GenerateLegalSearchQueries(question, {
  maxQueries: config.maxQueriesPerIteration
});
```

**Validation Criteria**:
- All magic numbers replaced with configuration values
- Different behavior in dev/test/production environments
- Configuration easily adjustable without code changes
- No performance impact on research pipeline

### 1.3 Document Ordering System Activation

**Objective**: Activate the well-designed document ordering system already in place

**Files Affected**:
- `lib/state/researchAtoms.ts` (orderedDocumentsAtom)
- Components displaying document lists
- Research orchestrator (document metadata)

**Implementation Steps**:

1. **Activate Document Ordering Logic** (Day 3)
```typescript
// The existing orderedDocumentsAtom is well-designed - just activate it
// In components/domain/legal-research/analyzed-documents-list.tsx

export function AnalyzedDocumentsList() {
  // Replace direct documents access with ordered version
  const orderedDocuments = useAtomValue(orderedDocumentsAtom);

  return (
    <div className="space-y-4">
      {orderedDocuments.map((doc, index) => (
        <AnalyzedDocumentCard
          key={doc.id}
          document={doc}
          sequenceNumber={index + 1} // Show ordering to users
        />
      ))}
    </div>
  );
}
```

2. **Enhanced Document Metadata** (Day 4)
```typescript
// In research orchestrator - add ordering metadata
interface OrderedSearchResultItem extends SearchResultItem {
  globalSequenceNumber: number;
  iterationIndex: number;
  fetchBatchIndex: number;
  fetchTimestamp: string;
}

// Add metadata during document processing
const orderedResult: OrderedSearchResultItem = {
  ...searchResult,
  globalSequenceNumber: globalDocumentCounter++,
  iterationIndex: currentIteration,
  fetchBatchIndex: batchIndex,
  fetchTimestamp: new Date().toISOString()
};
```

**Success Metrics**:
- Documents display in consistent, logical order
- Users can understand document sequence and timing
- No performance impact on document rendering

---

## Layer 2: Reliability Enhancement (Week 2)

### 2.1 Circuit Breaker Error Handling Pattern

**Objective**: Implement composable, non-coupled error recovery using Circuit Breaker pattern

**Architectural Pattern**: **Pluggable recovery strategies** avoiding tight orchestrator coupling

**Files Affected**:
- `lib/utils/exaSearchUtil.ts` (core integration)
- `lib/utils/exaErrorHandler.ts` (strategy implementation)
- `app/actions/researchAgentOrchestrator.ts` (recovery integration)

**Implementation Steps**:

1. **Recovery Strategy Interface** (Day 1)
```typescript
// lib/utils/errorRecovery.ts - New architectural pattern
interface RecoveryStrategy {
  name: string;
  canRecover(error: unknown, context: SearchContext): boolean;
  recover(error: unknown, context: SearchContext): Promise<SearchResultItem[]>;
  priority: number; // Lower = higher priority
}

interface SearchContext {
  queries: SearchQueryItem[];
  attempt: number;
  previousResults?: SearchResultItem[];
}

class SearchCircuitBreaker {
  constructor(private strategies: RecoveryStrategy[]) {
    // Sort strategies by priority
    this.strategies = strategies.sort((a, b) => a.priority - b.priority);
  }

  async executeWithRecovery(
    operation: () => Promise<SearchResultItem[]>,
    context: SearchContext
  ): Promise<SearchResultItem[]> {
    try {
      return await operation();
    } catch (error) {
      // Try recovery strategies in priority order
      for (const strategy of this.strategies) {
        if (strategy.canRecover(error, context)) {
          console.log(`Attempting recovery with strategy: ${strategy.name}`);
          try {
            return await strategy.recover(error, context);
          } catch (recoveryError) {
            console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
            continue; // Try next strategy
          }
        }
      }

      // All recovery strategies failed
      throw error;
    }
  }
}
```

2. **Composable Recovery Strategies** (Day 2)
```typescript
// lib/utils/recoveryStrategies.ts - Specific implementations
const retryWithBackoffStrategy: RecoveryStrategy = {
  name: 'RetryWithBackoff',
  priority: 1,
  canRecover: (error, context) => {
    return isExaRateLimitError(error) && context.attempt < 3;
  },
  recover: async (error, context) => {
    const delay = Math.min(1000 * Math.pow(2, context.attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    // Retry with reduced query count
    return executeExaSearchDirect(context.queries.slice(0, 2));
  }
};

const fallbackToCacheStrategy: RecoveryStrategy = {
  name: 'FallbackToCache',
  priority: 2,
  canRecover: (error, context) => {
    return isExaNetworkError(error) && hasCachedResults(context.queries);
  },
  recover: async (error, context) => {
    return getCachedSearchResults(context.queries);
  }
};

const partialResultsStrategy: RecoveryStrategy = {
  name: 'ContinueWithPartial',
  priority: 3,
  canRecover: (error, context) => {
    return context.previousResults && context.previousResults.length > 0;
  },
  recover: async (error, context) => {
    return context.previousResults!;
  }
};
```

3. **Integration with Existing Search** (Day 3)
```typescript
// lib/utils/exaSearchUtil.ts - Replace basic try/catch
const searchCircuitBreaker = new SearchCircuitBreaker([
  retryWithBackoffStrategy,
  fallbackToCacheStrategy,
  partialResultsStrategy
]);

export async function executeExaSearch(queries: SearchQueryItem[]): Promise<SearchResultItem[]> {
  const context: SearchContext = {
    queries,
    attempt: 1,
    previousResults: undefined
  };

  return await searchCircuitBreaker.executeWithRecovery(
    () => executeExaSearchDirect(queries),
    context
  );
}

// Keep original implementation as direct call
async function executeExaSearchDirect(queries: SearchQueryItem[]): Promise<SearchResultItem[]> {
  // Original implementation without recovery logic
}
```

**Validation Criteria**:
- Search failures no longer crash research pipeline
- Multiple recovery strategies can be attempted
- Recovery attempts are logged for debugging
- Graceful degradation preserves user experience

### 2.2 Enhanced Document Status Indicators

**Objective**: Transform basic status displays into informative, actionable components

**Architectural Pattern**: **Component-level UI state**, **global research state through atoms**

**Files Affected**:
- `components/domain/legal-research/document-status-indicator.tsx`
- Research progress components
- Error state displays

**Implementation Steps**:

1. **Enhanced Status Data Structure** (Day 3-4)
```typescript
// Keep StatusIndicatorData but enhance it incrementally
export interface StatusIndicatorData {
  icon: React.ReactNode;
  text: string;
  color: string;
  // New enhancements
  progress?: number; // 0-100 for progress bars
  estimatedTime?: string; // "~2 minutes remaining"
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
  details?: string; // Expandable details
}

// Make getStatusIndicator internal and enhance it
function getStatusIndicator(
  status: string,
  metadata: {
    progress?: number;
    estimatedTime?: string;
    onRetry?: () => void;
    onSkip?: () => void;
    errorMessage?: string;
  } = {}
): StatusIndicatorData {
  switch (status) {
    case "analyzing":
      return {
        icon: <Brain className="h-4 w-4 animate-pulse" />,
        text: "Analyzing document content...",
        color: "text-blue-600",
        progress: metadata.progress,
        estimatedTime: metadata.estimatedTime,
        details: `Processing document analysis`
      };

    case "failed":
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Analysis failed",
        color: "text-red-600",
        actions: [
          {
            label: "Retry",
            onClick: metadata.onRetry || (() => {}),
            variant: 'primary'
          },
          {
            label: "Skip",
            onClick: metadata.onSkip || (() => {}),
            variant: 'secondary'
          }
        ],
        details: metadata.errorMessage || "Unknown error occurred"
      };

    // Enhanced existing statuses...
    default:
      return {
        icon: <Loader2 className="h-4 w-4" />,
        text: status,
        color: "text-gray-600"
      };
  }
}
```

2. **Component Enhancement with Local State** (Day 4)
```typescript
// components/domain/legal-research/document-status-indicator.tsx
export function DocumentStatusIndicator({
  docId,
  onAction
}: {
  docId: string;
  onAction?: (action: string, docId: string) => void;
}) {
  // UI state stays local
  const [showDetails, setShowDetails] = useState(false);

  // Global research state through atoms
  const document = useAtomValue(documentAtom(docId));

  const statusData = getStatusIndicator(document.status, {
    progress: document.analysisProgress,
    estimatedTime: document.estimatedCompletionTime,
    onRetry: () => onAction?.('retry', docId),
    onSkip: () => onAction?.('skip', docId),
    errorMessage: document.lastError
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {statusData.icon}
          <span className={statusData.color}>{statusData.text}</span>
          {statusData.estimatedTime && (
            <span className="text-sm text-muted-foreground">
              ({statusData.estimatedTime})
            </span>
          )}
        </div>

        {statusData.actions && (
          <div className="flex space-x-1">
            {statusData.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {statusData.progress !== undefined && (
        <Progress value={statusData.progress} className="w-full" />
      )}

      {statusData.details && (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground">
            {showDetails ? 'Hide details' : 'Show details'}
          </CollapsibleTrigger>
          <CollapsibleContent className="text-xs text-muted-foreground mt-1">
            {statusData.details}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
```

**Validation Criteria**:
- Status indicators show meaningful progress information
- Failed states offer actionable recovery options
- Details are available but not overwhelming
- Component performance is not impacted by enhancements

### 2.3 Basic Testing Infrastructure Activation

**Objective**: Activate minimal, high-value testing utilities

**Implementation Steps**:

1. **Environment-Aware Test Configuration** (Day 4)
```typescript
// __tests__/test-utils.tsx - Activate markAsApiDependent
export function markAsApiDependent(apiKeys: string[]) {
  const missingKeys = apiKeys.filter(key => !process.env[key]);

  return {
    meta: {
      requiresApiKeys: apiKeys,
      description: `This test requires: ${apiKeys.join(", ")}`,
      skipReason: missingKeys.length > 0 ?
        `Missing API keys: ${missingKeys.join(", ")}` :
        undefined
    }
  };
}

// Simple mock client for unit tests
export function createMockBamlClient(): Partial<BamlClient> {
  return {
    GenerateLegalSearchQueries: vi.fn(),
    AnalyzeSingleDocument: vi.fn(),
    // Add others as needed, not all at once
  };
}
```

2. **Environment Validation Tests** (Day 5)
```typescript
// __tests__/lib/schemas/env.test.ts
describe('Environment Validation', () => {
  it('should fail with clear message when API keys missing', () => {
    const originalEnv = process.env;
    process.env = { NODE_ENV: 'test' }; // Missing API keys

    expect(() => {
      // Re-import to trigger validation
      delete require.cache[require.resolve('@/lib/schemas/env')];
      require('@/lib/schemas/env');
    }).toThrow('Missing or invalid environment variables: CEREBRAS_API_KEY, EXA_API_KEY');

    process.env = originalEnv;
  });

  it('should pass with valid environment', () => {
    expect(() => {
      // Current environment should be valid for tests
      require('@/lib/schemas/env');
    }).not.toThrow();
  });
});
```

---

## Layer 3: Experience Polish (Week 3)

### 3.1 Interactive Entity Badge Enhancement

**Objective**: Transform entity badges into interactive exploration tools

**Implementation Strategy**: **Start with basic interactivity**, build advanced features incrementally

**Implementation Steps**:

1. **Enhanced EntityBadge Component** (Day 1-2)
```typescript
// components/domain/legal-research/entity-badge.tsx
interface EntityBadgeProps {
  entity: ClientLegalEntity;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showConfidence?: boolean;
  onClick?: (entity: ClientLegalEntity) => void;
}

export function EntityBadge({
  entity,
  size = 'md',
  interactive = true,
  showConfidence = false,
  onClick
}: EntityBadgeProps) {
  // Keep getEntityStyle internal - not exported
  const baseStyle = getEntityStyle(entity.type);
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-opacity",
        baseStyle,
        sizeClasses[size],
        interactive && "cursor-pointer hover:opacity-80"
      )}
      onClick={() => interactive && onClick?.(entity)}
    >
      <span>{entity.name}</span>
      {showConfidence && entity.confidence && (
        <span className="ml-1 text-xs opacity-75">
          {Math.round(entity.confidence * 100)}%
        </span>
      )}
    </span>
  );
}

// Make getEntityStyle internal
function getEntityStyle(type: string): string {
  // Existing implementation - unchanged
  const styles = {
    Case: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Statute: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    // ... rest of existing styles
  };
  return styles[type as keyof typeof styles] || styles.LegalConcept;
}
```

**Success Metrics**:
- Entity badges show confidence when available
- Interactive entities provide visual feedback
- Clicking entities can trigger exploration (basic implementation)

### 3.2 Report Section Enhancement (Optional)

**Objective**: Add basic report section management if time permits

**Implementation Strategy**: **Simple section display** before complex reordering

**Implementation Steps**:

1. **Basic ClientReportSection Usage** (Day 2-3)
```typescript
// lib/state/researchAtoms.ts - Simple section structure
export interface ClientReportSection {
  id: string;
  title: string;
  content: string;
  type: 'executive_summary' | 'key_findings' | 'legal_analysis' | 'conclusion';
  status: 'pending' | 'complete';
}

export const reportSectionsAtom = atom<ClientReportSection[]>([]);
```

2. **Basic Section Display** (Day 3)
```typescript
// components/domain/report-generation/report-sections-display.tsx
export function ReportSectionsDisplay() {
  const sections = useAtomValue(reportSectionsAtom);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{section.title}</h3>
            <Badge variant={section.status === 'complete' ? 'default' : 'secondary'}>
              {section.status}
            </Badge>
          </div>
          <div className="prose prose-sm max-w-none">
            {section.content || 'Content pending...'}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.3 Advanced Features (Time Permitting)

**AutoMode Implementation**: Only if basic features are solid and time permits

**Implementation Strategy**: **Minimal AutoMode** - simple automation without complex UI

```typescript
// lib/state/researchAtoms.ts - Minimal AutoMode
export interface AutoModeConfig {
  enabled: boolean;
  maxIterations: number;
  confidenceThreshold: number;
}

export const autoModeConfigAtom = atom<AutoModeConfig>({
  enabled: false,
  maxIterations: 3,
  confidenceThreshold: 0.8
});
```

---

## Implementation Timeline & Validation Protocol

### Week 1: Infrastructure Foundation

**Day 1**: Environment Validation System
- [ ] Implement minimal environment schema
- [ ] Add startup validation
- [ ] **Validate**: App fails fast with missing keys

**Day 2**: Environment Variable Replacement
- [ ] Replace all `process.env` usage with validated imports
- [ ] **Validate**: No direct environment access remains

**Day 3**: Basic Configuration System
- [ ] Implement flat configuration structure
- [ ] Integrate with orchestrator
- [ ] **Validate**: Magic numbers replaced, environment-specific behavior

**Day 4**: Document Ordering Activation
- [ ] Activate orderedDocumentsAtom
- [ ] Add document metadata
- [ ] **Validate**: Documents display in logical order

**Day 5**: Week 1 Integration Testing
- [ ] End-to-end testing of all changes
- [ ] Performance validation
- [ ] **Validate**: No regressions, immediate value delivered

### Week 2: Reliability Enhancement

**Day 1-2**: Circuit Breaker Error Handling
- [ ] Implement recovery strategy pattern
- [ ] Create composable recovery strategies
- [ ] **Validate**: Error recovery works without tight coupling

**Day 3-4**: Enhanced Status Indicators
- [ ] Enhance StatusIndicatorData
- [ ] Add progress indicators and actions
- [ ] **Validate**: Better user feedback on document processing

**Day 5**: Testing Infrastructure
- [ ] Activate basic testing utilities
- [ ] Add environment validation tests
- [ ] **Validate**: Test coverage improves, API tests conditional

### Week 3: Experience Polish

**Day 1-2**: Interactive Entity Badges
- [ ] Enhance EntityBadge component
- [ ] Add basic interactivity
- [ ] **Validate**: Entities are explorable and informative

**Day 3-4**: Report Section Enhancement (Optional)
- [ ] Basic report section display
- [ ] Simple section management
- [ ] **Validate**: Reports are better organized

**Day 5**: Final Integration & Polish
- [ ] Advanced features if time permits
- [ ] Final testing and documentation
- [ ] **Validate**: All knip "unused" items now integrated

---

## Success Metrics & Validation Criteria

### Technical Achievements
- [ ] **Zero "unused" warnings** from knip for integrated components
- [ ] **100% environment variable validation** with clear error messages
- [ ] **Composable error handling** without tight orchestrator coupling
- [ ] **Enhanced user feedback** through progress indicators and actions
- [ ] **Improved document organization** through ordering system

### User Experience Improvements
- [ ] **Clear error messages** guide users during failures
- [ ] **Progress indicators** show document processing status
- [ ] **Interactive elements** allow exploration of research results
- [ ] **Consistent document ordering** improves research comprehension
- [ ] **Graceful error recovery** maintains research continuity

### Development Experience Enhancements
- [ ] **Type-safe environment access** prevents runtime errors
- [ ] **Configurable research parameters** without code changes
- [ ] **Comprehensive error recovery** reduces debugging time
- [ ] **Enhanced testing utilities** improve development confidence
- [ ] **Clear architectural patterns** guide future development

---

## Risk Assessment & Mitigation Strategies

### High Risk Items (Week 1)
1. **Environment Schema Breaking BAML Functions**
   - **Mitigation**: Test BAML functions immediately after environment changes
   - **Rollback Plan**: Keep process.env fallbacks during transition

2. **Configuration System Performance Impact**
   - **Mitigation**: Performance benchmarks before/after each change
   - **Threshold**: < 5% performance degradation acceptable

### Medium Risk Items (Week 2)
1. **Error Recovery Complexity Masking Issues**
   - **Mitigation**: Comprehensive logging of all recovery attempts
   - **Monitoring**: Track recovery strategy success rates

2. **UI Enhancement Performance Impact**
   - **Mitigation**: Component-level performance testing
   - **Optimization**: Use React.memo for expensive components

### Low Risk Items (Week 3)
1. **Entity Badge Interactivity Scope Creep**
   - **Mitigation**: Start with basic click handling only
   - **Expansion**: Add features incrementally based on validation

---

## Architecture Decision Records (ADRs)

### ADR-001: Circuit Breaker Pattern for Error Handling
**Decision**: Use pluggable recovery strategies instead of monolithic error handler
**Rationale**: Avoids tight coupling, enables composable error recovery
**Consequences**: More flexible but requires strategy implementation

### ADR-002: Flat Configuration Structure
**Decision**: Start with flat config, avoid nested complexity early
**Rationale**: Easier to understand, modify, and debug
**Consequences**: May need restructuring as features grow

### ADR-003: Component-Level UI State
**Decision**: Keep UI state local to components, global atoms only for research data
**Rationale**: Better separation of concerns, easier testing
**Consequences**: More useState calls but clearer data flow

### ADR-004: Minimal Environment Schema First
**Decision**: Start with essential API keys only, expand incrementally
**Rationale**: Lower risk, immediate production value
**Consequences**: Additional environment variables need schema updates

---

## Future Considerations & Extensibility

### Layer 4: Advanced Automation (Future Sprint)
- **AutoMode**: Full hands-off research automation
- **Smart Query Generation**: Machine learning-enhanced query optimization
- **Advanced Report Templates**: Domain-specific report structures
- **Collaborative Features**: Multi-user research sessions

### Layer 5: Analytics & Optimization (Future Sprint)
- **Performance Monitoring**: Real-time research pipeline metrics
- **Usage Analytics**: Research pattern analysis and optimization
- **Advanced Caching**: Intelligent result caching and preloading
- **Export Capabilities**: PDF/Word report generation

### Architectural Evolution Path
1. **Microservice Decomposition**: Extract search, analysis, and synthesis services
2. **Event-Driven Architecture**: Move to event-based orchestration
3. **Persistent Storage**: Add database layer for research session history
4. **API Gateway**: Expose research capabilities as REST/GraphQL APIs

---

## Conclusion

This v2 architectural plan transforms the knip integration from a **comprehensive feature delivery** approach to a **validated incremental development** strategy. By following proven architectural patterns and emphasizing immediate value delivery, we ensure:

**Week 1 Delivers**: Production-ready environment validation and configuration management
**Week 2 Delivers**: Robust error handling and enhanced user experience
**Week 3 Delivers**: Interactive features and polish

Each layer builds upon validated foundations, ensuring system stability while adding meaningful value. The **Circuit Breaker pattern** for error handling, **component-level UI state** management, and **incremental complexity growth** create a maintainable, scalable architecture that serves both immediate needs and future expansion.

**Success Definition**: All previously "unused" abstractions become active, valuable features that enhance JurisConsulta's production readiness, user experience, and developer productivity without introducing technical debt or architectural complexity.
