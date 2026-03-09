import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ExternalLink} from './external-link';
import {VsCode} from '../../services/vs-code';
import {vi} from 'vitest';

describe('ExternalLink', () => {
  let component: ExternalLink;
  let fixture: ComponentFixture<ExternalLink>;
  let vsCodeMock: { openUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vsCodeMock = {
      openUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ExternalLink],
      providers: [
        {provide: VsCode, useValue: vsCodeMock},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalLink);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('href', 'https://example.com/finding');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the default tooltip text when no tooltip input is provided', () => {
    expect(component.tooltip()).toBe('Open finding in Sigrid');
  });

  it('calls VsCode.openUrl with the href when openLink is invoked', () => {
    (component as any).openLink();

    expect(vsCodeMock.openUrl).toHaveBeenCalledTimes(1);
    expect(vsCodeMock.openUrl).toHaveBeenCalledWith('https://example.com/finding');
  });

  it('uses a custom tooltip input when provided', () => {
    fixture.componentRef.setInput('tooltip', 'Open external page');
    fixture.detectChanges();

    expect(component.tooltip()).toBe('Open external page');
  });
});
