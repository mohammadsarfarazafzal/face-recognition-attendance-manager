export default function ResultCard({ result }) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {result.student.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{result.roll}</p>
            <div className="mt-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Confidence: {result.confidence}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Position: {result.location.top}px, {result.location.left}px
            </p>
          </div>
        </div>
      </div>
    )
  }