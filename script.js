import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const resultSection = document.getElementById('resultSection');
const loadingIndicator = document.getElementById('loadingIndicator');
const imagePreview = document.getElementById('imagePreview');
const resetBtn = document.getElementById('resetBtn');
const copyFinalBtn = document.getElementById('copyFinalBtn');
const finalPromptText = document.getElementById('finalPromptText');
const parametersList = document.getElementById('parametersList');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const apiKeyInput = document.getElementById('apiKey');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const toast = document.getElementById('toast');

// State
let currentFile = null;
let currentBase64 = null;
let generatedPromptStr = '';

// Load saved API key
const savedApiKey = localStorage.getItem('gemini_api_key');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
} else {
    // If no API key, prompt user on first load
    setTimeout(() => {
        settingsModal.classList.remove('hidden');
    }, 1000);
}

// Settings Handlers
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    const val = apiKeyInput.value.trim();
    if (val) {
        localStorage.setItem('gemini_api_key', val);
    } else {
        localStorage.removeItem('gemini_api_key');
    }
    settingsModal.classList.add('hidden');
});

// Click outside modal to close
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

// Drag & Drop Handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
});

resetBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    uploadSection.querySelector('.drop-zone').classList.remove('hidden');
    uploadSection.querySelector('h2').classList.remove('hidden');
    uploadSection.querySelector('.subtitle').classList.remove('hidden');
    currentFile = null;
    currentBase64 = null;
    fileInput.value = '';
});

// File Handling
function handleFile(file) {
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    if (!isImage) {
        alert('Please upload an image file (JPG, PNG, WEBP).');
        return;
    }

    currentFile = file;
    const reader = new FileReader();

    // Show loading UI
    uploadSection.querySelector('.drop-zone').classList.add('hidden');
    uploadSection.querySelector('h2').classList.add('hidden');
    uploadSection.querySelector('.subtitle').classList.add('hidden');
    loadingIndicator.classList.remove('hidden');

    reader.onload = async (e) => {
        currentBase64 = e.target.result;
        imagePreview.src = currentBase64;
        
        await analyzeImage(currentBase64, file.type);
    };

    reader.readAsDataURL(file);
}

// Convert Base64 to API format
function base64ToGenerativePart(base64Data, mimeType) {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Str = base64Data.split(',')[1];
    return {
        inlineData: {
            data: base64Str,
            mimeType
        },
    };
}

// Simulated Analysis for when API key is missing
function mockAnalysis() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                medium: "Digital illustration",
                primary_subject: "a glowing neon-lit sports car",
                action_pose: "speeding down an empty highway",
                environment: "a dense cyberpunk city street at night",
                camera_angle: "low angle dynamic shot",
                lighting: "harsh dramatic shadows and neon rim light",
                color_palette: "vibrant purples, deep blues, and cyan",
                mood: "energetic and gritty",
                technical_details: "8k resolution, highly detailed, Unreal Engine 5 render"
            });
        }, 1500);
    });
}

// Real Analysis using Gemini API
async function analyzeImage(base64Data, mimeType) {
    const key = localStorage.getItem('gemini_api_key');
    let data;

    const schemaStr = `
    {
        "medium": "The visual format or artistic method (e.g., Digital illustration, 35mm photography, watercolor painting, cinematic 3D render).",
        "primary_subject": "The core focal point, described with specific physical attributes, age, or clothing.",
        "action_pose": "The kinetic state of the subject.",
        "environment": "The background and spatial context.",
        "camera_angle": "The framing of the subject (e.g., extreme close-up, wide-angle landscape, Dutch angle).",
        "lighting": "The directional or ambient light sources (e.g., golden hour sunlight, harsh dramatic shadows).",
        "color_palette": "The dominant hues or specific color grading (e.g., monochromatic, vibrant pastels).",
        "mood": "The emotional resonance or environmental tone.",
        "technical_details": "Descriptors for output quality or specific rendering engines (e.g., 8k resolution, highly detailed, Unreal Engine 5)."
    }`;

    try {
        if (!key) {
            console.warn("No API key found, using simulated analysis.");
            data = await mockAnalysis();
        } else {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Analyze this image and provide a highly detailed description using this JSON schema:\n${schemaStr}`;

            const imagePart = base64ToGenerativePart(base64Data, mimeType);

            let result;
            let retries = 3;
            while (retries > 0) {
                try {
                    result = await model.generateContent([prompt, imagePart]);
                    break;
                } catch (e) {
                    if (e.message.includes('503') && retries > 1) {
                        retries--;
                        await new Promise(r => setTimeout(r, 2000)); // wait 2s
                        continue;
                    }
                    throw e;
                }
            }
            const response = await result.response;
            const text = response.text();
            
            // Clean markdown JSON markers if the model adds them
            const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            data = JSON.parse(cleanedText);
        }

        renderResult(data);
    } catch (err) {
        console.error(err);
        alert(`Analysis failed: ${err.message}\n\nPlease check your API key and try again.`);
        resetBtn.click();
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Render the final output structures
function renderResult(data) {
    // Construct the final string based on user's exact format requirement
    generatedPromptStr = `${capitalize(data.medium)} of ${data.primary_subject}, ${data.action_pose}, located in ${data.environment}. ${capitalize(data.camera_angle)}, ${data.lighting}, ${data.color_palette}. ${capitalize(data.mood)}, ${data.technical_details}.`;

    finalPromptText.textContent = generatedPromptStr;

    // Render parameters breakdown
    const displayMap = {
        'Medium/Art Style': data.medium,
        'Primary Subject': data.primary_subject,
        'Action/Pose': data.action_pose,
        'Environment/Setting': data.environment,
        'Camera Angle/Composition': data.camera_angle,
        'Lighting': data.lighting,
        'Color Palette': data.color_palette,
        'Mood/Atmosphere': data.mood,
        'Technical Details/Resolution': data.technical_details
    };

    parametersList.innerHTML = '';
    for (const [key, value] of Object.entries(displayMap)) {
        const item = document.createElement('div');
        item.className = 'param-item';
        item.innerHTML = `
            <strong>${key}</strong>
            <span>${value}</span>
        `;
        parametersList.appendChild(item);
    }

    // Switch views
    uploadSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
}

// Copy to clipboard function
copyFinalBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(generatedPromptStr);
        showToast("Copied exact prompt to clipboard!");
    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = generatedPromptStr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("Copy");
        textArea.remove();
        showToast("Copied to clipboard!");
    }
});

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
