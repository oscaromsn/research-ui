// Test file to validate separated format/lint behavior in lint-staged
// This file has intentional formatting and linting issues

const testVariable = "hello world"

function badlyFormatted(param1: string, param2: number) {
  return param1 + param2
}

const unusedVariable = "this should trigger a linting warning"

// Missing semicolon
const anotherTest = "test"

// Bad spacing
if (true) {
  console.log("bad formatting")
}

// This should be formatted but linting errors should not revert formatting
export default function TestComponent() {
  return null
}
