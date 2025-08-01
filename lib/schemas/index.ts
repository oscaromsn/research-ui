// Main entry point for schema system
// biome-ignore lint/performance/noBarrelFile: Centralized schema exports are needed for system architecture
export {
  number,
  string,
} from "./common";

export {
  type ClientEnv,
  env,
  type ServerEnv,
} from "./env";

export { createSchema } from "./utils";
