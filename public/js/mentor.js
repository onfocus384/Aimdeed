

const url = 'https://script.google.com/macros/s/AKfycbzHb4c98lyAsQFd45R4qzISifja1OOjmY2S1H5-rrhw7t5fRbHCIujYUetVy-TIJkQx/exec';

const form = document.querySelector('#form');
form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission

    // Change button text to indicate submission is in progress
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.innerHTML = "Submitting...";

    // Validate form fields
    const name = document.getElementById("name").value.trim();
    const gender = document.getElementById("gender").value;
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const school = document.getElementById("school").value.trim();
    const classLevel = document.getElementById("class").value.trim();
    const city = document.getElementById("city").value.trim();
    const district = document.getElementById("district").value.trim();
    const state = document.getElementById("state").value.trim();
    const careerGoal = document.getElementById("career-goal").value.trim();
    const studyTime = document.getElementById("study-time").value;

    // Validation rules
    if (!name || name.length < 2) {
        alert("Please enter a valid name (at least 2 characters).");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!gender) {
        alert("Please select a gender.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit phone number.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!school || school.length < 2) {
        alert("Please enter a valid school name.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!classLevel || classLevel < 1 || classLevel > 12) {
        alert("Please enter a valid class (between 1 and 12).");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!city || city.length < 2) {
        alert("Please enter a valid city name.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!district || district.length < 2) {
        alert("Please enter a valid district name.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!state || state.length < 2) {
        alert("Please enter a valid state name.");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!careerGoal || careerGoal.length < 5) {
        alert("Please enter a valid career goal (at least 5 characters).");
        submitButton.innerHTML = "Submit";
        return;
    }

    if (!studyTime) {
        alert("Please select a valid study time.");
        submitButton.innerHTML = "Submit";
        return;
    }

    // If all validations pass, submit the form data
    const formData = new FormData(form);
    fetch(url, {
        method: "POST",
        body: formData
    })
    .then((res) => res.text())
    .then((finalRes) => {
        // Reset button text
        submitButton.innerHTML = "Submit";

        // Display the response message
        document.getElementById("res").innerHTML = finalRes;

        // Reset the form
        form.reset();

        // Clear the response message after 6 seconds
        setTimeout(() => {
            document.getElementById("res").innerHTML = "";
        }, 5000);
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while submitting the form. Please try again.");
        submitButton.innerHTML = "Submit";
    });
});