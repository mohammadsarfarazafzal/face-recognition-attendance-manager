// frontend/src/components/CameraCapture.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw, Camera, Undo2, Check, X } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = useCallback(async () => {
    try {
      setError("");
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera: " + err.message);
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        setCaptured({ blob, url });
        // Stop the camera stream after capture
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    if (captured?.url) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (captured) {
      const file = new File([captured.blob], "camera_capture.jpg", {
        type: "image/jpeg",
      });
      onCapture(file, captured.url);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Camera Capture</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={captured.url}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* Camera overlay guide */}
        {!captured && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/30 rounded-lg w-3/4 h-3/4" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {!captured ? (
          <>
            {/* <button
              onClick={switchCamera}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              title="Switch camera"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Flip
            </button> */}
            <button
              onClick={capturePhoto}
              disabled={!!error}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-40 shadow-lg"
            >
              <Camera className="w-4 h-4 mr-1.5" /> Capture
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Undo2 className="w-4 h-4 mr-1.5" /> Retake
            </button>
            <button
              onClick={confirmCapture}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow"
            >
              <Check className="w-4 h-4 mr-1.5" /> Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
