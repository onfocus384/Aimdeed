/**
 * Aimdeed Mentor Form Handler
 * Wrapped in an IIFE to avoid global scope pollution (DeepSource JS-0067)
 */
(function() {
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzHb4c98lyAsQFd45R4qzISifja1OOjmY2S1H5-rrhw7t5fRbHCIujYUetVy-TIJkQx/exec';
    const form = document.querySelector('#form');
    const statusEl = document.getElementById("res");

    if (!form || !statusEl) return;

    /**
     * Displays a modern non-blocking status message.
     * @param {string} message - The text to display.
     * @param {boolean} isError - Whether the message is an error.
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

        const statusConfig = isError ? config.error : config.success;
        
        statusEl.innerHTML = `<div class="alert mt-3 animate__animated animate__fadeIn" style="
            background: ${statusConfig.bg}; 
            border: 1px solid ${statusConfig.border}; 
            color: ${statusConfig.color};
            border-radius: 12px;
            padding: 1rem;
        ">
            ${statusConfig.icon} ${message}
        </div>`;
        
        setTimeout(() => {
            statusEl.innerHTML = "";
        }, statusConfig.time);
    }

    /**
     * Validates mentor form data using a rule-based approach to reduce complexity.
     * @param {Object} data - The form data object.
     * @returns {string|null} - The error message or null if valid.
     */
    function getValidationError(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;

        const validationRules = [
            { condition: () => !data.name || data.name.length < 2, message: "Please enter a valid name (at least 2 characters)." },
            { condition: () => !data.gender, message: "Please select a gender." },
            { condition: () => !data.email || !emailRegex.test(data.email), message: "Please enter a valid email address." },
            { condition: () => !data.phone || !phoneRegex.test(data.phone), message: "Please enter a valid 10-digit phone number." },
            { condition: () => !data.school || data.school.length < 2, message: "Please enter a valid school name." },
            { condition: () => !data.class_num || data.class_num < 1 || data.class_num > 12, message: "Please enter a valid class (between 1 and 12)." },
            { condition: () => !data.city || data.city.length < 2, message: "Please enter a valid city name." },
            { condition: () => !data.district || data.district.length < 2, message: "Please enter a valid district name." },
            { condition: () => !data.state || data.state.length < 2, message: "Please enter a valid state name." },
            { condition: () => !data.career_goal || data.career_goal.length < 5, message: "Please enter a valid career goal (at least 5 characters)." },
            { condition: () => !data.study_time, message: "Please select a valid study time." }
        ];

        const failedRule = validationRules.find(rule => rule.condition());
        return failedRule ? failedRule.message : null;
    }

    /**
     * Submits form data to Google Apps Script.
     * @param {Object} formData - Data to submit.
     * @param {HTMLButtonElement} submitButton - The button to reset.
     */
    async function submitToGoogle(formData, submitButton) {
        const params = new URLSearchParams();
        Object.keys(formData).forEach(key => params.append(key, formData[key]));

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString()
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
            class_num: document.getElementById("class").value.trim(),
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
})();