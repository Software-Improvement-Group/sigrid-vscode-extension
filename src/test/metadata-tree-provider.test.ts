import * as assert from 'assert';
import { MetadataTreeProvider } from '../tree-views/metadata-tree-provider';
import { MetadataTreeItem } from '../tree-views/metadata-tree-item';

suite('MetadataTreeProvider', () => {
  test('shows loading state initially', () => {
    const provider = new MetadataTreeProvider('test-key', 'https://test.com', 'portfolio', 'system');
    const children = provider.getChildren();

    assert.strictEqual(children instanceof Promise, true, 'getChildren should return a Promise');
  });

  test('shows error when configuration is missing', async () => {
    const provider = new MetadataTreeProvider(undefined, 'https://test.com', 'portfolio', 'system');

    const children = await provider.getChildren();

    assert.strictEqual(children.length > 0, true, 'should have error items');
    assert.strictEqual(children[0].type, 'error', 'should show error item');
  });

  test('shows error when portfolio is missing', async () => {
    const provider = new MetadataTreeProvider('test-key', 'https://test.com', undefined, 'system');

    const children = await provider.getChildren();

    assert.strictEqual(children.length > 0, true, 'should have error items');
    assert.strictEqual(children[0].type, 'error', 'should show error item');
  });

  test('shows error when system is missing', async () => {
    const provider = new MetadataTreeProvider('test-key', 'https://test.com', 'portfolio', undefined);

    const children = await provider.getChildren();

    assert.strictEqual(children.length > 0, true, 'should have error items');
    assert.strictEqual(children[0].type, 'error', 'should show error item');
  });

  test('updates configuration correctly', () => {
    const provider = new MetadataTreeProvider('old-key', 'https://old.com', 'old-portfolio', 'old-system');

    provider.updateConfiguration('new-key', 'https://new.com', 'new-portfolio', 'new-system');

    // Verify that the provider can be used with new configuration
    const children = provider.getChildren();
    assert.strictEqual(children instanceof Promise, true, 'should be able to use updated configuration');
  });

  test('tree item formatting for key-value pairs', () => {
    const item = new MetadataTreeItem('', 'keyValue', undefined, {
      key: 'systemName',
      value: 'my-system'
    });

    assert.strictEqual(item.label, 'System Name: my-system', 'should format camelCase keys');
    assert.strictEqual(item.type, 'keyValue');
  });

  test('tree item formatting for boolean values', () => {
    const item = new MetadataTreeItem('', 'keyValue', undefined, {
      key: 'isActive',
      value: true
    });

    assert.strictEqual(item.label, 'Is Active: Yes', 'should convert true to "Yes"');
  });

  test('tree item formatting for false boolean values', () => {
    const item = new MetadataTreeItem('', 'keyValue', undefined, {
      key: 'excludedFromDashboards',
      value: false
    });

    assert.strictEqual(item.label, 'Excluded From Dashboards: No', 'should convert false to "No"');
  });

  test('tree item with action type has command', () => {
    const item = new MetadataTreeItem('Edit in Sigrid', 'action', undefined, {
      command: 'sigrid-vscode.openMetadataEditor'
    });

    assert.strictEqual(item.type, 'action');
    assert.strictEqual(item.command?.command, 'sigrid-vscode.openMetadataEditor');
  });

  test('category items have proper icons', () => {
    const categoryItem = new MetadataTreeItem('General', 'category');
    assert.strictEqual(categoryItem.type, 'category');
    assert.notStrictEqual(categoryItem.iconPath, undefined);
  });

  test('loading items have loading icon', () => {
    const loadingItem = new MetadataTreeItem('Loading...', 'loading');
    assert.strictEqual(loadingItem.type, 'loading');
    assert.notStrictEqual(loadingItem.iconPath, undefined);
  });
});
