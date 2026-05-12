import {VsCommandHandler} from './vs-command-handler';
import {AppResource} from '../services/app-resource.service';

export class WebviewBaseUriCommand implements VsCommandHandler<string>{
  constructor(private appResource: AppResource) {
  }

  execute(payload: string): void {
    this.appResource.setWebviewBaseUri(payload);
  }
}
