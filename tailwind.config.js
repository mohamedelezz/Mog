import StyleDictionary from 'style-dictionary';

// Helper to format token names
const formatTokenName = (name) => {
  return name.toLowerCase()
    .replace(/[․.]/g, '_') // Replace dots with underscores for decimals
    .replace(/\s+/g, '-');
};

// Helper to format reference values to CSS variable names
const formatRefValue = (value) => {
  if (typeof value !== 'string' || !value.startsWith('{')) return value;
  
  let formatted = value
    .replace(/^\{|\}$/g, '')
    .toLowerCase();
  
  // Handle Primitives.Colors
  if (formatted.startsWith('primitives.colors.')) {
    return formatted
      .replace('primitives.colors.', 'color-')
      .replace(/\./g, '-')
      .replace('alpha-alpha-', 'alpha-');
  }
  
  // Handle Primitives.Spacing
  if (formatted.startsWith('primitives.spacing.')) {
    const match = formatted.match(/primitives\.spacing\.([0-9_.]+)/);
    if (match) {
      return `spacing-${match[1].replace(/[.]/g, '_')}`;
    }
  }
  
  // Handle Primitives.Radius
  if (formatted.startsWith('primitives.radius.')) {
    return formatted.replace('primitives.radius.radius-', 'radius-');
  }
  
  // Handle Themes references
  if (formatted.startsWith('themes.')) {
    return formatted.replace('themes.', '').replace(/\./g, '-');
  }
  
  return formatted.replace(/\./g, '-');
};

StyleDictionary.registerFormat({
  name: 'css/tailwind',
  format: ({ dictionary }) => {
    const themeLines = [];
    const processedNames = new Set();

    dictionary.allTokens.forEach((t) => {
      
      let varName = '';
      let actualValue = '';
      
      // Process based on file path - use var() references to globals.css
      if (t.filePath === 'tokens/Primitives.json') {
        // Colors
        if (t.name.startsWith('primitives-colors')) {
          const colorName = t.name.replace('primitives-colors-', '').replace('alpha-alpha-', 'alpha-');
          varName = `--color-${colorName}`;
          actualValue = `var(--color-${colorName})`;
        }
        // Spacing
        else if (t.name.startsWith('primitives-spacing')) {
          const spacingMatch = t.key?.match(/([0-9_.]+)/);
          if (spacingMatch) {
            const spacingName = spacingMatch[1].replace(/[.]/g, '_');
            // Skip invalid spacing names (just underscore or empty)
            if (spacingName && spacingName !== '_' && /\d/.test(spacingName)) {
              varName = `--spacing-${spacingName}`;
              actualValue = `var(--spacing-${spacingName})`;
            }
          }
        }
        // Radius
        else if (t.name.startsWith('primitives-radius')) {
          const radiusName = t.name.replace('primitives-radius-radius-', '');
          varName = `--radius-${radiusName}`;
          actualValue = `var(--radius-${radiusName})`;
        }
        // Typography
        else if (t.name.includes('typography')) {
          if (t.name.includes('font-family')) {
            const fontName = t.name.replace('primitives-typography-font-family-font-family-', '');
            varName = `--font-${fontName}`;
            actualValue = `var(--typography-font-family-${fontName})`;
          } else if (t.name.includes('font-weight')) {
            const weightName = t.name.replace('primitives-typography-font-weight-font-weight-', '');
            varName = `--font-weight-${weightName}`;
            actualValue = `var(--typography-font-weight-${weightName})`;
          } else if (t.name.includes('text-size')) {
            const sizeName = t.name.replace('primitives-typography-size-text-size-', '');
            varName = `--text-${sizeName}`;
            actualValue = `var(--typography-text-size-${sizeName})`;
          } else if (t.name.includes('line-hight')) {
            const heightName = t.name.replace('primitives-typography-line-hight-line-hight-', '');
            varName = `--leading-${heightName}`;
            actualValue = `var(--typography-line-hight-${heightName})`;
          }
        }
      }
      // Theme tokens - reference the CSS variables from imported theme files
      else if (t.filePath === 'tokens/Themes.json') {
        let themeName = t.name.toLowerCase().replace(/^themes-/, '');
        
        // Skip theme tokens that are simple aliases to primitive colors
        // These include: alpha tokens, and tokens that directly map to color primitives
        // The theme-aware versions are available in theme-light.css and theme-dark.css
        if (themeName.startsWith('alpha-')) return;
        
        // Skip global tokens that are aliased from other theme tokens
        if (themeName.startsWith('global-')) return;
        // Remove duplicated words
        themeName = themeName.replace(/^background-background-/, 'background-');
        themeName = themeName.replace(/^text-text-/, 'text-');
        themeName = themeName.replace(/^button-button-/, 'button-');
        themeName = themeName.replace(/^border-border-/, 'border-');
        themeName = themeName.replace(/^link-link-/, 'link-');
        themeName = themeName.replace(/^icon-icon-/, 'icon-');
        themeName = themeName.replace(/^alpha-alpha-/, 'alpha-');
        themeName = themeName.replace(/^controls-control-/, 'controls-');
        themeName = themeName.replace(/^table-table-/, 'table-');
        themeName = themeName.replace(/^stepper-stepper-/, 'stepper-');
        themeName = themeName.replace(/^tag-tag-/, 'tag-');
        themeName = themeName.replace(/^tooltip-tooltip-/, 'tooltip-');
        themeName = themeName.replace(/^chip-chip-/, 'chip-');
        themeName = themeName.replace(/^charts-charts-/, 'charts-');
        themeName = themeName.replace(/^progress-bar-progress-bar-/, 'progress-bar-');
        themeName = themeName.replace(/^form-field-/, 'form-');
        themeName = themeName.replace(/^form-text-/, 'form-');
        themeName = themeName.replace(/^form-form-/, 'form-');
        themeName = themeName.replace(/^form-option-/, 'form-');
        themeName = themeName.replace(/^form-datecell-/, 'form-');
        themeName = themeName.replace(/^form-textarea-/, 'form-');
        themeName = themeName.replace(/^global-/, '');
        
        // Store original name for the value reference
        const originalThemeName = themeName;
        
        // Flip specific category names to come first (only for the key)
        themeName = themeName.replace(/^form-background-/, 'background-form-');
        themeName = themeName.replace(/^form-border-/, 'border-form-');
        
        // Add text- prefix to form text tokens
        themeName = themeName.replace(/^form-placeholder$/, 'text-form-placeholder');
        themeName = themeName.replace(/^form-focused$/, 'text-form-focused');
        themeName = themeName.replace(/^form-filled$/, 'text-form-filled');
        themeName = themeName.replace(/^form-helper$/, 'text-form-helper');
        themeName = themeName.replace(/^form-label$/, 'text-form-label');
        themeName = themeName.replace(/^form-title$/, 'text-form-title');
        themeName = themeName.replace(/^form-paragraph$/, 'text-form-paragraph');
        themeName = themeName.replace(/^form-readonly$/, 'text-form-readonly');
        themeName = themeName.replace(/^form-hovered$/, 'text-form-hovered');
        themeName = themeName.replace(/^form-pressed$/, 'text-form-pressed');
        
        // Move background to front for form-today tokens
        themeName = themeName.replace(/^form-today-background-/, 'background-form-today-');
        
        // Move background to front for button tokens
        themeName = themeName.replace(/^button-background-/, 'background-button-');
        
        // Add text- prefix for button-label tokens
        themeName = themeName.replace(/^button-label-/, 'text-button-label-');
        
        // Add text- prefix for link tokens (but not link-icon or link-link)
        if (themeName.startsWith('link-') && !themeName.startsWith('link-icon-') && !themeName.startsWith('link-link-')) {
          themeName = 'text-' + themeName;
        }
        
        // Move icon to front for link-icon tokens
        themeName = themeName.replace(/^link-icon-/, 'icon-link-');
        // Handle the link-link-oncolor-focused case (likely a typo, but handle it)
        themeName = themeName.replace(/^link-link-/, 'icon-link-');
        
        // Move background to front for chip tokens
        themeName = themeName.replace(/^chip-background-/, 'background-chip-');
        
        // Button icon tokens
        themeName = themeName.replace(/^button-icon-/, 'icon-button-');
        
        // Table tokens
        themeName = themeName.replace(/^table-text-/, 'text-table-');
        themeName = themeName.replace(/^table-background-/, 'background-table-');
        themeName = themeName.replace(/^table-cell-/, 'border-table-cell-');
        themeName = themeName.replace(/^table-boarder-/, 'border-table-');
        
        // Stepper tokens
        themeName = themeName.replace(/^stepper-button-/, 'button-stepper-');
        themeName = themeName.replace(/^stepper-text-/, 'text-stepper-');
        themeName = themeName.replace(/^stepper-line-/, 'line-stepper-');
        
        // Tag tokens
        themeName = themeName.replace(/^tag-background-/, 'background-tag-');
        themeName = themeName.replace(/^tag-border-/, 'border-tag-');
        themeName = themeName.replace(/^tag-text-/, 'text-tag-');
        themeName = themeName.replace(/^tag-icon-/, 'icon-tag-');
        
        // Tooltip tokens
        themeName = themeName.replace(/^tooltip-background-/, 'background-tooltip-');
        themeName = themeName.replace(/^tooltip-text-/, 'text-tooltip-');
        
        // Icon background tokens
        themeName = themeName.replace(/^icon-background-/, 'background-icon-');
        
        // Controls tokens
        themeName = themeName.replace(/^controls-icon-/, 'icon-controls-');
        themeName = themeName.replace(/^controls-border/, 'border-controls');
        themeName = themeName.replace(/^controls-boarder/, 'border-controls');
        // Add background prefix for control state tokens
        if (themeName.match(/^controls-(primary|neutral|pressed|ripple|disabled)/)) {
          themeName = 'background-' + themeName;
        }
        
        // Form scrollbar
        themeName = themeName.replace(/^form-scrollbar-/, 'scrollbar-form-');
        
        // Charts tokens - add color prefix
        if (themeName.startsWith('charts-')) {
          themeName = 'color-' + themeName;
        }
        
        // Progress bar
        themeName = themeName.replace(/^progress-bar-/, 'background-progress-bar-');
        
        // Tag dot
        if (themeName === 'tag-dot') {
          themeName = 'color-tag-dot';
        }
        
        // Line stepper - add color prefix
        if (themeName.startsWith('line-stepper-')) {
          themeName = 'color-' + themeName;
        }
        
        varName = `--${themeName}`;
        actualValue = `var(--${originalThemeName})`; // Reference the original theme variable
      }
      
      if (varName && actualValue && !processedNames.has(varName)) {
        processedNames.add(varName);
        themeLines.push(`  ${varName.toLowerCase()}: ${actualValue};`);
      }
    });

    return `
@import 'tailwindcss';
@import 'tailwindcss' prefix(moj);
@import './globals.css';
@import './theme-light.css';
@import './theme-dark.css';

@theme {
  /* Reset defaults */
  --color-*: initial;
  --spacing-*: initial;
  --radius-*: initial;
  --font-*: initial;
  --leading-*: initial;
  --text-*: initial;
  --width-*: initial;
  
${themeLines.join('\n')}
}

/* Custom utilities */
@utility bg-* {
  background-color: --value(--background-*);
}

@utility text-color-* {
  color: --value(--text-*);
}

@utility border-color-* {
  border-color: --value(--border-*);
}

@utility rounded-* {
  border-radius: --value(--radius-*);
}

@utility w-* {
  width: --value(--width-*);
}

@utility min-w-* {
  min-width: --value(--width-*);
}

@utility max-w-* {
  max-width: --value(--width-*);
}

`;
  },
});

function getStyleDictionaryConfig() {
  return {
    source: [
      'tokens/Primitives.json',
      'tokens/Spacing.json',
      'tokens/Widths.json',
      'tokens/Radius.json',
      'tokens/Typography.json',
      'tokens/containers.json',
      'tokens/Themes.json',
    ],
    platforms: {
      css: {
        transforms: ['name/kebab'],
        buildPath: 'build/css/',
        files: [
          {
            destination: 'tailwind.css',
            format: 'css/tailwind',
            options: {
              showFileHeader: false,
            },
          },
        ],
      },
    },
  };
}

console.log('\n==============================================');
console.log('\nProcessing: [tailwind]');

const StyleDictionaryConfig = getStyleDictionaryConfig();
const sd = new StyleDictionary(StyleDictionaryConfig);
sd.buildAllPlatforms();

console.log('\nEnd processing');
