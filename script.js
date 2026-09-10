/* ========================================
CHLOE & DYLAN WEDDING WEBSITE
PHOTO UPLOAD SYSTEM
======================================== */

/* ---------- ELEMENTS ---------- */

const photoInput = document.getElementById("photoInput");

const uploadBox = document.getElementById("uploadBox");

const previewSection =
document.getElementById("previewSection");

const previewGrid =
document.getElementById("previewGrid");

const photoCount =
document.getElementById("photoCount");

const submitButton =
document.getElementById("submitButton");

const successMessage =
document.getElementById("successMessage");

const addMoreButton =
document.getElementById("addMoreButton");

/* ---------- STATE ---------- */

/*
This array contains the photos selected by the guest.

```
IMPORTANT:
At this stage they only exist temporarily in the browser.

Later, we'll replace the submit function with the
Supabase private upload system.
```

*/

let selectedPhotos = [];

/* ---------- FILE SELECTION ---------- */

photoInput.addEventListener("change", function () {

```
const files = Array.from(this.files);

addPhotos(files);

// Allows the same file to be selected again later.
this.value = "";
```

});

/* ---------- ADD PHOTOS ---------- */

function addPhotos(files) {

```
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
```

}

/* ---------- RENDER PREVIEWS ---------- */

function renderPreviews() {

```
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


    /*
        createObjectURL lets us preview the local
        image without uploading it anywhere.
    */

    image.src =
        URL.createObjectURL(file);


    container.appendChild(image);

    container.appendChild(removeButton);

    previewGrid.appendChild(container);

});


updatePhotoCount();
```

}

/* ---------- REMOVE PHOTO ---------- */

function removePhoto(index) {

```
selectedPhotos.splice(index, 1);

renderPreviews();
```

}

/* ---------- PHOTO COUNT ---------- */

function updatePhotoCount() {

```
const count = selectedPhotos.length;

if (count === 1) {

    photoCount.textContent = "1 photo";

} else {

    photoCount.textContent =
        `${count} photos`;

}
```

}

/* ---------- DRAG & DROP ---------- */

uploadBox.addEventListener(
"dragover",
function (event) {

```
    event.preventDefault();

    uploadBox.classList.add("dragging");

}
```

);

uploadBox.addEventListener(
"dragleave",
function () {

```
    uploadBox.classList.remove("dragging");

}
```

);

uploadBox.addEventListener(
"drop",
function (event) {

```
    event.preventDefault();

    uploadBox.classList.remove("dragging");

    const files =
        Array.from(event.dataTransfer.files);

    addPhotos(files);

}
```

);

/* ---------- SUBMIT ---------- */

submitButton.addEventListener(
"click",
async function () {

```
    if (selectedPhotos.length === 0) {

        alert("Please select at least one photo.");

        return;
    }


    /*
        THIS IS TEMPORARY.

        Later this button will send the photos to
        the private Supabase storage system.

        We are intentionally NOT uploading anything
        yet.
    */

    submitButton.disabled = true;

    submitButton.textContent =
        "Preparing photos...";


    /*
        Small delay so we can test the interface.
    */

    await new Promise(resolve =>
        setTimeout(resolve, 1000)
    );


    /*
        Temporary success state.
    */

    previewSection.hidden = true;

    successMessage.hidden = false;

    submitButton.disabled = false;

    submitButton.textContent =
        "Send Photos";

}
```

);

/* ---------- ADD MORE PHOTOS ---------- */

addMoreButton.addEventListener(
"click",
function () {

```
    selectedPhotos = [];

    previewGrid.innerHTML = "";

    photoCount.textContent = "0 photos";

    successMessage.hidden = true;

    uploadBox.hidden = false;

    photoInput.click();

}
```

);

/* ---------- INITIAL STATE ---------- */

previewSection.hidden = true;

successMessage.hidden = true;
