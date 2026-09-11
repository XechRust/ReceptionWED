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

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

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
            throw new Error("Login failed. No session was created.");
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

        console.error("Session check failed:", error);

        showLogin();
    }
}


// ================================
// PHOTO LOADING
// ================================

async function loadPhotos() {

    console.log("Photo loading will be connected next.");

}


// ================================
// AUTH STATE CHANGES
// ================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        if (event === "SIGNED_OUT" || !session) {

            showLogin();

        }

    }
);


// ================================
// START
// ================================

checkSession();
