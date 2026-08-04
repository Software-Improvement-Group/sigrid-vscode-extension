import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FixWithAi} from './fix-with-ai';
import {AiAgents} from './ai-agents';
import {VsCode} from './vs-code';
import {PopupMenuService} from './popup-menu-service';
import {SelectedFinding} from '../models/selected-finding';
import {MenuItem} from '../shared/popup-menu/menu-item';

describe('FixWithAi', () => {
  let service: FixWithAi;
  let aiAgents: AiAgents;
  let fixFindingsWithAi: ReturnType<typeof vi.fn>;
  let openMenu: ReturnType<typeof vi.fn>;

  const finding: SelectedFinding = {
    id: 'maintainability-1',
    category: 'Maintainability',
    title: 'Long method',
    severity: 'HIGH',
    fileLocations: [{filePath: 'src/app/example.ts', startLine: 10, endLine: 20, component: 'component-1'}],
  };

  const claudeCode = {id: 'claude-code', label: 'Claude Code', mcpDetected: true};
  const copilot = {id: 'copilot', label: 'GitHub Copilot', mcpDetected: false};

  beforeEach(() => {
    fixFindingsWithAi = vi.fn();
    openMenu = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {provide: VsCode, useValue: {fixFindingsWithAi}},
        {provide: PopupMenuService, useValue: {open: openMenu, close: vi.fn()}},
      ],
    });

    service = TestBed.inject(FixWithAi);
    aiAgents = TestBed.inject(AiAgents);
  });

  it('is unavailable until the host reports an agent', () => {
    expect(service.isAvailable()).toBe(false);

    aiAgents.setAgents([claudeCode]);

    expect(service.isAvailable()).toBe(true);
  });

  it('hands off directly when a single agent is installed', () => {
    aiAgents.setAgents([claudeCode]);

    service.fix([finding]);

    expect(fixFindingsWithAi).toHaveBeenCalledWith({agentId: 'claude-code', findings: [finding]});
    expect(openMenu).not.toHaveBeenCalled();
  });

  it('asks which agent to use when several are installed', () => {
    aiAgents.setAgents([claudeCode, copilot]);

    service.fix([finding]);

    expect(fixFindingsWithAi).not.toHaveBeenCalled();
    const items: MenuItem[] = openMenu.mock.calls[0][0];
    expect(items.map(item => item.label)).toEqual(['Fix with Claude Code', 'Fix with GitHub Copilot']);
    expect(items[0].description).toBe('Sigrid MCP detected');
    expect(items[1].description).toBeUndefined();

    items[1].action();

    expect(fixFindingsWithAi).toHaveBeenCalledWith({agentId: 'copilot', findings: [finding]});
  });

  it('notifies the caller only once the findings have been handed off', () => {
    aiAgents.setAgents([claudeCode, copilot]);
    const onHandoff = vi.fn();

    service.fix([finding], onHandoff);
    expect(onHandoff).not.toHaveBeenCalled();

    const items: MenuItem[] = openMenu.mock.calls[0][0];
    items[0].action();

    expect(onHandoff).toHaveBeenCalledOnce();
  });

  it('does nothing without findings or without an agent', () => {
    aiAgents.setAgents([claudeCode]);
    service.fix([]);

    aiAgents.setAgents([]);
    service.fix([finding]);

    expect(fixFindingsWithAi).not.toHaveBeenCalled();
    expect(openMenu).not.toHaveBeenCalled();
  });
});
