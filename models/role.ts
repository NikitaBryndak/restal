import mongoose, { Schema } from "mongoose";

/**
 * Dynamic access role. A role grants whole groups (see config/access.ts) and
 * may override individual pages within those groups:
 *   - pageOverrides[page] === true  -> granted even if its group is off
 *   - pageOverrides[page] === false -> denied even if its group is on
 *   - absent                        -> follows the group
 */

export interface IRole {
    slug: string;              // unique ASCII identifier, e.g. "client", "bookkeeper"
    name: string;              // display name (Ukrainian), e.g. "Клієнт"
    description?: string;
    isSystem: boolean;         // client/editor/manager/admin — cannot be deleted or renamed
    groups: string[];          // enabled group slugs
    pageOverrides: Record<string, boolean>; // per-page overrides (page slug -> allowed)
    createdAt?: Date;
    updatedAt?: Date;
}

const roleSchema = new Schema(
    {
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        isSystem: { type: Boolean, default: false },
        groups: { type: [String], default: [] },
        pageOverrides: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    delete (mongoose.models as Record<string, unknown>).Role;
}

const Role = mongoose.models.Role || mongoose.model<IRole>("Role", roleSchema);

export default Role;
