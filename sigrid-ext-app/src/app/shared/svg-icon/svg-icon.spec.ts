import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DomSanitizer} from '@angular/platform-browser';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SvgIcon} from './svg-icon';
import {AppResource} from '../../services/app-resource';

describe('SvgIcon', () => {
  let fixture: ComponentFixture<SvgIcon>;
  let component: SvgIcon;

  const appResource = {
    loadSvgContent: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SvgIcon],
      providers: [
        {provide: AppResource, useValue: appResource},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SvgIcon);
    component = fixture.componentInstance;
  });

  async function setIconName(iconName: string): Promise<void> {
    fixture.componentRef.setInput('iconName', iconName);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function getIconEl(): HTMLSpanElement {
    const el = fixture.nativeElement.querySelector('span.svg-icon') as HTMLSpanElement | null;
    expect(el).not.toBeNull();
    return el!;
  }

  it('should create', async () => {
    appResource.loadSvgContent.mockResolvedValue('');

    await setIconName('jira');

    expect(component).toBeTruthy();
  });

  it('loads the requested SVG and renders it as sanitized HTML', async () => {
    const svgContent = '<svg><path d="M1 2"></path></svg>';
    appResource.loadSvgContent.mockResolvedValue(svgContent);

    await setIconName('jira');

    expect(appResource.loadSvgContent).toHaveBeenCalledWith('jira.svg');
    expect(getIconEl().innerHTML).toContain('<svg>');
    expect(getIconEl().innerHTML).toContain('<path d="M1 2"></path>');
  });

  it('sanitizes the loaded SVG before storing it', async () => {
    const svgContent = '<svg><circle cx="1" cy="2" r="3"></circle></svg>';
    appResource.loadSvgContent.mockResolvedValue(svgContent);
    const sanitizer = TestBed.inject(DomSanitizer);
    const bypassSecurityTrustHtml = vi.spyOn(sanitizer, 'bypassSecurityTrustHtml');

    await setIconName('sigrid-light');

    expect(bypassSecurityTrustHtml).toHaveBeenCalledWith(svgContent);
    expect(component.svgHtml()).toBe(bypassSecurityTrustHtml.mock.results[0].value);
  });

  it('clears the rendered icon and does not load SVG content when iconName is empty', async () => {
    appResource.loadSvgContent.mockResolvedValue('<svg></svg>');

    await setIconName('');

    expect(appResource.loadSvgContent).not.toHaveBeenCalled();
    expect(component.svgHtml()).toBe('');
    expect(getIconEl().innerHTML).toBe('');
  });

  it('does not update the rendered icon when no SVG content is returned', async () => {
    appResource.loadSvgContent.mockResolvedValue('');

    await setIconName('missing-icon');

    expect(appResource.loadSvgContent).toHaveBeenCalledWith('missing-icon.svg');
    expect(component.svgHtml()).toBe('');
    expect(getIconEl().innerHTML).toBe('');
  });

  it('loads a new SVG when iconName changes', async () => {
    appResource.loadSvgContent
      .mockResolvedValueOnce('<svg id="jira"></svg>')
      .mockResolvedValueOnce('<svg id="sigrid"></svg>');

    await setIconName('jira');
    await setIconName('sigrid-light');

    expect(appResource.loadSvgContent).toHaveBeenNthCalledWith(1, 'jira.svg');
    expect(appResource.loadSvgContent).toHaveBeenNthCalledWith(2, 'sigrid-light.svg');
    expect(getIconEl().innerHTML).toContain('id="sigrid"');
  });
});
