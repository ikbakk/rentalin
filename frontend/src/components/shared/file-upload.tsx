"use client"

import { useState, useRef, useEffect } from "react"
import { useAction } from "convex/react"
import type { Id } from "../../../../convex/_generated/dataModel"
import { api } from "../../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { useActiveBusiness } from "@/hooks/use-active-business"

interface FileUploadProps {
  onUpload: (url: string) => void
  onRemove?: () => void
  accept?: string
  onUploadingChange?: (uploading: boolean) => void
}

export function FileUpload({
  onUpload,
  onRemove,
  accept = "image/*",
  onUploadingChange,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"r2Uploads"> | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const previewUrl = useRef<string | null>(null)
  const { businessId } = useActiveBusiness()
  const createUpload = useAction(api.r2.createUpload)
  const finalizeUpload = useAction(api.r2.finalizeUpload)
  const removeImage = useAction(api.r2.removeImage)
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current) }, [])

  const upload = async (file: File) => {
    setUploading(true)
    onUploadingChange?.(true)
    let pendingId: Id<"r2Uploads"> | null = null
    try {
      if (!businessId) throw new Error("Business session not found")
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > 5 * 1024 * 1024) {
        throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB")
      }
      const { id, uploadUrl } = await createUpload({ businessId, contentType: file.type, size: file.size })
      pendingId = id
      const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
      if (!response.ok) throw new Error("Upload failed; please try again")
      const reference = await finalizeUpload({ id })
      setUploadedStorageId(id)
      previewUrl.current = URL.createObjectURL(file)
      setPreview(previewUrl.current)
      onUpload(reference)
    } catch (error) {
      if (pendingId) { try { await removeImage({ id: pendingId }) } catch { /* scheduled cleanup retries */ } }
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={ref}
        type="file"
        accept={accept === "image/*" ? "image/jpeg,image/png,image/webp" : accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
        }}
      />
      {preview ? (
        <div className="relative size-20 rounded-lg overflow-hidden">
          <img src={preview} alt="" className="size-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="Remove photo"
            className="absolute top-1 right-1 rounded-full bg-destructive p-0.5"
            onClick={async () => {
              if (businessId && uploadedStorageId) {
                try {
                  await removeImage({ id: uploadedStorageId })
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Photo could not be removed")
                  return
                }
              }
              if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
              previewUrl.current = null
              setPreview(null)
              setUploadedStorageId(null)
              onRemove?.()
              ref.current!.value = ""
            }}
          >
            <X className="size-3 text-destructive-foreground" />
          </Button>
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
