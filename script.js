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
document.addEventListener('DOMContentLoaded', initializeWebcam);

// Set up camera stream
async function initializeWebcam() {
    try {
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        
        // Start a new stream
        const constraints = {
            video: { 
                facingMode: currentCamera,
                width: { ideal: canvasWidth },
                height: { ideal: canvasHeight }
            },
            audio: false
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
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

// Check if this is a mobile device with touch support
if ('ontouchstart' in window) {
    // Mobile device specific adjustments
    canvasWidth = Math.min(640, window.innerWidth - 40);
    canvasHeight = Math.floor(canvasWidth * 3/4); // Maintain aspect ratio
    
    // Update canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    compositeCanvas.width = canvasWidth;
    compositeCanvas.height = canvasHeight;
}
