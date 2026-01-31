import FormInput from "@/components/ui/form-input";


export default function AddArticlePage() {
    return (
        <div className="min-h-screen relative">
            <form>
                <FormInput labelText="Заголовок" placeholder="Заголовок статті" name="title" id="title"></FormInput>
                <FormInput labelText="Опис" placeholder="Опис статті" name="description" id="description"></FormInput>
                <FormInput labelText="Зміст" placeholder="Зміст статті" name="content" id="content"></FormInput>
            </form>
        </div>
    )
}