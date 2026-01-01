import React from 'react';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';

interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    showLabels?: boolean;
    size?: 'sm' | 'md';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onEdit,
    onDelete,
    showLabels = false,
    size = 'sm'
}) => {
    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2'
    };

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div className="flex items-center gap-1">
            {onEdit && (
                <button
                    onClick={onEdit}
                    className={`${sizeClasses[size]} rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5`}
                    title="Edit"
                >
                    <Pencil className={iconSize} />
                    {showLabels && <span className="text-sm">Edit</span>}
                </button>
            )}
            {onDelete && (
                <button
                    onClick={onDelete}
                    className={`${sizeClasses[size]} rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5`}
                    title="Delete"
                >
                    <Trash2 className={iconSize} />
                    {showLabels && <span className="text-sm">Delete</span>}
                </button>
            )}
        </div>
    );
};
