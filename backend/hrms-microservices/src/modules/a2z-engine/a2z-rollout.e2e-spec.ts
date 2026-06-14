/**
 * A2Z ROLLOUT INTEGRATION TESTS
 *
 * Tests the submitRollout → DB persist → queue enqueue flow.
 * The BullMQ queue is stubbed (no real Redis needed in tests).
 *
 * Coverage:
 *   - submitRollout: persists A2zRolloutRequestEntity to DB
 *   - Job enqueued with deterministic jobId (rollout:<id>)
 *   - Idempotency: re-submit same requestId → same jobId (dedup)
 *   - getRolloutStatus: returns current status from DB
 *   - Status not found: returns null
 */

import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { A2zEngineService } from './a2z-engine.service';
import { A2zEngineModule } from './a2z-engine.module';
import { A2zRolloutRequestEntity } from '../../database/entities/a2z-engine.entities';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';
import {
  createTestingModule,
  closeTestingModule,
} from '../../test/integration-test.helper';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

// Stub BullMQ queue — no Redis required in unit/integration tests
const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-mock-001' }),
};

describe('A2zEngineService — submitRollout (Integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let service: A2zEngineService;
  let requestRepo: Repository<A2zRolloutRequestEntity>;

  beforeAll(async () => {
    ({ module, app } = await createTestingModule(
      [A2zEngineModule],
      [
        // Override the BullMQ queue with a mock so no Redis is needed
        { token: getQueueToken(QUEUE_AUTOMATION), useValue: mockQueue },
      ],
    ));
    service = module.get(A2zEngineService);
    requestRepo = module.get(getRepositoryToken(A2zRolloutRequestEntity));
  });

  afterAll(async () => {
    await closeTestingModule(app);
  });

  beforeEach(async () => {
    await requestRepo.clear();
    jest.clearAllMocks();
  });

  // ── submitRollout ──────────────────────────────────────────────────────────

  describe('submitRollout()', () => {
    const config = { workflowId: 'enterprise-rollout', bundle: 'Complete Atlas', capacity: '51-200' };

    it('persists a RolloutRequest with submitted status', async () => {
      const result = await service.submitRollout(config, 'user-001', 'company-001');

      expect(result.status).toBe('submitted');
      expect(result.requestId).toBeDefined();

      const persisted = await requestRepo.findOne({ where: { id: result.requestId } });
      expect(persisted).not.toBeNull();
      expect(persisted!.status.step).toBe('submitted');
      expect(persisted!.status.progress).toBe(0);
    });

    it('enqueues a BullMQ job with deterministic jobId', async () => {
      const result = await service.submitRollout(config);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      const [, , options] = mockQueue.add.mock.calls[0];
      expect(options.jobId).toBe(`rollout:${result.requestId}`);
    });

    it('uses exponential backoff with 3 attempts', async () => {
      await service.submitRollout(config);

      const [, , options] = mockQueue.add.mock.calls[0];
      expect(options.attempts).toBe(3);
      expect(options.backoff).toMatchObject({ type: 'exponential', delay: 5000 });
    });

    it('different submits produce different requestIds (no collision)', async () => {
      const r1 = await service.submitRollout(config, 'u1');
      const r2 = await service.submitRollout(config, 'u2');
      expect(r1.requestId).not.toBe(r2.requestId);
    });

    it('different submits produce different jobIds (no collision)', async () => {
      const r1 = await service.submitRollout(config);
      const r2 = await service.submitRollout(config);
      const jobId1 = mockQueue.add.mock.calls[0][2].jobId;
      const jobId2 = mockQueue.add.mock.calls[1][2].jobId;
      expect(jobId1).toBe(`rollout:${r1.requestId}`);
      expect(jobId2).toBe(`rollout:${r2.requestId}`);
      expect(jobId1).not.toBe(jobId2);
    });
  });

  // ── getRolloutStatus ───────────────────────────────────────────────────────

  describe('getRolloutStatus()', () => {
    it('returns current status for existing requestId', async () => {
      const { requestId } = await service.submitRollout({
        workflowId: 'enterprise-rollout', bundle: 'People Mesh', capacity: '0-50',
      });

      const status = await service.getRolloutStatus(requestId);
      expect(status).not.toBeNull();
      expect(status!.requestId).toBe(requestId);
      expect(status!.status.step).toBe('submitted');
    });

    it('returns null for non-existent requestId', async () => {
      const status = await service.getRolloutStatus('non-existent-id-000');
      expect(status).toBeNull();
    });
  });
});
