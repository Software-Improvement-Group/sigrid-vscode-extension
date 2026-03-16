import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Subject, throwError} from 'rxjs';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {FindingEdit} from './finding-edit';
import {SigridApi} from '../../services/sigrid-api';
import {DialogRef} from '../dialog/dialog-ref';
import {VsCode} from '../../services/vs-code';
import {SecurityFinding} from '../../models/security-finding';
import {RefactoringCandidate} from '../../models/refactoring-candidate';
import {FindingStatus, MaintainabilityFindingStatus} from '../../models/finding-status';
import {VsMessageSeverity} from '../../models/vs-message-data';

describe('FindingEdit', () => {
  let fixture: ComponentFixture<FindingEdit>;
  let component: FindingEdit;

  const editFinding = vi.fn();
  const close = vi.fn();
  const showMessage = vi.fn();

  beforeEach(async () => {
    editFinding.mockReset();
    close.mockReset();
    showMessage.mockReset();

    await TestBed.configureTestingModule({
      imports: [FindingEdit],
      providers: [
        {provide: SigridApi, useValue: {editFinding}},
        {provide: DialogRef, useValue: {close}},
        {provide: VsCode, useValue: {showMessage}},
      ],
    }).compileComponents();
  });

  function createSecurityFinding(): SecurityFinding {
    const finding = new SecurityFinding();
    finding.id = 'security-1';
    finding.status = FindingStatus.WillFix;
    return finding;
  }

  function createRefactoringCandidate(): RefactoringCandidate {
    const finding = new RefactoringCandidate();
    finding.id = 'maint-1';
    finding.status = MaintainabilityFindingStatus.Accepted;
    return finding;
  }

  function createComponentWithFinding(finding: SecurityFinding | RefactoringCandidate) {
    fixture = TestBed.createComponent(FindingEdit);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('finding', finding);
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponentWithFinding(createSecurityFinding());

    expect(component).toBeTruthy();
  });

  it('initializes the form status from the finding on init', () => {
    const finding = createSecurityFinding();

    createComponentWithFinding(finding);

    expect(component['findingEditForm'].controls.status.value).toBe(FindingStatus.WillFix);
    expect(component['findingEditForm'].controls.remark.value).toBe('');
  });

  it('renders security finding status options with sentence-case labels', () => {
    createComponentWithFinding(createSecurityFinding());

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('select option')
    ) as HTMLOptionElement[];

    const values = options.map(option => option.value);
    const labels = options.map(option => option.textContent?.trim());

    expect(values).toEqual(Object.values(FindingStatus));
    expect(labels).toEqual([
      'Raw',
      'Refined',
      'Will fix',
      'Fixed',
      'Accepted',
      'False positive',
    ]);
  });

  it('renders refactoring candidate status options with maintainability statuses only', () => {
    createComponentWithFinding(createRefactoringCandidate());

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('select option')
    ) as HTMLOptionElement[];

    const values = options.map(option => option.value);
    const labels = options.map(option => option.textContent?.trim());

    expect(values).toEqual(Object.values(MaintainabilityFindingStatus));
    expect(labels).toEqual([
      'Raw',
      'Will fix',
      'Accepted',
    ]);
  });

  it('disables save button when status is empty and enables it when valid', () => {
    createComponentWithFinding(createSecurityFinding());

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);

    component['findingEditForm'].controls.status.setValue('');
    fixture.detectChanges();

    expect(component['findingEditForm'].valid).toBe(false);
    expect(saveButton.disabled).toBe(true);

    component['findingEditForm'].controls.status.setValue(FindingStatus.Fixed);
    fixture.detectChanges();

    expect(component['findingEditForm'].valid).toBe(true);
    expect(saveButton.disabled).toBe(false);
  });

  it('does not call the API when the form is invalid', () => {
    createComponentWithFinding(createSecurityFinding());

    component['findingEditForm'].controls.status.setValue('');
    expect(component['findingEditForm'].valid).toBe(false);

    component['onSave']();

    expect(editFinding).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('calls the API with the edited values and closes the dialog on success', () => {
    const success$ = new Subject<void>();
    editFinding.mockReturnValue(success$.asObservable());

    createComponentWithFinding(createSecurityFinding());

    component['findingEditForm'].controls.status.setValue(FindingStatus.Fixed);
    component['findingEditForm'].controls.remark.setValue('Done');

    component['onSave']();

    expect(editFinding).toHaveBeenCalledTimes(1);
    expect(editFinding).toHaveBeenCalledWith('security-1', {
      status: FindingStatus.Fixed,
      remark: 'Done',
    });
    expect(close).not.toHaveBeenCalled();
    expect(showMessage).not.toHaveBeenCalled();

    success$.next();
    success$.complete();

    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith({
      id: 'security-1',
      status: FindingStatus.Fixed,
      remark: 'Done',
    });
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('passes undefined remark to the API when the remark control value is null', () => {
    const success$ = new Subject<void>();
    editFinding.mockReturnValue(success$.asObservable());

    createComponentWithFinding(createSecurityFinding());

    component['findingEditForm'].controls.status.setValue(FindingStatus.Accepted);
    component['findingEditForm'].controls.remark.setValue(null);

    component['onSave']();

    expect(editFinding).toHaveBeenCalledWith('security-1', {
      status: FindingStatus.Accepted,
      remark: undefined,
    });
    expect(showMessage).not.toHaveBeenCalled();

    success$.next();
    success$.complete();

    expect(close).toHaveBeenCalledWith({
      id: 'security-1',
      status: FindingStatus.Accepted,
      remark: null,
    });
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('logs an error, shows an error message, and does not close the dialog when saving fails', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('save failed');
    editFinding.mockReturnValue(throwError(() => error));

    createComponentWithFinding(createSecurityFinding());

    component['findingEditForm'].controls.status.setValue(FindingStatus.Fixed);
    component['findingEditForm'].controls.remark.setValue('Needs retry');

    component['onSave']();

    expect(editFinding).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('Error updating finding:', error);
    expect(showMessage).toHaveBeenCalledTimes(1);
    expect(showMessage).toHaveBeenCalledWith(
      'Error occurred while updating finding.',
      VsMessageSeverity.Error,
    );

    errorSpy.mockRestore();
  });

  it('closes the dialog when the close icon button emits onClick', () => {
    createComponentWithFinding(createSecurityFinding());

    const iconButton = fixture.debugElement.query(By.css('sigrid-icon-button'));
    iconButton.triggerEventHandler('onClick', undefined);

    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith();
  });
});
