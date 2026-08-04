"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "lucide-react"
import { uploadFile } from "@/lib/upload"

interface FileUploadProps {
  onUpload: (url: string) => void
  referenceType?: string
  accept?: string
}

export function FileUpload({
  onUpload,
  referenceType = "Inspection",
  accept = "image/*",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFile(file, referenceType)
      onUpload(url)
      setPreview(URL.createObjectURL(file))
    } catch {
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
        }}
      />
      {preview ? (
        <div className="relative size-20 rounded-lg overflow-hidden">
          <img src={preview} alt="" className="size-full object-cover" />
          <button
            aria-label="Remove photo"
            className="absolute top-1 right-1 rounded-full bg-destructive p-0.5"
            onClick={() => {
              setPreview(null)
              ref.current!.value = ""
            }}
          >
            <X className="size-3 text-destructive-foreground" />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <ImagePlus className="size-4" />
          {uploading ? "Uploading..." : "Add Photo"}
        </Button>
      )}
    </div>
  )
}
