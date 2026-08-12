import {computed, Injectable, signal} from '@angular/core';
import {AvailableAgent} from '../models/available-agent';

/** Holds the AI coding agents the extension host detected. */
@Injectable({
  providedIn: 'root',
})
export class AiAgents {
  private readonly _agents = signal<AvailableAgent[]>([]);

  readonly agents = this._agents.asReadonly();

  readonly hasAgents = computed(() => this._agents().length > 0);

  setAgents(agents: AvailableAgent[]) {
    this._agents.set(agents);
  }
}
