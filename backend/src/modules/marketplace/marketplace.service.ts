import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateListingDto, UpdateListingDto, ListingQueryDto } from './dto';

@Injectable()
export class MarketplaceService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Fetch listings with optional filters.
     */
    async findAll(query: ListingQueryDto) {
        const supabase = this.supabaseService.getAdminClient();
        const { category, search, limit = 20, offset = 0 } = query;

        let queryBuilder = supabase
            .from('marketplace_listings')
            .select(`
                *,
                seller:profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            queryBuilder = queryBuilder.eq('category', category);
        }

        if (search) {
            queryBuilder = queryBuilder.ilike('title', `%${search}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return data?.map(this.transformListing);
    }

    /**
     * Get a single listing by ID.
     */
    async findById(id: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('marketplace_listings')
            .select(`
                *,
                seller:profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url, email)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Listing not found');
            }
            throw error;
        }

        return this.transformListing(data);
    }

    /**
     * Create a new listing.
     */
    async create(dto: CreateListingDto, sellerId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('marketplace_listings')
            .insert({
                seller_id: sellerId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                price: dto.price,
                image_url: dto.imageUrl,
                location: dto.location,
                status: 'active',
            })
            .select(`
                *,
                seller:profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return this.transformListing(data);
    }

    /**
     * Update a listing.
     */
    async update(id: string, dto: UpdateListingDto, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: listing } = await supabase
            .from('marketplace_listings')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.seller_id !== userId) {
            throw new ForbiddenException('Only the seller can update this listing');
        }

        const updateData: Record<string, any> = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.category !== undefined) updateData.category = dto.category;
        if (dto.price !== undefined) updateData.price = dto.price;
        if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
        if (dto.location !== undefined) updateData.location = dto.location;
        if (dto.status !== undefined) updateData.status = dto.status;

        const { data, error } = await supabase
            .from('marketplace_listings')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                seller:profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return this.transformListing(data);
    }

    /**
     * Delete a listing.
     */
    async delete(id: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: listing } = await supabase
            .from('marketplace_listings')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.seller_id !== userId) {
            throw new ForbiddenException('Only the seller can delete this listing');
        }

        const { error } = await supabase
            .from('marketplace_listings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Get listings by a specific seller.
     */
    async findBySeller(sellerId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data?.map(this.transformListing);
    }

    private transformListing(row: any) {
        return {
            id: row.id,
            sellerId: row.seller_id,
            title: row.title,
            description: row.description,
            category: row.category,
            price: row.price,
            imageUrl: row.image_url,
            location: row.location,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            seller: row.seller,
        };
    }
}
