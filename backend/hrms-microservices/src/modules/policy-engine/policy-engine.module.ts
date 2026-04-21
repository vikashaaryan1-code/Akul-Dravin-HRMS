import { RuleEvaluatorService } from './evaluator/rule-evaluator.service';
import { PolicyAuditService } from './audit/policy-audit.service';
import { PolicyEngineController } from './policy-engine.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyDefinitionEntity, PolicyAuditEntity]),
  ],
  controllers: [PolicyEngineController],
  providers: [
    PolicyResolverService,
    PolicyValidatorService,
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
