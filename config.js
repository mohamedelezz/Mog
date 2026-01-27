import StyleDictionary from "style-dictionary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get all mode files
const themes = fs
  .readdirSync("./tokens/themes")
  .filter((file) => file.endsWith(".json"))
  .map((file) => path.basename(file, ".json"));

// Helper function to process typography tokens
function processTypographyTokens(dictionary) {
  const fontFamilies = {};

  dictionary.allTokens
    .filter((token) => token.path[0] === "typography")
    .forEach((token) => {
      const fontFamily = token.path[1]; // rubik or ping

      if (!fontFamilies[fontFamily]) {
        fontFamilies[fontFamily] = {
          fontFamily: null,
          weights: {},
          sizes: {},
          lineHeights: {},
          letterSpacings: {},
          paragraphSpacings: {},
        };
      }

      // Handle font-family
      if (
        token.path[2] === "type" &&
        token.path[3] === "font-family" &&
        token.path[4] === "primary"
      ) {
        fontFamilies[fontFamily].fontFamily = token.$value;
      }

      // Handle font-weight
      else if (token.path[2] === "type" && token.path[3] === "font-weight") {
        fontFamilies[fontFamily].weights[token.path[4]] = token.$value;
      }

      // Handle font-size
      else if (token.path[2] === "font-size") {
        const category = token.path[3]; // display or text
        const size = token.path[4]; // lg, md, sm, etc.

        if (!fontFamilies[fontFamily].sizes[category]) {
          fontFamilies[fontFamily].sizes[category] = {};
        }
        fontFamilies[fontFamily].sizes[category][size] = token.$value;
      }

      // Handle line-height (note: your JSON has "line-hight" typo)
      else if (token.path[2] === "line-height") {
        const category = token.path[3]; // display or text
        const size = token.path[4]; // lg, md, sm, etc.

        if (!fontFamilies[fontFamily].lineHeights[category]) {
          fontFamilies[fontFamily].lineHeights[category] = {};
        }
        fontFamilies[fontFamily].lineHeights[category][size] = token.$value;
      }

      // Handle letter-spacing
      else if (token.path[2] === "letter-spacing") {
        const category = token.path[3]; // display or text
        const size = token.path[4]; // lg, md, sm, etc.

        if (!fontFamilies[fontFamily].letterSpacings[category]) {
          fontFamilies[fontFamily].letterSpacings[category] = {};
        }
        fontFamilies[fontFamily].letterSpacings[category][size] = token.$value;
      }

      // Handle paragraph-spacing
      else if (token.path[2] === "paragraph-spacing") {
        const category = token.path[3]; // display or text
        const size = token.path[4]; // lg, md, sm, etc.

        if (!fontFamilies[fontFamily].paragraphSpacings[category]) {
          fontFamilies[fontFamily].paragraphSpacings[category] = {};
        }
        fontFamilies[fontFamily].paragraphSpacings[category][size] =
          token.$value;
      }
    });

  return fontFamilies;
}

// Register CSS format for typography classes
StyleDictionary.registerFormat({
  name: "css/typography-classes",
  format: function ({ dictionary }) {
    const fontFamilies = processTypographyTokens(dictionary);

    let css = "";

    // Generate CSS for each font family
    Object.entries(fontFamilies).forEach(([fontFamily, data]) => {
      // Base font family class
      css += `.font-${fontFamily.toLowerCase()} {\n`;
      if (data.fontFamily) {
        css += `  font-family: ${data.fontFamily};\n`;
      }
      css += `}\n\n`;

      // Generate size classes by combining all properties with weights
      const allSizeClasses = new Set();

      // Collect all unique size combinations
      Object.keys(data.sizes || {}).forEach((category) => {
        Object.keys(data.sizes[category] || {}).forEach((size) => {
          allSizeClasses.add(`${category}-${size}`);
        });
      });

      // Generate CSS for each size class with each weight
      allSizeClasses.forEach((sizeClass) => {
        const [category, size] = sizeClass.split("-");

        // Generate a class for each font weight
        Object.keys(data.weights || {}).forEach((weight) => {
          css += `.font-${fontFamily.toLowerCase()} .${sizeClass}-${weight} {\n`;

          // Add font-size
          if (data.sizes?.[category]?.[size]) {
            css += `  font-size: ${data.sizes[category][size] / 16}rem;\n`;
          }

          // Add line-height
          if (data.lineHeights?.[category]?.[size]) {
            css += `  line-height: ${data.lineHeights[category][size] / 16}rem;\n`;
          }

          // Add letter-spacing
          if (data.letterSpacings?.[category]?.[size]) {
            css += `  letter-spacing: ${data.letterSpacings[category][size] / 16}rem;\n`;
          }

          // Add paragraph-spacing as margin-bottom
          if (data.paragraphSpacings?.[category]?.[size]) {
            css += `  margin-bottom: ${data.paragraphSpacings[category][size] / 16}rem;\n`;
          }

          // Add font-weight
          css += `  font-weight: ${data.weights[weight]};\n`;

          css += `}\n\n`;
        });
      });
    });

    return css;
  },
});

// Add this format registration to generate a dynamic index.css file
StyleDictionary.registerFormat({
  name: "css/index",
  format: function ({ options }) {
    // Get the build path
    const buildPath = options.buildPath || "build/css/";
    const fullBuildPath = path.resolve(__dirname, buildPath);
    const themesPath = path.join(fullBuildPath, "themes");
    const modesPath = path.join(fullBuildPath, "modes");

    // Function to get all CSS files in a directory
    const getCSSFiles = (dirPath) => {
      try {
        if (fs.existsSync(dirPath)) {
          return fs
            .readdirSync(dirPath)
            .filter((file) => file.endsWith(".css"))
            .sort();
        }
        return [];
      } catch (error) {
        console.warn(`Could not read directory: ${dirPath}`);
        console.error(error);
        return [];
      }
    };

    // Get all theme and mode files
    const themeFiles = getCSSFiles(themesPath);
    const modeFiles = getCSSFiles(modesPath);

    // Generate theme imports
    const themeImports = themeFiles
      .map(
        (file) =>
          `/* ${file.replace(".css", "").toUpperCase()} Theme */\n@import './themes/${file}';`
      )
      .join("\n\n");

    // Generate mode imports
    const modeImports = modeFiles
      .map(
        (file) =>
          `/* ${file.replace(".css", "").replace("-", " ").toUpperCase()} Mode */\n@import './modes/${file}';`
      )
      .join("\n\n");

    const header = `/*!
 * ARG Global Design System - Design Tokens
 * CSS Entry Point - All Available Tokens
 * 
 * This file imports all available CSS design tokens including:
 * - Global tokens (colors, dimensions, typography, etc.)
 * - Theme-specific tokens (${themeFiles.length} themes)
 * - Mode-specific tokens (${modeFiles.length} modes)
 * 
 * Auto-generated - Do not edit manually
 * Generated on: ${new Date().toISOString()}
 */

/* ==========================================================================
   GLOBAL TOKENS
   ========================================================================== */

/* Core global tokens - colors, dimensions, typography, etc. */
@import './globals.css';

/* Typography-specific tokens */
@import './typography.css';

/* ==========================================================================
   MODE TOKENS (${modeFiles.length} modes)
   ========================================================================== */

${modeImports || "/* No mode files found */"}

/* ==========================================================================
   THEME TOKENS (${themeFiles.length} themes)
   ========================================================================== */

${themeImports || "/* No theme files found */"}

/* ==========================================================================
   UTILITY CLASSES
   ========================================================================== */

/* Common utility classes using design tokens */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.container {
  max-width: var(--gds-sizing-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--gds-spacing-inset-md, 1rem);
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* ==========================================================================
   USAGE EXAMPLES & DOCUMENTATION
   ========================================================================== */

/* 
 * Theme and Mode Switching:
 * 
 * 1. Apply a specific theme:
 *    <html data-theme="theme-name">
 * 
 * 2. Apply a specific mode:
 *    <html data-mode="mode-name">
 * 
 * 3. Combine theme and mode:
 *    <html data-theme="theme-name" data-mode="mode-name">
 * 
 * 4. Use in CSS:
 *    .my-component {
 *      background-color: var(--gds-color-background-primary);
 *      color: var(--gds-color-text-primary);
 *      padding: var(--gds-spacing-inset-md);
 *      border-radius: var(--gds-radius-md);
 *    }
 * 
 * Available Themes: ${themeFiles.map((f) => f.replace(".css", "")).join(", ") || "none"}
 * Available Modes: ${modeFiles.map((f) => f.replace(".css", "")).join(", ") || "none"}
 * 
 * Total CSS Variables: Check individual files for complete token list
 */`;

    return header;
  },
});

StyleDictionary.registerFormat({
  name: "css/globals",
  format: function ({ dictionary }) {
    console.log(dictionary.allTokens, "hamada");
    dictionary.allTokens.forEach((token) => {
      // Convert numbers from globals/numbers to rem
      //   if (
      //     token.filePath.includes("globals/numbers") &&
      //     typeof token.$value === "number"
      //   ) {
      //     token.$value = `${token.$value / 16}rem`;
      //   }
      return token;
    });

    // Add your CSS output generation here
    const cssOutput = dictionary.allTokens
      .map((token) => `  --${token.name}: ${token.value};`)
      .join("\n");

    return `:root {\n${cssOutput}\n}`;
  },
});

function getStyleDictionaryConfig(
  // theme
) {
  return {
    source: ["tokens/globals/**/*.json", 
      // `tokens/themes/${theme}.json`
    ],

    platforms: {
      globals: {
        transforms: ["name/kebab", "color/hex", "size/px"],
        buildPath: "build/css/",
        files: [
          {
            destination: "globals.css",
            // format: "css/globals",
            format: "css/variables",
            options: {
              showFileHeader: false,
              //   selector: ":root",
              outputReferences: true,
            },
            filter: (token) => {
              return (
                token.filePath.includes("/globals") 
                // || token.filePath.includes(`/themes/light`)
              );
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

      // themes: {
      //   transforms: ["name/kebab", "color/hex", "size/px"],
      //   buildPath: "build/css/themes/",
      //   files: [
      //     {
      //       destination: `${theme.toLowerCase()}.css`,
      //       format: "css/variables",
      //       options: {
      //         selector: `[data-theme="${theme.toLowerCase()}"]`,
      //         outputReferences: true,
      //       },
      //       filter: (token) => {
      //         return token.filePath.includes(`tokens/themes/${theme}`);
      //       },
      //     },
      //   ],
      // },
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
