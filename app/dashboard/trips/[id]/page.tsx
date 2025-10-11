export default async function TripPage({ params }: { params: { id: string } }) {
    const { id } = params;
    return (
        <div className="min-h-screen relative">
            <h1 className="text-3xl font-bold mb-6">Trip Details for Trip ID: {id}</h1>
        </div>
    );
}