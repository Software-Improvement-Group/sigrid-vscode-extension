import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { JiraIssueDialog } from './jira-issue-dialog';
import { DialogRef } from '../dialog/dialog-ref';
import { FindingSelection } from '../../services/finding-selection';
import { VsCode } from '../../services/vs-code';
import { SigridConfiguration } from '../../services/sigrid-configuration';
import { SIGRID_DEFAULT_URL } from '../../utilities/constants';

describe('JiraIssueDialog', () => {
  let fixture: ComponentFixture<JiraIssueDialog>;
  let component: JiraIssueDialog;

  const dialogRef = {
    close: vi.fn(),
  };

  const selectionService = {
    selectedCount: signal(2),
    getAll: vi.fn(),
    clear: vi.fn(),
  };

  const vscode = {
    createJiraIssue: vi.fn(),
  };

  const sigridConfiguration = {
    getConfigurationOrEmpty: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    selectionService.getAll.mockReturnValue([
      {
        id: 'maintainability-1',
        category: 'maintainability',
        title: 'Large method',
        severity: 'high',
        fileLocations: [
          {
            filePath: 'src/app/example.ts',
            startLine: 42,
            endLine: 50,
          },
        ],
      },
      {
        id: 'security-1',
        category: 'security',
        title: 'SQL injection',
        severity: 'critical',
        fileLocations: [
          {
            filePath: 'src/app/security.ts',
            startLine: 12,
            endLine: 12,
          },
        ],
      },
    ]);

    sigridConfiguration.getConfigurationOrEmpty.mockReturnValue({
      apiKey: 'api-key',
      customer: 'customer',
      system: 'system',
      subsystem: '',
      sigridUrl: 'https://sigrid.example.com',
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    });

    await TestBed.configureTestingModule({
      imports: [JiraIssueDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: FindingSelection, useValue: selectionService },
        { provide: VsCode, useValue: vscode },
        { provide: SigridConfiguration, useValue: sigridConfiguration },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JiraIssueDialog);
    component = fixture.componentInstance;
  });

  it('should create the dialog', () => {
    expect(component).toBeTruthy();
  });

  it('does not create a Jira issue when the form is invalid', () => {
    component['onSubmit']();

    expect(vscode.createJiraIssue).not.toHaveBeenCalled();
    expect(selectionService.clear).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('creates a Jira issue from selected findings and closes the dialog', () => {
    component['jiraForm'].controls.title.setValue('Investigate selected Sigrid findings');

    component['onSubmit']();

    expect(vscode.createJiraIssue).toHaveBeenCalledWith({
      title: 'Investigate selected Sigrid findings',
      sigridUrl: 'https://sigrid.example.com/customer/system',
      findings: [
        {
          emoji: '🔴',
          title: 'Large method',
          fileLocations: [
            {
              filePath: 'src/app/example.ts',
              startLine: 42,
            },
          ],
        },
        {
          emoji: '🔴',
          title: 'SQL injection',
          fileLocations: [
            {
              filePath: 'src/app/security.ts',
              startLine: 12,
            },
          ],
        },
      ],
    });
    expect(selectionService.clear).toHaveBeenCalledOnce();
    expect(dialogRef.close).toHaveBeenCalledOnce();
  });

  it('uses the default Sigrid URL when the configured Sigrid URL is empty', () => {
    sigridConfiguration.getConfigurationOrEmpty.mockReturnValue({
      apiKey: 'api-key',
      customer: 'customer',
      system: 'system',
      subsystem: '',
      sigridUrl: '',
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    });
    selectionService.getAll.mockReturnValue([
      {
        id: 'medium-1',
        category: 'maintainability',
        title: 'Duplicated code',
        severity: 'medium',
        fileLocations: [],
      },
    ]);
    component['jiraForm'].controls.title.setValue('Create issue');

    component['onSubmit']();

    expect(vscode.createJiraIssue).toHaveBeenCalledWith({
      title: 'Create issue',
      sigridUrl: `${SIGRID_DEFAULT_URL}/customer/system`,
      findings: [
        {
          emoji: '🟠',
          title: 'Duplicated code',
          fileLocations: [],
        },
      ],
    });
  });

  it('closes the dialog without creating a Jira issue', () => {
    component['close']();

    expect(dialogRef.close).toHaveBeenCalledOnce();
    expect(vscode.createJiraIssue).not.toHaveBeenCalled();
  });
});
