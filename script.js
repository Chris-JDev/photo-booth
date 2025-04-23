// Background images
const backgroundImages = {
    none: null,
    beach: "images/beach.jpg",
    cityscape: "images/cityscape.jpg",
    forest: "images/forest.jpg",
    party: "images/party.jpg",
    space: "images/space.jpg"
};

// Variables for webcam control
let currentStream = null;
let currentCamera = 'user'; // Start with front camera
let photoCounter = 1;
let currentFilter = 'none';
let selectedBackground = 'none';
let canvasWidth = 640;
let canvasHeight = 480;
let isListening = false;
let recognitionActive = false;
let recognition;

// Voice command variables
const VOICE_COMMANDS = ['cheese', 'smile', 'tech fest'];

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const compositeCanvas = document.getElementById('composite-canvas');
const photoPreview = document.getElementById('photo-preview');
const switchCameraBtn = document.getElementById('switch-camera');
const takePhotoBtn = document.getElementById('take-photo');
const backgroundOptions = document.querySelectorAll('.background-option');
const filterButtons = document.querySelectorAll('.filter-button');
const saveButton = document.getElementById('save-button');
const retakeButton = document.getElementById('retake-button');
const filterOptions = document.getElementById('filter-options');
const actionButtons = document.getElementById('action-buttons');
const countdownEl = document.getElementById('countdown');

// Initialize webcam on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeWebcam();
    setupSpeechRecognition();
});

// Set up speech recognition
function setupSpeechRecognition() {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // Create speech recognition instance
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Handle recognition results
        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                
                // Check if any of our voice commands are in the transcript
                for (const command of VOICE_COMMANDS) {
                    if (transcript.includes(command)) {
                        console.log(`Voice command detected: ${command}`);
                        if (!takePhotoBtn.disabled) {
                            startPhotoProcess();
                        }
                        break;
                    }
                }
            }
        };
        
        // Handle errors
        recognition.onerror = (event) => {
            console.error('Speech Recognition Error:', event.error);
            toggleVoiceRecognition(); // Try to restart if error occurs
        };
        
        // Handle when recognition stops
        recognition.onend = () => {
            if (recognitionActive) {
                recognition.start(); // Restart if it should be active
            }
        };
        
        // Add voice command toggle button
        addVoiceCommandToggle();
    } else {
        console.warn('Speech Recognition not supported in this browser');
    }
}

// Add voice command toggle button
function addVoiceCommandToggle() {
    const voiceToggleBtn = document.createElement('button');
    voiceToggleBtn.id = 'voice-toggle';
    voiceToggleBtn.className = 'voice-toggle';
    voiceToggleBtn.innerHTML = '🎤 Enable Voice Commands';
    
    // Insert before camera controls
    const cameraControls = document.querySelector('.camera-controls');
    cameraControls.parentNode.insertBefore(voiceToggleBtn, cameraControls);
    
    // Add event listener
    voiceToggleBtn.addEventListener('click', toggleVoiceRecognition);
}

// Toggle voice recognition on/off
function toggleVoiceRecognition() {
    if (!recognition) return;
    
    recognitionActive = !recognitionActive;
    const voiceToggleBtn = document.getElementById('voice-toggle');
    
    if (recognitionActive) {
        try {
            recognition.start();
            voiceToggleBtn.innerHTML = '🎤 Voice Commands Active';
            voiceToggleBtn.classList.add('active');
            showVoiceCommandHelper();
        } catch (err) {
            console.error('Failed to start recognition:', err);
        }
    } else {
        recognition.stop();
        voiceToggleBtn.innerHTML = '🎤 Enable Voice Commands';
        voiceToggleBtn.classList.remove('active');
        hideVoiceCommandHelper();
    }
}

// Show helper message with available voice commands
function showVoiceCommandHelper() {
    let helperEl = document.getElementById('voice-helper');
    
    if (!helperEl) {
        helperEl = document.createElement('div');
        helperEl.id = 'voice-helper';
        helperEl.className = 'voice-helper';
        helperEl.innerHTML = `
            <p>Say one of these commands to take a photo:</p>
            <ul>${VOICE_COMMANDS.map(cmd => `<li>${cmd}</li>`).join('')}</ul>
        `;
        
        const cameraControls = document.querySelector('.camera-controls');
        cameraControls.parentNode.insertBefore(helperEl, cameraControls.nextSibling);
    }
    
    helperEl.style.display = 'block';
}

// Hide voice command helper
function hideVoiceCommandHelper() {
    const helperEl = document.getElementById('voice-helper');
    if (helperEl) {
        helperEl.style.display = 'none';
    }
}

// Set up camera stream with device's highest available resolution
async function initializeWebcam() {
    try {
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        
        // Get available camera devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Start with highest possible resolution
        const constraints = {
            video: { 
                facingMode: currentCamera,
                width: { ideal: 4096 },  // Request maximum resolution
                height: { ideal: 2160 }  // Request maximum resolution
            },
            audio: false
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        // Once video is loaded, update canvas dimensions
        video.onloadedmetadata = () => {
            // Get the actual dimensions of the video stream
            const track = currentStream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            // Update canvas dimensions
            canvasWidth = settings.width;
            canvasHeight = settings.height;
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            compositeCanvas.width = canvasWidth;
            compositeCanvas.height = canvasHeight;
            
            console.log(`Camera resolution: ${canvasWidth}x${canvasHeight}`);
            
            // Adjust video container size
            const videoContainer = document.getElementById('video-container');
            videoContainer.style.height = 'auto';
            videoContainer.style.maxHeight = '80vh';
            
            // Make preview fill the screen better
            photoPreview.style.maxHeight = '80vh';
            photoPreview.style.height = 'auto';
        };
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Unable to access the camera. Please make sure you've granted camera permission.");
    }
}

// Handle camera switch button
switchCameraBtn.addEventListener('click', () => {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    initializeWebcam();
});

// Handle take photo button
takePhotoBtn.addEventListener('click', startPhotoProcess);

function startPhotoProcess() {
    // Hide camera controls during countdown
    takePhotoBtn.disabled = true;
    switchCameraBtn.disabled = true;
    
    // Start countdown
    let count = 3;
    countdownEl.textContent = count;
    
    const countInterval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(countInterval);
            countdownEl.textContent = "Smile!";
            
            setTimeout(() => {
                countdownEl.textContent = "";
                capturePhoto();
            }, 500);
        }
    }, 1000);
}

// Capture photo from video stream
function capturePhoto() {
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply the selected background if any
    applyBackgroundAndFilter();
    
    // Hide video container and show the preview
    document.getElementById('video-container').style.display = 'none';
    photoPreview.style.display = 'block';
    
    // Show filter options and action buttons
    filterOptions.style.display = 'block';
    actionButtons.style.display = 'block';
    
    // Hide camera controls
    takePhotoBtn.style.display = 'none';
    switchCameraBtn.style.display = 'none';
    
    // Hide voice command toggle during preview
    const voiceToggleBtn = document.getElementById('voice-toggle');
    if (voiceToggleBtn) {
        voiceToggleBtn.style.display = 'none';
    }
    
    // Hide voice helper during preview
    hideVoiceCommandHelper();
}

// Apply background and current filter
function applyBackgroundAndFilter() {
    // Get the composite canvas context
    const ctx = compositeCanvas.getContext('2d');
    ctx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
    
    // If there's a selected background, draw it first
    if (selectedBackground !== 'none' && backgroundImages[selectedBackground]) {
        // Create an image object for the background
        const bgImg = new Image();
        
        bgImg.onload = function() {
            // Draw the background
            ctx.drawImage(bgImg, 0, 0, compositeCanvas.width, compositeCanvas.height);
            
            // Get the photo from the original canvas
            const img = new Image();
            img.onload = function() {
                // Draw the user's photo on top
                ctx.drawImage(img, 0, 0, compositeCanvas.width, compositeCanvas.height);
                
                // Convert the composite canvas to a data URL for the preview
                const compositeData = compositeCanvas.toDataURL('image/png');
                photoPreview.src = compositeData;
                
                // Apply the selected filter
                photoPreview.style.filter = currentFilter === 'none' ? 'none' : currentFilter;
            };
            img.src = canvas.toDataURL('image/png');
        };
        
        bgImg.src = backgroundImages[selectedBackground];
    } else {
        // If no background, just use the original photo
        const photoData = canvas.toDataURL('image/png');
        photoPreview.src = photoData;
        photoPreview.style.filter = currentFilter === 'none' ? 'none' : currentFilter;
    }
}

// Handle background selection
backgroundOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Remove selection from all options
        backgroundOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selection to clicked option
        this.classList.add('selected');
        
        // Update selected background
        selectedBackground = this.getAttribute('data-bg');
        
        // If a photo is already taken, update the preview
        if (photoPreview.style.display === 'block') {
            applyBackgroundAndFilter();
        }
    });
});

// Set up filter buttons
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove selection from all filter buttons
        filterButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selection to clicked button
        this.classList.add('selected');
        
        // Update current filter
        currentFilter = this.getAttribute('data-filter');
        
        // Apply filter to the preview
        photoPreview.style.filter = currentFilter === 'none' ? 'none' : currentFilter;
    });
});

// Save photo to gallery
saveButton.addEventListener('click', function() {
    if (photoPreview.src) {
        // Create new photo item in gallery
        const photoGallery = document.getElementById('photo-gallery');
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Create image element with the filtered and background-applied photo
        const newImg = document.createElement('img');
        newImg.src = photoPreview.src;
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-button';
        downloadBtn.textContent = '⬇️ Download';
        downloadBtn.addEventListener('click', function() {
            // Create download link for the image
            const link = document.createElement('a');
            link.href = photoPreview.src;
            link.download = `photobooth_${photoCounter}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        
        photoItem.appendChild(newImg);
        photoItem.appendChild(downloadBtn);
        photoGallery.appendChild(photoItem);
        
        // Reset the display
        resetPhotoDisplay();
        photoCounter++;
    }
});

// Retake photo
retakeButton.addEventListener('click', function() {
    resetPhotoDisplay();
});

// Reset the display after saving or discarding
function resetPhotoDisplay() {
    // Show video container again
    document.getElementById('video-container').style.display = 'block';
    photoPreview.style.display = 'none';
    photoPreview.src = '';
    
    // Hide filter options and action buttons
    filterOptions.style.display = 'none';
    actionButtons.style.display = 'none';
    
    // Show camera controls
    takePhotoBtn.style.display = 'inline-block';
    switchCameraBtn.style.display = 'inline-block';
    takePhotoBtn.disabled = false;
    switchCameraBtn.disabled = false;
    
    // Show voice command toggle
    const voiceToggleBtn = document.getElementById('voice-toggle');
    if (voiceToggleBtn) {
        voiceToggleBtn.style.display = 'inline-block';
    }
    
    // Show voice helper if voice commands are active
    if (recognitionActive) {
        showVoiceCommandHelper();
    }
    
    // Reset filter to none
    currentFilter = 'none';
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'none') {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Mobile responsiveness adjustments
function updateLayoutForScreenSize() {
    // Make the preview and camera view responsive to the device size
    if (window.innerWidth <= 600) {
        // Mobile adjustments already handled by CSS
    } else {
        // For larger screens, make better use of available space
        document.getElementById('video-container').style.maxHeight = '80vh';
        photoPreview.style.maxHeight = '80vh';
    }
}

// Update layout on window resize
window.addEventListener('resize', updateLayoutForScreenSize);
updateLayoutForScreenSize();
