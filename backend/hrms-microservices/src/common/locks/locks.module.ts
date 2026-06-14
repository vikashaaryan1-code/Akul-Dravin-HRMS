import { Global, Module } from '@nestjs/common';
import { RedlockService } from './redlock.service';

/**
 * LocksModule — globally available distributed lock primitive.
 *
 * @Global() means any module can inject `RedlockService` without
 * importing `LocksModule` explicitly. Requires `RedisModule` to be
 * in scope (it is @Global already).
 */
@Global()
@Module({
  providers: [RedlockService],
  exports:   [RedlockService],
})
export class LocksModule {}
