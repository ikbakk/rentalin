"use client"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
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
}

export function FileUpload({
  onUpload,
  onRemove,
  accept = "image/*",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const { businessId } = useActiveBusiness()
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const registerImage = useMutation(api.files.registerInspectionImage)
  const removeImage = useMutation(api.files.removePendingInspectionImage)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      if (!businessId) throw new Error("Business session not found")
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > 5 * 1024 * 1024) {
        throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB")
      }
      const uploadUrl = await generateUploadUrl({ businessId })
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file })
      if (!response.ok) throw new Error("Upload failed")
      const { storageId } = await response.json() as { storageId: Id<"_storage"> }
      await registerImage({ businessId, storageId })
      setUploadedStorageId(storageId)
      onUpload(String(storageId))
      setPreview(URL.createObjectURL(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
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
          <button
            aria-label="Remove photo"
            className="absolute top-1 right-1 rounded-full bg-destructive p-0.5"
            onClick={async () => {
              if (businessId && uploadedStorageId) {
                try {
                  await removeImage({ businessId, storageId: uploadedStorageId })
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Photo could not be removed")
                  return
                }
              }
              setPreview(null)
              setUploadedStorageId(null)
              onRemove?.()
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
