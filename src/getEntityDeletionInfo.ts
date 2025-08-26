import supabase from "./supabaseClient";

export interface GetEntityDeletionDetailsPayload {
    p_entity_id: string;  // UUID of the entity (conversation or character)
    p_entity_type: 'conversation' | 'character';  // Type of entity (either 'conversation' or 'character')
}

export async function getEntityDeletionDetails(payload: GetEntityDeletionDetailsPayload) {
    try {
        // Get the current session from Supabase
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
            throw new Error("Not authenticated");
        }

        const token = data.session.access_token;
        if (!token) {
            throw new Error("No token found");
        }

        // Make the request to the Edge Function
        const response = await fetch(import.meta.env.VITE_GET_ENTITY_DELETION_DETAILS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to get entity deletion details");
        }

        // Parse and return the result
        const result = await response.json();
        return result;

    } catch (err: any) {
        console.error(err);
        throw err; // Propagate the error after logging it
    }
}
