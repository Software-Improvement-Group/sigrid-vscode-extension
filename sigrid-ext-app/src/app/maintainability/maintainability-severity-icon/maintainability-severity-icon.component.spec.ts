import {ComponentFixture, TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it} from 'vitest';
import {MaintainabilitySeverityIcon} from './maintainability-severity-icon.component';
import {MaintainabilitySeverity} from '../../models/maintainability-severity';

describe('MaintainabilitySeverityIcon', () => {
  let fixture: ComponentFixture<MaintainabilitySeverityIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintainabilitySeverityIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintainabilitySeverityIcon);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function getCircle(): HTMLSpanElement {
    const el = fixture.nativeElement.querySelector('span.circle') as HTMLSpanElement | null;
    expect(el).not.toBeNull();
    return el!;
  }

  function expectNoSeverityClass(circle: HTMLSpanElement) {
    const severityClasses = ['low', 'medium', 'high', 'critical'];
    for (const cls of severityClasses) {
      expect(circle.classList.contains(cls)).toBe(false);
    }
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have no additional class by default (Unknown)', () => {
    const circle = getCircle();
    expect(circle.classList.contains('circle')).toBe(true);
    expectNoSeverityClass(circle);
  });

  it('should apply the correct CSS class for each severity', async () => {
    const cases: Array<[MaintainabilitySeverity, string]> = [
      [MaintainabilitySeverity.Low, 'low'],
      [MaintainabilitySeverity.Moderate, 'medium'],
      [MaintainabilitySeverity.Medium, 'medium'],
      [MaintainabilitySeverity.High, 'high'],
      [MaintainabilitySeverity.VeryHigh, 'critical'],
      [MaintainabilitySeverity.Unknown, ''], // no extra class
    ];

    for (const [severity, expected] of cases) {
      fixture.componentRef.setInput('severity', severity);
      fixture.detectChanges();
      await fixture.whenStable();

      const circle = getCircle();
      expect(circle.classList.contains('circle')).toBe(true);

      if (expected === '') {
        expectNoSeverityClass(circle);
        continue;
      }

      for (const cls of ['low', 'medium', 'high', 'critical']) {
        expect(circle.classList.contains(cls)).toBe(cls === expected);
      }
    }
  });
});
