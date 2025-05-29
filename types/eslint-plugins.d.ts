// Type declarations for ESLint plugins that don't have built-in TypeScript support
// This file resolves IDE warnings about missing type declarations

declare module 'eslint-plugin-import' {
  import type { ESLint, Linter } from 'eslint';
  
  interface ImportPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
      typescript: Linter.Config;
      errors: Linter.Config;
      warnings: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: ImportPlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint, Linter } from 'eslint';
  
  interface JSXA11yPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: JSXA11yPlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-promise' {
  import type { ESLint, Linter } from 'eslint';
  
  interface PromisePlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: PromisePlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-security' {
  import type { ESLint, Linter } from 'eslint';
  
  interface SecurityPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: SecurityPlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-jest-dom' {
  import type { ESLint, Linter } from 'eslint';
  
  interface JestDOMPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: JestDOMPlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-testing-library' {
  import type { ESLint, Linter } from 'eslint';
  
  interface TestingLibraryPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
      react: Linter.Config;
      vue: Linter.Config;
      angular: Linter.Config;
      marko: Linter.Config;
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: TestingLibraryPlugin;
  export = plugin;
  export default plugin;
}

declare module 'eslint-plugin-regexp' {
  import type { ESLint } from 'eslint';
  
  interface RegexpPlugin extends ESLint.Plugin {
    configs: {
      recommended: ESLint.ConfigData;
      'flat/recommended': ESLint.ConfigData;
    };
  }
  
  const plugin: RegexpPlugin;
  export = plugin;
}

declare module 'eslint-plugin-sonarjs' {
  import type { ESLint } from 'eslint';
  
  interface SonarJSPlugin extends ESLint.Plugin {
    configs: {
      recommended: ESLint.ConfigData;
    };
  }
  
  const plugin: SonarJSPlugin;
  export = plugin;
}

declare module 'eslint-plugin-unicorn' {
  import type { ESLint } from 'eslint';
  
  interface UnicornPlugin extends ESLint.Plugin {
    configs: {
      recommended: ESLint.ConfigData;
      'flat/recommended': ESLint.ConfigData;
    };
  }
  
  const plugin: UnicornPlugin;
  export = plugin;
}

declare module 'eslint-plugin-no-unsanitized' {
  import type { ESLint } from 'eslint';
  
  interface NoUnsanitizedPlugin extends ESLint.Plugin {
    configs: {
      recommended: ESLint.ConfigData;
      DOM: ESLint.ConfigData;
    };
  }
  
  const plugin: NoUnsanitizedPlugin;
  export = plugin;
}

declare module 'eslint-plugin-tailwindcss' {
  import type { ESLint } from 'eslint';
  
  interface TailwindCSSPlugin extends ESLint.Plugin {
    configs: {
      recommended: ESLint.ConfigData;
      'flat/recommended': ESLint.ConfigData;
    };
  }
  
  const plugin: TailwindCSSPlugin;
  export = plugin;
}

// Enhanced Vitest ESLint plugin declaration for better compatibility
declare module '@vitest/eslint-plugin' {
  import type { ESLint, Linter } from 'eslint';
  
  interface VitestPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
    environments: {
      env: {
        globals: Record<string, boolean>;
      };
    };
    rules: Record<string, ESLint.Rule.RuleModule>;
  }
  
  const plugin: VitestPlugin;
  export = plugin;
  export default plugin;
}