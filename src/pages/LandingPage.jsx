import React, { useState, useRef, useEffect } from "react";

function LandingPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleShowCamera = async () => {
    try {
      setShowCamera(true);

      // Access the user's camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, // Request video stream
      });

      // Set the video source to the stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Get the image data URL
      const imageDataUrl = canvasRef.current.toDataURL();

      // Convert data URL to Blob
      const blob = await fetch(imageDataUrl)
        .then((res) => res.blob())
        .catch((error) => console.error("Error converting to blob:", error));

      // Send the image to the server
      const formData = new FormData();

      // Generate a unique filename based on the current datetime
      const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
      const filename = `captured_image_${timestamp}.png`;

      formData.append("image", blob, filename);

      try {
        const response = await fetch("http://10.96.0.20:5000/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          setCapturedImage(imageDataUrl); // Show the captured image
          console.log("Image uploaded successfully:", data);
        } else {
          console.error("Error uploading image:", data);
        }
      } catch (error) {
        console.error("Error sending image to server:", error);
      }
    }
  };

  // Cleanup the camera stream on component unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop()); // Stop all tracks
      }
    };
  }, []);

  return (
    <div className="h-screen flex w-full justify-center bg-gray-500 my-8">
      {/* Container Div */}
      <div className="h-screen flex flex-col lg:w-1/2">
        {/* Top Div */}
        <div className="flex-1 h-1/2 bg-blue-100 flex justify-center items-center relative">
          {showCamera ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Canvas element to capture image */}
              <canvas
                ref={canvasRef}
                className="hidden"
                width="640"
                height="480"
              ></canvas>
            </>
          ) : (
            <button
              onClick={handleShowCamera}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Camera
            </button>
          )}

          {/* Floating Button */}
          {showCamera && (
            <button
              onClick={captureImage}
              className="absolute bottom-4 right-4 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 focus:outline-none"
            >
              Process
            </button>
          )}
        </div>

        {/* Bottom Div */}
        <div className="flex-1 bg-gray-700 flex items-center justify-center pb-4">
          {!capturedImage && (
            <p className="text-lg text-white">
              Processed content will be displayed here.
            </p>
          )}

          {/* Display captured image */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="mt-4 max-w-full h-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
