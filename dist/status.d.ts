export type BookingStatus = 'received' | 'scheduled' | 'rescheduled' | 'ongoing' | 'completed' | 'cancelled' | 'expired' | 'lapsed';
export type StatusFamily = 'upcoming' | 'live' | 'done' | 'stopped';
export interface BookingStatusInfo { family: StatusFamily; icon: string; en: string; hi: string }
export declare const BOOKING_STATUS: Readonly<Record<BookingStatus, BookingStatusInfo>>;
export declare const STATUS_FAMILIES: readonly StatusFamily[];
export declare const STATUS_FAMILY_CLASSES: Readonly<Record<StatusFamily, string>>;
export declare function bookingStatus(status: string): BookingStatusInfo | null;
