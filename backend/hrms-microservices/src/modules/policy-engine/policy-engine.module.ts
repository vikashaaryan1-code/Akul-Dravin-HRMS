import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyDefinitionEntity } from './entities/policy.entity';
import { PolicyAuditEntity } from './entities/policy-audit.entity';
import { RuleEvaluatorService } from './evaluator/rule-evaluator.service';
import { PolicyAuditService } from './audit/policy-audit.service';
import { PolicyEngineController } from './policy-engine.controller';
import { PolicyResolverService } from './resolver/policy-resolver.service';
import { ExecutionGatekeeperService } from './gatekeeper/execution-gatekeeper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyDefinitionEntity, PolicyAuditEntity]),
  ],
  controllers: [PolicyEngineController],
  providers: [
    PolicyResolverService,
    ExecutionGatekeeperService,
    RuleEvaluatorService,
    PolicyAuditService,
  ],
  exports: [
    PolicyResolverService,
    ExecutionGatekeeperService,
    PolicyAuditService,
  ],
})
export class PolicyEngineModule {}

