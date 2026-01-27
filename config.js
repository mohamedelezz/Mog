import StyleDictionary from "style-dictionary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Figma font-weight names to CSS numeric values
const fontWeightMap = {
  'Bold': 700,
  'Semibold': 600,
  'Medium': 500,
  'Regular': 400,
  'Italic': 400,
  'Medium Italic': 500,
  'Semibold Italic': 600,
  'Bold italic': 700,
};

// Format reference values like {Primitives.Spacing.4 (16px)} to CSS variable names
const formatReferenceValue = (refValue) => {
  if (typeof refValue !== 'string') return refValue;
  
  // Match patterns like {Primitives.Spacing.X (Ypx)} or {Primitives.Radius.radius-X}
  let formatted = refValue
    .replace(/^\{|\}$/g, '') // Remove curly braces
    .toLowerCase();
  
  // Handle Spacing references: {Primitives.Spacing.4 (16px)} -> spacing-4
  if (formatted.startsWith('primitives.spacing.')) {
    const match = formatted.match(/primitives\.spacing\.([0-9․.]+)/);
    if (match) {
      let spacingValue = match[1].replace(/[․.]/g, '_'); // Replace dots with underscore
      return `spacing-${spacingValue}`;
    }
  }
  
  // Handle Radius references: {Primitives.Radius.radius-X} -> radius-X
  if (formatted.startsWith('primitives.radius.')) {
    return formatted.replace('primitives.radius.radius-', 'radius-');
  }
  
  // Handle Typography references
  if (formatted.startsWith('primitives.typography.')) {
    // Font Family
    if (formatted.includes('font family.font-family-')) {
      return formatted.replace(/primitives\.typography\.font family\.font-family-/, 'typography-font-family-');
    }
    // Font Weight
    if (formatted.includes('font weight.font-weight-')) {
      return formatted.replace(/primitives\.typography\.font weight\.font-weight-/, 'typography-font-weight-');
    }
    // Line Height
    if (formatted.includes('line hight.line-hight-')) {
      return formatted.replace(/primitives\.typography\.line hight\.line-hight-/, 'typography-line-hight-');
    }
    // Text Size
    if (formatted.includes('size.text-size-')) {
      return formatted.replace(/primitives\.typography\.size\.text-size-/, 'typography-text-size-');
    }
    // Paragraph Spacing
    if (formatted.includes('paragraph spacing.paragraph-spacing-')) {
      return formatted.replace(/primitives\.typography\.paragraph spacing\.paragraph-spacing-/, 'typography-paragraph-spacing-');
    }
  }
  
  // Default: convert dots to dashes
  return formatted.split('.').join('-');
};

// Format theme reference values like {Primitives.Colors.Base.white} to CSS variable names
const formatThemeReferenceValue = (refValue) => {
  if (typeof refValue !== 'string') return refValue;
  
  let formatted = refValue
    .replace(/^\{|\}$/g, '') // Remove curly braces
    .toLowerCase();
  
  // Handle Primitives.Colors references
  if (formatted.startsWith('primitives.colors.')) {
    return formatted
      .replace('primitives.colors.', 'color-')
      .replace(/\./g, '-')
      .replace('alpha-alpha-', 'alpha-');
  }
  
  // Handle Themes references (e.g., {Themes.Alpha.Alpha-success-20})
  if (formatted.startsWith('themes.')) {
    let result = formatted
      .replace('themes.', '')
      .replace(/\./g, '-');
    
    // Remove duplicated words
    result = result.replace(/^background-background-/, 'background-');
    result = result.replace(/^text-text-/, 'text-');
    result = result.replace(/^button-button-/, 'button-');
    result = result.replace(/^border-border-/, 'border-');
    result = result.replace(/^link-link-/, 'link-');
    result = result.replace(/^icon-icon-/, 'icon-');
    result = result.replace(/^alpha-alpha-/, 'alpha-');
    result = result.replace(/^controls-control-/, 'controls-');
    result = result.replace(/^table-table-/, 'table-');
    result = result.replace(/^stepper-stepper-/, 'stepper-');
    result = result.replace(/^tag-tag-/, 'tag-');
    result = result.replace(/^tooltip-tooltip-/, 'tooltip-');
    result = result.replace(/^chip-chip-/, 'chip-');
    result = result.replace(/^charts-charts-/, 'charts-');
    result = result.replace(/^progress-bar-progress-bar-/, 'progress-bar-');
    result = result.replace(/^global-/, '');
    
    return result;
  }
  
  // Default: convert dots to dashes
  return formatted.replace(/\./g, '-');
};

// Format theme token name
const formatThemeTokenName = (tokenName) => {
  let name = tokenName.toLowerCase().replace(/^themes-/, '');
  
  // Remove duplicated words like background-background-, text-text-, etc.
  name = name.replace(/^background-background-/, 'background-');
  name = name.replace(/^text-text-/, 'text-');
  name = name.replace(/^button-button-/, 'button-');
  name = name.replace(/^border-border-/, 'border-');
  name = name.replace(/^link-link-/, 'link-');
  name = name.replace(/^icon-icon-/, 'icon-');
  name = name.replace(/^alpha-alpha-/, 'alpha-');
  name = name.replace(/^controls-control-/, 'controls-');
  name = name.replace(/^table-table-/, 'table-');
  name = name.replace(/^stepper-stepper-/, 'stepper-');
  name = name.replace(/^tag-tag-/, 'tag-');
  name = name.replace(/^tooltip-tooltip-/, 'tooltip-');
  name = name.replace(/^chip-chip-/, 'chip-');
  name = name.replace(/^charts-charts-/, 'charts-');
  name = name.replace(/^progress-bar-progress-bar-/, 'progress-bar-');
  name = name.replace(/^form-field-/, 'form-');
  name = name.replace(/^form-text-/, 'form-');
  name = name.replace(/^form-form-/, 'form-');
  name = name.replace(/^form-option-/, 'form-');
  name = name.replace(/^form-datecell-/, 'form-');
  name = name.replace(/^form-textarea-/, 'form-');
  name = name.replace(/^global-/, '');
  
  return name;
};

const formatTokenKey = (token) => {
  // console.log(token , "token")

  if (token.name.startsWith('primitives-colors')){
    return token.name.toLowerCase().replace('primitives-colors-', 'color-').replace('alpha-alpha-', 'alpha-');
  }

  if (token.name.startsWith('primitives-spacing')){
    // console.log(token , "token.ffffffffffffffname")
    return token.key.split(" ")[0].toLowerCase()
      .replace('{primitives.','')
      .split('.')
      .join('-')
      .replace(/(\d)[․.](\d)/g, '$1_$2'); // Replace dots between digits with underscore
  }

  if (token.name.startsWith('primitives-radius')){
    // Convert primitives-radius-radius-X to radius-X
    return token.name.toLowerCase().replace('primitives-radius-radius-', 'radius-');
  }

  if (token.name.startsWith('radius-components-card-radius')){
    // Convert radius-components-card-radius to radius-card
    return 'radius-card';
  }

  if (token.name.startsWith('radius-radius-radius-')){
    // Convert radius-radius-radius-X to radius-X
    return token.name.toLowerCase().replace('radius-radius-radius-', 'radius-');
  }

  if (token.name.startsWith('spacing-card-card-')){
    // Convert spacing-card-card-X to spacing-card-X
    return token.name.toLowerCase().replace('spacing-card-card-', 'spacing-card-');
  }

  // Remove duplicated words in spacing tokens
  if (token.name.startsWith('spacing-section-section-')){
    return token.name.toLowerCase().replace('spacing-section-section-', 'spacing-section-');
  }
  if (token.name.startsWith('spacing-text-text-')){
    return token.name.toLowerCase().replace('spacing-text-text-', 'spacing-text-');
  }
  if (token.name.startsWith('spacing-icon-icon-')){
    return token.name.toLowerCase().replace('spacing-icon-icon-', 'spacing-icon-');
  }
  if (token.name.startsWith('spacing-button-buttons-')){
    return token.name.toLowerCase().replace('spacing-button-buttons-', 'spacing-button-');
  }
  if (token.name.startsWith('spacing-button-button-')){
    return token.name.toLowerCase().replace('spacing-button-button-', 'spacing-button-');
  }
  if (token.name.startsWith('spacing-link-links-')){
    return token.name.toLowerCase().replace('spacing-link-links-', 'spacing-link-');
  }
  if (token.name.startsWith('spacing-link-link-')){
    return token.name.toLowerCase().replace('spacing-link-link-', 'spacing-link-');
  }
  if (token.name.startsWith('spacing-control-control-')){
    return token.name.toLowerCase().replace('spacing-control-control-', 'spacing-control-');
  }
  if (token.name.startsWith('spacing-accordion-accordion-')){
    return token.name.toLowerCase().replace('spacing-accordion-accordion-', 'spacing-accordion-');
  }
  if (token.name.startsWith('spacing-global-spacing-')){
    return token.name.toLowerCase().replace('spacing-global-spacing-', 'spacing-');
  }
  if (token.name.startsWith('spacing-tooltip-tooltip-')){
    return token.name.toLowerCase().replace('spacing-tooltip-tooltip-', 'spacing-tooltip-');
  }
  if (token.name.startsWith('spacing-form-')){
    return token.name.toLowerCase().replace('spacing-form-', 'spacing-');
  }
  if (token.name.startsWith('spacing-tab-')){
    return token.name.toLowerCase().replace('spacing-tab-', 'spacing-');
  }
  if (token.name.startsWith('spacing-table-table-')){
    return token.name.toLowerCase().replace('spacing-table-table-', 'spacing-table-');
  }
  if (token.name.startsWith('spacing-progress-indicator-progress-indicator-')){
    return token.name.toLowerCase().replace('spacing-progress-indicator-progress-indicator-', 'spacing-progress-indicator-');
  }
  if (token.name.startsWith('spacing-pagination-pagination-')){
    return token.name.toLowerCase().replace('spacing-pagination-pagination-', 'spacing-pagination-');
  }
  if (token.name.startsWith('spacing-model-modal-')){
    // Note: "model" is likely a typo for "modal", keeping as modal
    return token.name.toLowerCase().replace('spacing-model-modal-', 'spacing-modal-');
  }
  if (token.name.startsWith('spacing-notification-notification-')){
    return token.name.toLowerCase().replace('spacing-notification-notification-', 'spacing-notification-');
  }

  if (token.name.startsWith('primitives-typography-size-text-size')){
    // Convert primitives-typography-size-text-size-X to typography-text-size-X
    return token.name.toLowerCase().replace('primitives-typography-size-text-size-', 'typography-text-size-');
  }

  if (token.name.startsWith('primitives-typography-font-family-font-family')){
    // Convert primitives-typography-font-family-font-family-X to typography-font-family-X
    return token.name.toLowerCase().replace('primitives-typography-font-family-font-family-', 'typography-font-family-');
  }

  if (token.name.startsWith('primitives-typography-line-hight-line-hight')){
    // Convert primitives-typography-line-hight-line-hight-X to typography-line-hight-X
    return token.name.toLowerCase().replace('primitives-typography-line-hight-line-hight-', 'typography-line-hight-');
  }

  if (token.name.startsWith('primitives-typography-font-weight-font-weight')){
    // Convert primitives-typography-font-weight-font-weight-X to typography-font-weight-X
    return token.name.toLowerCase().replace('primitives-typography-font-weight-font-weight-', 'typography-font-weight-');
  }

  if (token.name.startsWith('primitives-typography-paragraph-spacing-paragraph-spacing')){
    // Convert primitives-typography-paragraph-spacing-paragraph-spacing-X to typography-paragraph-spacing-X
    return token.name.toLowerCase().replace('primitives-typography-paragraph-spacing-paragraph-spacing-', 'typography-paragraph-spacing-');
  }

  // Fix typography-font-wieght (typo) and remove duplicate
  if (token.name.startsWith('typography-font-wieght-font-weight-')){
    return token.name.toLowerCase().replace('typography-font-wieght-font-weight-', 'typography-font-weight-');
  }

  // Fix typography-paragraph-spacing duplicates
  if (token.name.startsWith('typography-paragraph-spacing-display-paragraph-spacing-display-')){
    return token.name.toLowerCase().replace('typography-paragraph-spacing-display-paragraph-spacing-display-', 'typography-paragraph-spacing-display-');
  }
  if (token.name.startsWith('typography-paragraph-spacing-text-paragraph-spacing-text-')){
    return token.name.toLowerCase().replace('typography-paragraph-spacing-text-paragraph-spacing-text-', 'typography-paragraph-spacing-text-');
  }

  // Fix typography-line-height duplicates
  if (token.name.startsWith('typography-line-height-text-line-heights-text-')){
    return token.name.toLowerCase().replace('typography-line-height-text-line-heights-text-', 'typography-line-heights-text-');
  }
  if (token.name.startsWith('typography-line-height-display-line-heights-display-')){
    return token.name.toLowerCase().replace('typography-line-height-display-line-heights-display-', 'typography-line-heights-display-');
  }

  // Fix typography-size duplicates  
  if (token.name.startsWith('typography-size-text-typo-size-')){
    return token.name.toLowerCase().replace('typography-size-text-typo-size-', 'typography-typo-size-');
  }
  if (token.name.startsWith('typography-size-display-typo-size-')){
    return token.name.toLowerCase().replace('typography-size-display-typo-size-', 'typography-typo-size-');
  }

  // Fix widths
  if (token.name.startsWith('widths-width-width-')){
    return token.name.toLowerCase().replace('widths-width-width-', 'width-');
  }
  if (token.name === 'widths-max-width-paragraph-max-width'){
    return 'paragraph-max-width';
  }

  // Fix containers
  if (token.name.startsWith('containers-container-max-width-')){
    return token.name.toLowerCase().replace('containers-container-max-width-', 'container-max-width-');
  }
  if (token.name.startsWith('containers-container-padding-')){
    return token.name.toLowerCase().replace('containers-container-padding-', 'container-padding-');
  }
  if (token.name === 'containers-screen-width-max-width-desktop'){
    return 'screen-max-width-desktop';
  }
  if (token.name === 'containers-screen-hight-min-hight-desktop'){
    return 'screen-min-hight-desktop';
  }

  return token.name.toLowerCase();
}


// Theme format for Light mode
StyleDictionary.registerFormat({
  name: 'css/theme-light',
  format: function ({ dictionary }) {
    const selector = `:root, [data-theme="light"]`;
    
    const allVars = dictionary.allTokens
      .filter((token) => token.filePath === 'tokens/Themes.json')
      .map((token) => {
        const newName = formatThemeTokenName(token.name);
        
        // Get the Light value from the $value object
        const lightValue = token.original.$value?.Light || token.original.$value;
        
        if (typeof lightValue === 'string' && lightValue.startsWith('{')) {
          const formattedRef = formatThemeReferenceValue(lightValue);
          return `  --${newName}: var(--${formattedRef});`;
        }
        
        return `  --${newName}: ${lightValue};`;
      })
      .join('\n');
    
    return `${selector} {\n${allVars}\n}\n`;
  },
});

// Theme format for Dark mode
StyleDictionary.registerFormat({
  name: 'css/theme-dark',
  format: function ({ dictionary }) {
    const selector = `[data-theme="dark"]`;
    
    const allVars = dictionary.allTokens
      .filter((token) => token.filePath === 'tokens/Themes.json')
      .map((token) => {
        const newName = formatThemeTokenName(token.name);
        
        // Get the Dark value from the $value object
        const darkValue = token.original.$value?.Dark || token.original.$value;
        
        if (typeof darkValue === 'string' && darkValue.startsWith('{')) {
          const formattedRef = formatThemeReferenceValue(darkValue);
          return `  --${newName}: var(--${formattedRef});`;
        }
        
        return `  --${newName}: ${darkValue};`;
      })
      .join('\n');
    
    return `${selector} {\n${allVars}\n}\n`;
  },
});

StyleDictionary.registerFormat({
  name: 'css/index-variables',
  format: function ({ dictionary }) {

    // const fileHeader = '/**\n * Do not edit directly, this file was auto-generated.\n */\n\n';
    const selector = `:root`;

    const allVars = dictionary.allTokens
      .map((token) => {
        // Create a new path that filters out the dynamic brand name
        // e.g., ['background', 'button', 'alrajhi-bank', 'primary'] becomes ['background', 'button', 'primary']

        let newName = formatTokenKey(token);

        // console.log(newName , "newName")

        let value = ''

        if (token.filePath === 'tokens/Primitives.json') {
          value = token.$value
          // Quote font-family values that contain spaces
          if (token.name.includes('font-family') && typeof value === 'string' && value.includes(' ')) {
            value = `"${value}"`
          }
          // Convert Figma font-weight names to CSS numeric values
          if (token.name.includes('font-weight') && fontWeightMap[value] !== undefined) {
            value = fontWeightMap[value]
          }
        } else {
          const formattedRef = formatReferenceValue(token.original.$value);
          value = `var(--${formattedRef})`
        }

        return `  --${newName}: ${value};`;
      })
      .join('\n');

    return `${selector} {\n${allVars}\n}\n`;
  },
});



function getStyleDictionaryConfig(
) {
  return {
    source: ["tokens/**/*.json", 
    ],

    platforms: {
      globals: {
        transforms: ["name/kebab", "color/hex", "size/px"],
        buildPath: "build/css/",
        files: [
          {
            destination: "globals.css",
            format: "css/index-variables",
            // format: "css/index",
            options: {
              showFileHeader: false,
              //   selector: ":root",
              outputReferences: true,
            },
            filter: (token) => {
              return (
                !token.filePath.includes("Themes.json") 
                // || token.filePath.includes(`/themes/light`)
              );
            },
          },
          {
            destination: "theme-light.css",
            format: "css/theme-light",
            options: {
              showFileHeader: false,
            },
            filter: (token) => {
              return token.filePath.includes("Themes.json");
            },
          },
          {
            destination: "theme-dark.css",
            format: "css/theme-dark",
            options: {
              showFileHeader: false,
            },
            filter: (token) => {
              return token.filePath.includes("Themes.json");
            },
          },
          //   {
          //     destination: "core.css",
          //     format: "css/core",
          //     options: {
          //       showFileHeader: false,
          //     },
          //     filter: (token) => {
          //       return token.filePath.includes("/core");
          //     },
          //   },
          //   {
          //     destination: "typography.css",
          //     format: "css/typography-classes",
          //     options: {
          //       showFileHeader: false,
          //     },
          //     filter: (token) => {
          //       return token.filePath.includes("/globals/typography.json");
          //     },
          //   },
          //   {
          //     destination: "index.css",
          //     format: "css/index",
          //     options: {
          //       buildPath: "build/css/",
          //     },
          //   },
        ],
        // include: [`tokens/themes/light.json`],
      },

    },
  };
}

// themes.map((theme) => {
//   console.log("\n==============================================");
//   console.log(`\nProcessing: [${theme}]`);

//   const StyleDictionaryConfig = getStyleDictionaryConfig(theme);

//   const sd = new StyleDictionary(StyleDictionaryConfig);
//   sd.log.verbosity = "verbose";
//   if (theme === "light") {
//     sd.buildAllPlatforms();
//   } else {
//     sd.buildPlatform("themes");
//   }

//   console.log("\nEnd processing");
// });

const sd = new StyleDictionary(getStyleDictionaryConfig());
sd.buildAllPlatforms();
