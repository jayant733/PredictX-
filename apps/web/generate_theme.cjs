const fs = require('fs');

const darkColors = {
        "on-tertiary-fixed-variant": "#92002a",
        "inverse-surface": "#e3e2e5",
        "on-surface-variant": "#b9cacb",
        "on-primary-fixed": "#002022",
        "outline": "#849495",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "inverse-on-surface": "#303033",
        "primary": "#e1fdff",
        "background": "#121315",
        "outline-variant": "#3a494b",
        "surface-variant": "#343537",
        "on-primary": "#00363a",
        "on-tertiary-fixed": "#40000d",
        "on-primary-fixed-variant": "#004f54",
        "on-primary-container": "#006a71",
        "on-background": "#e3e2e5",
        "tertiary-fixed": "#ffdadb",
        "on-secondary-fixed-variant": "#005236",
        "on-secondary": "#003824",
        "surface-bright": "#38393b",
        "surface-container-lowest": "#0d0e10",
        "error-container": "#93000a",
        "surface-dim": "#121315",
        "on-secondary-container": "#00311f",
        "surface": "#121315",
        "inverse-primary": "#00696f",
        "surface-container-highest": "#343537",
        "on-error-container": "#ffdad6",
        "primary-fixed-dim": "#00dbe7",
        "secondary-container": "#00a572",
        "primary-container": "#00f2ff",
        "on-tertiary-container": "#be0d3c",
        "secondary-fixed": "#6ffbbe",
        "surface-tint": "#00dbe7",
        "surface-container-low": "#1b1c1e",
        "tertiary-fixed-dim": "#ffb2b7",
        "surface-container-high": "#292a2c",
        "on-tertiary": "#67001b",
        "secondary-fixed-dim": "#4edea3",
        "surface-container": "#1f2022",
        "on-surface": "#e3e2e5",
        "secondary": "#4edea3",
        "tertiary-container": "#ffcfd1",
        "primary-fixed": "#74f5ff",
        "tertiary": "#fff5f4",
        "on-secondary-fixed": "#002113"
};

// Generate a simple light mode equivalent by inverting lightness or setting defaults
// I'll manually set key colors for light mode
const lightColors = {
        "background": "#f8f9fa",
        "on-background": "#121315",
        "surface": "#ffffff",
        "on-surface": "#121315",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8f9fa",
        "surface-container": "#f1f3f4",
        "surface-container-high": "#e8eaed",
        "surface-container-highest": "#dadce0",
        "primary": "#006a71",
        "on-primary": "#ffffff",
        "primary-container": "#e1fdff",
        "on-primary-container": "#002022",
        "secondary": "#006c4a",
        "on-secondary": "#ffffff",
        "secondary-container": "#6ffbbe",
        "on-secondary-container": "#002113",
        "outline": "#70787d",
        "outline-variant": "#c0c8cc",
        "surface-variant": "#e1e3e5",
        "on-surface-variant": "#40484a",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002"
};

// Merge for light mode (fallback to dark if not defined)
const finalLightColors = {};
for (const key in darkColors) {
    finalLightColors[key] = lightColors[key] || darkColors[key];
}

let cssContent = `:root {\n`;
for (const key in finalLightColors) {
    cssContent += `  --color-${key}: ${finalLightColors[key]};\n`;
}
cssContent += `}\n\n.dark {\n`;
for (const key in darkColors) {
    cssContent += `  --color-${key}: ${darkColors[key]};\n`;
}
cssContent += `}\n`;

fs.writeFileSync('generated_theme.css', cssContent);

let twConfigColors = {};
for (const key in darkColors) {
    twConfigColors[key] = `var(--color-${key})`;
}

fs.writeFileSync('generated_tw_colors.json', JSON.stringify(twConfigColors, null, 2));
