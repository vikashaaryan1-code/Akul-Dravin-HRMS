import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceListingEntity } from '../../database/entities/marketplace-listing.entity';
import { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(MarketplaceListingEntity)
    private readonly listingRepository: Repository<MarketplaceListingEntity>,
  ) {}

  findAll(): Promise<MarketplaceListingEntity[]> {
    return this.listingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<MarketplaceListingEntity> {
    const listing = await this.listingRepository.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Marketplace listing not found: ${id}`);
    }
    return listing;
  }

  create(dto: CreateMarketplaceListingDto): Promise<MarketplaceListingEntity> {
    const entity = this.listingRepository.create({
      tenantId: dto.tenantId ?? null,
      jobId: dto.jobId,
      listingType: dto.listingType ?? 'job',
      visibility: dto.visibility ?? 'public',
      sourceService: dto.sourceService ?? 'job-marketplace',
      metadata: dto.metadata ?? {},
      status: 'active',
    });
    this.logger.log(`Creating marketplace listing for job=${dto.jobId}`);
    return this.listingRepository.save(entity);
  }

  async update(id: string, dto: UpdateMarketplaceListingDto): Promise<MarketplaceListingEntity> {
    const listing = await this.findOne(id);

    listing.visibility = dto.visibility ?? listing.visibility;
    listing.status = dto.status ?? listing.status;
    listing.sourceService = dto.sourceService ?? listing.sourceService;
    listing.metadata = dto.metadata ?? listing.metadata;

    this.logger.log(`Updating marketplace listing id=${id}`);
    await this.listingRepository.save(listing);
    return this.findOne(id);
  }
}
