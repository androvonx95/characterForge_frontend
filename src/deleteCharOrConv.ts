import supabase from "./supabaseClient";

export interface DeleteEntityPayload {
    entity_id: string; // UUID of the entity to be deleted
    entity_type: 'conversation' | 'character'; // Type of the entity (either 'conversation' or 'character')
}

export async function deleteEntity(payload: DeleteEntityPayload) {
    try {
        // Get the current session from Supabase
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
            throw new Error("Not authenticated");
        }

        // Extract the token from the session
        const token = data.session.access_token;
        if (!token) {
            throw new Error("No token found");
        }

        // Make the request to the endpoint
        const response = await fetch(import.meta.env.VITE_DELETE_ENTITY_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        // Handle unsuccessful response
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.details || "Failed to delete entity");
        }

        // Parse the result and return it
        const result = await response.json();
        return result;

    } catch (err: any) {
        console.error(err);
        throw err; // Propagate the error after logging it
    }
}
