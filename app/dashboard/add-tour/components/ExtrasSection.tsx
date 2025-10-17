export const ExtrasSection = () => {
    return (
        <section className="space-y-4">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Extras</h2>
                <p className="text-sm text-foreground/60">Optional add-ons for peace of mind.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                    <input
                        type="checkbox"
                        name="insurance"
                        className="size-4 rounded border border-border/60 text-primary focus:ring-primary/30"
                    />
                    Travel insurance
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                    <input
                        type="checkbox"
                        name="transfer"
                        className="size-4 rounded border border-border/60 text-primary focus:ring-primary/30"
                    />
                    Airport transfer
                </label>
            </div>
        </section>
    );
};
