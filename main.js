/**
 * VocalizeX - AI-Powered Text-to-Speech Website
 * Main JavaScript Functionality
 */

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const sunIcon = themeToggleBtn.querySelector('.fa-sun');
const moonIcon = themeToggleBtn.querySelector('.fa-moon');
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const convertButton = document.querySelector('.convert-button');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-modal');
const applySettingsBtn = document.querySelector('.apply-settings');
const pitchSlider = document.getElementById('pitch-slider');
const speedSlider = document.getElementById('speed-slider');
const emphasisSlider = document.getElementById('emphasis-slider');
const sliderValues = document.querySelectorAll('.slider-value');

// Voice Settings
let voiceSettings = {
    pitch: 1,
    speed: 1,
    emphasis: 1
};

// Initialize WaveSurfer
let wavesurfer = null;

// Initialize Speech Synthesis
const synth = window.speechSynthesis;
let utterance = null;
let availableVoices = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initWaveSurfer();
    initVoices();
    initEventListeners();
    initAnimations();
});

// Initialize WaveSurfer with microphone input
function initWaveSurfer() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#1F77FF', // Electric Blue
        progressColor: '#8A2BE2', // Neon Violet
        cursorColor: '#2EC4B6', // Vibrant Turquoise
        barWidth: 3,
        barRadius: 3,
        cursorWidth: 1,
        height: 128,
        barGap: 2,
        responsive: true,
        normalize: true,
        partialRender: true,
    });

    // Create a dummy audio context for visualization
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    // Create a custom audio visualization
    function createAudioVisualization() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Generate random data for visualization
        function updateVisualization() {
            if (!wavesurfer.isPlaying()) return;
            
            // Generate random frequency data for visualization
            for (let i = 0; i < bufferLength; i++) {
                const randomValue = Math.random() * 255;
                dataArray[i] = randomValue;
            }
            
            // Update waveform
            wavesurfer.drawer.drawPeaks([...dataArray], 1000, 0, 1000);
            
            requestAnimationFrame(updateVisualization);
        }
        
        return updateVisualization;
    }
    
    // Store the visualization function
    window.audioVisualization = createAudioVisualization();
}

// Initialize voices and populate dropdown
function initVoices() {
    // Function to populate voice list
    function populateVoiceList() {
        availableVoices = synth.getVoices();
        
        // Clear existing options
        voiceSelect.innerHTML = '';
        
        // Add voices to dropdown
        availableVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // If no voices are available yet, try again
        if (availableVoices.length === 0) {
            setTimeout(populateVoiceList, 100);
        }
    }
    
    // Chrome loads voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    } else {
        // For other browsers
        populateVoiceList();
    }
}

// Initialize Event Listeners
function initEventListeners() {
    // Theme Toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Convert Button
    convertButton.addEventListener('click', convertTextToSpeech);

    // Playback Controls
    playBtn.addEventListener('click', playAudio);
    pauseBtn.addEventListener('click', pauseAudio);
    stopBtn.addEventListener('click', stopAudio);

    // Settings Modal
    settingsBtn.addEventListener('click', openSettingsModal);
    closeModalBtn.addEventListener('click', closeSettingsModal);
    applySettingsBtn.addEventListener('click', applySettings);

    // Sliders
    pitchSlider.addEventListener('input', updateSliderValue);
    speedSlider.addEventListener('input', updateSliderValue);
    emphasisSlider.addEventListener('input', updateSliderValue);

    // Initialize slider values
    updateAllSliderValues();
}

// Initialize Animations
function initAnimations() {
    // Add animation classes to elements when they come into view
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });

    // Elements to animate
    document.querySelectorAll('.feature-card, .tts-container, .section-title').forEach(el => {
        animateOnScroll.observe(el);
    });
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    sunIcon.classList.toggle('active');
    moonIcon.classList.toggle('active');
}

// Convert Text to Speech
function convertTextToSpeech() {
    const text = textInput.value.trim();
    if (!text) {
        alert('Please enter some text to convert to speech.');
        return;
    }

    // Cancel any ongoing speech
    synth.cancel();
    
    // Create a new utterance
    utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.speed;
    
    // Select voice based on dropdown
    const selectedVoiceIndex = parseInt(voiceSelect.value);
    
    // Make sure we have voices available
    if (availableVoices.length > 0) {
        // Use the selected voice if valid, otherwise use the first available voice
        utterance.voice = availableVoices[selectedVoiceIndex] || availableVoices[0];
    }
    
    // Event handlers
    utterance.onstart = () => {
        // Start the waveform animation
        animateWaveform(true);
        // Start audio visualization
        requestAnimationFrame(window.audioVisualization);
    };
    
    utterance.onend = () => {
        // Stop the waveform animation
        animateWaveform(false);
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        animateWaveform(false);
    };
    
    // Speak the text
    synth.speak(utterance);
    
    // Start waveform visualization
    startWaveformVisualization();
}

// Start Waveform Visualization
function startWaveformVisualization() {
    // Reset waveform
    wavesurfer.empty();
    
    // Create a dynamic waveform based on speech
    const waveformData = generateDynamicWaveform();
    wavesurfer.load(waveformData);
    
    // Play the waveform
    setTimeout(() => {
        wavesurfer.play();
    }, 100);
}

// Generate Dynamic Waveform
function generateDynamicWaveform() {
    // Create a dummy audio element for visualization
    const audioElement = document.createElement('audio');
    
    // Use a silent audio file as base
    const silentAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audioElement.src = silentAudio;
    
    return audioElement;
}

// Animate Waveform
function animateWaveform(isPlaying) {
    const waveform = document.getElementById('waveform');
    if (isPlaying) {
        waveform.classList.add('playing');
    } else {
        waveform.classList.remove('playing');
    }
}

// Playback Controls
function playAudio() {
    if (synth.paused) {
        synth.resume();
    } else if (utterance) {
        synth.speak(utterance);
    }
    wavesurfer.play();
    requestAnimationFrame(window.audioVisualization);
}

function pauseAudio() {
    synth.pause();
    wavesurfer.pause();
}

function stopAudio() {
    synth.cancel();
    wavesurfer.stop();
}

// Settings Modal
function openSettingsModal() {
    settingsModal.classList.add('active');
}

function closeSettingsModal() {
    settingsModal.classList.remove('active');
}

function applySettings() {
    voiceSettings.pitch = parseFloat(pitchSlider.value);
    voiceSettings.speed = parseFloat(speedSlider.value);
    voiceSettings.emphasis = parseFloat(emphasisSlider.value);
    
    closeSettingsModal();
    
    // If there's an active utterance, update its settings
    if (utterance) {
        utterance.pitch = voiceSettings.pitch;
        utterance.rate = voiceSettings.speed;
    }
}

// Update Slider Values
function updateSliderValue(e) {
    const slider = e.target;
    const value = parseFloat(slider.value).toFixed(1);
    const valueDisplay = slider.nextElementSibling;
    valueDisplay.textContent = value;
}

function updateAllSliderValues() {
    pitchSlider.nextElementSibling.textContent = pitchSlider.value;
    speedSlider.nextElementSibling.textContent = speedSlider.value;
    emphasisSlider.nextElementSibling.textContent = emphasisSlider.value;
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for navbar height
                behavior: 'smooth'
            });
        }
    });
});

// Add animation to the CTA button
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('mouseover', () => {
        ctaButton.classList.add('pulse');
    });
    
    ctaButton.addEventListener('mouseout', () => {
        ctaButton.classList.remove('pulse');
    });
    
    ctaButton.addEventListener('click', () => {
        // Scroll to the TTS demo section
        const ttsDemo = document.querySelector('.tts-demo');
        if (ttsDemo) {
            window.scrollTo({
                top: ttsDemo.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
}

// Add CSS for enhanced visualization and effects
const style = document.createElement('style');
style.textContent = `
    .cursor-effect {
        position: absolute;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, var(--secondary-color), transparent);
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        opacity: 0.7;
        z-index: 9999;
        animation: cursorFade 1s forwards;
    }
    
    @keyframes cursorFade {
        0% {
            opacity: 0.7;
            width: 10px;
            height: 10px;
        }
        100% {
            opacity: 0;
            width: 50px;
            height: 50px;
        }
    }
    
    .animated {
        animation: fadeIn 1s forwards;
    }
    
    #waveform.playing {
        animation: waveformPulse 2s infinite;
    }
    
    @keyframes waveformPulse {
        0% {
            box-shadow: 0 0 0 0 rgba(31, 119, 255, 0.4);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(31, 119, 255, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(31, 119, 255, 0);
        }
    }
    
    .pulse {
        animation: pulse 1s infinite;
    }
    
    /* Enhanced waveform visualization */
    #waveform wave {
        animation: colorShift 3s infinite alternate;
    }
    
    @keyframes colorShift {
        0% {
            filter: hue-rotate(0deg);
        }
        100% {
            filter: hue-rotate(90deg);
        }
    }
`;

document.head.appendChild(style);

// Add cursor effects (with reduced frequency for performance)
let lastCursorTime = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastCursorTime < 100) return; // Limit to one effect every 100ms
    
    lastCursorTime = now;
    const cursor = document.createElement('div');
    cursor.classList.add('cursor-effect');
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
    
    document.body.appendChild(cursor);
    
    setTimeout(() => {
        cursor.remove();
    }, 1000);
});
