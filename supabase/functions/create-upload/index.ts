import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers":
"authorization, x-client-info, apikey, content-type",
"Access-Control-Allow-Methods":
"POST, OPTIONS",
};

Deno.serve(async (req) => {

```
// Handle browser CORS preflight requests.
if (req.method === "OPTIONS") {
    return new Response("ok", {
        headers: corsHeaders,
    });
}


try {

    // Only allow POST requests.
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({
                error: "Method not allowed",
            }),
            {
                status: 405,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );
    }


    /*
        These values will be stored as Supabase Edge Function
        secrets later.

        NEVER put the service role key inside index.html,
        style.css, or script.js.
    */

    const supabaseUrl =
        Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");


    if (!supabaseUrl || !serviceRoleKey) {

        throw new Error(
            "Supabase environment variables are not configured."
        );

    }


    /*
        This client uses the service role key ONLY on the
        server side.

        Guests will never receive this key.
    */

    const supabase = createClient(
        supabaseUrl,
        serviceRoleKey
    );


    // Read the upload information sent by the website.
    const body = await req.json();

    const originalName =
        typeof body.fileName === "string"
            ? body.fileName
            : "";

    const contentType =
        typeof body.contentType === "string"
            ? body.contentType
            : "";


    // Basic validation.
    if (!originalName || !contentType) {

        return new Response(
            JSON.stringify({
                error: "File name and content type are required.",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );

    }


    // Only images are allowed.
    if (!contentType.startsWith("image/")) {

        return new Response(
            JSON.stringify({
                error: "Only image files are allowed.",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );

    }


    /*
        Create a safe random filename.

        We do NOT use the user's original filename as the
        storage filename.

        Example:

        wedding/8c3f...-photo.jpg
    */

    const extension =
        originalName.includes(".")
            ? originalName
                .split(".")
                .pop()
                ?.toLowerCase()
            : "jpg";


    const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "heic",
        "heif",
        "gif",
    ];


    if (!extension || !allowedExtensions.includes(extension)) {

        return new Response(
            JSON.stringify({
                error: "Unsupported image format.",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );

    }


    const randomId =
        crypto.randomUUID();


    const filePath =
        `wedding/${randomId}.${extension}`;


    /*
        Create a temporary signed upload URL.

        The frontend will use this URL to upload the actual
        photo directly to private Supabase Storage.

        Guests do NOT receive access to the rest of the
        wedding collection.
    */

    const {
        data,
        error,
    } = await supabase.storage
        .from("wedding-photos")
        .createSignedUploadUrl(filePath);


    if (error) {

        console.error(
            "Signed upload URL error:",
            error
        );

        throw new Error(
            "Could not create upload permission."
        );

    }


    return new Response(
        JSON.stringify({
            success: true,

            path: filePath,

            token: data.token,
        }),
        {
            status: 200,

            headers: {
                ...corsHeaders,

                "Content-Type":
                    "application/json",
            },
        }
    );


} catch (error) {

    console.error(
        "Create upload error:",
        error
    );


    return new Response(
        JSON.stringify({
            success: false,

            error:
                error instanceof Error
                    ? error.message
                    : "Unexpected server error.",
        }),
        {
            status: 500,

            headers: {
                ...corsHeaders,

                "Content-Type":
                    "application/json",
            },
        }
    );

}
```

});
