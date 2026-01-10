import React, { useState } from 'react';
import { FileText, Download, X } from 'lucide-react';
import { Message } from '../types/messaging';
import { getFilenameFromUrl } from '../services/attachmentService';

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    showAvatar?: boolean;
}

const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwnMessage,
    showAvatar = true,
}) => {
    const [isImageExpanded, setIsImageExpanded] = useState(false);

    // Inline styles to ensure visibility (bypasses any CSS conflicts)
    const ownMessageStyle: React.CSSProperties = {
        background: 'linear-gradient(to right, #10b981, #14b8a6)',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '16px',
        borderBottomRightRadius: '4px',
    };

    const otherMessageStyle: React.CSSProperties = {
        backgroundColor: '#f3f4f6',
        color: '#111827',
        padding: '10px 16px',
        borderRadius: '16px',
        borderBottomLeftRadius: '4px',
    };

    // Render attachment based on type
    const renderAttachment = () => {
        if (!message.attachment_url || !message.attachment_type) return null;

        if (message.attachment_type === 'image') {
            return (
                <>
                    <img
                        src={message.attachment_url}
                        alt="Image attachment"
                        onClick={() => setIsImageExpanded(true)}
                        style={{
                            maxWidth: '240px',
                            maxHeight: '180px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: message.content ? '8px' : '0',
                            objectFit: 'cover',
                        }}
                    />
                    {/* Expanded image modal */}
                    {isImageExpanded && (
                        <div
                            onClick={() => setIsImageExpanded(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                cursor: 'pointer',
                            }}
                        >
                            <button
                                onClick={() => setIsImageExpanded(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <X style={{ width: '24px', height: '24px', color: 'white' }} />
                            </button>
                            <img
                                src={message.attachment_url}
                                alt="Expanded image"
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    borderRadius: '8px',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                    )}
                </>
            );
        }

        if (message.attachment_type === 'document') {
            const filename = getFilenameFromUrl(message.attachment_url);
            return (
                <a
                    href={message.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: 'inherit',
                        marginBottom: message.content ? '8px' : '0',
                    }}
                >
                    <FileText style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    <span style={{
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '150px'
                    }}>
                        {filename}
                    </span>
                    <Download style={{ width: '16px', height: '16px', flexShrink: 0, opacity: 0.7 }} />
                </a>
            );
        }

        return null;
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                marginBottom: '12px',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
        >
            {/* Avatar - only show for other user's messages */}
            {showAvatar && !isOwnMessage && (
                <div style={{ flexShrink: 0 }}>
                    {message.sender?.avatar_url ? (
                        <img
                            src={message.sender.avatar_url}
                            alt={message.sender.full_name}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(to bottom right, #9ca3af, #6b7280)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>
                                {message.sender?.full_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Message bubble */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '70%',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                }}
            >
                <div style={isOwnMessage ? ownMessageStyle : otherMessageStyle}>
                    {/* Render attachment first */}
                    {renderAttachment()}

                    {/* Only show content if it's not the default "Sent a X" message when there's an attachment */}
                    {message.content && !(message.attachment_url && message.content.startsWith('Sent a ')) && (
                        <p
                            style={{
                                fontSize: '14px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                margin: 0,
                            }}
                        >
                            {message.content}
                        </p>
                    )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                    }}
                >
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {formatTime(message.created_at)}
                    </span>
                    {isOwnMessage && (
                        <span style={{ fontSize: '12px', color: '#10b981' }}>
                            {message.is_read ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

