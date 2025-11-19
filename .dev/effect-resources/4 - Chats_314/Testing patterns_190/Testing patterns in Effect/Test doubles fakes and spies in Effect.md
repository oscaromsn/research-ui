---
modified: 2025-10-26T14:24:25-03:00
---
# Test doubles: fakes and spies in Effect

**Mocks** and **fakes** are both test doubles, but they serve different purposes and work in fundamentally different ways.

## Fakes

A **fake** is a working implementation with real behavior, just simplified. It actually does something functional, but takes shortcuts that make it unsuitable for production. The classic example is an in-memory database instead of a real PostgreSQL connection—it stores data, retrieves it, even handles basic queries, but everything lives in RAM.

```typescript
class FakeUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}
```

Fakes are **state-based**: you interact with them naturally, then verify the resulting state. You call methods, then check what changed.

## Mocks

A **mock** is a test spy with expectations built in. It doesn't have real behavior—instead, you program it with expectations about what should be called, with what arguments, and how many times. The mock itself verifies these expectations and fails the test if they're not met.

```typescript
test('should notify user on signup', () => {
  const mockEmailService = mock<EmailService>();
  mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
  
  const service = new UserService(mockEmailService);
  await service.registerUser(userData);
  
  // Mock verifies the interaction happened correctly
  expect(mockEmailService.sendWelcomeEmail)
    .toHaveBeenCalledWith(userData.email);
});
```

Mocks are **behavior-based**: you verify that specific interactions occurred, not the resulting state.

## When to use which?

**Use fakes when** you need realistic behavior without infrastructure overhead. Fakes are great for repositories, file systems, or time providers. They make tests faster and more reliable since they eliminate external dependencies.

**Use mocks when** you care about interactions rather than state, especially for side effects like sending emails, publishing events, or calling external APIs. Mocks are also useful when a fake would be too complex to implement.

The key philosophical difference: fakes let you test through the front door (use the system naturally), while mocks require you to specify implementation details (this method must be called with these arguments). This makes fakes more resistant to refactoring, but mocks better at verifying specific behaviors.

Given your Effect-TS background, you might also appreciate that fakes work naturally with dependency injection through Effect's Layer system, while mocking in Effect often involves creating test layers with programmed behavior.
