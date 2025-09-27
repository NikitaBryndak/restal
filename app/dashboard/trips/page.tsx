import TripCard from "@/components/trip/trip-card"
import Link from "next/link"

export default function TripsPage(){
    
    const tripsData = [
        {
            number: 1,
            bookingDate: "14-06-2025",
            tripStartDate: "20-06-2025",
            tripEndDate: "24-06-2025",
            country: "UK",
            flightInfo: {
                departure: {
                    airportCode: "KRK",
                    country: "Poland",
                    flightNumber: "EZ8822",
                    date: "19-06-2025",
                    time: "14:35"
                },
                arrival: {
                    airportCode: "KRK",
                    country: "Poland",
                    flightNumber: "EZ0000",
                    date: "23-06-2025",
                    time: "22:35"  
                }
            },
            hotel: {
                name: "Voyage Belek"
            },
            food: "All",
            hotelNights: 3,
            tourists: [
                {
                    name: "Name1",
                    surname: "Surname1",
                    pasportExpiryDate: "31-12-2025",
                    DOB: ""
                },
                {
                    name: "Name2",
                    surname: "Surname2",
                    pasportExpiryDate: "31-10-2026"
                }
            ],
            addons: {
                insurance: true,
                transfer: true
            }

        },
        {
            number: 2,
            bookingDate: "15-07-2025",
            tripStartDate: "01-08-2025",
            tripEndDate: "10-08-2025",
            country: "Spain",
            flightInfo: {
                departure: {
                    airportCode: "MAD",
                    country: "Spain",
                    flightNumber: "IB1234",
                    date: "01-08-2025",
                    time: "10:00"
                },
                arrival: {
                    airportCode: "MAD",
                    country: "Spain",
                    flightNumber: "IB5678",
                    date: "10-08-2025",
                    time: "18:00"  
                }
            },
            hotel: {
                name: "Costa del Sol Resort"
            },
            food: "Breakfast",
            hotelNights: 9,
            tourists: [
                {
                    name: "John",
                    surname: "Doe",
                    pasportExpiryDate: "15-03-2027",
                    DOB: "01-01-1990"
                }
            ],
            addons: {
                insurance: false,
                transfer: true
            }

        },
        {
            number: 3,
            bookingDate: "20-08-2025",
            tripStartDate: "15-09-2025",
            tripEndDate: "25-09-2025",
            country: "Italy",
            flightInfo: {
                departure: {
                    airportCode: "FCO",
                    country: "Italy",
                    flightNumber: "AZ9999",
                    date: "15-09-2025",
                    time: "08:30"
                },
                arrival: {
                    airportCode: "FCO",
                    country: "Italy",
                    flightNumber: "AZ8888",
                    date: "25-09-2025",
                    time: "20:45"  
                }
            },
            hotel: {
                name: "Rome Grand Hotel"
            },
            food: "Half Board",
            hotelNights: 10,
            tourists: [
                {
                    name: "Jane",
                    surname: "Smith",
                    pasportExpiryDate: "22-11-2026",
                    DOB: "15-05-1985"
                },
                {
                    name: "Bob",
                    surname: "Johnson",
                    pasportExpiryDate: "30-06-2028",
                    DOB: "20-12-1992"
                }
            ],
            addons: {
                insurance: true,
                transfer: false
            }

        }
    ]

    const tripCards = tripsData.map((trip) => <Link href={`/dashboard/trips/${trip.number}`} key={trip.number}><TripCard data={trip} /></Link>)
    
    return (
        <div>
            <>{tripCards}</>
        </div>
    )
}