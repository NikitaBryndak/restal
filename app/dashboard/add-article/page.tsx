import FormInput from "@/components/ui/form-input";


export default function AddArticlePage() {
    return (
        <div className="min-h-screen relative">
            <form>
                <FormInput labelText="Title" placeholder="Article Title" name="title" id="title"></FormInput>
                <FormInput labelText="Description" placeholder="Article Description" name="description" id="description"></FormInput>
                <FormInput labelText="Content" placeholder="Article Content" name="content" id="content"></FormInput>
            </form>
        </div>
    )
}