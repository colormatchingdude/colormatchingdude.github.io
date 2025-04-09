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

    // State Variable
    let colorAmounts = new Array(baseColors.length).fill(0);

    // DOM Elements
    const baseColorPaletteContainer = document.getElementById('base-color-palette');
    const yourMixDisplay = document.getElementById('your-mix');
    const targetColorDisplay = document.getElementById('target-color');
    const matchPercentageDisplay = document.getElementById('match-percentage');
    const resetButton = document.getElementById('reset-button');
    const nextButton = document.getElementById('next-button');

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
            // No colors added - should be transparent
            yourMixDisplay.style.backgroundColor = 'transparent';
            return { r: 0, g: 0, b: 0 }; // Return black RGB for calculation purposes
        } else {
            colorAmounts.forEach((amount, index) => {
                if (amount > 0) {
                    const baseRgb = hexToRgb(baseColors[index].hex);
                    const proportion = amount / totalAmount;
                    mixedR += baseRgb.r * proportion;
                    mixedG += baseRgb.g * proportion;
                    mixedB += baseRgb.b * proportion;
                }
            });
        }

        const finalHex = rgbToHex(mixedR, mixedG, mixedB);
        yourMixDisplay.style.backgroundColor = finalHex;
        return { r: mixedR, g: mixedG, b: mixedB };
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

            // Removed the hex text element

            const minusButton = document.createElement('button');
            minusButton.className = 'minus-button';
            minusButton.textContent = '-';
            minusButton.disabled = true;
            minusButton.setAttribute('aria-label', `Subtract ${color.name}`);

            itemContainer.appendChild(circleButton);
            itemContainer.appendChild(percentageDisplay);
            // No longer appending hexText
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
        
        updateMixAndDisplays();
    }

    function generateTargetColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        targetColor = { r, g, b };
        targetColorDisplay.style.backgroundColor = rgbToHex(r, g, b);
        resetMix(); // Reset amounts for the new target
    }

    // --- Event Listeners for main buttons ---
    if (resetButton) {
        resetButton.addEventListener('click', resetMix);
    } else { console.error("Reset button not found"); }

     if (nextButton) {
        nextButton.addEventListener('click', generateTargetColor);
    } else { console.error("Next button not found"); }

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