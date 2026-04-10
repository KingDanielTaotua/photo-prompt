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
                style: "Digital illustration, cyberpunk influence, hyper-realistic",
                subject: {
                    identity: "Female, 20s, East Asian descent",
                    facial_structure: "Sharp jawline, high cheekbones, symmetrical features",
                    skin: "Smooth texture, pale tone, glowing neon reflections",
                    hair: "Short bob, thick density, synthetic glossy finish",
                    body: "Tall impression, athletic proportions"
                },
                wardrobe: {
                    clothing: "Techwear jacket, form-fitting suit, heavy layering",
                    fabric: "Matte synthetic, reflective panels, textured mesh",
                    accessories: "Goggles on forehead, oversized collar"
                },
                pose: "Looking over shoulder, chin tilted down, tense shoulders",
                environment: {
                    location: "Neon-lit alleyway rooftop",
                    depth_layers: "Foreground pipes / midground character / background blurred skyscrapers",
                    interaction: "Leaning against a rain-slicked wall"
                },
                camera: {
                    shot_type: "Mid-shot",
                    angle: "Slight low angle",
                    lens: "50mm prime",
                    aperture: "Shallow depth of field"
                },
                lighting: {
                    source: "Artificial street lights",
                    position: "Backlight with rim lighting",
                    quality: "Hard directional light",
                    shadow_behavior: "Long deep shadows",
                    additional: "Cyan bounce light on face"
                },
                color: {
                    palette: "Cyan, magenta, deep blacks",
                    contrast: "High cinematic contrast",
                    temperature: "Cool overall with warm neon accents"
                },
                mood: "Gritty, tense, mysterious narrative",
                micro_details: "Raindrops on jacket, subtle skin pores, glowing seams",
                output_quality: "8k resolution, ultra-detailed, cinematic masterpiece",
                negative: "no distortion, no extra limbs, no blur, no artifacts, no style drift"
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
        "style": "Exact format + stylistic influence + realism level",
        "subject": {
            "identity": "gender, age range, ethnicity if relevant",
            "facial_structure": "jawline, cheekbones, eyes, nose, symmetry",
            "skin": "texture, tone, imperfections",
            "hair": "style, density, flow, finish",
            "body": "height impression, proportions, posture bias"
        },
        "wardrobe": {
            "clothing": "type, fit, layering",
            "fabric": "material physics: matte, reflective, sheer, textured",
            "accessories": "exact placement + scale"
        },
        "pose": "Precise positioning of limbs, head tilt, eye direction, tension in body",
        "environment": {
            "location": "specific type",
            "depth_layers": "foreground / midground / background elements",
            "interaction": "how subject sits in environment"
        },
        "camera": {
            "shot_type": "close-up, mid, full-body",
            "angle": "eye-level, low angle, high angle",
            "lens": "35mm, 50mm, 85mm, wide",
            "aperture": "shallow vs deep"
        },
        "lighting": {
            "source": "natural, studio, artificial",
            "position": "front-left, backlight, overhead",
            "quality": "soft, hard, diffused",
            "shadow_behavior": "length, softness",
            "additional": "rim light, bounce, reflections"
        },
        "color": {
            "palette": "dominant tones",
            "contrast": "high, low, cinematic",
            "temperature": "warm, cool, neutral"
        },
        "mood": "Emotional tone + narrative implication",
        "micro_details": "imperfections, texture realism, environmental effects",
        "output_quality": "8k, ultra-detailed, sharp focus, cinematic",
        "negative": "no distortion, no extra limbs, no blur, no artifacts, no style drift"
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
    // Option A: Flatten the structured object into a comma-separated paragraph string
    const flatProps = [
        data.style,
        data.subject?.identity, data.subject?.facial_structure, data.subject?.skin, data.subject?.hair, data.subject?.body,
        data.wardrobe?.clothing, data.wardrobe?.fabric, data.wardrobe?.accessories,
        data.pose,
        data.environment?.location, data.environment?.depth_layers, data.environment?.interaction,
        data.camera?.shot_type, data.camera?.angle, data.camera?.lens, data.camera?.aperture,
        data.lighting?.source, data.lighting?.position, data.lighting?.quality, data.lighting?.shadow_behavior, data.lighting?.additional,
        data.color?.palette, data.color?.contrast, data.color?.temperature,
        data.mood,
        data.micro_details,
        data.output_quality
    ].filter(Boolean); // remove any empty/undefined fields

    generatedPromptStr = flatProps.join(", ") + " --no " + (data.negative || "distortion, artifacts");
    finalPromptText.textContent = generatedPromptStr;

    // Render parameters breakdown using a nested structure
    const displayGroups = [
        { title: '1. Medium / Style', value: data.style },
        { title: '2. Primary Subject', props: { 'Identity': data.subject?.identity, 'Facial structure': data.subject?.facial_structure, 'Skin': data.subject?.skin, 'Hair': data.subject?.hair, 'Body': data.subject?.body } },
        { title: '3. Wardrobe & Materials', props: { 'Clothing': data.wardrobe?.clothing, 'Fabric': data.wardrobe?.fabric, 'Accessories': data.wardrobe?.accessories } },
        { title: '4. Pose / Action', value: data.pose },
        { title: '5. Environment / Setting', props: { 'Location': data.environment?.location, 'Depth layers': data.environment?.depth_layers, 'Interaction': data.environment?.interaction } },
        { title: '6. Camera & Lens', props: { 'Shot type': data.camera?.shot_type, 'Angle': data.camera?.angle, 'Lens': data.camera?.lens, 'Aperture / DOF': data.camera?.aperture } },
        { title: '7. Lighting (Technical)', props: { 'Source': data.lighting?.source, 'Position': data.lighting?.position, 'Quality': data.lighting?.quality, 'Shadow behavior': data.lighting?.shadow_behavior, 'Additional': data.lighting?.additional } },
        { title: '8. Color & Grading', props: { 'Palette': data.color?.palette, 'Contrast': data.color?.contrast, 'Temperature': data.color?.temperature } },
        { title: '9. Mood / Intent', value: data.mood },
        { title: '10. Micro-Details', value: data.micro_details },
        { title: '11. Output Quality', value: data.output_quality },
        { title: '12. Negative Constraints', value: data.negative }
    ];

    parametersList.innerHTML = '';
    displayGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'param-item';
        
        let innerHTML = `<strong>${group.title}</strong>`;
        if (group.value) {
            innerHTML += `<span>${group.value}</span>`;
        } else if (group.props) {
            Object.entries(group.props).forEach(([k, v]) => {
                if(v) innerHTML += `<span class="sub-item"><em>${k}:</em> ${v}</span>`;
            });
        }
        item.innerHTML = innerHTML;
        parametersList.appendChild(item);
    });

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
