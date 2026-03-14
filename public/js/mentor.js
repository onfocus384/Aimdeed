
const url = 'https://script.google.com/macros/s/AKfycbzHb4c98lyAsQFd45R4qzISifja1OOjmY2S1H5-rrhw7t5fRbHCIujYUetVy-TIJkQx/exec';
const form = document.querySelector('#form');
const statusEl = document.getElementById("res");

/**
 * Modern non-blocking status messages
 */
function showStatus(message, isError = true) {
    const config = {
        error: {
            bg: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            icon: '⚠️',
            time: 5000
        },
        success: {
            bg: 'rgba(16, 185, 129, 0.1)',
            border: 'rgba(16, 185, 129, 0.3)',
            color: '#4ade80',
            icon: '✅',
            time: 8000
        }
    };

    const s = isError ? config.error : config.success;
    
    statusEl.innerHTML = `<div class="alert mt-3 animate__animated animate__fadeIn" style="
        background: ${s.bg}; 
        border: 1px solid ${s.border}; 
        color: ${s.color};
        border-radius: 12px;
        padding: 1rem;
    ">
        ${s.icon} ${message}
    </div>`;
    
    setTimeout(() => {
        statusEl.innerHTML = "";
    }, s.time);
}

/**
 * Validates the mentor form data
 */
function getValidationError(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!data.name || data.name.length < 2) return "Please enter a valid name (at least 2 characters).";
    if (!data.gender) return "Please select a gender.";
    if (!data.email || !emailRegex.test(data.email)) return "Please enter a valid email address.";
    if (!data.phone || !phoneRegex.test(data.phone)) return "Please enter a valid 10-digit phone number.";
    if (!data.school || data.school.length < 2) return "Please enter a valid school name.";
    if (!data.class || data.class < 1 || data.class > 12) return "Please enter a valid class (between 1 and 12).";
    if (!data.city || data.city.length < 2) return "Please enter a valid city name.";
    if (!data.district || data.district.length < 2) return "Please enter a valid district name.";
    if (!data.state || data.state.length < 2) return "Please enter a valid state name.";
    if (!data.career_goal || data.career_goal.length < 5) return "Please enter a valid career goal (at least 5 characters).";
    if (!data.study_time) return "Please select a valid study time.";
    
    return null;
}

/**
 * Submits form data to Google Apps Script
 */
async function submitToGoogle(formData, submitButton) {
    const data = new URLSearchParams();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: data.toString()
        });
        
        showStatus("Your mentor application was submitted successfully! We will contact you soon.", false);
        form.reset();
    } catch (error) {
        console.error("Submission Error:", error);
        showStatus("An error occurred. Please check your internet connection and try again.");
    } finally {
        submitButton.innerHTML = 'Submit My Application <i class="ri-send-plane-fill ms-2"></i>';
        submitButton.disabled = false;
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');

    const formData = {
        name: document.getElementById("name").value.trim(),
        gender: document.getElementById("gender").value,
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        school: document.getElementById("school").value.trim(),
        class: document.getElementById("class").value.trim(),
        city: document.getElementById("city").value.trim(),
        district: document.getElementById("district").value.trim(),
        state: document.getElementById("state").value.trim(),
        career_goal: document.getElementById("career-goal").value.trim(),
        study_time: document.getElementById("study-time").value,
        reason: document.getElementById("reason").value.trim()
    };

    const error = getValidationError(formData);
    if (error) {
        showStatus(error);
        return;
    }

    submitButton.innerHTML = '<i class="ri-loader-4-line ri-spin me-2"></i> Submitting...';
    submitButton.disabled = true;

    submitToGoogle(formData, submitButton);
});