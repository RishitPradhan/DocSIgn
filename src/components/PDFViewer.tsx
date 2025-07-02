import React, { useState } from 'react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { FileText, Download, ExternalLink } from 'lucide-react'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  title?: string
  width?: number
  height?: number
  onBack?: () => void
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  title = "PDF Document", 
  width = 400, 
  height = 600, 
  onBack 
}) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pdfError, setPdfError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages, url })
    setNumPages(numPages)
    setPdfError('')
    setLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error)
    console.error('PDF URL:', url)
    setPdfError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  const openInNewTab = () => {
    window.open(url, '_blank')
  }

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50 gap-2 sm:gap-0">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button onClick={onBack} className="mr-2 p-2 text-gray-400 hover:text-gray-600" aria-label="Back">
              <span className="text-xl">&#8592;</span>
            </button>
          )}
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900 text-base sm:text-lg">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={openInNewTab}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={downloadPDF}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative">
        {loading && (
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {pdfError ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-2 text-base sm:text-lg">Error loading PDF</p>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">{pdfError}</p>
            {/* Fallback options */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={openInNewTab}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Open PDF in New Tab
              </button>
              <button
                onClick={downloadPDF}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Download PDF
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Page navigation */}
            {numPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-300 hover:bg-white transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs sm:text-sm text-gray-600">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-300 hover:bg-white transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            {/* PDF Document */}
            <div className="flex justify-center w-full overflow-x-auto">
              <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
                <PDFDocument
                  file={url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={undefined}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </PDFDocument>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 