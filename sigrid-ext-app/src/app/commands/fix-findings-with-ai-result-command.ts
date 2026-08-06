import {VsCommandHandler} from './vs-command-handler';
import {FixWithAi} from '../services/fix-with-ai';
import {FixFindingsWithAiResult} from '../models/fix-findings-with-ai-result';

export class FixFindingsWithAiResultCommand implements VsCommandHandler<FixFindingsWithAiResult> {
  constructor(private fixWithAi: FixWithAi) {
  }

  execute(payload: FixFindingsWithAiResult): void {
    this.fixWithAi.onHandoffResult(payload.success);
  }
}
