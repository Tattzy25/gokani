"use client"

import { useState, useRef } from "react"
import { useWire } from "./wire"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Loader2, Download, Upload, Sparkles, Share2 } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"
import { generateImage } from "./actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function LabelWithTooltip({ id, label, tooltip }: { id?: string, label: string, tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs text-sm">
          <p>{tooltip}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ImageUploadInput({ 
  id, 
  value, 
  onChange, 
  label,
  tooltip
}: { 
  id: string, 
  value: string, 
  onChange: (val: string, fileName?: string) => void, 
  label: string,
  tooltip: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [localFileName, setLocalFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      onChange(reader.result as string, file.name)
      setLocalFileName(file.name)
    }
    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFile(file)
      } else {
        toast.error("Please upload a valid image file (JPG, PNG, GIF)")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }
  
  const handleClear = () => {
    onChange("", "")
    setLocalFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <LabelWithTooltip id={id} label={label} tooltip={tooltip} />
      
      {value ? (
        <div className="relative rounded-lg border bg-background p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted/50">
            <img 
              src={value} 
              alt="Preview" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {localFileName || "Image URL"}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              onClick={handleClear}
            >
              Clear file
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/50",
            isDragging && "border-primary bg-muted"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-background p-3 shadow-sm">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-muted-foreground">
              SVG, PNG, JPG or GIF
            </div>
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default function Home() {
  const { customerId, version, sourceId, triggerWord, coverImage } = useWire();
  const [numOutputs, setNumOutputs] = useState(1)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [width] = useState(1024)
  const [height] = useState(1024)
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isPreparingShare, setIsPreparingShare] = useState(false)

  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState("")

  const getDimensions = () => {
    if (aspectRatio === "custom") return { w: width, h: height }
    const [w, h] = aspectRatio.split(":").map(Number)
    // Base scale on 1024px
    return { w: 1024, h: Math.round(1024 * (h / w)) }
  }

  const getAspectRatioStyle = (ratio: string) => {
    if (ratio === "custom") return { aspectRatio: `${width} / ${height}` }
    const [w, h] = ratio.split(":").map(Number)
    return { aspectRatio: `${w} / ${h}` }
  }

  const handleGenerate = async () => {
    if (isLoading) return;

    if (prompt.trim().length < 10) {
      toast.error("Prompt must be at least 10 characters");
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]);

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("version", version);
    formData.append("source_id", sourceId);
    formData.append("num_outputs", numOutputs.toString());
    formData.append("aspect_ratio", aspectRatio);
    formData.append("customer_id", customerId);
    if (image) formData.append("artist_uploads", image);

    const result = await generateImage(formData);

    if (result.success) {
      setGeneratedImages(result.output);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const filename = `tattty-generated-${index + 1}.${url.split('.').pop()}`
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error('Download failed:', error)
      toast.error("Download failed. Please try again.")
    }
  }

  const handleShare = async (url: string, index: number) => {
    const filename = `tattty-generated-${index + 1}.${url.split('.').pop()}`
    setShareUrl(url)
    
    // Check if we can share files
    if (navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] })) {
      setIsPreparingShare(true)
      toast.info("Preparing image for sharing...")
      
      try {
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
        if (response.ok) {
          const blob = await response.blob()
          const file = new File([blob], filename, { type: blob.type })
          setShareFile(file)
          setShareDialogOpen(true)
          setIsPreparingShare(false)
          return
        }
      } catch (error) {
        console.warn("File preparation failed", error)
      }
      setIsPreparingShare(false)
    }

    // Fallback to Link Sharing immediately if file sharing isn't supported or failed
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'GoKAnI AI Generation',
          text: 'Check out this image I generated with GoKAnI AI!',
          url: url
        })
        toast.success("Shared link successfully")
        return
      }
    } catch (error) {
      console.warn("Link sharing failed", error)
    }

    // Fallback to Clipboard
    try {
      await navigator.clipboard.writeText(url)
      toast.info("Sharing failed, link copied to clipboard instead!")
    } catch (clipboardError) {
      toast.error("Failed to share. Try downloading instead.")
    }
  }

  const executeShare = async () => {
    if (!shareFile) return
    
    try {
      await navigator.share({
        title: 'GoKAnI AI Generation',
        text: 'Check out this image I generated with GoKAnI AI!',
        files: [shareFile]
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error: any) {
      console.warn("Share execution failed", error)
      
      // If user cancelled, just close dialog
      if (error.name === 'AbortError') {
        setShareDialogOpen(false)
        return
      }

      // Fallback to link sharing
      if (shareUrl) {
        try {
          await navigator.share({
            title: 'GoKAnI AI Generation',
            text: 'Check out this image I generated with GoKAnI AI!',
            url: shareUrl
          })
          setShareDialogOpen(false)
          return
        } catch (e) {
           // ignore
        }
      }
      
      toast.error("Sharing failed. Try downloading instead.")
      setShareDialogOpen(false)
    }
  }

  const handleDownloadAll = async () => {
    toast.info("Starting download of all images...")
    for (let i = 0; i < generatedImages.length; i++) {
      await handleDownload(generatedImages[i], i)
      // Small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const { w, h } = getDimensions()
  const slides = generatedImages.map((src) => ({
    src,
    width: w,
    height: h,
  }))

  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto py-10 px-[10px] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prompt & Model Settings */}
        <Card className="shadow-glow h-full overflow-hidden">
          <CardHeader className="hidden">
            <CardTitle>Prompt & Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 px-3 sm:px-6">
            <div className="space-y-1 pb-2 [container-type:inline-size]">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground text-left" style={{ fontFamily: "var(--font-rock-salt)" }}>Trigger Word</p>
              <p className="font-black text-center w-full leading-tight" style={{ fontFamily: "var(--font-orbitron)", fontSize: "6cqw" }}>{triggerWord}</p>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <LabelWithTooltip 
                  id="prompt" 
                  label="Prompt" 
                  tooltip="Prompt for generated image. If you include the `trigger_word` used in the training process you are more likely to activate the trained object, style, or concept in the resulting image." 
                />
              </div>
              <Textarea 
                id="prompt" 
                placeholder="Enter your prompt here..." 
                className="h-40"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Separator className="opacity-0" />
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="space-y-2">
                <LabelWithTooltip
                  id="aspect_ratio_card1"
                  label="Aspect Ratio"
                  tooltip="Aspect ratio for the generated image. If custom is selected, uses height and width below & will run in bf16 mode"
                />
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect_ratio_card1">
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <LabelWithTooltip
                  id="num_outputs"
                  label={`Num Outputs (${numOutputs})`}
                  tooltip="Number of outputs to generate"
                />
                <Slider
                  min={1}
                  max={4}
                  step={1}
                  value={[numOutputs]}
                  onValueChange={(vals: number[]) => setNumOutputs(vals[0])}
                />
              </div>
            </div>
            <Separator className="opacity-0" />
            <ImageUploadInput
              id="image_url"
              label="Image (Img2Img)"
              tooltip="Input image for image to image or inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored."
              value={image}
              onChange={(val) => setImage(val)}
            />
          </CardContent>
        </Card>

        {/* Card 2: Output */}
        <Card className="shadow-glow h-full overflow-hidden">
          <CardContent className="p-3 h-full flex flex-col">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Creating your masterpiece...</p>
              </div>
            ) : generatedImages.length > 0 ? (
              <div className="flex flex-col gap-2 flex-1">
                <div className={cn("grid gap-2 flex-1", generatedImages.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {generatedImages.map((src, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden cursor-pointer" style={getAspectRatioStyle(aspectRatio)} onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}>
                      <img src={src} alt={`Generated image ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={handleDownloadAll} variant="secondary" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />Download All ({generatedImages.length})
                  </Button>
                  <Button onClick={() => handleShare(generatedImages[0], 0)} variant="secondary" size="sm" className="flex-1" disabled={isPreparingShare}>
                    {isPreparingShare ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                    {isPreparingShare ? "Preparing..." : "Share"}
                  </Button>
                </div>
              </div>
            ) : coverImage ? (
              <img src={coverImage} alt="" className="flex-1 rounded-lg object-cover w-full" style={getAspectRatioStyle(aspectRatio)} />
            ) : (
              <div className="flex-1 rounded-lg bg-muted/50 border border-border" style={getAspectRatioStyle(aspectRatio)} />
            )}
          </CardContent>
        </Card>

      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className={cn(
            "w-full max-w-sm text-lg py-4 h-auto shadow-glow transition-transform active:scale-95",
            isLoading && "opacity-50 cursor-not-allowed active:scale-100"
          )}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              GENERATING...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-6 w-6" />
              GENERATE
              <Sparkles className="ml-2 h-6 w-6" />
            </>
          )}
        </Button>
      </div>


      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to Share</DialogTitle>
            <DialogDescription>
              Your image has been prepared. Click the button below to share it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeShare}>Share Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}