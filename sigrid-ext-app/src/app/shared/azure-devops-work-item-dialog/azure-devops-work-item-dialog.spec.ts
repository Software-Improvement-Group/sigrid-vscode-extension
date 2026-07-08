import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AzureDevOpsWorkItemDialog } from './azure-devops-work-item-dialog';
import { DialogRef } from '../dialog/dialog-ref';
import { FindingSelection } from '../../services/finding-selection';
import { VsCode } from '../../services/vs-code';
import { SigridConfiguration } from '../../services/sigrid-configuration';
import { AzureDevOpsWorkItemTypes } from '../../services/azure-devops-work-item-types';
import { SIGRID_DEFAULT_URL } from '../../utilities/constants';

describe('AzureDevOpsWorkItemDialog', () => {
  let fixture: ComponentFixture<AzureDevOpsWorkItemDialog>;
  let component: AzureDevOpsWorkItemDialog;

  const dialogRef = {
    close: vi.fn(),
  };

  const selectionService = {
    selectedCount: signal(1),
    getAll: vi.fn(),
    clear: vi.fn(),
  };

  const vscode = {
    createAzureDevOpsWorkItem: vi.fn(),
  };

  const sigridConfiguration = {
    getConfigurationOrEmpty: vi.fn(),
  };

  const workItemTypesService = {
    types: signal<string[] | null>(null),
    loading: signal(false),
    error: signal<string | null>(null),
    requestIfNeeded: vi.fn(),
    getLastSelectedType: vi.fn(),
    setLastSelectedType: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    workItemTypesService.types.set(null);
    workItemTypesService.loading.set(false);
    workItemTypesService.error.set(null);
    workItemTypesService.getLastSelectedType.mockReturnValue(null);

    selectionService.getAll.mockReturnValue([
      {
        id: 'security-1',
        category: 'security',
        title: 'SQL injection',
        severity: 'critical',
        fileLocations: [
          { filePath: 'src/app/security.ts', startLine: 12, endLine: 12 },
        ],
      },
    ]);

    sigridConfiguration.getConfigurationOrEmpty.mockReturnValue({
      apiKey: 'api-key',
      customer: 'customer',
      system: 'system',
      subsystem: '',
      sigridUrl: 'https://sigrid.example.com',
      azureDevOpsOrganizationUrl: 'https://dev.azure.com/myorg',
      azureDevOpsPersonalAccessToken: 'token',
      azureDevOpsProjectName: 'MyProject',
    });

    await TestBed.configureTestingModule({
      imports: [AzureDevOpsWorkItemDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: FindingSelection, useValue: selectionService },
        { provide: VsCode, useValue: vscode },
        { provide: SigridConfiguration, useValue: sigridConfiguration },
        { provide: AzureDevOpsWorkItemTypes, useValue: workItemTypesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AzureDevOpsWorkItemDialog);
    component = fixture.componentInstance;
  });

  it('should create the dialog and request work item types', () => {
    expect(component).toBeTruthy();
    expect(workItemTypesService.requestIfNeeded).toHaveBeenCalledWith('https://dev.azure.com/myorg', 'MyProject', 'token');
  });

  it('does not create a work item when the form is invalid', () => {
    component['onSubmit']();

    expect(vscode.createAzureDevOpsWorkItem).not.toHaveBeenCalled();
    expect(selectionService.clear).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('defaults the work item type to Task once types are loaded', () => {
    workItemTypesService.types.set(['Bug', 'Task', 'Issue']);
    TestBed.tick();

    expect(component['workItemForm'].controls.workItemType.value).toBe('Task');
  });

  it('defaults to the last selected type when it is still in the fetched list', () => {
    workItemTypesService.getLastSelectedType.mockReturnValue('Issue');
    workItemTypesService.types.set(['Bug', 'Task', 'Issue']);
    TestBed.tick();

    expect(component['workItemForm'].controls.workItemType.value).toBe('Issue');
  });

  it('falls back to the first type when neither the last selected type nor Task is available', () => {
    workItemTypesService.getLastSelectedType.mockReturnValue('Feature');
    workItemTypesService.types.set(['Bug', 'Issue']);
    TestBed.tick();

    expect(component['workItemForm'].controls.workItemType.value).toBe('Bug');
  });

  it('creates a work item from selected findings, remembers the type, and closes the dialog', () => {
    workItemTypesService.types.set(['Bug', 'Task']);
    TestBed.tick();
    component['workItemForm'].controls.title.setValue('Investigate SQL injection');

    component['onSubmit']();

    expect(vscode.createAzureDevOpsWorkItem).toHaveBeenCalledWith({
      title: 'Investigate SQL injection',
      workItemType: 'Task',
      sigridUrl: 'https://sigrid.example.com/customer/system',
      findings: [
        {
          emoji: '🔴',
          title: 'SQL injection',
          fileLocations: [
            { filePath: 'src/app/security.ts', startLine: 12 },
          ],
        },
      ],
    });
    expect(workItemTypesService.setLastSelectedType).toHaveBeenCalledWith('Task');
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
      azureDevOpsOrganizationUrl: 'https://dev.azure.com/myorg',
      azureDevOpsPersonalAccessToken: 'token',
      azureDevOpsProjectName: 'MyProject',
    });
    workItemTypesService.types.set(['Task']);
    TestBed.tick();
    component['workItemForm'].controls.title.setValue('Create work item');

    component['onSubmit']();

    expect(vscode.createAzureDevOpsWorkItem).toHaveBeenCalledWith(
      expect.objectContaining({ sigridUrl: `${SIGRID_DEFAULT_URL}/customer/system` })
    );
  });

  it('closes the dialog without creating a work item', () => {
    component['close']();

    expect(dialogRef.close).toHaveBeenCalledOnce();
    expect(vscode.createAzureDevOpsWorkItem).not.toHaveBeenCalled();
  });
});
