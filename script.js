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
            const amount = colorAmounts[index];
            if (elements && elements.amountDisplay && elements.percentageDisplay && elements.minusButton) {
                elements.amountDisplay.textContent = amount;
                const percentage = totalAmount === 0 ? 0 : (amount / totalAmount) * 100;
                elements.percentageDisplay.textContent = totalAmount === 0 ? '' : `${percentage.toFixed(0)}%`;
                elements.minusButton.disabled = (amount <= 0);
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
            circleButton.style.backgroundColor = color.hex;
            circleButton.setAttribute('aria-label', `Add ${color.name}`);

            const amountDisplay = document.createElement('span');
            amountDisplay.className = 'amount-display';
            amountDisplay.textContent = '0';
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
        // Two approaches for target generation:
        // 1. Random mixing of base colors (gives perfect solutions)
        // 2. Completely random RGB (more challenging)
        
        // Let's use approach 1: random mixing of base colors
        // This ensures there's always a perfect solution

        resetMix(); // Reset amounts for the new target
        
        // Randomly select 2-4 colors to mix
        const numColorsToUse = Math.floor(Math.random() * 3) + 2; // 2 to 4 colors
        targetColorRatios = new Array(baseColors.length).fill(0);
        
        // Randomly pick which colors to use
        const colorIndices = [];
        while (colorIndices.length < numColorsToUse) {
            const index = Math.floor(Math.random() * baseColors.length);
            if (!colorIndices.includes(index)) {
                colorIndices.push(index);
            }
        }
        
        // Assign random weights to the selected colors (1-5 units each)
        let totalWeight = 0;
        for (const index of colorIndices) {
            const weight = Math.floor(Math.random() * 5) + 1; // 1 to 5 units
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

    // --- Initial Setup ---
    try {
        setupControls();
        generateTargetColor();
        
        // Make sure the yourMixDisplay starts transparent
        yourMixDisplay.style.backgroundColor = 'transparent';
        matchPercentageDisplay.textContent = "0";
    } catch (error) {
        console.error("Error during initial setup:", error);
    }
});
