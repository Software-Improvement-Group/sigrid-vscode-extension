import {ComponentFixture, TestBed} from '@angular/core/testing';
import {describe, expect, it, beforeEach} from 'vitest';
import {SeverityIcon} from './severity-icon';
import {RiskSeverity} from '../../models/risk-severity';

describe('SeverityIcon', () => {
  let fixture: ComponentFixture<SeverityIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeverityIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(SeverityIcon);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function getCircleEl(): HTMLSpanElement {
    const el = fixture.nativeElement.querySelector('span.circle') as HTMLSpanElement | null;
    expect(el).not.toBeNull();
    return el!;
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render only the base "circle" class for Unknown severity (default)', async () => {
    const circle = getCircleEl();
    expect(circle.classList.contains('circle')).toBe(true);

    // Unknown maps to '' => no extra severity class should be present
    expect(circle.classList.contains('none')).toBe(false);
    expect(circle.classList.contains('low')).toBe(false);
    expect(circle.classList.contains('information')).toBe(false);
    expect(circle.classList.contains('medium')).toBe(false);
    expect(circle.classList.contains('high')).toBe(false);
    expect(circle.classList.contains('critical')).toBe(false);
  });

  it('should apply the correct severity class when input changes', async () => {
    const cases: Array<[RiskSeverity, string]> = [
      [RiskSeverity.None, 'none'],
      [RiskSeverity.Low, 'low'],
      [RiskSeverity.Information, 'information'],
      [RiskSeverity.Medium, 'medium'],
      [RiskSeverity.High, 'high'],
      [RiskSeverity.Critical, 'critical'],
      [RiskSeverity.Unknown, ''], // explicitly assert "no class"
    ];

    for (const [severity, expectedClass] of cases) {
      fixture.componentRef.setInput('severity', severity);
      fixture.detectChanges();
      await fixture.whenStable();

      const circle = getCircleEl();

      expect(circle.classList.contains('circle')).toBe(true);

      const allSeverityClasses = ['none', 'low', 'information', 'medium', 'high', 'critical'];
      for (const css of allSeverityClasses) {
        const shouldHave = expectedClass === css;
        expect(circle.classList.contains(css)).toBe(shouldHave);
      }
    }
  });
});
