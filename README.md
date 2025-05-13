# Photo Booth

A simple, client-side photo booth application that captures webcam snapshots and displays them in a gallery using HTML5, CSS3, and vanilla JavaScript.

## Features

* **Live Camera Preview**: Uses the WebRTC `getUserMedia` API to display your webcam feed in real-time.
* **Snapshot Capture**: Click a button to take a photo; captured images are shown in a gallery below the video.
* **Download Photos**: Each snapshot can be downloaded as a PNG file.
* **Responsive Design**: Basic CSS to ensure the UI adapts to different screen sizes.

## Prerequisites

* A modern web browser with webcam access support (e.g., Chrome, Firefox, Edge).
* Optional: A local HTTP server to serve files (recommended for `getUserMedia` to work correctly).

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/Chris-JDev/photo-booth.git
   cd photo-booth
   ```

2. **Serve the files** (required for some browsers to enable webcam access):

   * **Python 3.x**

     ```bash
     python3 -m http.server 8000
     ```
   * **Node.js (http-server)**

     ```bash
     npx http-server . -p 8000
     ```

3. **Open in browser**

   Navigate to `http://localhost:8000` in your browser.

4. **Use the app**

   * Allow camera permission when prompted.
   * Click the **"Take Photo"** button to capture a snapshot.
   * View thumbnails in the gallery; click the **download icon** on each to save the image.

## File Structure

```
photo-booth/
├── index.html      # Main UI markup
├── styles.css      # Layout and styling
└── script.js       # JavaScript logic for camera and snapshots
```

## Customization

* **Video Constraints**: In `script.js`, modify `constraints` (e.g., resolution) passed to `getUserMedia`.
* **Styling**: Tweak `styles.css` for colors, layout, and responsiveness.
* **Download Format**: Adjust the canvas export in `script.js` to change image format or quality.

## Troubleshooting

* **No Video Feed**: Ensure no other application is using the webcam. Serve over HTTPS or from `localhost`.
* **Permission Denied**: Check browser settings to allow camera access.
* **Snapshots Not Appearing**: Open browser console for errors; verify `script.js` is correctly linked in `index.html`.

---
