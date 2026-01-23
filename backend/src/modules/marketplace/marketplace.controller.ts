import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto, UpdateListingDto, ListingQueryDto } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('marketplace')
@Controller('api/marketplace/listings')
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) { }

    @Get()
    @ApiOperation({ summary: 'Get marketplace listings' })
    @ApiResponse({ status: 200, description: 'Returns list of listings' })
    async findAll(@Query() query: ListingQueryDto) {
        return this.marketplaceService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a listing by ID' })
    @ApiParam({ name: 'id', description: 'Listing ID' })
    @ApiResponse({ status: 200, description: 'Returns the listing' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    async findById(@Param('id') id: string) {
        return this.marketplaceService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new listing' })
    @ApiResponse({ status: 201, description: 'Listing created' })
    async create(
        @Body() dto: CreateListingDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.marketplaceService.create(dto, user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update a listing' })
    @ApiParam({ name: 'id', description: 'Listing ID' })
    @ApiResponse({ status: 200, description: 'Listing updated' })
    @ApiResponse({ status: 403, description: 'Not authorized' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateListingDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.marketplaceService.update(id, dto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete a listing' })
    @ApiParam({ name: 'id', description: 'Listing ID' })
    @ApiResponse({ status: 200, description: 'Listing deleted' })
    @ApiResponse({ status: 403, description: 'Not authorized' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.marketplaceService.delete(id, user.id);
        return { message: 'Listing deleted successfully' };
    }
}
