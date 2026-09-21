import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SigridConfiguration } from './services/sigrid-configuration';
import { FindingSelection } from './services/finding-selection';
import { SigridDialog } from './shared/dialog/sigrid-dialog';
import { JiraIssueDialog } from './shared/jira-issue-dialog/jira-issue-dialog';
import { VsCommandRegistry } from './commands/vs-command-registry';
import { WebviewMessage } from './models/webview-message';

describe('App', () => {
  const sigridConfiguration = {
    isConfigurationValid: signal(true),
    isJiraConfigured: signal(false),
  };

  const findingSelectionService = {
    selectedCount: signal(0),
  };

  const dialog = {
    open: vi.fn(),
  };

  const commandRegistry = {
    execute: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    sigridConfiguration.isConfigurationValid.set(true);
    sigridConfiguration.isJiraConfigured.set(false);
    findingSelectionService.selectedCount.set(0);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: SigridConfiguration, useValue: sigridConfiguration },
        { provide: FindingSelection, useValue: findingSelectionService },
        { provide: SigridDialog, useValue: dialog },
        { provide: VsCommandRegistry, useValue: commandRegistry },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('does not open Jira issue dialog when Jira is not configured', () => {
    findingSelectionService.selectedCount.set(1);
    const fixture = TestBed.createComponent(App);

    fixture.componentInstance['onCreateJiraIssue']();

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('does not open Jira issue dialog when no findings are selected', () => {
    sigridConfiguration.isJiraConfigured.set(true);
    findingSelectionService.selectedCount.set(0);
    const fixture = TestBed.createComponent(App);

    fixture.componentInstance['onCreateJiraIssue']();

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens Jira issue dialog when Jira is configured and findings are selected', () => {
    sigridConfiguration.isJiraConfigured.set(true);
    findingSelectionService.selectedCount.set(2);
    const fixture = TestBed.createComponent(App);

    fixture.componentInstance['onCreateJiraIssue']();

    expect(dialog.open).toHaveBeenCalledWith(JiraIssueDialog);
  });

  it('dispatches to the command registry for a same-origin, well-formed message', () => {
    const fixture = TestBed.createComponent(App);
    const message = new MessageEvent('message', {
      data: { command: 'activeEditorChanged', data: { filePath: 'foo.ts' } },
      origin: window.origin,
    });

    fixture.componentInstance.onMessageReceived(message);

    expect(commandRegistry.execute).toHaveBeenCalledWith('activeEditorChanged', { filePath: 'foo.ts' });
  });

  it('ignores messages from a different origin', () => {
    const fixture = TestBed.createComponent(App);
    const message = new MessageEvent('message', {
      data: { command: 'activeEditorChanged', data: {} },
      origin: 'https://evil.example',
    });

    fixture.componentInstance.onMessageReceived(message);

    expect(commandRegistry.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['null data', null],
    ['non-object data', 'not-an-object'],
    ['missing command', { data: {} }],
    ['non-string command', { command: 123, data: {} }],
  ])('ignores malformed messages: %s', (_description, data) => {
    const fixture = TestBed.createComponent(App);
    const message = new MessageEvent('message', { data, origin: window.origin }) as MessageEvent<WebviewMessage>;

    fixture.componentInstance.onMessageReceived(message);

    expect(commandRegistry.execute).not.toHaveBeenCalled();
  });
});
