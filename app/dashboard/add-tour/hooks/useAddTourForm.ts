import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tourSchema, TourFormValues } from '../schema';
import { PreviewState } from '../types';
import { blankPreview } from '../constants';
import { getCurrentDate } from '@/lib/utils';
import { Documents, DEFAULT_DOCUMENTS, DOCUMENT_KEYS, DOCUMENT_LABELS } from '@/types';

export const useAddTourForm = () => {
    const router = useRouter();
    const curDate = getCurrentDate();

    // Document state
    const [documents, setDocuments] = useState<Documents>(DEFAULT_DOCUMENTS);
    const [pendingFiles, setPendingFiles] = useState<Record<keyof Documents, File | null>>(() => {
        const files: any = {};
        DOCUMENT_KEYS.forEach(k => files[k] = null);
        return files as Record<keyof Documents, File | null>;
    });
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<TourFormValues>({
        resolver: zodResolver(tourSchema) as any,
        defaultValues: {
            number: '',
            country: '',
            region: '',
            hotelNights: 0,
            tripStartDate: '',
            tripEndDate: '',
            food: '',
            bookingDate: '',
            hotelName: '',
            hotelCheckIn: '',
            hotelCheckOut: '',
            roomType: '',
            departureCountry: '',
            departureAirport: '',
            departureFlight: '',
            departureDate: '',
            departureTime: '',
            arrivalCountry: '',
            arrivalAirport: '',
            arrivalFlight: '',
            arrivalDate: '',
            arrivalTime: '',
            travellers: [],
            insurance: false,
            transfer: false,
            paymentTotal: 0,
            paymentPaid: 0,
            paymentDeadline: '',
            ownerPhone: '',
        },
        mode: 'onChange',
    });

    const { watch, handleSubmit: hookFormSubmit } = form;
    const formValues = watch();

    const mapToPreview = (values: TourFormValues): PreviewState => {
        const travellers = values.travellers?.length ? values.travellers.map(t => ({
            name: t.firstName || 'Traveller',
            surname: t.lastName || 'Pending',
            sex: t.sex || 'unspecified',
            passportExpiryDate: t.passportExpiry || '',
            dob: t.dob || '',
        })) : [{
            name: 'Traveller',
            surname: 'Pending',
            sex: 'unspecified',
            passportExpiryDate: '',
            dob: '',
        }];

        return {
            number: values.number || '',
            country: values.country || '',
            bookingDate: values.bookingDate || curDate,
            tripStartDate: values.tripStartDate || '',
            tripEndDate: values.tripEndDate || '',
            flightInfo: {
                departure: {
                    country: values.departureCountry || '',
                    airportCode: values.departureAirport?.toUpperCase() || '',
                    flightNumber: values.departureFlight?.toUpperCase() || '',
                    date: values.departureDate || '',
                    time: values.departureTime || '',
                },
                arrival: {
                    country: values.arrivalCountry || '',
                    airportCode: values.arrivalAirport?.toUpperCase() || '',
                    flightNumber: values.arrivalFlight?.toUpperCase() || '',
                    date: values.arrivalDate || '',
                    time: values.arrivalTime || '',
                },
            },
            hotel: {
                name: values.hotelName || '',
                checkIn: values.hotelCheckIn || values.tripStartDate || '',
                checkOut: values.hotelCheckOut || values.tripEndDate || '',
                food: values.food || '',
                nights: values.hotelNights || 0,
                roomType: values.roomType || '',
            },
            tourists: travellers,
            addons: {
                insurance: values.insurance || false,
                transfer: values.transfer || false,
            },
            payment: {
                totalAmount: values.paymentTotal || 0,
                paidAmount: values.paymentPaid || 0,
                deadline: values.paymentDeadline || '',
            },
            ownerPhone: values.ownerPhone || '',
        };
    };

    const previewState = mapToPreview(formValues as TourFormValues);

    const handleFileSelect = (key: keyof Documents, file: File) => {
        setPendingFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleFileClear = (key: keyof Documents) => {
        setPendingFiles(prev => ({ ...prev, [key]: null }));
    };

    const handleToggleReady = (key: keyof Documents, isReady: boolean) => {
        setDocuments(prev => ({
            ...prev,
            [key]: { ...prev[key], uploaded: isReady }
        }));
    };

    const onSubmit = async (data: TourFormValues) => {
        setIsUploading(true);
        try {
            const finalDocuments = { ...documents };

            for (const key of DOCUMENT_KEYS) {
                const file = pendingFiles[key];
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', 'documents');

                    try {
                        const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (uploadRes.ok) {
                            const { url } = await uploadRes.json();
                            finalDocuments[key] = {
                                ...finalDocuments[key],
                                url: url,
                                uploaded: true
                            };
                        } else {
                            const errorText = await uploadRes.text();
                            alert(`Failed to upload ${DOCUMENT_LABELS[key] || key}: ${errorText}`);
                            setIsUploading(false);
                            return;
                        }
                    } catch {
                        alert(`Error uploading ${DOCUMENT_LABELS[key] || key}.`);
                        setIsUploading(false);
                        return;
                    }
                }
            }

            const payload = {
            number: data.number,
            country: data.country,
            region: data.region,
            bookingDate: data.bookingDate || curDate,
            tripStartDate: data.tripStartDate,
            tripEndDate: data.tripEndDate,
            flightInfo: {
                departure: {
                    country: data.departureCountry,
                    airportCode: data.departureAirport?.toUpperCase(),
                    flightNumber: data.departureFlight?.toUpperCase(),
                    date: data.departureDate,
                    time: data.departureTime,
                },
                arrival: {
                    country: data.arrivalCountry,
                    airportCode: data.arrivalAirport?.toUpperCase(),
                    flightNumber: data.arrivalFlight?.toUpperCase(),
                    date: data.arrivalDate,
                    time: data.arrivalTime,
                },
            },
            hotel: {
                name: data.hotelName,
                checkIn: data.hotelCheckIn || data.tripStartDate,
                checkOut: data.hotelCheckOut || data.tripEndDate,
                food: data.food,
                nights: data.hotelNights,
                roomType: data.roomType,
            },
            tourists: data.travellers.map(t => ({
                name: t.firstName,
                surname: t.lastName,
                sex: t.sex,
                passportExpiryDate: t.passportExpiry,
                dob: t.dob,
                passportNumber: t.passportNumber,
                passportSeries: t.passportSeries,
                passportIssueDate: t.passportIssueDate,
            })),
            addons: {
                insurance: data.insurance,
                transfer: data.transfer,
            },
            payment: {
                totalAmount: data.paymentTotal,
                paidAmount: data.paymentPaid,
                deadline: data.paymentDeadline,
            },
            ownerPhone: data.ownerPhone,
            documents: finalDocuments,
        };


            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const resData = await res.json().catch(() => ({}));
                alert('Error creating trip: ' + (resData.message || res.statusText));
                return;
            }
            alert('Trip created');
            router.push('/dashboard');
        } catch {
            alert('Error creating trip');
        } finally {
            setIsUploading(false);
        }
    };

    const onError = (errors: Record<string, { message?: string }>) => {
        const errorMessages = Object.values(errors)
            .map((error) => error.message)
            .filter(Boolean);

        if (errorMessages.length > 0) {
            alert(`Please fix the following errors:\n${errorMessages.join('\n')}`);
        } else {
            alert('Please check the form for errors.');
        }
    };

    return {
        form,
        previewState,
        onSubmit: hookFormSubmit(onSubmit, onError),
        documents,
        pendingFiles,
        isUploading,
        handleFileSelect,
        handleFileClear,
        handleToggleReady
    };
};
