/* ========================================
   CHLOE & DYLAN WEDDING WEBSITE
   PRIVATE PHOTO UPLOAD SYSTEM
======================================== */

/* ---------- SUPABASE CONFIG ---------- */

const SUPABASE_URL = "https://setudkercboguhbujvbn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_krmeukFTrwXcGUjNV7ZoBw_Vpz_IyVE";

const SUPABASE_FUNCTION_URL =
    `${SUPABASE_URL}/functions/v1/create-upload`;

const STORAGE_BUCKET = "wedding-photos";

/* ---------- ELEMENTS ---------- */

const photoInput = document.getElementById("photoInput");
const uploadBox = document.getElementById("uploadBox");
const previewSection = document.getElementById("previewSection");
const previewGrid = document.getElementById("previewGrid");
const photoCount = document.getElementById("photoCount");
const submitButton = document.getElementById("submitButton");
const successMessage = document.getElementById("successMessage");
const addMoreButton = document.getElementById("addMoreButton");

/* ---------- STATE ---------- */

let selectedPhotos = [];

/* ---------- SUPABASE ---------- */

let supabaseClient = null;

async function getSupabaseClient() {

    if (supabaseClient) {
        return supabaseClient;
    }

    try {

        const { createClient } =
            await import(
                "https://esm.sh/@supabase/supabase-js@2"
            );

        supabaseClient = createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        return supabaseClient;

    } catch (error) {

        console.error(
            "Could not load Supabase:",
            error
        );

        throw new Error(
            "Could not connect to the photo service."
        );
    }
}

/* ---------- FILE SELECTION ---------- */

photoInput.addEventListener("change", function () {

    const files = Array.from(this.files);

    addPhotos(files);

    // Allows the same file to be selected again later.
    this.value = "";

});

/* ---------- ADD PHOTOS ---------- */

function addPhotos(files) {

    const imageFiles = files.filter(file =>
        file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
        return;
    }

    imageFiles.forEach(file => {

        /*
            Prevent duplicate files from being added.
        */

        const alreadyAdded = selectedPhotos.some(
            existingFile =>
                existingFile.name === file.name &&
                existingFile.size === file.size &&
                existingFile.lastModified === file.lastModified
        );

        if (!alreadyAdded) {
            selectedPhotos.push(file);
        }

    });

    renderPreviews();
}

/* ---------- RENDER PREVIEWS ---------- */

function renderPreviews() {

    previewGrid.innerHTML = "";

    if (selectedPhotos.length === 0) {

        previewSection.hidden = true;

        return;
    }

    previewSection.hidden = false;

    selectedPhotos.forEach((file, index) => {

        const container =
            document.createElement("div");

        container.className = "photo-preview";

        const image =
            document.createElement("img");

        image.alt = "Selected wedding photo";

        /*
            createObjectURL lets us preview the local
            image without uploading it anywhere.
        */

        const objectURL =
            URL.createObjectURL(file);

        image.src = objectURL;

        image.onload = () => {
            URL.revokeObjectURL(objectURL);
        };

        const removeButton =
            document.createElement("button");

        removeButton.className = "remove-photo";
        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            "Remove photo"
        );

        removeButton.addEventListener(
            "click",
            function () {

                removePhoto(index);

            }
        );

        container.appendChild(image);
        container.appendChild(removeButton);

        previewGrid.appendChild(container);

    });

    updatePhotoCount();
}

/* ---------- REMOVE PHOTO ---------- */

function removePhoto(index) {

    selectedPhotos.splice(index, 1);

    renderPreviews();
}

/* ---------- PHOTO COUNT ---------- */

function updatePhotoCount() {

    const count = selectedPhotos.length;

    if (count === 1) {

        photoCount.textContent = "1 photo";

    } else {

        photoCount.textContent =
            `${count} photos`;

    }
}

/* ---------- DRAG & DROP ---------- */

uploadBox.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadBox.classList.add("dragging");

    }
);

uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.classList.remove("dragging");

    }
);

uploadBox.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadBox.classList.remove("dragging");

        const files =
            Array.from(event.dataTransfer.files);

        addPhotos(files);

    }
);

/* ---------- CREATE UPLOAD PERMISSION ---------- */

async function createUploadPermission(file) {

    const response = await fetch(
        SUPABASE_FUNCTION_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_PUBLISHABLE_KEY
            },

            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type
            })
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "The photo server returned an invalid response."
        );
    }

    if (!response.ok || !data.success) {

        throw new Error(
            data.error ||
            "Could not prepare the photo upload."
        );
    }

    return data;
}

/* ---------- UPLOAD ONE PHOTO ---------- */

async function uploadPhoto(file) {

    const supabase = await getSupabaseClient();

    /*
        The Edge Function gives us:

        path
        token

        The token only authorizes this particular
        upload instead of giving the guest access
        to the entire private bucket.
    */

    const uploadPermission =
        await createUploadPermission(file);

    const {
        path,
        token
    } = uploadPermission;

    const {
        error
    } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(
            path,
            token,
            file
        );

    if (error) {

        console.error(
            "Storage upload error:",
            error
        );

        throw new Error(
            `Could not upload ${file.name}.`
        );
    }

    return {
        path,
        originalName: file.name
    };
}

/* ---------- UPLOAD ALL PHOTOS ---------- */

async function uploadAllPhotos() {

    const uploadedPhotos = [];

    for (
        let index = 0;
        index < selectedPhotos.length;
        index++
    ) {

        const file =
            selectedPhotos[index];

        submitButton.textContent =
            `Uploading ${index + 1} of ${selectedPhotos.length}...`;

        const result =
            await uploadPhoto(file);

        uploadedPhotos.push(result);
    }

    return uploadedPhotos;
}

/* ---------- SUBMIT ---------- */

submitButton.addEventListener(
    "click",
    async function () {

        if (selectedPhotos.length === 0) {

            alert(
                "Please select at least one photo."
            );

            return;
        }

        submitButton.disabled = true;

        try {

            /*
                Actually upload the selected photos
                to the private Supabase bucket.
            */

            await uploadAllPhotos();

            /*
                Photos are now stored privately.
                Guests do not receive permission to
                browse the wedding collection.
            */

            previewSection.hidden = true;

            successMessage.hidden = false;

            submitButton.textContent =
                "Photos Sent ✓";

            selectedPhotos = [];

        } catch (error) {

            console.error(
                "Photo upload failed:",
                error
            );

            alert(
                error.message ||
                "Something went wrong while uploading your photos. Please try again."
            );

            submitButton.disabled = false;

            submitButton.textContent =
                "Send Photos";

            return;
        }

        /*
            Keep the success state visible.
        */

        submitButton.disabled = false;
    }
);

/* ---------- ADD MORE PHOTOS ---------- */

addMoreButton.addEventListener(
    "click",
    function () {

        selectedPhotos = [];

        previewGrid.innerHTML = "";

        photoCount.textContent =
            "0 photos";

        successMessage.hidden = true;

        uploadBox.hidden = false;

        submitButton.textContent =
            "Send Photos";

        photoInput.click();

    }
);

/* ---------- INITIAL STATE ---------- */

previewSection.hidden = true;

successMessage.hidden = true;
