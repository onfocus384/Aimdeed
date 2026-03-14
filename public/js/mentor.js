

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

    const statusEl = document.getElementById("res");

    // Helper to show modern non-blocking status messages
    function showStatus(message, isError = true) {
        statusEl.innerHTML = `<div class="alert mt-3 animate__animated animate__fadeIn" style="
            background: ${isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; 
            border: 1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; 
            color: ${isError ? '#fca5a5' : '#4ade80'};
            border-radius: 12px;
            padding: 1rem;
        ">
            ${isError ? '⚠️ ' : '✅ '} ${message}
        </div>`;
        
        // Auto-clear error messages after 5 seconds, success stays longer
        setTimeout(() => {
            statusEl.innerHTML = "";
        }, isError ? 5000 : 8000);
    }

    // Validation rules
    if (!name || name.length < 2) {
        showStatus("Please enter a valid name (at least 2 characters).");
        return;
    }

    if (!gender) {
        showStatus("Please select a gender.");
        return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus("Please enter a valid email address.");
        return;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
        showStatus("Please enter a valid 10-digit phone number.");
        return;
    }

    if (!school || school.length < 2) {
        showStatus("Please enter a valid school name.");
        return;
    }

    if (!classLevel || classLevel < 1 || classLevel > 12) {
        showStatus("Please enter a valid class (between 1 and 12).");
        return;
    }

    if (!city || city.length < 2) {
        showStatus("Please enter a valid city name.");
        return;
    }

    if (!district || district.length < 2) {
        showStatus("Please enter a valid district name.");
        return;
    }

    if (!state || state.length < 2) {
        showStatus("Please enter a valid state name.");
        return;
    }

    if (!careerGoal || careerGoal.length < 5) {
        showStatus("Please enter a valid career goal (at least 5 characters).");
        return;
    }

    if (!studyTime) {
        showStatus("Please select a valid study time.");
        return;
    }

    // If all validations pass, trigger the submitting state
    submitButton.innerHTML = '<i class="ri-loader-4-line ri-spin me-2"></i> Submitting...';
    submitButton.disabled = true;

    const data = new URLSearchParams();
    data.append("name", name);
    data.append("gender", gender);
    data.append("email", email);
    data.append("phone", phone);
    data.append("school", school);
    data.append("class", classLevel);
    data.append("city", city);
    data.append("district", district);
    data.append("state", state);
    data.append("career_goal", careerGoal);
    data.append("study_time", studyTime);
    data.append("reason", document.getElementById("reason").value.trim());

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data.toString()
    })
    .then(() => {
        // Restore button state
        submitButton.innerHTML = 'Submit My Application <i class="ri-send-plane-fill ms-2"></i>';
        submitButton.disabled = false;

        // Show prominent success message
        showStatus("Your mentor application was submitted successfully! We will contact you soon.", false);
        form.reset();
    })
    .catch((error) => {
        console.error("Submission Error:", error);
        submitButton.innerHTML = 'Submit My Application <i class="ri-send-plane-fill ms-2"></i>';
        submitButton.disabled = false;
        showStatus("An error occurred. Please check your internet connection and try again.");
    });
});