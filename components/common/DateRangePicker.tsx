import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to format dates as YYYY-MM-DD
const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-CA');
};

interface DateRange {
    from: Date | null;
    to: Date | null;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    label: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value.to || new Date());
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDayClick = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0); // Normalize date to the start of the day

        if (!value.from || (value.from && value.to)) {
            // Start a new selection
            onChange({ from: date, to: null });
        } else if (date < value.from) {
            // If a date before the start date is selected, start a new selection
            onChange({ from: date, to: null });
        } else {
            // Complete the range
            const toDate = new Date(date);
            toDate.setHours(23, 59, 59, 999);
            onChange({ ...value, to: toDate });
            setIsOpen(false); // Close picker after selecting a range
        }
    };

    const handleQuickRangeSelect = (rangeType: 'last1Month' | 'last3Months' | 'last6Months' | 'last1Year') => {
        const today = new Date();
        let from = new Date();
        let to = new Date();
        to.setHours(23, 59, 59, 999);
        from.setHours(0, 0, 0, 0);

        switch (rangeType) {
            case 'last1Month':
                from.setMonth(to.getMonth() - 1);
                break;
            case 'last3Months':
                from.setMonth(to.getMonth() - 3);
                break;
            case 'last6Months':
                from.setMonth(to.getMonth() - 6);
                break;
            case 'last1Year':
                from.setFullYear(to.getFullYear() - 1);
                break;
        }
        onChange({ from, to });
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => null);

        const quickRanges = [
            { label: 'Last Month', key: 'last1Month' },
            { label: 'Last 3 Months', key: 'last3Months' },
            { label: 'Last 6 Months', key: 'last6Months' },
            { label: 'Last Year', key: 'last1Year' },
        ];

        return (
            <div className="absolute top-full left-0 mt-2 bg-card rounded-lg shadow-lg border border-border z-10 flex w-auto overflow-hidden">
                <div className="p-4 border-r border-border bg-slate-50 w-40">
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Quick Ranges</h4>
                    <div className="flex flex-col gap-1">
                        {quickRanges.map(range => (
                            <button
                                key={range.key}
                                type="button"
                                onClick={() => handleQuickRangeSelect(range.key as any)}
                                className="text-left text-sm p-2 rounded-md hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 w-80">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-background"><ChevronLeft size={20} /></button>
                        <span className="font-semibold text-text-primary">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-background"><ChevronRight size={20} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="font-medium">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                        {leadingBlanks.map((_, i) => <div key={`blank-${i}`} />)}
                        {days.map(day => {
                            const date = new Date(year, month, day);
                            date.setHours(0, 0, 0, 0);
                            
                            const toDateNormalized = value.to ? new Date(new Date(value.to).toDateString()) : null;
                            const fromDateNormalized = value.from ? new Date(new Date(value.from).toDateString()) : null;
                            
                            const isFrom = fromDateNormalized && date.getTime() === fromDateNormalized.getTime();
                            const isTo = toDateNormalized && date.getTime() === toDateNormalized.getTime();
                            const isInRange = fromDateNormalized && toDateNormalized && date > fromDateNormalized && date < toDateNormalized;
                            const isToday = date.getTime() === today.getTime();

                            const baseClasses = 'h-8 w-8 rounded-full text-sm transition-colors flex items-center justify-center';
                            let stateClasses = 'hover:bg-primary-lightest';

                            if (isFrom || isTo) {
                                stateClasses = 'bg-primary text-white font-semibold';
                            } else if (isInRange) {
                                stateClasses = 'bg-primary-lightest text-primary rounded-none';
                            } else if (isToday) {
                                stateClasses = 'border border-primary text-primary';
                            }
                            
                            if (isFrom && value.to) stateClasses += ' rounded-r-none';
                            if (isTo) stateClasses += ' rounded-l-none';

                            return (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`${baseClasses} ${stateClasses}`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full" ref={pickerRef}>
             <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm bg-input-bg border-border focus-visible:outline-none focus-visible:ring-2"
            >
                <span className="text-text-primary text-sm">
                    {value.from ? formatDate(value.from) : 'Select Start Date'}
                    {value.to ? ` - ${formatDate(value.to)}` : ''}
                </span>
                <Calendar size={16} className="text-text-secondary" />
            </button>
            {isOpen && renderCalendar()}
        </div>
    );
};

export default DateRangePicker;