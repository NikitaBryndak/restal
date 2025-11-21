import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tourSchema, TourFormValues } from '../schema';
import { PreviewState } from '../types';
import { blankPreview } from '../constants';
import { getCurrentDate } from '@/lib/utils';

export const useAddTourForm = () => {
    const router = useRouter();
    const curDate = getCurrentDate();

    const form = useForm<TourFormValues>({
        resolver: zodResolver(tourSchema) as any,
        defaultValues: {
            travellers: [],
            insurance: false,
            transfer: false,
            hotelNights: 0,
            paymentTotal: 0,
            paymentPaid: 0,
        },
        mode: 'onChange',
    });

    const { watch, handleSubmit: hookFormSubmit } = form;
    const formValues = watch();

    const [previewState, setPreviewState] = useState<PreviewState>(blankPreview);

    useEffect(() => {
        const mapToPreview = (values: TourFormValues): PreviewState => {
            const travellers = values.travellers?.length ? values.travellers.map(t => ({
                name: t.firstName || 'Traveller',
                surname: t.lastName || 'Pending',
                sex: t.sex || 'unspecified',
                pasportExpiryDate: t.passportExpiry || '',
                DOB: t.dob || '',
            })) : [{
                name: 'Traveller',
                surname: 'Pending',
                sex: 'unspecified',
                pasportExpiryDate: '',
                DOB: '',
            }];

            return {
                number: 0,
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
                ownerEmail: values.ownerEmail || '',
            };
        };

        setPreviewState(mapToPreview(formValues as TourFormValues));
    }, [formValues, curDate]);

    const onSubmit = async (data: TourFormValues) => {
        const payload = {
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
                pasportExpiryDate: t.passportExpiry,
                DOB: t.dob,
                PasportNumber: t.passportNumber,
                PasportSeries: t.passportSeries,
                PasportIsueDate: t.passportIssueDate,
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
            ownerEmail: data.ownerEmail,
            documents: data.documents,
        };

        try {
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
        } catch (err) {
            console.error('Create trip error', err);
            alert('Error creating trip');
        }
    };

    return {
        form,
        previewState,
        onSubmit: hookFormSubmit(onSubmit),
    };
};
