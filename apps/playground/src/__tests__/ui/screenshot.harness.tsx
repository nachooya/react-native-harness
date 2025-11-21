import { describe, test, render, screen, expect } from 'react-native-harness';
import { View, Text } from 'react-native';

describe('Screenshot', () => {
  test('should match image snapshot with multiple snapshots', async () => {
    await render(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'blue',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>Hello, world!</Text>
        </View>
      </View>
    );
    const screenshot1 = await screen.screenshot();
    await expect(screenshot1).toMatchImageSnapshot({ name: 'blue-square' });

    // Change the background color and take another snapshot
    await render(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>Hello, world!</Text>
        </View>
      </View>
    );
    const screenshot2 = await screen.screenshot();
    await expect(screenshot2).toMatchImageSnapshot({ name: 'red-square' });

    // Take a third snapshot with different content
    await render(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'green',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>Goodbye, world!</Text>
        </View>
      </View>
    );
    const screenshot3 = await screen.screenshot();
    await expect(screenshot3).toMatchImageSnapshot({ name: 'green-square' });
  });

  test('should match image snapshot with custom options', async () => {
    await render(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'yellow',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'black' }}>Custom options test</Text>
        </View>
      </View>
    );
    const screenshot = await screen.screenshot();
    await expect(screenshot).toMatchImageSnapshot({
      name: 'yellow-square-custom-options',
      threshold: 0.05, // More sensitive threshold
      diffColor: [0, 255, 0], // Green diff color
    });
  });

  test('should create diff image when test fails', async () => {
    await render(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'purple', // Different color to cause mismatch
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>This will fail</Text>
        </View>
      </View>
    );
    const screenshot = await screen.screenshot();
    // This should fail and create a diff image
    await expect(screenshot).toMatchImageSnapshot({
      name: 'purple-square-will-fail',
    });
  });
});
