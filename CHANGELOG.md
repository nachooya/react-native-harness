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
