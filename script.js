document.addEventListener('DOMContentLoaded', () => {
    // Base colors
    const baseColors = [
        { name: '#F52F0C', hex: '#F52F0C' },
        { name: '#B2F711', hex: '#B2F711' },
        { name: '#0FF57A', hex: '#0FF57A' },
        { name: '#1B07F0', hex: '#1B07F0' },
        { name: '#FFFFFF', hex: '#FFFFFF' },
        { name: '#000000', hex: '#000000' }
    ];

    // Difficulty settings
    const difficultySettings = {
        easy: {
            numColors: { min: 2, max: 3 },
            weightsRange: { min: 1, max: 3 }
        },
        medium: {
            numColors: { min: 2, max: 4 },
            weightsRange: { min: 1, max: 5 }
        },
        hard: {
            numColors: { min: 3, max: 5 },
            weightsRange: { min: 1, max: 7 }
        }
    };

    // Current difficulty level (default to medium)
    let currentDifficulty = 'medium';

    // State Variables
    let colorAmounts = new Array(baseColors.length).fill(0);
    let targetColorRatios = []; // Store the original ratios used to create the target

    // DOM Elements
    const baseColorPaletteContainer = document.getElementById('base-color-palette');
    const yourMixDisplay = document.getElementById('your-mix');
    const targetColorDisplay = document.getElementById('target-color');
    const matchPercentageDisplay = document.getElementById('match-percentage');
    const resetButton = document.getElementById('reset-button');
    const nextButton = document.getElementById('next-button');
    const solutionButton = document.getElementById('solution-button');
    
    // Navbar Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const difficultyLinks = document.querySelectorAll('.dropdown-content a');
    const difficultyBtn = document.querySelector('.dropdown-btn');

    let targetColor = { r: 0, g: 0, b: 0 };
    let uiElements = [];

    // --- Helper Functions ---
    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) { // More robust check
            let c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            r = (c >> 16) & 255;
            g = (c >> 8) & 255;
            b = c & 255;
        } else {
             return { r: 0, g: 0, b: 0 };
        }
        return { r, g, b };
    }

    function rgbToHex(r, g, b) {
        const toHex = c => {
            const val = Math.round(Math.max(0, Math.min(255, c))); // Ensure value is valid
            const hex = val.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase(); // Consistent case
    }

    // --- Core Logic Functions ---
    function mixColors() {
        let totalAmount = 0;
        colorAmounts.forEach(amount => { totalAmount += amount; });

        let mixedR = 0, mixedG = 0, mixedB = 0;

        if (totalAmount === 0) {
            // No colors added - should be transparent WITH the grid
            yourMixDisplay.style.backgroundColor = 'transparent';
            yourMixDisplay.style.backgroundImage = ''; // <--- ADD THIS LINE: Reset to allow CSS background-image to show
            // Return black RGB for calculation purposes
            return { r: 0, g: 0, b: 0 };
        } else {
            // Calculate mixed color
            colorAmounts.forEach((amount, index) => {
                if (amount > 0) {
                    const baseRgb = hexToRgb(baseColors[index].hex);
                    const proportion = amount / totalAmount;
                    mixedR += baseRgb.r * proportion;
                    mixedG += baseRgb.g * proportion;
                    mixedB += baseRgb.b * proportion;
                }
            });

            const finalHex = rgbToHex(mixedR, mixedG, mixedB);
            yourMixDisplay.style.backgroundColor = finalHex;
            yourMixDisplay.style.backgroundImage = 'none'; // <--- ADD THIS LINE: Explicitly hide the CSS background-image
            return { r: mixedR, g: mixedG, b: mixedB };
        }
    }

    function calculateMatch(mixedRgb) {
        // If no colors have been added, match should be 0
        let totalAmount = 0;
        colorAmounts.forEach(amount => { totalAmount += amount; });
        
        if (totalAmount === 0) {
            matchPercentageDisplay.textContent = "0";
            return;
        }
        
        const diffR = targetColor.r - mixedRgb.r;
        const diffG = targetColor.g - mixedRgb.g;
        const diffB = targetColor.b - mixedRgb.b;
        const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
        const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
        const match = Math.max(0, 100 * (1 - distance / maxDistance));
        
        matchPercentageDisplay.textContent = match.toFixed(1);
        
        // Add congratulation message if match is 99% or higher
        if (match >= 99) {
            // Check if congratulation message already exists
            let congratsElement = document.getElementById('congrats-message');
            if (!congratsElement) {
                congratsElement = document.createElement('div');
                congratsElement.id = 'congrats-message';
                congratsElement.textContent = 'Great Job!';
                congratsElement.style.color = '#28a745';
                congratsElement.style.fontWeight = 'bold';
                congratsElement.style.marginTop = '5px';
                congratsElement.style.fontSize = '1.1em';
                
                // Insert after match info
                const matchInfo = document.querySelector('.match-info');
                matchInfo.parentNode.insertBefore(congratsElement, matchInfo.nextSibling);
            }
        } else {
            // Remove congratulation message if it exists
            const congratsElement = document.getElementById('congrats-message');
            if (congratsElement) {
                congratsElement.remove();
            }
        }
    }

    // --- UI Update Functions ---
    function updateAmountDisplays() {
        let totalAmount = 0;
        colorAmounts.forEach(amount => { totalAmount += amount; });

        uiElements.forEach((elements, index) => {
            // Ensure elements and their properties exist before accessing them
            if (elements && elements.amountDisplay && elements.percentageDisplay && elements.minusButton) {
                const amount = colorAmounts[index];
                const percentageDisplay = elements.percentageDisplay; // Cache reference

                elements.amountDisplay.textContent = amount; // Update the amount display (number inside circle)

                // Check if this specific color has been added AND if there's a mix overall
                if (amount > 0 && totalAmount > 0) {
                    const percentage = (amount / totalAmount) * 100;
                    percentageDisplay.textContent = `${percentage.toFixed(0)}%`; // Set percentage text
                    percentageDisplay.style.color = '#FFFFFF'; // Set text color to white (visible)
                } else {
                    const percentage = 0;
                    percentageDisplay.textContent = `${percentage.toFixed(0)}%`; // Set percentage text
                    percentageDisplay.style.color = '#999'; // Set text color to dim gray (like CSS default)
                    // This makes it dim instead of transparent/invisible
                }

                // Update minus button state
                elements.minusButton.disabled = (amount <= 0);
            } else {
                // Log an error if expected elements are missing for debugging
                console.error(`UI elements missing for index ${index}`);
            }
        });
    }

    function updateMixAndDisplays() {
        const mixedRgb = mixColors();
        calculateMatch(mixedRgb);
        updateAmountDisplays();
    }

    // --- Solution Function ---
    function findSolution() {
        // We already know the exact ratios that created the target color
        // Just use those stored ratios directly
        colorAmounts = [...targetColorRatios];
        
        // Update UI
        updateMixAndDisplays();
        
        // Add "Solution" message
        let solutionElement = document.getElementById('solution-message');
        if (!solutionElement) {
            solutionElement = document.createElement('div');
            solutionElement.id = 'solution-message';
            solutionElement.textContent = 'Solution Applied';
            solutionElement.style.color = '#007bff';
            solutionElement.style.fontWeight = 'bold';
            solutionElement.style.marginTop = '5px';
            solutionElement.style.fontSize = '1.1em';
            
            // Insert after match info or congrats message
            const matchInfo = document.querySelector('.match-info');
            matchInfo.parentNode.insertBefore(solutionElement, matchInfo.nextSibling);
            
            // Remove solution message after 3 seconds
            setTimeout(() => {
                const elem = document.getElementById('solution-message');
                if (elem) elem.remove();
            }, 3000);
        }
    }

    // --- Initialization and Control Setup ---
    function setupControls() {
        baseColorPaletteContainer.innerHTML = '';
        uiElements = [];

        baseColors.forEach((color, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'base-color-item';

            const circleButton = document.createElement('button');
            circleButton.className = 'base-color-circle';
            // Set the background color FIRST
            circleButton.style.backgroundColor = color.hex;
            circleButton.setAttribute('aria-label', `Add ${color.name}`);

            // --- START: Added logic for text color ---
            let textColor = '#000000'; // Default to black
            try {
                const rgb = hexToRgb(color.hex);
                // Calculate relative luminance (formula from WCAG)
                // Normalize RGB values to 0-1
                const r = rgb.r / 255.0;
                const g = rgb.g / 255.0;
                const b = rgb.b / 255.0;
                // Apply gamma correction approximation
                const r_lin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
                const g_lin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
                const b_lin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
                // Calculate luminance
                const luminance = 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin;

                // Use white text for dark backgrounds (luminance < 0.5 is a common threshold)
                if (luminance < 0.5) {
                    textColor = '#FFFFFF';
                }
            } catch (e) {
                console.error("Could not calculate luminance for color:", color.hex, e);
                // Keep default black text on error
            }
            // --- END: Added logic for text color ---

            const amountDisplay = document.createElement('span');
            amountDisplay.className = 'amount-display';
            amountDisplay.textContent = '0';
            // Apply the calculated text color
            amountDisplay.style.color = textColor; // <--- SET TEXT COLOR HERE
            circleButton.appendChild(amountDisplay);

            const percentageDisplay = document.createElement('div');
            percentageDisplay.className = 'percentage-display';
            percentageDisplay.textContent = '';

            const minusButton = document.createElement('button');
            minusButton.className = 'minus-button';
            minusButton.textContent = '-';
            minusButton.disabled = true;
            minusButton.setAttribute('aria-label', `Subtract ${color.name}`);

            itemContainer.appendChild(circleButton);
            itemContainer.appendChild(percentageDisplay);
            itemContainer.appendChild(minusButton);
            baseColorPaletteContainer.appendChild(itemContainer);

            // Store references
            uiElements.push({
                amountDisplay: amountDisplay,
                percentageDisplay: percentageDisplay,
                minusButton: minusButton
            });

            // Add Event Listeners
            circleButton.addEventListener('click', () => {
                colorAmounts[index]++;
                updateMixAndDisplays();
            });

            minusButton.addEventListener('click', () => {
                if (colorAmounts[index] > 0) {
                    colorAmounts[index]--;
                    updateMixAndDisplays();
                }
            });
        });
    }

    function resetMix() {
        colorAmounts.fill(0);
        
        // Remove congratulation message if it exists
        const congratsElement = document.getElementById('congrats-message');
        if (congratsElement) {
            congratsElement.remove();
        }
        
        // Remove solution message if it exists
        const solutionElement = document.getElementById('solution-message');
        if (solutionElement) {
            solutionElement.remove();
        }
        
        updateMixAndDisplays();
    }

    function generateTargetColor() {
        // Get difficulty settings
        const settings = difficultySettings[currentDifficulty];
        
        resetMix(); // Reset amounts for the new target
        
        // Randomly select number of colors to mix based on difficulty
        const numColorsToUse = Math.floor(Math.random() * 
            (settings.numColors.max - settings.numColors.min + 1)) + 
            settings.numColors.min;
            
        targetColorRatios = new Array(baseColors.length).fill(0);
        
        // Randomly pick which colors to use
        const colorIndices = [];
        while (colorIndices.length < numColorsToUse) {
            const index = Math.floor(Math.random() * baseColors.length);
            if (!colorIndices.includes(index)) {
                colorIndices.push(index);
            }
        }
        
        // Assign random weights to the selected colors based on difficulty
        let totalWeight = 0;
        for (const index of colorIndices) {
            const weight = Math.floor(Math.random() * 
                (settings.weightsRange.max - settings.weightsRange.min + 1)) + 
                settings.weightsRange.min;
            targetColorRatios[index] = weight;
            totalWeight += weight;
        }
        
        // Calculate the mixed target color
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < targetColorRatios.length; i++) {
            if (targetColorRatios[i] > 0) {
                const baseRgb = hexToRgb(baseColors[i].hex);
                const proportion = targetColorRatios[i] / totalWeight;
                r += baseRgb.r * proportion;
                g += baseRgb.g * proportion;
                b += baseRgb.b * proportion;
            }
        }
        
        targetColor = { r, g, b };
        targetColorDisplay.style.backgroundColor = rgbToHex(r, g, b);
    }

    // Update difficulty level and button text
    function setDifficulty(difficulty) {
        currentDifficulty = difficulty;
        
        // Update the dropdown button text
        const difficultyText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        difficultyBtn.innerHTML = `Difficulty: ${difficultyText} <span class="arrow-down">▼</span>`;
        
        // Generate a new target color with the new difficulty
        generateTargetColor();
        
        // Close mobile menu if open
        if (navbarMenu.classList.contains('active')) {
            navbarMenu.classList.remove('active');
        }
    }

    // --- Event Listeners for main buttons ---
    if (resetButton) {
        resetButton.addEventListener('click', resetMix);
    } else { console.error("Reset button not found"); }

    if (nextButton) {
        nextButton.addEventListener('click', generateTargetColor);
    } else { console.error("Next button not found"); }
    
    if (solutionButton) {
        solutionButton.addEventListener('click', findSolution);
    } else { console.error("Solution button not found"); }

    // --- Navbar Event Listeners ---
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
        });
    }

    // Difficulty selection
    difficultyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const difficulty = e.target.getAttribute('data-difficulty');
            setDifficulty(difficulty);
        });
    });

    // --- Initial Setup ---
    try {
        setupControls();
        setDifficulty('medium'); // Start with medium difficulty
        
        // Make sure the yourMixDisplay starts transparent
        yourMixDisplay.style.backgroundColor = 'transparent';
        matchPercentageDisplay.textContent = "0";
    } catch (error) {
        console.error("Error during initial setup:", error);
    }
});