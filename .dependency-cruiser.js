/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* rules checking for circular dependencies */
    {
      name: "no-circular",
      severity: "warn",
      comment:
        "This dependency is part of a circular relationship. You might want to revise " +
        "your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ",
      from: {},
      to: {
        circular: true,
      },
    },
    /* rules checking for orphan modules */
    {
      name: "no-orphans",
      comment:
        "This is an orphan module - it's likely not used (anymore?). Either use it or " +
        "remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
        "add an exception for it in your dependency-cruiser configuration.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$", // dot files
          "\\.d\\.ts$", // TypeScript declaration files
          "(^|/)tsconfig\\.json$", // TypeScript config
          "(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$", // babel/webpack configs
          "(^|/)vitest\\.config\\.(js|cjs|mjs|ts)$", // vitest config
          "(^|/)next\\.config\\.(js|cjs|mjs|ts)$", // next config
          "(^|/)tailwind\\.config\\.(js|cjs|mjs|ts)$", // tailwind config
          "(^|/)postcss\\.config\\.(js|cjs|mjs|ts)$", // postcss config
          "__tests__/", // test files
          "\\.test\\.(js|ts|tsx)$", // test files
          "\\.spec\\.(js|ts|tsx)$", // spec files
        ],
      },
      to: {},
    },
    /* rules checking for deprecated modules */
    {
      name: "not-to-deprecated",
      comment:
        "This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later " +
        "version of that module, or find an alternative. Deprecated modules are a security risk.",
      severity: "warn",
      from: {},
      to: {
        dependencyTypes: ["deprecated"],
      },
    },
    /* rules checking for vulnerabilities */
    {
      name: "not-to-unresolvable",
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
        "module: add it to your package.json. In all other cases you likely already know what to do.",
      severity: "error",
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    /* rules checking for npm security advisories */
    {
      name: "no-non-package-json",
      severity: "error",
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' or 'devDependencies' " +
        "of your package.json. That's problematic as the package either (1) won't be available on live (2) " +
        "will be available on live with an non-guaranteed version. Fix it by adding the package to the " +
        "dependencies in your package.json.",
      from: {},
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
    /* Custom rules for Next.js project structure */
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment:
        "This module depends on an npm package from the devDependencies section of your " +
        "package.json. It looks like something that ships to production, though. To prevent problems " +
        "with npm packages that aren't there on production declare it (only!) in the dependencies" +
        "section of your package.json. If this module is development only - add it to the " +
        "from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration",
      from: {
        path: "^(app|components|lib)",
        pathNot: [
          "\\.(test|spec)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$",
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
        pathNot: [
          "node_modules/@types/",
          "node_modules/@testing-library/",
          "node_modules/vitest",
          "node_modules/happy-dom",
        ],
      },
    },
    /* BAML specific rules */
    {
      name: "no-manual-baml-client-edits",
      severity: "error",
      comment:
        "Do not manually edit files in baml_client - they are auto-generated. " +
        "Make changes in baml_src instead.",
      from: {
        path: "^baml_client",
      },
      to: {},
    },
    /* Next.js specific architectural rules */
    {
      name: "no-server-components-in-client",
      severity: "error",
      comment:
        "Server Components should not be imported into Client Components. " +
        "Consider using composition or moving the logic to a shared location.",
      from: {
        path: ".*",
        pathNot: ["app/.*", "__tests__/.*"],
      },
      to: {
        path: "app/.*",
        pathNot: ["app/actions/.*", "app/api/.*"],
      },
    },
  ],
  options: {
    /* conditions to focus on when resolving */
    doNotFollow: {
      path: "node_modules",
    },
    includeOnly: {
      path: "^(app|components|lib|baml_src)",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "browser"],
    },
  },
};
