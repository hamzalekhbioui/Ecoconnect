import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        label: string;
    };
    icon: React.ReactNode;
    color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
}

const colorClasses = {
    emerald: {
        bg: 'bg-emerald-500/10',
        icon: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400'
    },
    blue: {
        bg: 'bg-blue-500/10',
        icon: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400'
    },
    purple: {
        bg: 'bg-purple-500/10',
        icon: 'text-purple-400',
        badge: 'bg-purple-500/20 text-purple-400'
    },
    amber: {
        bg: 'bg-amber-500/10',
        icon: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-400'
    },
    rose: {
        bg: 'bg-rose-500/10',
        icon: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-400'
    },
    cyan: {
        bg: 'bg-cyan-500/10',
        icon: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-400'
    }
};

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    change,
    icon,
    color = 'emerald'
}) => {
    const colors = colorClasses[color];

    const getTrendIcon = () => {
        if (!change) return null;
        if (change.value > 0) return <TrendingUp className="w-3 h-3" />;
        if (change.value < 0) return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (!change) return '';
        if (change.value > 0) return 'text-emerald-400';
        if (change.value < 0) return 'text-rose-400';
        return 'text-slate-400';
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                    <div className={colors.icon}>
                        {icon}
                    </div>
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{change.value > 0 ? '+' : ''}{change.value}%</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-sm text-slate-400">{title}</p>
            </div>
            {change && (
                <p className="text-xs text-slate-500 mt-2">{change.label}</p>
            )}
        </div>
    );
};
