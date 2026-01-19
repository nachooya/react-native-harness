## 1.0.0-alpha.22 (2026-01-19)

### 🩹 Fixes

- Introduces UI testing capabilities with a new `@react-native-harness/ui` package that provides screen queries, user event simulation (press, type), and visual regression testing through `toMatchImageSnapshot`. This enables comprehensive component and integration testing with real device interactions, similar to React Testing Library but running on actual iOS and Android devices. ([#35](https://github.com/callstackincubator/react-native-harness/pull/35))

### ❤️ Thank You

- Szymon Chmal @V3RON

## 1.0.0-alpha.21 (2026-01-15)

### 🩹 Fixes

- Adds Object.hasOwn polyfill to the runtime package for JSC (JavaScriptCore) compatibility. ([#53](https://github.com/callstackincubator/react-native-harness/pull/53))
- Add automatic app restart functionality when apps fail to report ready within the configured timeout period, improving test reliability by recovering from startup failures. ([#55](https://github.com/callstackincubator/react-native-harness/pull/55))
- Added native crash detection during test execution that automatically detects when the app crashes, skips the current test file, and continues with the next test file after restarting the app. ([#56](https://github.com/callstackincubator/react-native-harness/pull/56))
- Bundling errors are now displayed in the CLI output, providing immediate feedback when build issues occur. ([#57](https://github.com/callstackincubator/react-native-harness/pull/57))

### ❤️ Thank You

- bheemreddy-samsara @bheemreddy-samsara
- manud99 @manud99
- Szymon Chmal @V3RON

## 1.0.0-alpha.20 (2026-01-07)

### 🩹 Fixes

- Added `webSocketPort` option to `rn-harness.config` (default 3001). This allows configuring the Bridge Server port, enabling usage of custom ports without rebuilding the application. ([#44](https://github.com/callstackincubator/react-native-harness/pull/44))
- The module mocking system has been rewritten to improve compatibility with different versions of React Native. Instead of fully overwriting Metro's module system, the new implementation surgically redirects responsibility for imports to Harness, allowing for better integration with various React Native versions while maintaining the same mocking capabilities. The module mocking API has been slightly modified as part of this rewrite. ([#49](https://github.com/callstackincubator/react-native-harness/pull/49))
- Fixed inconsistent Android device manufacturer and model matching. Some devices reported manufacturer and model information in non-lowercased form, which could cause device identification issues. Device information is now normalized to lowercase for consistent matching. ([#45](https://github.com/callstackincubator/react-native-harness/pull/45))
- Updated `chai` and `@vitest/expect` dependencies to resolve test crashes caused by Hermes not understanding bigint literals. ([#37](https://github.com/callstackincubator/react-native-harness/pull/37))
- Fixed HMR (Hot Module Replacement) initialization race condition by adding retry logic with delays when disabling HMR, ensuring Harness waits for HMR to be ready before proceeding. ([#38](https://github.com/callstackincubator/react-native-harness/pull/38))

### ❤️ Thank You

- bheemreddy-samsara @bheemreddy-samsara
- manud99 @manud99
- Szymon Chmal @V3RON

## 1.0.0-alpha.19 (2025-12-21)

### 🩹 Fixes

- ## Features ([](https://github.com/callstackincubator/react-native-harness/commit/))

  - Add support for expo-dev-client
    Enables development with Expo's development client for enhanced debugging capabilities
  - Guard against augmenting the Metro config twice
    Prevents duplicate Metro configuration modifications that could cause issues
  - Run Metro internally
    Integrates Metro bundler execution within the harness for better control

  ## Fixes

  - Add missing use-sync-external-store dependency
    Fixes runtime errors by including required React hook dependency

  ## Chores

  - Reduce install size
    Optimizes package dependencies to decrease installation footprint
  - Add GitHub Actions for Harness
    Sets up automated CI/CD workflows for the project

## [1.0.0-alpha.18] (2025-11-03)

### Features

- **Metro Caching** ([#23](https://github.com/callstackincubator/react-native-harness/pull/23)): Added support for Metro's transformation cache, helping in cases when Metro struggles with re-transforming the same files over and over.

- **Improved Timeout Handling** ([#24](https://github.com/callstackincubator/react-native-harness/pull/24)): Enhanced timeout handling to propagate timeouts not only to the initial bootstrapping process but also to all commands sent to the device.

- **Platform Architecture Refactor** ([#22](https://github.com/callstackincubator/react-native-harness/pull/22)): Introduced a major refactor of the Harness architecture, splitting the CLI package into several smaller packages. This makes it possible to create custom platform packages without modifying existing ones. The Metro integration has also been revamped to be more reliable in CI environments.

### Documentation

- **GitHub Actions Workflow Update** ([#25](https://github.com/callstackincubator/react-native-harness/pull/25)): Updated the example GitHub Actions workflow for iOS by adding a step to install Watchman, which dramatically speeds up the file-crawling process and makes Harness run much faster.

## [1.0.0-alpha.17] (2025-10-22)

### Features

- **Metro Regression Workaround** ([#21](https://github.com/callstackincubator/react-native-harness/pull/21)): Changed the way config is augmented to return an async function, working around a regression in Metro.

- **Migration Prompts** ([#19](https://github.com/callstackincubator/react-native-harness/pull/19)): Added migration guide to help users transition from the old CLI to the new Jest-based workflow. Users with unsupported configuration properties will be prompted to migrate.

### Bug Fixes

- **Bundle URL Fix** ([#20](https://github.com/callstackincubator/react-native-harness/pull/20)): Fixed incorrect URL with double slashes used during test bundling, which was causing failures due to changed behavior in React Native or Metro.

## [1.0.0-alpha.16] (2025-10-22)

### Features

- **Split Setup and Setup After Env** ([#18](https://github.com/callstackincubator/react-native-harness/pull/18)): Split setup files into separate setup and setup after environment phases for better control over test initialization.

- **UI Components Support** ([#17](https://github.com/callstackincubator/react-native-harness/pull/17)): Added basic support for testing UI components in React Native Harness, enabling component-level testing capabilities.

- **Jest Wrapper CLI** ([#16](https://github.com/callstackincubator/react-native-harness/pull/16)): Replaced custom CLI implementation with a Jest wrapper, providing better integration with the Jest ecosystem and improved compatibility.

- **Jest Preset Re-export** ([#15](https://github.com/callstackincubator/react-native-harness/pull/15)): Re-exported Jest preset from the main package for easier configuration and setup.

- **Watch Mode Performance** ([#14](https://github.com/callstackincubator/react-native-harness/pull/14)): Significantly improved watch mode speed, making the development experience faster and more responsive.

- **Code Frame Error Display** ([#13](https://github.com/callstackincubator/react-native-harness/pull/13)): Enhanced error reporting in Jest with code frames, making it easier to identify and fix issues by showing the exact location of errors in context.

- **Jest Globals Detection** ([#12](https://github.com/callstackincubator/react-native-harness/pull/12)): Added validation to throw errors when Jest globals are used, ensuring proper test isolation and preventing common testing pitfalls.

- **Coverage Support** ([#10](https://github.com/callstackincubator/react-native-harness/pull/10)): Implemented code coverage reporting capabilities.

- **Reset Environment Config** ([#11](https://github.com/callstackincubator/react-native-harness/pull/11)): Added `resetEnvironmentBetweenTestFiles` configuration property for better test isolation control.

- **Auto-apply Babel Plugins** ([#9](https://github.com/callstackincubator/react-native-harness/pull/9)): Babel plugins are now automatically applied, reducing manual configuration requirements.

- **Auto-inject Harness** ([#8](https://github.com/callstackincubator/react-native-harness/pull/8)): Harness is now automatically injected into the test environment, simplifying setup process.

- **Setup Files Support** ([#6](https://github.com/callstackincubator/react-native-harness/pull/6)): Added support for Jest setup files, allowing for better test environment configuration.

- **Harness-based Jest Runner** ([#4](https://github.com/callstackincubator/react-native-harness/pull/4)): Implemented a custom Jest runner built on the Harness architecture.
