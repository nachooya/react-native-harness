import pixelmatch from 'pixelmatch';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import type { FileReference, ImageSnapshotOptions } from './shared.js';

type PixelmatchOptions = Parameters<typeof pixelmatch>[5];

const SNAPSHOT_DIR_NAME = '__image_snapshots__';
const DEFAULT_OPTIONS_FOR_PIXELMATCH: PixelmatchOptions = {
  threshold: 0.1,
  includeAA: false,
  alpha: 0.1,
  aaColor: [255, 255, 0],
  diffColor: [255, 0, 0],
  // @ts-expect-error - this is extracted from the pixelmatch package
  diffColorAlt: null,
  diffMask: false,
};

export const matchImageSnapshot = async (
  screenshot: FileReference,
  testFilePath: string,
  options: ImageSnapshotOptions,
  platformName: string
) => {
  const pixelmatchOptions = {
    ...DEFAULT_OPTIONS_FOR_PIXELMATCH,
    ...options,
  };
  const receivedPath = screenshot.path;

  try {
    await fs.access(receivedPath);
  } catch {
    throw new Error(`Screenshot file not found at ${receivedPath}`);
  }

  const receivedBuffer = await fs.readFile(receivedPath);

  // Create __image_snapshots__ directory in same directory as test file
  const testDir = path.dirname(testFilePath);
  const snapshotsDir = path.join(testDir, SNAPSHOT_DIR_NAME, platformName);

  const snapshotName = `${options.name}.png`;
  const snapshotPath = path.join(snapshotsDir, snapshotName);

  await fs.mkdir(snapshotsDir, { recursive: true });

  try {
    await fs.access(snapshotPath);
  } catch {
    // First time - create snapshot
    await fs.writeFile(snapshotPath, receivedBuffer);
    return {
      pass: true,
      message: `Snapshot created at ${snapshotPath}`,
    };
  }

  const [receivedBufferAgain, snapshotBuffer] = await Promise.all([
    fs.readFile(receivedPath),
    fs.readFile(snapshotPath),
  ]);
  const img1 = PNG.sync.read(receivedBufferAgain);
  const img2 = PNG.sync.read(snapshotBuffer);
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      pass: false,
      message: `Images have different dimensions. Received image width: ${img1.width}, height: ${img1.height}. Snapshot image width: ${img2.width}, height: ${img2.height}.`,
    };
  }

  // Compare buffers byte by byte
  const differences = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    pixelmatchOptions
  );

  const pass = differences === 0;

  // Save diff and actual images when test fails
  if (!pass) {
    const diffFileName = `${snapshotName.replace('.png', '')}-diff.png`;
    const diffPath = path.join(snapshotsDir, diffFileName);
    await fs.writeFile(diffPath, PNG.sync.write(diff));

    const actualFileName = `${snapshotName.replace('.png', '')}-actual.png`;
    const actualPath = path.join(snapshotsDir, actualFileName);
    await fs.writeFile(actualPath, receivedBuffer);
  }

  return {
    pass,
    message: pass
      ? 'Images match'
      : `Images differ by ${differences} pixels. Diff saved at ${path.join(
          snapshotsDir,
          snapshotName.replace('.png', '') + '-diff.png'
        )}. Actual image saved at ${path.join(
          snapshotsDir,
          snapshotName.replace('.png', '') + '-actual.png'
        )}.`,
  };
};
