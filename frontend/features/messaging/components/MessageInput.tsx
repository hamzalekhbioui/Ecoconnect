import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Paperclip, Image, FileText } from 'lucide-react';

interface MessageInputProps {
    onSend: (content: string) => Promise<void>;
    onFileSelect?: (file: File, type: 'image' | 'document') => void;
    disabled?: boolean;
    placeholder?: string;
}

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.pptx'];

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onFileSelect,
    disabled = false,
    placeholder = 'Type a message...',
}) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const attachmentButtonRef = useRef<HTMLButtonElement>(null);

    // Track which type of file we're selecting
    const [currentFileType, setCurrentFileType] = useState<'image' | 'document'>('image');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isAttachmentMenuOpen &&
                attachmentMenuRef.current &&
                attachmentButtonRef.current &&
                !attachmentMenuRef.current.contains(event.target as Node) &&
                !attachmentButtonRef.current.contains(event.target as Node)
            ) {
                setIsAttachmentMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAttachmentMenuOpen]);

    const handleSend = async () => {
        if (!message.trim() || isSending || disabled) return;

        try {
            setIsSending(true);
            await onSend(message);
            setMessage('');
            inputRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAttachmentClick = (type: 'image' | 'document') => {
        setCurrentFileType(type);
        setIsAttachmentMenuOpen(false);

        // Update accept attribute based on type
        if (fileInputRef.current) {
            if (type === 'image') {
                fileInputRef.current.accept = ALLOWED_IMAGE_EXTENSIONS.join(',');
            } else {
                fileInputRef.current.accept = ALLOWED_DOCUMENT_EXTENSIONS.join(',');
            }
            // Trigger file picker
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        let isValid = false;
        if (currentFileType === 'image') {
            isValid = ALLOWED_IMAGE_TYPES.includes(file.type);
            if (!isValid) {
                alert('Invalid file type. Please select a .jpg or .png image.');
            }
        } else {
            isValid = ALLOWED_DOCUMENT_TYPES.includes(file.type);
            if (!isValid) {
                alert('Invalid file type. Please select a .pdf, .docx, or .pptx document.');
            }
        }

        if (isValid && onFileSelect) {
            onFileSelect(file, currentFileType);
        }

        // Reset file input so the same file can be selected again
        event.target.value = '';
    };

    return (
        <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
                {/* Attachment button with dropdown */}
                <div className="relative">
                    <button
                        ref={attachmentButtonRef}
                        type="button"
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className={`p-2 rounded-lg transition-colors ${isAttachmentMenuOpen
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                        title="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Attachment dropdown menu */}
                    {isAttachmentMenuOpen && (
                        <div
                            ref={attachmentMenuRef}
                            className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50"
                        >
                            <button
                                onClick={() => handleAttachmentClick('image')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Image className="w-4 h-4 text-emerald-500" />
                                <span>Image</span>
                            </button>
                            <button
                                onClick={() => handleAttachmentClick('document')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span>Document</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Input field */}
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || isSending}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm 
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                   disabled:bg-gray-100 disabled:cursor-not-allowed
                                   placeholder:text-gray-400"
                    />
                </div>

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending || disabled}
                    className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full 
                               hover:from-emerald-600 hover:to-teal-600 transition-all
                               disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
                               shadow-md hover:shadow-lg disabled:shadow-none"
                >
                    <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
                </button>
            </div>
        </div>
    );
};
