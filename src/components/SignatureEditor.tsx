import React, { useState, useRef } from "react"
import { Document, supabase } from '../lib/supabase'
import { Type, X, Save, Move, Trash2 } from 'lucide-react'
import { PDFViewer } from './PDFViewer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

interface SignatureEditorProps {
  document: Document
  onSave: () => void
  onCancel: () => void
}

interface Signature {
  id: string
  text: string
  font: string
  fontSize: number
  color: string
  x: number
  y: number
  page: number
}

const FONT_OPTIONS = [
  { name: 'Great Vibes', value: 'Great Vibes, cursive', fontFamily: 'Great Vibes, cursive' },
  { name: 'Pacifico', value: 'Pacifico, cursive', fontFamily: 'Pacifico, cursive' },
  { name: 'Satisfy', value: 'Satisfy, cursive', fontFamily: 'Satisfy, cursive' },
];

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#1e40af' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#7c3aed' }
]

// Map font names to TTF file paths
const FONT_FILE_MAP: Record<string, string | undefined> = {
  'Great Vibes, cursive': '/fonts/GreatVibes-Regular.ttf',
  'Pacifico, cursive': '/fonts/Pacifico-Regular.ttf',
  'Satisfy, cursive': '/fonts/Satisfy-Regular.ttf',
  'Brush Script MT, cursive': '/fonts/BrushScriptMT.ttf', // You must provide this file
  'Arial, sans-serif': undefined, // fallback to standard font
  'Times New Roman, serif': undefined, // fallback to standard font
};

export const SignatureEditor: React.FC<SignatureEditorProps> = ({ document, onSave, onCancel }) => {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const [signatureText, setSignatureText] = useState('')
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)
  const [fontSize, setFontSize] = useState(24)
  const [selectedPage, setSelectedPage] = useState(1)
  const [numPages, setNumPages] = useState(1)

  const pdfContainerRef = useRef<HTMLDivElement>(null)

  const yOffset = 110; // Adjust this value for fine-tuning Y alignment

  const addSignature = () => {
    if (!signatureText.trim()) return

    const newSignature: Signature = {
      id: Date.now().toString(),
      text: signatureText,
      font: selectedFont,
      fontSize,
      color: selectedColor,
      x: 100,
      y: 100,
      page: selectedPage
    }

    setSignatures([...signatures, newSignature])
    setSignatureText('')
  }

  const removeSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id))
    if (selectedSignature?.id === id) {
      setSelectedSignature(null)
    }
  }

  const updateSignature = (id: string, updates: Partial<Signature>) => {
    setSignatures(signatures.map(sig => 
      sig.id === id ? { ...sig, ...updates } : sig
    ))
    if (selectedSignature?.id === id) {
      setSelectedSignature({ ...selectedSignature, ...updates })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, signature: Signature) => {
    e.preventDefault()
    setSelectedSignature(signature)
    setIsDragging(true)
    
    const rect = pdfContainerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - signature.x,
        y: e.clientY - rect.top - signature.y
      })
    }
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedSignature || !pdfContainerRef.current) return

    const rect = pdfContainerRef.current.getBoundingClientRect()
    const fontSize = selectedSignature.fontSize
    const newX = clamp(e.clientX - rect.left - dragOffset.x, 0, rect.width - fontSize)
    const newY = clamp(e.clientY - rect.top - dragOffset.y, 0, rect.height - fontSize)

    updateSignature(selectedSignature.id, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSave = async () => {
    if (signatures.length === 0) {
      alert('Please add at least one signature')
      return
    }

    try {
      // Generate and upload signed PDF
      const existingPdfBytes = await fetch(document.original_url).then(res => res.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      pdfDoc.registerFontkit(fontkit)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Get actual overlay size
      let overlayWidth = 500
      let overlayHeight = 600
      if (pdfContainerRef.current) {
        const rect = pdfContainerRef.current.getBoundingClientRect()
        overlayWidth = rect.width
        overlayHeight = rect.height
      }
      function hexToRgb(hex: string): { r: number; g: number; b: number } {
        const match = hex.replace('#', '').match(/.{1,2}/g)
        if (!match) return { r: 0, g: 0, b: 0 }
        const [r, g, b] = match.map((x: string) => parseInt(x, 16) / 255)
        return { r, g, b }
      }
      for (const sig of signatures) {
        const page = pdfDoc.getPage(sig.page - 1)
        const pageHeight = page.getHeight()
        const pageWidth = page.getWidth()
        const scaleX = pageWidth / overlayWidth
        const scaleY = pageHeight / overlayHeight
        const scaledX = sig.x * scaleX
        const scaledY = pageHeight - (sig.y * scaleY) - (sig.fontSize / 2) + yOffset
        const { r, g, b } = hexToRgb(sig.color)
        let pdfFont = font; // fallback to standard font
        if (FONT_FILE_MAP[sig.font]) {
          const fontUrl = FONT_FILE_MAP[sig.font]!
          const response = await fetch(fontUrl)
          const fontBytes = await response.arrayBuffer()
          console.log('Font fetch:', fontUrl, 'Status:', response.status, 'Bytes:', fontBytes.byteLength)
          pdfFont = await pdfDoc.embedFont(fontBytes)
        }
        page.drawText(sig.text, {
          x: scaledX,
          y: scaledY,
          size: sig.fontSize,
          color: rgb(r, g, b),
          font: pdfFont,
        })
      }
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      // Upload to Supabase Storage
      const userId = document.user_id
      const fileName = `signed-${document.id}.pdf`
      const filePath = `${userId}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, { upsert: true })
      if (uploadError) {
        alert('Failed to upload signed PDF: ' + uploadError.message)
        return
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)
      const signedUrl = urlData.publicUrl
      // Update document record
      const { error: dbError } = await supabase
        .from('documents')
        .update({ signed_url: signedUrl, status: 'signed' })
        .eq('id', document.id)
      if (dbError) {
        alert('Failed to update document record: ' + dbError.message)
        return
      }
      alert('Document signed and uploaded successfully!')
      onSave()
    } catch (error) {
      console.error('Error saving signatures:', error)
      alert('Failed to save signatures')
    }
  }

  const handleDownloadSignedPDF = async () => {
    const existingPdfBytes = await fetch(document.original_url).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    pdfDoc.registerFontkit(fontkit)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Get actual overlay size
    let overlayWidth = 500
    let overlayHeight = 600
    if (pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect()
      overlayWidth = rect.width
      overlayHeight = rect.height
    }
    console.log(`Actual overlay size used for scaling: ${overlayWidth}x${overlayHeight}`)

    // Helper to convert hex color to rgb for pdf-lib
    function hexToRgb(hex: string): { r: number; g: number; b: number } {
      const match = hex.replace('#', '').match(/.{1,2}/g)
      if (!match) return { r: 0, g: 0, b: 0 }
      const [r, g, b] = match.map((x: string) => parseInt(x, 16) / 255)
      return { r, g, b }
    }

    for (const sig of signatures) {
      const page = pdfDoc.getPage(sig.page - 1)
      const pageHeight = page.getHeight()
      const pageWidth = page.getWidth()
      // Scale x and y from overlay to PDF page size
      const scaleX = pageWidth / overlayWidth
      const scaleY = pageHeight / overlayHeight
      const scaledX = sig.x * scaleX
      const scaledY = pageHeight - (sig.y * scaleY) - (sig.fontSize / 2) + yOffset
      const { r, g, b } = hexToRgb(sig.color)
      console.log(`Overlay size: ${overlayWidth}x${overlayHeight}, PDF page size: ${pageWidth}x${pageHeight}`)
      console.log(`Signature '${sig.text}' overlay (x: ${sig.x}, y: ${sig.y}), scaled (x: ${scaledX}, y: ${scaledY}), fontSize: ${sig.fontSize}, color: ${sig.color}`)
      let pdfFont = font; // fallback to standard font
      if (FONT_FILE_MAP[sig.font]) {
        const fontUrl = FONT_FILE_MAP[sig.font]!
        const response = await fetch(fontUrl)
        const fontBytes = await response.arrayBuffer()
        console.log('Font fetch:', fontUrl, 'Status:', response.status, 'Bytes:', fontBytes.byteLength)
        pdfFont = await pdfDoc.embedFont(fontBytes)
      }
      page.drawText(sig.text, {
        x: scaledX,
        y: scaledY,
        size: sig.fontSize,
        color: rgb(r, g, b),
        font: pdfFont,
      })
      // Draw a debug dot
      page.drawCircle({ x: scaledX, y: scaledY, size: 3, color: rgb(1, 0, 0) })
    }

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Upload to Supabase Storage
    const userId = document.user_id
    const fileName = `signed-${document.id}.pdf`
    const filePath = `${userId}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, blob, { upsert: true })
    if (uploadError) {
      alert('Failed to upload signed PDF: ' + uploadError.message)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)
    const signedUrl = urlData.publicUrl

    // Update document record
    const { error: dbError } = await supabase
      .from('documents')
      .update({ signed_url: signedUrl, status: 'signed' })
      .eq('id', document.id)
    if (dbError) {
      alert('Failed to update document record: ' + dbError.message)
      return
    }

    // Download locally as well
    const link = window.document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()

    alert('Signed PDF uploaded and available in dashboard!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sign Document</h1>
          <p className="text-gray-600 mt-1">{document.name}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PDF Preview with Signatures */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            <div className="flex items-center space-x-2">
              <Move className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Drag signatures to position them</span>
            </div>
          </div>
          
          <div className="relative" style={{ width: 500, height: 600 }}>
            {/* PDF Document */}
            <PDFViewer url={document.original_url} title={document.name} width={500} height={600} />
            {/* Signature Overlay - absolutely positioned over the PDF */}
            <div
              ref={pdfContainerRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {signatures.filter(sig => sig.page === selectedPage).map(signature => (
                <div
                  key={signature.id}
                  style={{
                    position: 'absolute',
                    left: signature.x,
                    top: signature.y,
                    fontFamily: signature.font,
                    fontSize: signature.fontSize,
                    color: signature.color,
                    cursor: isDragging && selectedSignature?.id === signature.id ? 'grabbing' : 'move',
                    userSelect: 'none',
                    zIndex: selectedSignature?.id === signature.id ? 11 : 10,
                    border: selectedSignature?.id === signature.id ? '2px dashed #3b82f6' : 'none',
                    padding: '2px',
                    backgroundColor: selectedSignature?.id === signature.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    pointerEvents: 'auto',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, signature)}
                >
                  {signature.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Signature</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature Text</label>
              <div className="flex items-center space-x-2">
                <Type className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your signature"
                  maxLength={32}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Font</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.fontFamily }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {COLOR_OPTIONS.map(color => (
                    <option key={color.value} value={color.value}>{color.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={12}
                max={72}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page</label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <option key={i+1} value={i+1}>Page {i+1}</option>
                ))}
              </select>
            </div>

            <button
              onClick={addSignature}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all"
            >
              Add Signature
            </button>
          </div>

          {/* List of signatures */}
          {signatures.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-800 mb-2">Signatures</h4>
              <ul className="space-y-2">
                {signatures.map(sig => (
                  <li key={sig.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span style={{ fontFamily: sig.font, fontSize: sig.fontSize, color: sig.color }}>{sig.text}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeSignature(sig.id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleSave}
            className="mt-8 w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:ring-4 focus:ring-green-200 transition-all"
          >
            <Save className="h-5 w-5 inline-block mr-2" />
            Save & Sign Document
          </button>

          <button
            onClick={handleDownloadSignedPDF}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 focus:ring-4 focus:ring-blue-200 transition-all"
          >
            Download Signed PDF
          </button>
        </div>
      </div>
    </div>
  )
} 