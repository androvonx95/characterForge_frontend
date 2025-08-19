import supabase from "./supabaseClient";


export interface CreateCharacterPayload {
    name: string;
    prompt: string;
    private?: boolean;
}


export async function createCharacter( payLoad: CreateCharacterPayload ){
    try{

        const { data } = await supabase.auth.getSession();
        if (!data.session){
            throw new Error("Not authenticated");
        }

        const token = data.session.access_token;
        if (!token){
            throw new Error("No token found");
        }
        const response = await fetch(import.meta.env.VITE_CREATE_CHARACTER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payLoad),
        });

        if( !response.ok){
            const err = await response.json().catch(() => ({}));
            throw new Error( err.details || "Failed to create character");
        }

        const result = await response.json();

        return result;

    }catch( err: any ){
        console.error(err);
        throw err;
    }
}