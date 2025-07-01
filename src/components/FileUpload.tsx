import React, { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onSuccess: () => void
  onCancel: () => void
}

export const FileUpload: React.FC<FileUploadProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB')
      return
    }
    setError('')
    setSelectedFile(file)
  }

  const uploadFile = async () => {
    if (!selectedFile || !user) return

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Save document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: selectedFile.name,
          original_url: urlData.publicUrl,
          status: 'unsigned'
        })

      if (dbError) throw dbError

      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-gray-600 mt-1">Upload a PDF document to add your signature</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Drop your PDF here
                </h3>
                <p className="text-gray-600">
                  or click to browse files
                </p>
              </div>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
              >
                Choose File
              </label>
              
              <p className="text-sm text-gray-500">
                PDF files only, max 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-sm text-green-700">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 text-green-600 hover:text-green-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  'Upload Document'
                )}
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}