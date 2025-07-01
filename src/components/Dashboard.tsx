import React, { useState, useEffect } from 'react'
import { supabase, Document } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Upload, FileText, Download, Calendar, Trash2, Plus, Search } from 'lucide-react'
import { FileUpload } from './FileUpload'
import { SignatureEditor } from './SignatureEditor'
import { PDFViewer } from './PDFViewer'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showSignatureEditor, setShowSignatureEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDocuments(documents.filter(doc => doc.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (showUpload) {
    return (
      <FileUpload
        onSuccess={() => {
          setShowUpload(false)
          fetchDocuments()
        }}
        onCancel={() => setShowUpload(false)}
      />
    )
  }

  if (showSignatureEditor && selectedDocument) {
    return (
      <SignatureEditor
        document={selectedDocument}
        onSave={() => {
          setShowSignatureEditor(false)
          setSelectedDocument(null)
          fetchDocuments()
        }}
        onCancel={() => {
          setShowSignatureEditor(false)
          setSelectedDocument(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your documents and signatures</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Signed Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(doc => doc.status === 'signed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Upload className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(doc => doc.status === 'unsigned').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No documents match your search.' : 'Upload your first document to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{document.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(document.created_at)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          document.status === 'signed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {document.status === 'signed' ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {document.status === 'unsigned' && (
                      <button
                        onClick={() => {
                          setSelectedDocument(document)
                          setShowSignatureEditor(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Sign Document
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const url = document.signed_url || document.original_url;
                        setPreviewDocument({ ...document, original_url: url });
                        setShowPreview(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View PDF"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    {document.signed_url && (
                      <button
                        onClick={() => window.open(document.signed_url, '_blank')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteDocument(document.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPreview && previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative">
            {/* Back button always visible at top-left */}
            <button
              onClick={() => setShowPreview(false)}
              className="fixed top-8 left-8 z-50 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
              aria-label="Back"
              style={{ margin: 0 }}
            >
              <span className="text-2xl">&#8592;</span>
            </button>
            <PDFViewer 
              url={previewDocument.original_url} 
              title={previewDocument.name} 
              width={600} 
              height={800} 
            />
          </div>
        </div>
      )}
    </div>
  )
}