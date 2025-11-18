import { Documents } from '@/types';

export const DEFAULT_DOCUMENTS: Documents = {
    contract: { uploaded: false, url: '' },
    invoice: { uploaded: false, url: '' },
    confirmation: { uploaded: false, url: '' },
    tickets: { uploaded: false, url: '' },
    voucher: { uploaded: false, url: '' },
    insurancePolicy: { uploaded: false, url: '' },
    tourProgram: { uploaded: false, url: '' },
    memo: { uploaded: false, url: '' },
};

export const DOCUMENT_LABELS: Record<keyof Documents, string> = {
    contract: 'Contract',
    invoice: 'Invoice',
    confirmation: 'Booking confirmation',
    tickets: 'Tickets',
    voucher: 'Voucher',
    insurancePolicy: 'Insurance policy',
    tourProgram: 'Tour program',
    memo: 'Manager memo',
};

export const DOCUMENT_KEYS = Object.keys(DEFAULT_DOCUMENTS) as (keyof Documents)[];
