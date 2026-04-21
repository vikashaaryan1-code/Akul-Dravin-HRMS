import { CareerGrowthService } from './career-growth.service';
import { CareerGrowthController } from './career-growth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CareerGrowthEntity])],
  controllers: [CareerGrowthController],
  providers: [CareerGrowthService],
  exports: [CareerGrowthService],
})
export class CareerGrowthModule {}
