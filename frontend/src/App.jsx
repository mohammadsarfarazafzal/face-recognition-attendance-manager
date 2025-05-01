import { useEffect, useState } from 'react'
import CharacterTable from './components/CharacterTable'
import ResultCard from './components/ResultCard'

export default function App() {
  const [results, setResults] = useState([])
  const [students, setStudents] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load student map on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:5000/students')
        if (!response.ok) throw new Error('Failed to load student data')
        const data = await response.json()
        setStudents(data)
      } catch (err) {
        setError(err.message)
      }
    }
    fetchStudents()
  }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Recognition failed')
      
      const data = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Get list of detected actors
  const presentStudents = results.map(result => result.student)
  
  

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Attendance Management System
          </h1>
          <p className="text-gray-600">
            Upload a photo
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center 
              ${isLoading ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-300 hover:border-blue-500'}`}>
              <svg
                className={`mx-auto h-12 w-12 ${isLoading ? 'text-gray-400' : 'text-blue-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className={`mt-4 text-lg ${isLoading ? 'text-gray-600' : 'text-blue-900'}`}>
                {isLoading ? 'Processing...' : 'Click to upload image'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Supported formats: JPEG, PNG
              </p>
            </div>
          </label>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Students</h2>
          <StudentTable 
            students={students} 
            presentStudents={presentStudents} 
          />
        </div>

        {/* Detection Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Detection Results</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <ResultCard key={index} result={result} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
