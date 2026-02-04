"use client";

import { useState } from "react";
import { X, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CreateReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string, scheduledDate: Date) => void;
}

export default function CreateReminderModal({
    isOpen,
    onClose,
    onSubmit,
}: CreateReminderModalProps) {
    const [content, setContent] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!content.trim()) {
            alert("Please enter reminder content");
            return;
        }
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }

        // Set time to 7:00 AM
        const reminderDate = new Date(selectedDate);
        reminderDate.setHours(7, 0, 0, 0);

        onSubmit(content.trim(), reminderDate);

        // Reset form
        setContent("");
        setSelectedDate(null);
        setShowCalendar(false);
        onClose();
    };

    const formatDate = (date: Date) => {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayOfWeek = dayNames[date.getDay()];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${dayOfWeek}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calendar logic
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

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date < today;
    };

    const isDateSelected = (day: number) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    const isToday = (day: number) => {
        const now = new Date();
        return (
            now.getDate() === day &&
            now.getMonth() === currentMonth.getMonth() &&
            now.getFullYear() === currentMonth.getFullYear()
        );
    };

    const selectDate = (day: number) => {
        if (isDateDisabled(day)) return;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(date);
        setShowCalendar(false);
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-5rem)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900">Create Reminder</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Input content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter reminder content..."
                            className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        />
                    </div>

                    {/* Select date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select reminder date
                        </label>
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span>
                                    {selectedDate ? formatDate(selectedDate) : "Select date..."}
                                </span>
                            </div>
                            <Clock className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* Custom Calendar */}
                        {showCalendar && (
                            <div className="mt-2 border border-gray-200 rounded-lg p-4 bg-white shadow-lg">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-base font-semibold text-gray-900">
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={prevMonth}
                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={nextMonth}
                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Day Names */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {dayNames.map((day) => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day, index) => (
                                        <div key={index} className="aspect-square">
                                            {day !== null ? (
                                                <button
                                                    onClick={() => selectDate(day)}
                                                    disabled={isDateDisabled(day)}
                                                    className={`w-full h-full flex items-center justify-center text-sm rounded-full transition-colors
                            ${isDateSelected(day)
                                                            ? "bg-blue-600 text-white font-medium"
                                                            : isToday(day)
                                                                ? "bg-blue-100 text-blue-600 font-medium border border-blue-300"
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

                        {selectedDate && (
                            <p className="mt-2 text-sm text-gray-500">
                                ⏰ Notification will be sent at <strong>7:00 AM</strong> on {formatDate(selectedDate)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || !selectedDate}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Reminder
                    </button>
                </div>
            </div>
        </div>
    );
}
