# Dependency Injection (DI) in @starterp/api

## Why We Use Dependency Injection

- **Environment-Agnostic Configuration**: DI allows us to inject configuration (e.g., secrets, environment variables) at runtime, whether running locally (using `process.env`) or in serverless/cloud environments (like Cloudflare Workers, where only `env` is available). This means services and storage classes receive their config via injection, avoiding conditional runtime checks and making code portable and testable.
- **Swappable Implementations**: Storage and service implementations (e.g., Postgres vs. in-memory) can be swapped easily by changing DI bindings. This is useful for testing, local development, or running in different environments.
- **Mocking and Testing**: DI enables us to inject mock or fake implementations for services and storage, making unit and integration testing straightforward. You can hijack the injection of a real dependency and replace it with a mock for tests.

## How We Use Dependency Injection

- **Key Files and Patterns**:
  - `src/di/types.ts`: Defines all DI keys (symbols) in the `TYPES` object. Always use these for binding and injection.
  - **Service Classes**: Use `@injectable()` on all services and storage classes. Use `@inject(TYPES.X)` in constructors to receive dependencies.
  - **Bindings**: While there is no central `container.ts` in the repo, bindings are set up in test files (see `tests/billing-webhooks.test.ts`) and referenced in the [README](../README.md). In production, the container is typically set up in the app/server entrypoint (not shown here, but follow the README structure).
  - **Swapping Implementations**: To use a different storage or service (e.g., in-memory vs. Postgres), change the binding for the relevant `TYPES.X` in your container setup.

- **Example Usage**:
  - To inject a dependency:

    ```ts
    import { inject, injectable } from "inversify";
    import { TYPES } from "../di/types";
    
    @injectable()
    export class UserService {
      constructor(
        @inject(TYPES.UserStorage) private userStorage: UserStorageInterface,
        // ...other deps
      ) {}
    }
    ```

  - To bind a mock in a test:

    ```ts
    container.bind(TYPES.UserStorage).toConstantValue(new UserStorageInMemory());
    ```

## Useful Information for AI and Contributors

- **Always use the `TYPES` object** for all DI keys—never use raw strings or symbols directly.
- **Prefer constructor injection** (not property injection) for all dependencies.
- **All services and storage classes must be decorated with `@injectable()`**.
- **To swap implementations**, change the binding for the relevant type in your container setup (e.g., swap `UserStorageInMemory` for `UserStoragePostgres`).
- **For configuration/secrets**, inject them as values using DI (e.g., `TYPES.StripeSecretKey`).
- **For mocking/testing**, bind a mock or fake implementation to the relevant type in your test container.
- **No central container file**: In this repo, DI setup is decentralized (see tests and README for examples). In production, follow the README's structure for where to set up the container.
- **No runtime conditional logic for config**: Always inject config at construction time, never check `process.env` or `env` inside service logic.

---

**References:**

- [src/di/types.ts](./types.ts)
- [README.md](../README.md)
- [tests/billing-webhooks.test.ts](../../tests/billing-webhooks.test.ts)
- [inversify docs](https://inversify.io)
