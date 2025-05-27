import { vi } from "vitest";

// Mock atom creation function
export const atom = vi.fn((initialValue) => ({
    init: initialValue,
    read: vi.fn(),
    write: vi.fn(),
}));

// Mock hooks
export const useAtom = vi.fn((atom) => {
    // Return a tuple with value and setter function
    return [
        atom.init, // The initial value
        vi.fn((newValue) => {
            if (typeof newValue === "function") {
                atom.init = newValue(atom.init);
            } else {
                atom.init = newValue;
            }
        }),
    ];
});

export const useAtomValue = vi.fn((atom) => atom.init);

export const useSetAtom = vi.fn((atom) =>
    vi.fn((newValue) => {
        if (typeof newValue === "function") {
            atom.init = newValue(atom.init);
        } else {
            atom.init = newValue;
        }
    }),
);

// Export the Provider component as a mock
export const Provider = ({ children }: { children: React.ReactNode }) =>
    children;
