import {VsCommandType} from './vs-command-type';

export class VsCommand<T> {
  command: VsCommandType;
  data?: T;

  constructor(command: VsCommandType, data?: T) {
    this.command = command;
    this.data = data;
  }
}
