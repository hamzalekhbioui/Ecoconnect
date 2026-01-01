import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, Column } from '../shared/DataTable';
import { ActionButtons } from '../shared/ActionButtons';
import {
    Package,
    MapPin,
    DollarSign,
    X,
    Save,
    Loader2,
    Plus
} from 'lucide-react';

interface Resource {
    id: string;
    title: string;
    description: string | null;
    category: 'electronics' | 'home' | 'clothing' | 'gardening' | 'books' | 'tools' | 'kitchen' | 'art';
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null;
    location: string | null;
    exchange_type: 'sale' | 'barter' | 'free' | 'loan';
    cost_type: 'monetary' | 'free' | 'barter';
    price: number | null;
    owner_id: string;
    created_at: string;
    owner?: {
        full_name: string;
        email: string;
    };
}

interface ResourceManagementViewProps {
    onNavigate: (page: string) => void;
}

const categoryLabels: Record<Resource['category'], string> = {
    electronics: 'Electronics & Gadgets',
    home: 'Home & Furniture',
    clothing: 'Clothing & Textiles',
    gardening: 'Gardening & Plants',
    books: 'Books & Knowledge',
    tools: 'Tools & Repair',
    kitchen: 'Kitchen & Dining',
    art: 'Art & Craft Supplies'
};

const conditionLabels: Record<NonNullable<Resource['condition']>, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
};

const emptyResource: Omit<Resource, 'id' | 'created_at' | 'owner'> = {
    title: '',
    description: '',
    category: 'electronics',
    condition: null,
    location: null,
    exchange_type: 'free',
    cost_type: 'free',
    price: null,
    owner_id: ''
};

export const ResourceManagementView: React.FC<ResourceManagementViewProps> = ({ onNavigate }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newResource, setNewResource] = useState(emptyResource);
    const [savingResource, setSavingResource] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        forSale: 0,
        forBarter: 0,
        totalValue: 0
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resources')
                .select(`
                    *,
                    owner:profiles!owner_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const resourcesData = data as Resource[];
            setResources(resourcesData);
            setFilteredResources(resourcesData);

            // Calculate stats
            const totalValue = resourcesData.reduce((sum, r) => sum + (r.price || 0), 0);
            setStats({
                total: resourcesData.length,
                forSale: resourcesData.filter(r => r.exchange_type === 'sale').length,
                forBarter: resourcesData.filter(r => r.exchange_type === 'barter').length,
                totalValue
            });
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        const filtered = resources.filter(
            resource =>
                resource.title.toLowerCase().includes(query.toLowerCase()) ||
                resource.description?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredResources(filtered);
    };

    const handleCreateResource = async () => {
        setSavingResource(true);
        try {
            const { error } = await supabase
                .from('resources')
                .insert([newResource]);

            if (error) throw error;

            await fetchResources();
            setIsCreating(false);
            setNewResource(emptyResource);
        } catch (error) {
            console.error('Error creating resource:', error);
        } finally {
            setSavingResource(false);
        }
    };

    const handleEditResource = async () => {
        if (!editingResource) return;
        setSavingResource(true);

        try {
            const { error } = await supabase
                .from('resources')
                .update({
                    title: editingResource.title,
                    description: editingResource.description,
                    type: editingResource.type,
                    cost_type: editingResource.cost_type,
                    price: editingResource.price
                })
                .eq('id', editingResource.id);

            if (error) throw error;

            await fetchResources();
            setEditingResource(null);
        } catch (error) {
            console.error('Error updating resource:', error);
        } finally {
            setSavingResource(false);
        }
    };

    const handleDeleteResource = async (resourceId: string) => {
        try {
            const { error } = await supabase
                .from('resources')
                .delete()
                .eq('id', resourceId);

            if (error) throw error;

            await fetchResources();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting resource:', error);
        }
    };

    const columns: Column<Resource>[] = [
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (resource) => (
                <div>
                    <span className="font-medium text-white">{resource.title}</span>
                    {resource.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">
                            {resource.description}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'category',
            header: 'Category',
            render: (resource) => (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-300">
                    {categoryLabels[resource.category] || resource.category}
                </span>
            )
        },
        {
            key: 'condition',
            header: 'Condition',
            render: (resource) => {
                if (!resource.condition) return <span className="text-slate-500">-</span>;
                const conditionStyles: Record<string, string> = {
                    new: 'bg-emerald-500/20 text-emerald-400',
                    like_new: 'bg-teal-500/20 text-teal-400',
                    good: 'bg-blue-500/20 text-blue-400',
                    fair: 'bg-amber-500/20 text-amber-400',
                    poor: 'bg-rose-500/20 text-rose-400'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionStyles[resource.condition] || 'bg-slate-500/20 text-slate-400'}`}>
                        {conditionLabels[resource.condition] || resource.condition}
                    </span>
                );
            }
        },
        {
            key: 'location',
            header: 'Location',
            render: (resource) => (
                <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{resource.location || '-'}</span>
                </div>
            )
        },
        {
            key: 'exchange_type',
            header: 'Exchange',
            render: (resource) => {
                const exchangeStyles = {
                    sale: 'bg-amber-500/20 text-amber-400',
                    barter: 'bg-purple-500/20 text-purple-400',
                    free: 'bg-emerald-500/20 text-emerald-400',
                    loan: 'bg-blue-500/20 text-blue-400'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${exchangeStyles[resource.exchange_type] || 'bg-slate-500/20 text-slate-400'}`}>
                        {resource.exchange_type ? resource.exchange_type.charAt(0).toUpperCase() + resource.exchange_type.slice(1) : '-'}
                    </span>
                );
            }
        },
        {
            key: 'cost_type',
            header: 'Cost',
            render: (resource) => {
                const costStyles = {
                    free: 'bg-emerald-500/20 text-emerald-400',
                    monetary: 'bg-amber-500/20 text-amber-400',
                    barter: 'bg-purple-500/20 text-purple-400'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${costStyles[resource.cost_type]}`}>
                        {resource.cost_type === 'monetary' && resource.price
                            ? `$${resource.price}`
                            : resource.cost_type.charAt(0).toUpperCase() + resource.cost_type.slice(1)}
                    </span>
                );
            }
        },
        {
            key: 'owner',
            header: 'Owner',
            render: (resource) => (
                <div>
                    <span className="text-slate-300">{resource.owner?.full_name || 'Unknown'}</span>
                    {resource.owner?.email && (
                        <p className="text-xs text-slate-500">{resource.owner.email}</p>
                    )}
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (resource) => (
                <span className="text-slate-400 text-xs">
                    {new Date(resource.created_at).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Resources</h2>
                    <p className="text-sm text-slate-400">Manage community resources</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Resource
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Resources"
                    value={stats.total}
                    icon={<Package className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="For Sale"
                    value={stats.forSale}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="For Barter"
                    value={stats.forBarter}
                    icon={<Package className="w-5 h-5" />}
                    color="purple"
                />
                <StatsCard
                    title="Total Exchange Value"
                    value={`$${stats.totalValue.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="blue"
                />
            </div>

            {/* Resource Table */}
            <DataTable
                data={filteredResources}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Search resources..."
                onSearch={handleSearch}
                loading={loading}
                emptyMessage="No resources found"
                actions={(resource) => (
                    <ActionButtons
                        onEdit={() => setEditingResource(resource)}
                        onDelete={() => setDeleteConfirm(resource.id)}
                    />
                )}
            />

            {/* Create/Edit Modal */}
            {(editingResource || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">
                                {isCreating ? 'Add Resource' : 'Edit Resource'}
                            </h3>
                            <button
                                onClick={() => {
                                    setEditingResource(null);
                                    setIsCreating(false);
                                    setNewResource(emptyResource);
                                }}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={isCreating ? newResource.title : editingResource?.title}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, title: e.target.value })
                                        : setEditingResource({ ...editingResource!, title: e.target.value })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Resource title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={isCreating ? newResource.description || '' : editingResource?.description || ''}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, description: e.target.value })
                                        : setEditingResource({ ...editingResource!, description: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 resize-none"
                                    placeholder="Describe the resource..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={isCreating ? newResource.category : editingResource?.category}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, category: e.target.value as Resource['category'] })
                                        : setEditingResource({ ...editingResource!, category: e.target.value as Resource['category'] })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="electronics">Electronics & Gadgets</option>
                                    <option value="home">Home & Furniture</option>
                                    <option value="clothing">Clothing & Textiles</option>
                                    <option value="gardening">Gardening & Plants</option>
                                    <option value="books">Books & Knowledge</option>
                                    <option value="tools">Tools & Repair</option>
                                    <option value="kitchen">Kitchen & Dining</option>
                                    <option value="art">Art & Craft Supplies</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Condition
                                </label>
                                <select
                                    value={isCreating ? newResource.condition || '' : editingResource?.condition || ''}
                                    onChange={(e) => {
                                        const condition = e.target.value ? e.target.value as Resource['condition'] : null;
                                        isCreating
                                            ? setNewResource({ ...newResource, condition })
                                            : setEditingResource({ ...editingResource!, condition });
                                    }}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select condition...</option>
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={isCreating ? newResource.location || '' : editingResource?.location || ''}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, location: e.target.value || null })
                                        : setEditingResource({ ...editingResource!, location: e.target.value || null })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Downtown, North Side, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Exchange Type
                                </label>
                                <select
                                    value={isCreating ? newResource.exchange_type : editingResource?.exchange_type}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, exchange_type: e.target.value as Resource['exchange_type'] })
                                        : setEditingResource({ ...editingResource!, exchange_type: e.target.value as Resource['exchange_type'] })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="sale">Sale</option>
                                    <option value="barter">Barter</option>
                                    <option value="loan">Loan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Cost Type
                                </label>
                                <select
                                    value={isCreating ? newResource.cost_type : editingResource?.cost_type}
                                    onChange={(e) => isCreating
                                        ? setNewResource({ ...newResource, cost_type: e.target.value as Resource['cost_type'] })
                                        : setEditingResource({ ...editingResource!, cost_type: e.target.value as Resource['cost_type'] })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="monetary">Monetary</option>
                                    <option value="barter">Barter</option>
                                </select>
                            </div>

                            {(isCreating ? newResource.cost_type : editingResource?.cost_type) === 'monetary' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={isCreating ? newResource.price || '' : editingResource?.price || ''}
                                        onChange={(e) => {
                                            const price = e.target.value ? parseFloat(e.target.value) : null;
                                            isCreating
                                                ? setNewResource({ ...newResource, price })
                                                : setEditingResource({ ...editingResource!, price });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setEditingResource(null);
                                    setIsCreating(false);
                                    setNewResource(emptyResource);
                                }}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isCreating ? handleCreateResource : handleEditResource}
                                disabled={savingResource}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingResource ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isCreating ? 'Create' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Resource?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. The resource will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteResource(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
