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
            weightsRange: { min: 1, max: 3 },
            visibleBaseColors: 4  // Show only 4 base colors
        },
        medium: {
            numColors: { min: 2, max: 4 },
            weightsRange: { min: 1, max: 5 },
            visibleBaseColors: 5  // Show 5 base colors
        },
        hard: {
            numColors: { min: 3, max: 5 },
            weightsRange: { min: 1, max: 7 },
            visibleBaseColors: 6  // Show all 6 base colors
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
            yourMixDisplay.style.backgroundImage = ''; // Reset to allow CSS background-image to show
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
            yourMixDisplay.style.backgroundImage = 'none'; // Explicitly hide the CSS background-image
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

        // Only update UI elements that exist
        const visibleColorsCount = difficultySettings[currentDifficulty].visibleBaseColors;
        
        for (let i = 0; i < visibleColorsCount; i++) {
            const elements = uiElements[i];
            
            // Ensure elements exist before accessing them
            if (elements && elements.amountDisplay && elements.percentageDisplay && elements.minusButton) {
                const amount = colorAmounts[i];
                
                elements.amountDisplay.textContent = amount; // Update the amount display

                // Update percentage display
                if (amount > 0 && totalAmount > 0) {
                    const percentage = (amount / totalAmount) * 100;
                    elements.percentageDisplay.textContent = `${percentage.toFixed(0)}%`;
                    elements.percentageDisplay.style.color = '#FFFFFF';
                } else {
                    elements.percentageDisplay.textContent = '0%';
                    elements.percentageDisplay.style.color = '#999';
                }

                // Update minus button state
                elements.minusButton.disabled = (amount <= 0);
            }
        }
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

        // Get the number of colors to display based on current difficulty
        const visibleColorsCount = difficultySettings[currentDifficulty].visibleBaseColors;
        
        // Only display the first N colors based on difficulty
        for (let i = 0; i < visibleColorsCount; i++) {
            const color = baseColors[i];
            
            const itemContainer = document.createElement('div');
            itemContainer.className = 'base-color-item';

            const circleButton = document.createElement('button');
            circleButton.className = 'base-color-circle';
            circleButton.style.backgroundColor = color.hex;
            circleButton.setAttribute('aria-label', `Add ${color.name}`);

            // Calculate text color based on background luminance
            let textColor = '#000000'; // Default to black
            try {
                const rgb = hexToRgb(color.hex);
                // Calculate relative luminance (formula from WCAG)
                const r = rgb.r / 255.0;
                const g = rgb.g / 255.0;
                const b = rgb.b / 255.0;
                // Apply gamma correction approximation
                const r_lin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
                const g_lin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
                const b_lin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
                // Calculate luminance
                const luminance = 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin;

                // Use white text for dark backgrounds
                if (luminance < 0.5) {
                    textColor = '#FFFFFF';
                }
            } catch (e) {
                console.error("Could not calculate luminance for color:", color.hex, e);
            }

            const amountDisplay = document.createElement('span');
            amountDisplay.className = 'amount-display';
            amountDisplay.textContent = '0';
            amountDisplay.style.color = textColor;
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

            // Store UI references at the correct index
            uiElements[i] = {
                amountDisplay: amountDisplay,
                percentageDisplay: percentageDisplay,
                minusButton: minusButton
            };

            // Add Event Listeners (using closure to capture the current index)
            const colorIndex = i;
            circleButton.addEventListener('click', () => {
                colorAmounts[colorIndex]++;
                updateMixAndDisplays();
            });

            minusButton.addEventListener('click', () => {
                if (colorAmounts[colorIndex] > 0) {
                    colorAmounts[colorIndex]--;
                    updateMixAndDisplays();
                }
            });
        }
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
        
        // Get the number of visible colors for this difficulty
        const visibleColorsCount = settings.visibleBaseColors;
        
        // Randomly pick which colors to use, but only from the visible colors
        const colorIndices = [];
        while (colorIndices.length < numColorsToUse) {
            const index = Math.floor(Math.random() * visibleColorsCount); // Only pick from visible colors
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
        
        // Reset color amounts when changing difficulty
        resetMix();
        
        // Rebuild the palette with the correct number of colors
        setupControls();
        
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