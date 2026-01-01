import { Community, CommunityFilters } from '../../../types';

/**
 * Filters communities based on search query and filter criteria.
 * This is a mock function for client-side filtering.
 * In production, this logic would be handled by Supabase queries.
 */
export function filterCommunities(
    communities: Community[],
    filters: CommunityFilters
): Community[] {
    return communities.filter((community) => {
        // Text search (name and description)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesName = community.name.toLowerCase().includes(searchLower);
            const matchesDescription = community.description.toLowerCase().includes(searchLower);
            const matchesTags = community.tags.some(tag =>
                tag.toLowerCase().includes(searchLower)
            );

            if (!matchesName && !matchesDescription && !matchesTags) {
                return false;
            }
        }

        // Theme filter
        if (filters.theme && filters.theme.length > 0) {
            const hasMatchingTheme = filters.theme.some(theme =>
                community.tags.some(tag =>
                    tag.toLowerCase().includes(theme.toLowerCase())
                )
            );
            if (!hasMatchingTheme) return false;
        }

        // Sector filter
        if (filters.sector && filters.sector.length > 0) {
            const hasMatchingSector = filters.sector.some(sector =>
                community.tags.some(tag =>
                    tag.toLowerCase().includes(sector.toLowerCase())
                )
            );
            if (!hasMatchingSector) return false;
        }

        // Project Type filter
        if (filters.projectType && filters.projectType.length > 0) {
            const hasMatchingType = filters.projectType.some(type =>
                community.tags.some(tag =>
                    tag.toLowerCase().includes(type.toLowerCase())
                )
            );
            if (!hasMatchingType) return false;
        }

        // Territory filter
        if (filters.territory && filters.territory.length > 0) {
            const hasMatchingTerritory = filters.territory.some(territory =>
                community.tags.some(tag =>
                    tag.toLowerCase().includes(territory.toLowerCase())
                )
            );
            if (!hasMatchingTerritory) return false;
        }

        // Privacy filter
        if (filters.isPrivate !== undefined) {
            if (community.isPrivate !== filters.isPrivate) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Get unique tags from a list of communities
 */
export function getUniqueTags(communities: Community[]): string[] {
    const tagSet = new Set<string>();
    communities.forEach(community => {
        community.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

/**
 * Generate a URL-friendly slug from a community name
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
