export default function ResultCard({ result }) {
    const isRecognized = result.status === "recognized";

    return (
      <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isRecognized ? "border-green-200" : "border-red-200"
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isRecognized ? result.student.replace(/_/g, ' ') : "Unknown Person"}
            </h3>
            {isRecognized && (
              <p className="text-sm text-gray-600 mt-1">{result.roll}</p>
            )}
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isRecognized
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {isRecognized ? "✓ Recognized" : "✗ Unknown"}
            </span>
          </div>
        </div>
      </div>
    )
  }
