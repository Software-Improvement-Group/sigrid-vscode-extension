import {VsCommandHandler} from './vs-command-handler';
import {SigridApiTransport} from '../services/sigrid-api-transport';
import {SigridApiResponseData} from '../models/sigrid-api-message';

export class SigridApiResponseCommand implements VsCommandHandler<SigridApiResponseData> {
  constructor(private transport: SigridApiTransport) {
  }

  execute(payload: SigridApiResponseData): void {
    this.transport.onResponse(payload);
  }
}
