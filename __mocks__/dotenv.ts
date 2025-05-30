import { vi } from "vitest";

export const config = vi.fn();

const dotenvMock = { config };
export default dotenvMock;
