import { Button } from "./ui/button";

export default function Dashboard() {
    return (
        <div className="flex justify-center items-center min-h-screen flex-col gap-4 ">
            <div className="rounded-md border p-6 ">
                <h1>Dashboard</h1>
                <p>Name: Jhon Doe</p>
                <p>Email: jhon@example.com</p>
                <Button
                    className="mt-4"
                    variant="outline"
                >
                    Logout
                </Button>
            </div>
        </div>
    )
}