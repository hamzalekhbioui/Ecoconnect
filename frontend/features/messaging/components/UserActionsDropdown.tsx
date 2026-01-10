import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Ban, Flag } from 'lucide-react';
import { UserProfile } from '../types/messaging';

interface UserActionsDropdownProps {
    otherUser: UserProfile;
    onBlockUser: () => void;
    onReportUser: () => void;
}

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
    otherUser,
    onBlockUser,
    onReportUser
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="More options"
                aria-label="User actions menu"
                aria-expanded={isOpen}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Block User */}
                    <button
                        onClick={() => handleAction(onBlockUser)}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 transition-colors group"
                    >
                        <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                            <Ban className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-red-600 font-medium">Block User</span>
                    </button>

                    <div className="my-1.5 border-t border-gray-100" />

                    {/* Report User */}
                    <button
                        onClick={() => handleAction(onReportUser)}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <Flag className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-600 font-medium">Report User</span>
                    </button>
                </div>
            )}
        </div>
    );
};
