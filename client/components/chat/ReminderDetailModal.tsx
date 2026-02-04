"use client";

import { useState, useEffect } from "react";
import { X, Clock, Edit3, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface ReminderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    reminder: {
        reminderId: string;
        content: string;
        scheduledDate: Date | string;
        creatorName: string;
    } | null;
    createdAt?: Date | string;
    currentUserId: string;
    creatorId: string;
    onUpdate?: (reminderId: string, content: string, scheduledDate: Date) => void;
    onCancel?: (reminderId: string) => void;
}

export default function ReminderDetailModal({
    isOpen,
    onClose,
    reminder,
    createdAt,
    currentUserId,
    creatorId,
    onUpdate,
    onCancel,
}: ReminderDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editDate, setEditDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    useEffect(() => {
        if (reminder) {
            setEditContent(reminder.content);
            setEditDate(new Date(reminder.scheduledDate));
            setCurrentMonth(new Date(reminder.scheduledDate));
        }
    }, [reminder]);

    // Reset editing state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setShowCalendar(false);
            setShowConfirmCancel(false);
        }
    }, [isOpen]);

    if (!isOpen || !reminder) return null;

    const scheduledDate = new Date(reminder.scheduledDate);
    const canEdit = currentUserId === creatorId;

    const getDayOfWeek = (date: Date) => {
        const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        return days[date.getDay()];
    };

    const getMonthName = (date: Date) => {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return months[date.getMonth()];
    };

    const formatDateTime = (date: Date) => {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayOfWeek = dayNames[date.getDay()];
        return `${dayOfWeek}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const formatCreatedAt = (date: Date | string) => {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, "0");
        const minutes = d.getMinutes().toString().padStart(2, "0");

        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();

        if (isToday) {
            return `${hours}:${minutes} Today`;
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${hours}:${minutes} ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    const handleSave = () => {
        if (!editContent.trim() || !editDate) return;

        const newDate = new Date(editDate);
        newDate.setHours(7, 0, 0, 0);

        onUpdate?.(reminder.reminderId, editContent.trim(), newDate);
        setIsEditing(false);
        setShowCalendar(false);
    };

    const handleConfirmCancel = () => {
        onCancel?.(reminder.reminderId);
        setShowConfirmCancel(false);
        onClose();
    };

    // Calendar logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (number | null)[] = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date < today;
    };

    const isDateSelected = (day: number) => {
        if (!editDate) return false;
        return (
            editDate.getDate() === day &&
            editDate.getMonth() === currentMonth.getMonth() &&
            editDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    const selectDate = (day: number) => {
        if (isDateDisabled(day)) return;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setEditDate(date);
        setShowCalendar(false);
    };

    const displayDate = isEditing && editDate ? editDate : scheduledDate;
    const days = getDaysInMonth(currentMonth);

    return (
        <>
            <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-5rem)]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-gray-900">Reminder Details</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 overflow-y-auto flex-1">
                        <div className="flex gap-5">
                            {/* Calendar Icon */}
                            <div className="flex-shrink-0">
                                <div className="w-20 h-24 rounded-xl overflow-hidden shadow-md border border-gray-200">
                                    <div className="bg-blue-600 text-white text-[10px] font-bold text-center py-1">
                                        {getDayOfWeek(displayDate)}
                                    </div>
                                    <div className="bg-white flex flex-col items-center justify-center h-16">
                                        <span className="text-3xl font-bold text-gray-900">
                                            {displayDate.getDate()}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {getMonthName(displayDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3">
                                {isEditing ? (
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none h-16 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                ) : (
                                    <h3 className="text-lg font-bold text-gray-900">{reminder.content}</h3>
                                )}

                                <p className="text-sm text-gray-500">
                                    Created by <span className="font-medium text-gray-700">{reminder.creatorName}</span>
                                    {createdAt && ` - ${formatCreatedAt(createdAt)}`}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {isEditing ? (
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {editDate ? formatDateTime(editDate) : "Select date..."}
                                        </button>
                                    ) : (
                                        <span>{formatDateTime(scheduledDate)}</span>
                                    )}
                                </div>

                                {/* Calendar for editing */}
                                {showCalendar && isEditing && (
                                    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                                    className="p-1 hover:bg-gray-100 rounded-full"
                                                >
                                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                                    className="p-1 hover:bg-gray-100 rounded-full"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 mb-1">
                                            {dayNames.map((day) => (
                                                <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-1">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {days.map((day, index) => (
                                                <div key={index} className="aspect-square">
                                                    {day !== null ? (
                                                        <button
                                                            onClick={() => selectDate(day)}
                                                            disabled={isDateDisabled(day)}
                                                            className={`w-full h-full flex items-center justify-center text-xs rounded-full transition-colors
                              ${isDateSelected(day)
                                                                    ? "bg-blue-600 text-white font-medium"
                                                                    : isDateDisabled(day)
                                                                        ? "text-gray-300 cursor-not-allowed"
                                                                        : "text-gray-700 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    ) : (
                                                        <div className="w-full h-full" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                    <span>One-time reminder</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                        {/* Left side - Cancel Reminder button */}
                        <div>
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setShowConfirmCancel(true)}
                                    className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Cancel Reminder
                                </button>
                            )}
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setShowCalendar(false);
                                            setEditContent(reminder.content);
                                            setEditDate(new Date(reminder.scheduledDate));
                                        }}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {canEdit && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Cancel Reminder Modal */}
            {showConfirmCancel && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Cancel Reminder</h3>
                            <button
                                onClick={() => setShowConfirmCancel(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4">
                            <p className="text-gray-600">Are you sure you want to cancel this reminder?</p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowConfirmCancel(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
