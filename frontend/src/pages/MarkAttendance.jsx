// frontend/src/pages/MarkAttendance.jsx
import { useState, useEffect } from 'react'

export default function MarkAttendance() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    marks: '1'
  })
  const [subjects, setSubjects] = useState([])
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [detectedStudents, setDetectedStudents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchSubjects() }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/subjects', {
        headers: { "user_id": localStorage.getItem('user_id') }
      })

      const data = await response.json()
      if (response.ok) {
        setSubjects(data)
        if (data.length > 0) setFormData(p => ({ ...p, subject: data[0].code }))
      }
    } catch (e) { console.error(e) }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setMessage("Please select a photo")

    setLoading(true)
    setMessage('')
    setDetectedStudents([])

    try {
      const submitData = new FormData()
      Object.keys(formData).forEach(k => submitData.append(k, formData[k]))
      submitData.append('photo', file)

      const response = await fetch('http://localhost:5000/attendance/mark', {
        method: 'POST',
        headers: { "user_id": localStorage.getItem('user_id') },
        body: submitData
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setDetectedStudents(data.detected_students)
      } else {
        setMessage(data.error || "Error marking attendance")
      }
    } catch (err) {
      setMessage("Network error")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600">Upload a class photo to automatically mark attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject.code} value={subject.code}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Marks
              </label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Photo
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload a clear photo of the classroom for face recognition
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Processing...' : 'Mark Attendance'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Detected Students */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Detected Students</h3>
          
          {detectedStudents.length > 0 ? (
            <div className="space-y-3">
              {detectedStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">{student.student}</p>
                    <p className="text-sm text-blue-700">Roll: {student.roll}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {student.confidence}% confidence
                  </span>
                </div>
              ))}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ Attendance marked for {detectedStudents.length} students
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>No students detected yet</p>
              <p className="text-sm">Upload a class photo to see detected students here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}