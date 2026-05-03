// frontend/src/pages/MarkAttendance.jsx — Phase 2: Camera + Verification Mode
import { useState, useEffect, useRef } from "react";
import { Upload, Camera, CheckCircle2, Check, Lightbulb } from "lucide-react";
import CameraCapture from "../components/CameraCapture";
import VerificationScreen from "../components/VerificationScreen";

const STEPS = { UPLOAD: "upload", VERIFY: "verify", DONE: "done" };

export default function MarkAttendance() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    subject: "",
    marks: "1",
  });
  const [subjects, setSubjects] = useState([]);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "camera"
  const [showCamera, setShowCamera] = useState(false);

  // Verification state
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [recognitionResults, setRecognitionResults] = useState([]);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [confirmedResult, setConfirmedResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/subjects`, {
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
        if (data.length > 0) setFormData((p) => ({ ...p, subject: data[0].code }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleCameraCapture = (capturedFile, previewUrl) => {
    setFile(capturedFile);
    setFilePreview(previewUrl);
    setShowCamera(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Step 1: Recognize (no save) ──────────────────────────────────
  const handleRecognize = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please select or capture a photo");
    if (!formData.subject) return setMessage("Please select a subject");

    setLoading(true);
    setMessage("");

    try {
      const fd = new FormData();
      fd.append("photo", file);

      const response = await fetch(`http://${window.location.hostname}:5000/attendance/recognize`, {
        method: "POST",
        headers: { "x-user-id": localStorage.getItem("user_id") },
        body: fd,
      });

      const data = await response.json();

      if (response.ok) {
        setRecognitionResults(data.results || []);
        setAnnotatedImage(data.annotated_image || null);
        setStep(STEPS.VERIFY);
      } else {
        setMessage(data.error || "Recognition failed");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm verified attendance ──────────────────────────
  const handleConfirmAttendance = async (confirmedEmails) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/attendance/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("user_id"),
        },
        body: JSON.stringify({
          date: formData.date,
          subject_code: formData.subject,
          marks: parseInt(formData.marks),
          confirmed_emails: confirmedEmails,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setConfirmedResult({
          marked: data.marked,
          message: data.message,
        });
        setStep(STEPS.DONE);
      } else {
        setMessage(data.error || "Failed to confirm attendance");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  const handleReset = () => {
    setStep(STEPS.UPLOAD);
    clearFile();
    setRecognitionResults([]);
    setAnnotatedImage(null);
    setConfirmedResult(null);
    setMessage("");
  };

  // ── STEP: Verification Screen ────────────────────────────────────
  if (step === STEPS.VERIFY) {
    return (
      <VerificationScreen
        annotatedImage={annotatedImage}
        results={recognitionResults}
        formData={formData}
        onConfirm={handleConfirmAttendance}
        onCancel={() => setStep(STEPS.UPLOAD)}
      />
    );
  }

  // ── STEP: Done ───────────────────────────────────────────────────
  if (step === STEPS.DONE && confirmedResult) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-4 flex justify-center"><CheckCircle2 className="w-16 h-16 text-emerald-500" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Attendance Confirmed
          </h2>
          <p className="text-gray-600 mb-6">{confirmedResult.message}</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold text-lg">
              {confirmedResult.marked} student{confirmedResult.marked !== 1 ? "s" : ""} marked present
            </p>
            <p className="text-green-600 text-sm mt-1">
              {formData.date} · {subjects.find((s) => s.code === formData.subject)?.name || formData.subject}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Mark Another Attendance
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: Upload / Capture ───────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600">
          Upload or capture a class photo, then verify detected students before saving
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
          <span className="w-5 h-5 bg-blue-600 text-white rounded-full inline-flex items-center justify-center text-xs">1</span>
          Upload Photo
        </span>
        <span className="text-gray-300">→</span>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 rounded-full">
          <span className="w-5 h-5 bg-gray-300 text-white rounded-full inline-flex items-center justify-center text-xs">2</span>
          Verify Faces
        </span>
        <span className="text-gray-300">→</span>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 rounded-full">
          <span className="w-5 h-5 bg-gray-300 text-white rounded-full inline-flex items-center justify-center text-xs">3</span>
          Confirm
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleRecognize} className="space-y-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Attendance Marks</label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Input Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Photo</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => { setInputMode("upload"); setShowCamera(false); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    inputMode === "upload"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="w-4 h-4 inline-block mr-1" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setInputMode("camera"); setShowCamera(true); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    inputMode === "camera"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Camera className="w-4 h-4 inline-block mr-1" /> Camera
                </button>
              </div>

              {/* Upload mode */}
              {inputMode === "upload" && !showCamera && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!filePreview ? (
                    <>
                      <div className="flex justify-center mb-2"><Camera className="w-10 h-10 text-gray-400" /></div>
                      <p className="text-gray-600 font-medium">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports JPG, PNG
                      </p>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Camera mode */}
              {inputMode === "camera" && showCamera && (
                <CameraCapture
                  onCapture={handleCameraCapture}
                  onClose={() => { setShowCamera(false); setInputMode("upload"); }}
                />
              )}

              {/* Camera preview (after capture) */}
              {inputMode === "camera" && !showCamera && filePreview && (
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={filePreview}
                    alt="Captured"
                    className="w-full max-h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="px-3 py-1 bg-white/90 hover:bg-white text-gray-700 rounded text-xs font-medium shadow"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white transition-all
                ${loading || !file ? "bg-gray-400 cursor-not-allowed" : "btn-primary"}
                disabled:opacity-50`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing faces...
                </span>
              ) : (
                "Analyze & Verify Faces"
              )}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-4 rounded-md text-sm ${
                message.includes("Error") || message.includes("error") || message.includes("failed")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Right: How it works */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How Verification Mode Works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-gray-900">Upload or Capture</p>
                  <p className="text-sm text-gray-500">Take a photo of the classroom or upload an existing image</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-gray-900">Review Detections</p>
                  <p className="text-sm text-gray-500">See detected faces with bounding boxes. Approve or reject each match.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-gray-900">Manual Corrections</p>
                  <p className="text-sm text-gray-500">Add missed students or remove false detections before confirming.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold flex-shrink-0"><Check className="w-5 h-5" /></span>
                <div>
                  <p className="font-medium text-gray-900">Confirm & Save</p>
                  <p className="text-sm text-gray-500">Only confirmed students are saved. No accidental false attendance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold"><Lightbulb className="w-4 h-4 inline-block mr-1 align-text-bottom" />Tip:</span> Attendance is never
              auto-saved. You always review and confirm before any records are created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
