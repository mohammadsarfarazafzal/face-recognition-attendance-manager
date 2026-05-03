// frontend/src/components/VerificationScreen.jsx
import { useState, useCallback } from "react";
import { Check, AlertTriangle } from "lucide-react";

export default function VerificationScreen({
  annotatedImage,
  results,
  formData,
  onConfirm,
  onCancel,
}) {
  // Track which detected students are approved (default: recognized = approved)
  const [approvedEmails, setApprovedEmails] = useState(() => {
    const initial = new Set();
    results.forEach((r) => {
      if (r.status === "recognized" && r.email) initial.add(r.email);
    });
    return initial;
  });

  // Manual student additions
  const [manualStudents, setManualStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const recognized = results.filter((r) => r.status === "recognized");
  const unknown = results.filter((r) => r.status === "unknown");

  const toggleStudent = (email) => {
    setApprovedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const removeManual = (email) => {
    setManualStudents((prev) => prev.filter((s) => s.email !== email));
    setApprovedEmails((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  };

  // Debounced student search
  const searchStudents = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:5000/students/search?q=${encodeURIComponent(query)}`,
        {
          headers: { "x-user-id": localStorage.getItem("user_id") },
        }
      );
      const data = await res.json();
      if (res.ok) {
        // Filter out already-present students
        const existing = new Set([
          ...Array.from(approvedEmails),
          ...manualStudents.map((s) => s.email),
        ]);
        setSearchResults(
          data.students.filter((s) => !existing.has(s.email))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }, [approvedEmails, manualStudents]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    searchStudents(q);
  };

  const addManualStudent = (student) => {
    setManualStudents((prev) => [...prev, student]);
    setApprovedEmails((prev) => new Set([...prev, student.email]));
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(Array.from(approvedEmails));
    } finally {
      setConfirming(false);
    }
  };

  const totalApproved = approvedEmails.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verify Attendance
          </h2>
          <p className="text-gray-600">
            Review detected faces before saving attendance
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annotated Image */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Detected Faces
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Green = recognized · Red = unknown
            </p>
          </div>
          <div className="p-2">
            {annotatedImage && (
              <img
                src={`data:image/jpeg;base64,${annotatedImage}`}
                alt="Annotated faces"
                className="w-full rounded-lg"
              />
            )}
          </div>
          {/* Stats bar */}
          <div className="p-4 bg-gray-50 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              {recognized.length} recognized
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              {unknown.length} unknown
            </span>
            <span className="flex items-center gap-1.5 ml-auto font-semibold text-blue-700">
              {totalApproved} approved
            </span>
          </div>
        </div>

        {/* Verification Panel */}
        <div className="space-y-4">
          {/* Recognized Students */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Recognized Students
            </h3>
            {recognized.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recognized.map((r, i) => (
                  <label
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      approvedEmails.has(r.email)
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={approvedEmails.has(r.email)}
                        onChange={() => toggleStudent(r.email)}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {r.student}
                        </p>
                        <p className="text-xs text-gray-500">
                          Roll: {r.roll}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 mr-1" /> Detected
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">
                No students were recognized
              </p>
            )}
          </div>

          {/* Unknown Faces */}
          {unknown.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Unknown Faces ({unknown.length})
              </h3>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 inline-block mr-1 align-text-bottom" /> {unknown.length} face{unknown.length > 1 ? "s" : ""} could
                not be matched to any registered student and{" "}
                {unknown.length > 1 ? "have" : "has"} been rejected.
              </p>
            </div>
          )}

          {/* Manually Added Students */}
          {manualStudents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Manually Added
              </h3>
              <div className="space-y-2">
                {manualStudents.map((s) => (
                  <div
                    key={s.email}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Roll: {s.roll_number}
                      </p>
                    </div>
                    <button
                      onClick={() => removeManual(s.email)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Add Search */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Add Student Manually
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, roll number, or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                  Searching...
                </span>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((s) => (
                  <button
                    key={s.email}
                    onClick={() => addManualStudent(s)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-500 ml-2">
                      {s.roll_number}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Confirm / Cancel */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalApproved === 0 || confirming}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 shadow"
            >
              {confirming
                ? "Saving..."
                : `Confirm Attendance (${totalApproved})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
