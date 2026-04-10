# Image Scan Prompt Generator

A sleek, web-based tool designed to analyze any uploaded image and automatically generate a highly structured, comprehensive text prompt using Google's **Gemini 2.5 Flash** Vision AI.

## Features
- **Effortless Uploads**: Seamless drag-and-drop interface or traditional file browsing.
- **Dynamic Prompt Breakdown**: Takes your image and isolates key components including:
  - Medium/Art Style
  - Primary Subject
  - Action/Pose
  - Environment/Setting
  - Camera Angle/Composition
  - Lighting & Color Palette
  - Mood/Atmosphere
  - Technical Details/Resolution
- **Premium UI**: Built with a dark-themed glassmorphism aesthetic, sleek hover states, and dynamic gradient backgrounds.
- **Copy-to-Clipboard**: One-click prompt copying instantly gives you a read-to-paste AI generation string.
- **Secure Local API Key**: All Gemini API keys are processed locally on your browser and are never sent to external third parties (other than Google directly).

## How to use locally
To run this project on your personal machine:

1. Clone this repository:
   ```bash
   git clone https://github.com/KingDanielTaotua/photo-prompt.git
   ```
2. Navigate into the folder:
   ```bash
   cd photo-prompt
   ```
3. Start a local server. You can use any lightweight sever like Python's `http.server` or Node's `serve`:
   ```bash
   npx serve .
   ```
4. Open the localhost link in your browser.
5. Click the top-right Settings icon to input your free Gemini API key to activate the live vision analysis!

## Technologies Used
- HTML5, CSS3 (Vanilla)
- JavaScript (ES Modules)
- Google Generative AI Web SDK `@google/generative-ai`

---
*Created by [Daniel Taotua](https://www.instagram.com/danieltaotua/).*
