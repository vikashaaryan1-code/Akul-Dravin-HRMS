import { Injectable } from '@nestjs/common';

/**
 * GOVERNANCE CLOCK SERVICE — Phase BB
 * 
 * Provides a stable time source for the coordination kernel. 
 * Essential for deterministic replay of time-sensitive logic 
 * (EMA, Starvation, Cooldowns).
 */
@Injectable()
export abstract class GovernanceClock {
  abstract now(): number;
}

@Injectable()
export class SystemGovernanceClock extends GovernanceClock {
  now(): number {
    return Date.now();
  }
}

/**
 * A manual clock used during historical replay to inject the 
 * "Original Incident Time" into the deterministic sandbox.
 */
@Injectable()
export class ManualGovernanceClock extends GovernanceClock {
  private currentTime: number = 0;

  setCurrentTime(time: number | string) {
    this.currentTime = typeof time === 'string' ? new Date(time).getTime() : time;
  }

  now(): number {
    return this.currentTime;
  }
}
