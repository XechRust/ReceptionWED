const SUPABASE_URL = "https://setudkercboguhbujvbn.supabase.co";

const SUPABASE_KEY = "sb_publishable_krmeukFTrwXcGUjNV7ZoBw_Vpz_IyVE";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ================================
// ELEMENTS
// ================================

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");

const photoGallery = document.getElementById("photoGallery");
const photoTotal = document.getElementById("photoTotal");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");


// ================================
// SHOW / HIDE SECTIONS
// ================================

function showLogin() {
    loginSection.hidden = false;
    adminSection.hidden = true;
}

function showAdmin() {
    loginSection.hidden = true;
    adminSection.hidden = false;
}


// ================================
// LOGIN
// ================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    loginError.hidden = true;
    loginError.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error(
                "Login failed. No session was created."
            );
        }

        showAdmin();

        await loadPhotos();

    } catch (error) {

        console.error("Login error:", error);

        loginError.textContent =
            error.message || "Unable to sign in.";

        loginError.hidden = false;

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});


// ================================
// LOGOUT
// ================================

logoutButton.addEventListener("click", async () => {

    logoutButton.disabled = true;
    logoutButton.textContent = "Signing out...";

    try {

        await supabaseClient.auth.signOut();

        showLogin();

        loginForm.reset();

    } catch (error) {

        console.error("Logout error:", error);

    } finally {

        logoutButton.disabled = false;
        logoutButton.textContent = "Sign Out";
    }
});


// ================================
// REFRESH
// ================================

refreshButton.addEventListener(
    "click",
    loadPhotos
);


// ================================
// LOAD PHOTOS
// ================================

async function loadPhotos() {

    loadingState.hidden = false;
    emptyState.hidden = true;

    photoGallery.innerHTML = "";

    photoTotal.textContent =
        "Loading photos...";

    try {

        const {
            data: files,
            error
        } = await supabaseClient.storage
            .from("wedding-photos")
            .list("wedding", {
                limit: 1000,
                offset: 0,
                sortBy: {
                    column: "created_at",
                    order: "desc"
                }
            });

        if (error) {
            throw error;
        }

        const photos = files.filter(
            file =>
                file.name &&
                !file.name.startsWith(".")
        );

        loadingState.hidden = true;

        photoTotal.textContent =
            `${photos.length} ${
                photos.length === 1
                    ? "photo"
                    : "photos"
            }`;

        if (photos.length === 0) {

            emptyState.hidden = false;

            return;
        }

        for (const photo of photos) {

            await createPhotoCard(photo);
        }

    } catch (error) {

        console.error(
            "Failed to load photos:",
            error
        );

        loadingState.hidden = true;

        photoTotal.textContent =
            "Unable to load photos.";

        photoGallery.innerHTML = `
            <div class="error-message">
                Unable to load the private photo collection.
                Please try refreshing the page.
            </div>
        `;
    }
}


// ================================
// CREATE PHOTO CARD
// ================================

async function createPhotoCard(photo) {

    const filePath =
        `wedding/${photo.name}`;

    const {
        data,
        error
    } = await supabaseClient.storage
        .from("wedding-photos")
        .createSignedUrl(
            filePath,
            3600
        );

    if (error) {

        console.error(
            `Could not create URL for ${photo.name}:`,
            error
        );

        return;
    }

    const card =
        document.createElement("article");

    card.className =
        "photo-card";

    card.innerHTML = `
        <img
            src="${escapeHtml(data.signedUrl)}"
            alt="Wedding photo"
            loading="lazy"
        >

        <div class="photo-card-overlay">

            <button
                type="button"
                class="view-button"
            >
                View
            </button>

            <button
                type="button"
                class="download-button"
            >
                Download
            </button>

        </div>
    `;

    const image =
        card.querySelector("img");

    const viewButton =
        card.querySelector(".view-button");

    const downloadButton =
        card.querySelector(".download-button");


    // VIEW

    viewButton.addEventListener(
        "click",
        () => {

            window.open(
                data.signedUrl,
                "_blank",
                "noopener,noreferrer"
            );

        }
    );


    // DOWNLOAD

    downloadButton.addEventListener(
        "click",
        async () => {

            try {

                downloadButton.disabled = true;
                downloadButton.textContent =
                    "Downloading...";

                const response =
                    await fetch(data.signedUrl);

                if (!response.ok) {
                    throw new Error(
                        "Download failed."
                    );
                }

                const blob =
                    await response.blob();

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;
                link.download =
                    photo.name;

                document.body.appendChild(link);

                link.click();

                link.remove();

                URL.revokeObjectURL(url);

            } catch (error) {

                console.error(
                    "Download error:",
                    error
                );

                alert(
                    "Unable to download this photo."
                );

            } finally {

                downloadButton.disabled = false;
                downloadButton.textContent =
                    "Download";
            }
        }
    );


    // CLICK IMAGE TO VIEW

    image.addEventListener(
        "click",
        () => {

            window.open(
                data.signedUrl,
                "_blank",
                "noopener,noreferrer"
            );

        }
    );

    photoGallery.appendChild(card);
}


// ================================
// ESCAPE HTML
// ================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ================================
// SESSION CHECK
// ================================

async function checkSession() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (session) {

            showAdmin();

            await loadPhotos();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        showLogin();
    }
}


// ================================
// AUTH STATE CHANGES
// ================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {
            showLogin();
        }
    }
);


// ================================
// START
// ================================

checkSession();
