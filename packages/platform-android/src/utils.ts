import { XMLParser } from 'fast-xml-parser';
import type {
  ElementReference,
  UIElement,
} from '@react-native-harness/platforms';
import { isAndroidDeviceEmulator, type AndroidDevice } from './config.js';

export const getDeviceName = (device: AndroidDevice): string => {
  if (isAndroidDeviceEmulator(device)) {
    return `${device.name} (emulator)`;
  }

  return `${device.manufacturer} ${device.model}`;
};

const parseBounds = (
  bounds: string
): { x: number; y: number; width: number; height: number } => {
  // Bounds format: [x1,y1][x2,y2]
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const x1 = parseInt(match[1], 10);
  const y1 = parseInt(match[2], 10);
  const x2 = parseInt(match[3], 10);
  const y2 = parseInt(match[4], 10);
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
};

type XmlNode = {
  '@_class'?: string;
  '@_resource-id'?: string;
  '@_text'?: string;
  '@_content-desc'?: string;
  '@_bounds'?: string;
  '@_clickable'?: string;
  '@_enabled'?: string;
  '@_focusable'?: string;
  '@_focused'?: string;
  '@_scrollable'?: string;
  '@_long-clickable'?: string;
  '@_password'?: string;
  '@_selected'?: string;
  '@_checkable'?: string;
  '@_checked'?: string;
  node?: XmlNode | XmlNode[];
  [key: string]: unknown;
};

const convertXmlNodeToUIElement = (node: XmlNode): UIElement => {
  const attributes: Record<string, unknown> = {};
  const children: UIElement[] = [];

  // Extract all attributes
  if (node['@_class']) attributes.class = node['@_class'];
  if (node['@_resource-id']) attributes['resource-id'] = node['@_resource-id'];
  if (node['@_text']) attributes.text = node['@_text'];
  if (node['@_content-desc'])
    attributes['content-desc'] = node['@_content-desc'];
  if (node['@_bounds']) attributes.bounds = node['@_bounds'];
  if (node['@_clickable']) attributes.clickable = node['@_clickable'];
  if (node['@_enabled']) attributes.enabled = node['@_enabled'];
  if (node['@_focusable']) attributes.focusable = node['@_focusable'];
  if (node['@_focused']) attributes.focused = node['@_focused'];
  if (node['@_scrollable']) attributes.scrollable = node['@_scrollable'];
  if (node['@_long-clickable'])
    attributes['long-clickable'] = node['@_long-clickable'];
  if (node['@_password']) attributes.password = node['@_password'];
  if (node['@_selected']) attributes.selected = node['@_selected'];
  if (node['@_checkable']) attributes.checkable = node['@_checkable'];
  if (node['@_checked']) attributes.checked = node['@_checked'];

  // Copy all other attributes
  Object.keys(node).forEach((key) => {
    if (key.startsWith('@_') && !attributes[key.slice(2)]) {
      attributes[key.slice(2)] = node[key];
    }
  });

  // Process children
  if (node.node && Array.isArray(node.node)) {
    children.push(...node.node.map(convertXmlNodeToUIElement));
  } else if (node.node) {
    children.push(convertXmlNodeToUIElement(node.node));
  }

  const bounds = node['@_bounds']
    ? parseBounds(node['@_bounds'])
    : { x: 0, y: 0, width: 0, height: 0 };

  return {
    type: node['@_class'] || 'unknown',
    id: node['@_resource-id'] || undefined,
    text: node['@_text'] || node['@_content-desc'] || undefined,
    rect: bounds,
    children,
    attributes,
  };
};

export const parseUiHierarchy = (xmlString: string): UIElement => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xmlString);
  const hierarchyNode = parsed.hierarchy?.node;

  if (!hierarchyNode) {
    throw new Error('Invalid UI hierarchy XML: missing hierarchy.node');
  }

  // Handle case where node might be an array (though typically it's a single root node)
  const rootNode = Array.isArray(hierarchyNode)
    ? hierarchyNode[0]
    : hierarchyNode;

  return convertXmlNodeToUIElement(rootNode);
};

/**
 * Recursively search for elements matching the testID
 */
const findElementsByTestId = (
  element: UIElement,
  testId: string,
  path: number[] = []
): Array<{ element: UIElement; path: number[] }> => {
  const results: Array<{ element: UIElement; path: number[] }> = [];

  // Check if this element matches the testID
  // In React Native, testID is typically stored in content-desc or as a testID attribute
  const elementTestId =
    element.attributes['testID'] ||
    element.attributes['test-id'] ||
    element.attributes['content-desc'];

  if (elementTestId === testId) {
    results.push({ element, path });
  }

  // Recursively search children
  element.children.forEach((child, index) => {
    results.push(...findElementsByTestId(child, testId, [...path, index]));
  });

  return results;
};

/**
 * Find a single element by testID. Throws if not found.
 */
export const findByTestId = async (
  getUiHierarchy: () => Promise<UIElement>,
  testId: string
): Promise<ElementReference> => {
  const hierarchy = await getUiHierarchy();
  const matches = findElementsByTestId(hierarchy, testId);

  if (matches.length === 0) {
    throw new Error(
      `Unable to find an element with testID: ${testId}. This could happen because:\n` +
        `  - The element is not currently rendered\n` +
        `  - The testID prop is not set on the element\n` +
        `  - The element is outside the visible viewport`
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Found multiple elements with testID: ${testId}. Use findAllByTestId instead.`
    );
  }

  // Encode path as identifier: "0.1.2" represents indices in the tree
  return { id: matches[0].path.join('.') };
};

/**
 * Find all elements by testID. Returns empty array if none found.
 */
export const findAllByTestId = async (
  getUiHierarchy: () => Promise<UIElement>,
  testId: string
): Promise<ElementReference[]> => {
  const hierarchy = await getUiHierarchy();
  const matches = findElementsByTestId(hierarchy, testId);

  // Encode paths as identifiers
  return matches.map((match) => ({ id: match.path.join('.') }));
};

/**
 * Get element by path identifier (e.g., "0.1.2")
 */
export const getElementByPath = (
  hierarchy: UIElement,
  pathStr: string
): UIElement | null => {
  const path = pathStr.split('.').map((s) => parseInt(s, 10));
  let current: UIElement = hierarchy;

  for (const index of path) {
    if (index < 0 || index >= current.children.length) {
      return null;
    }
    current = current.children[index];
  }

  return current;
};
