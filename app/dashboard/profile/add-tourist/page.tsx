import FormInput from "@/components/ui/form-input";

export default function AddTouristPage() {
    return (
        <div className="min-h-screen relative">
            <form>
                <FormInput labelText="Name" placeholder="Name" name="name" id="name"></FormInput>
                <FormInput labelText="Surname" placeholder="Name" name="name" id="name"></FormInput>
                <FormInput labelText="Name" placeholder="Name" name="name" id="name"></FormInput>
            </form>
        </div>
    )
}