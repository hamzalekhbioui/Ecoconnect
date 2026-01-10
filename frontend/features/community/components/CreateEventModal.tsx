import React, { useState, useEffect } from 'react';
import { CommunityEvent, EventLocationType } from '../../../types';
import { CreateEventInput } from '../services/eventService';
import { X, Calendar, Clock, Video, MapPin, Link, Users, Image } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateEventInput) => Promise<void>;
    communityId: string;
    initialData?: CommunityEvent;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    communityId,
    initialData,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [locationType, setLocationType] = useState<EventLocationType>('remote');
    const [meetingLink, setMeetingLink] = useState('');
    const [address, setAddress] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [maxAttendees, setMaxAttendees] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');

            const start = new Date(initialData.startTime);
            setStartDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().slice(0, 5));

            if (initialData.endTime) {
                const end = new Date(initialData.endTime);
                setEndDate(end.toISOString().split('T')[0]);
                setEndTime(end.toTimeString().slice(0, 5));
            }

            setLocationType(initialData.locationType);
            setMeetingLink(initialData.meetingLink || '');
            setAddress(initialData.address || '');
            setCoverImage(initialData.coverImage || '');
            setMaxAttendees(initialData.maxAttendees?.toString() || '');
        } else {
            // Reset form for new event
            setTitle('');
            setDescription('');
            setStartDate('');
            setStartTime('');
            setEndDate('');
            setEndTime('');
            setLocationType('remote');
            setMeetingLink('');
            setAddress('');
            setCoverImage('');
            setMaxAttendees('');
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!startDate || !startTime) {
            setError('Start date and time are required');
            return;
        }

        // Combine date and time into ISO string
        const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
        const endDateTime = endDate && endTime
            ? new Date(`${endDate}T${endTime}`).toISOString()
            : undefined;

        try {
            setIsSubmitting(true);
            await onSubmit({
                communityId,
                title: title.trim(),
                description: description.trim() || undefined,
                startTime: startDateTime,
                endTime: endDateTime,
                locationType,
                meetingLink: locationType === 'remote' ? meetingLink.trim() || undefined : undefined,
                address: locationType === 'in_person' ? address.trim() || undefined : undefined,
                coverImage: coverImage.trim() || undefined,
                maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
            });
        } catch (err) {
            console.error('Failed to save event:', err);
            setError('Failed to save event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Monthly Community Meetup"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this event about?"
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Start Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Start Time *
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* End Date & Time (Optional) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Location Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Type *
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setLocationType('remote')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${locationType === 'remote'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <Video className="w-5 h-5" />
                                <span className="font-medium">Remote</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationType('in_person')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${locationType === 'in_person'
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <MapPin className="w-5 h-5" />
                                <span className="font-medium">In Person</span>
                            </button>
                        </div>
                    </div>

                    {/* Meeting Link (for remote) */}
                    {locationType === 'remote' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Link className="w-4 h-4 inline mr-1" />
                                Meeting Link
                            </label>
                            <input
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Address (for in-person) */}
                    {locationType === 'in_person' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Address
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="123 Main St, City, Country"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Cover Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Image className="w-4 h-4 inline mr-1" />
                            Cover Image URL
                        </label>
                        <input
                            type="url"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    {/* Max Attendees */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Users className="w-4 h-4 inline mr-1" />
                            Max Attendees
                        </label>
                        <input
                            type="number"
                            value={maxAttendees}
                            onChange={(e) => setMaxAttendees(e.target.value)}
                            placeholder="Leave empty for unlimited"
                            min="1"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 text-white bg-emerald-500 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
