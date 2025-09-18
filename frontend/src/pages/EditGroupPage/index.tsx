import { useLocation } from "react-router-dom"
import type { Group } from "../../models/groups"
import EditGroupForm from "./appearance/EditGroupForm"

export default function EditGroupPage() {
    const location = useLocation()
    const group = location.state.group as Group

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Edit {group.name}</h2>
            </div>
            <EditGroupForm />
        </div>
    )
}