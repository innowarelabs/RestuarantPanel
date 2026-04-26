export const DATE_RANGE_OPTIONS = [
    { value: 'last-7', label: 'Last 7 Days', days: 7 },
    { value: 'last-30', label: 'Last 30 Days', days: 30 },
    { value: 'last-90', label: 'Last 90 Days', days: 90 },
    { value: 'this-year', label: 'This year', days: 365 },
];

export function dateRangeToDays(value) {
    const opt = DATE_RANGE_OPTIONS.find((o) => o.value === value);
    return opt?.days ?? 30;
}

export function daysToDateRangeValue(days) {
    const match = DATE_RANGE_OPTIONS.find((o) => o.days === days);
    return match?.value ?? 'last-30';
}

export const ORDER_TYPE_FILTER_OPTIONS = [
    { value: 'delivery', label: 'Delivery' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'dine_in', label: 'Dine-in' },
    { value: 'all', label: 'All' },
];

export const ORDER_PAYMENT_FILTER_OPTIONS = [
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'all', label: 'All' },
];

export const ORDER_SOURCE_FILTER_OPTIONS = [
    { value: 'ubereats', label: 'UberEats' },
    { value: 'doordash', label: 'DoorDash' },
    { value: 'inhouse', label: 'In-house' },
    { value: 'all', label: 'All' },
];
