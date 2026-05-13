![harness-banner](https://react-native-harness.dev/harness-banner.jpg)

[![mit licence][license-badge]][license]
[![npm downloads][npm-downloads-badge]][npm-downloads]
[![Chat][chat-badge]][chat]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]

Web platform for React Native Harness - enables testing on web browsers using WebDriver. Drop-in alternative to `@react-native-harness/platform-web` for setups that already provide a WebDriver-compatible browser driver (chromedriver, geckodriver, safaridriver, msedgedriver, Selenium Grid, etc).

## Installation

```bash
npm install @react-native-harness/platform-web-webdriver
# or
pnpm add @react-native-harness/platform-web-webdriver
# or
yarn add @react-native-harness/platform-web-webdriver
```

You also need a WebDriver server reachable from the test machine. Common options:

- [`chromedriver`](https://chromedriver.chromium.org/) for Chrome
- [`geckodriver`](https://github.com/mozilla/geckodriver) for Firefox
- [`safaridriver`](https://developer.apple.com/documentation/webkit/about_webdriver_for_safari) for Safari
- [`msedgedriver`](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) for Edge
- A Selenium Grid / cloud provider (Sauce Labs, BrowserStack, etc.)

## Usage

Import the WebDriver platform helpers in your `rn-harness.config.mjs`:

```javascript
import {
  webDriverPlatform,
  chrome,
  firefox,
  safari,
  edge,
} from '@react-native-harness/platform-web-webdriver';

const config = {
  runners: [
    webDriverPlatform({
      name: 'web-chrome',
      browser: chrome('http://localhost:8081/index.html', {
        hostname: 'localhost',
        port: 9515,
      }),
    }),
    webDriverPlatform({
      name: 'web-firefox',
      browser: firefox('http://localhost:8081/index.html', {
        hostname: 'localhost',
        port: 4444,
      }),
    }),
  ],
  // ... other config
};

export default config;
```

## API

### `webDriverPlatform(config)`

Creates a WebDriver-based platform runner configuration.

**Parameters:**

- `config.name` - Unique name for the runner
- `config.browser` - Browser configuration (created via helper factories)

### Helper Factories

#### `chrome(url, options)`

#### `firefox(url, options)`

#### `safari(url, options)`

#### `edge(url, options)`

Convenience functions for creating browser configurations.

**Options:**

- `hostname` - Hostname of the WebDriver server (default: `localhost`)
- `port` - Port of the WebDriver server
- `path` - URL path of the WebDriver server (default: `/`)
- `protocol` - `'http'` or `'https'`
- `capabilities` - Extra W3C capabilities merged into the session
- `showLogs` - Print browser console logs through the runner (default: `false`)

## Made with ❤️ at Callstack

`react-native-harness` is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Callstack][callstack-readme-with-love] is a group of React and React Native geeks, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need any help with these or just want to say hi!

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥

[callstack-readme-with-love]: https://callstack.com/?utm_source=github.com&utm_medium=referral&utm_campaign=react-native-harness&utm_term=readme-with-love
[license-badge]: https://img.shields.io/npm/l/react-native-harness?style=for-the-badge
[license]: https://github.com/callstackincubator/react-native-harness/blob/main/LICENSE
[npm-downloads-badge]: https://img.shields.io/npm/dm/react-native-harness?style=for-the-badge
[npm-downloads]: https://www.npmjs.com/package/react-native-harness
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-welcome]: ./CONTRIBUTING.md
[chat-badge]: https://img.shields.io/discord/426714625279524876.svg?style=for-the-badge
[chat]: https://discord.gg/xgGt7KAjxv
