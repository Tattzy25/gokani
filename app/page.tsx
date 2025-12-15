"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, ImageIcon, Loader2, Download, Upload, Link as LinkIcon, X, Sparkles, Share2 } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"
import { generateImage } from "./actions"
import { AVAILABLE_MODELS } from "@/lib/models"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
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
  const [numOutputs, setNumOutputs] = useState(1)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isPreparingShare, setIsPreparingShare] = useState(false)

  // Form State
  const [replicateModelId, setReplicateModelId] = useState(AVAILABLE_MODELS[0].id)
  const [customModelId, setCustomModelId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("dev")
  const [outputFormat, setOutputFormat] = useState("webp")
  const [megapixels, setMegapixels] = useState("1")
  const [outputQuality, setOutputQuality] = useState(80)
  const [guidanceScale, setGuidanceScale] = useState(3)
  const [numInferenceSteps, setNumInferenceSteps] = useState(28)
  const [seed, setSeed] = useState<number | undefined>(undefined)
  const [goFast, setGoFast] = useState(false)
  const [disableSafetyChecker, setDisableSafetyChecker] = useState(false)
  const [image, setImage] = useState("")
  const [imageFileName, setImageFileName] = useState("")
  const [mask, setMask] = useState("")
  const [maskFileName, setMaskFileName] = useState("")
  const [promptStrength, setPromptStrength] = useState(0.8)
  const [extraLora, setExtraLora] = useState("")
  const [loraScale, setLoraScale] = useState(1)
  const [extraLoraScale, setExtraLoraScale] = useState(1)

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
    if (isLoading) return // Prevent double clicks
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image")
      return
    }

    setIsLoading(true)
    setIsGenerated(false)
    setGeneratedImages([])

    const finalModelId = replicateModelId === "custom" ? customModelId : replicateModelId

    const formData = new FormData()
    formData.append("replicate_model_id", finalModelId)
    formData.append("prompt", prompt)
    formData.append("model", model)
    formData.append("aspect_ratio", aspectRatio)
    formData.append("output_format", outputFormat)
    formData.append("num_outputs", numOutputs.toString())
    formData.append("width", width.toString())
    formData.append("height", height.toString())
    formData.append("megapixels", megapixels)
    formData.append("output_quality", outputQuality.toString())
    formData.append("guidance_scale", guidanceScale.toString())
    formData.append("num_inference_steps", numInferenceSteps.toString())
    if (seed) formData.append("seed", seed.toString())
    if (goFast) formData.append("go_fast", "on")
    if (disableSafetyChecker) formData.append("disable_safety_checker", "on")
    if (image) formData.append("image", image)
    if (mask) formData.append("mask", mask)
    formData.append("prompt_strength", promptStrength.toString())
    if (extraLora) formData.append("extra_lora", extraLora)
    formData.append("lora_scale", loraScale.toString())
    formData.append("extra_lora_scale", extraLoraScale.toString())

    const result = await generateImage(formData)

    if (result.success) {
      setGeneratedImages(Array.isArray(result.output) ? result.output : [result.output])
      setIsGenerated(true)
    } else {
      console.error(result.error)
      toast.error(result.error || "Failed to generate image. Please try again.")
    }
    setIsLoading(false)
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const filename = `generated-image-${index + 1}.${outputFormat}`
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
    const filename = `generated-image-${index + 1}.${outputFormat}`
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
      <div className="w-full flex justify-center items-center py-4">
        <img 
          src="/header svg gokani.svg" 
          alt="GoKAnI Header" 
          className="h-24 w-auto object-contain"
        />
      </div>
      <div className="container mx-auto py-10 px-[10px] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prompt & Model Settings */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardHeader>
            <CardTitle>Prompt & Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <LabelWithTooltip 
                id="replicate_model" 
                label="Replicate Model" 
                tooltip="Select the specific Replicate model to use for generation." 
              />
              <Select 
                value={replicateModelId} 
                onValueChange={(val: string) => {
                  setReplicateModelId(val)
                  if (val === "custom" && !customModelId) {
                    setCustomModelId("black-forest-labs/flux-dev")
                  }
                }}
              >
                <SelectTrigger id="replicate_model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Other (Custom ID)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {replicateModelId === "custom" && (
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="custom_model_id" 
                  label="Custom Model ID" 
                  tooltip="Enter the full Replicate model ID (e.g., owner/model:version)" 
                />
                <Input 
                  id="custom_model_id" 
                  placeholder="owner/model:version" 
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <LabelWithTooltip 
                  id="prompt" 
                  label="Prompt" 
                  tooltip="Prompt for generated image. If you include the `trigger_word` used in the training process you are more likely to activate the trained object, style, or concept in the resulting image." 
                />
                <span className="text-sm text-muted-foreground">
                  Trigger word: <span className="font-mono font-bold text-primary">FAMOSOFLUXO</span>
                </span>
              </div>
              <Textarea 
                id="prompt" 
                placeholder="Enter your prompt here..." 
                className="h-24" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="model" 
                  label="Flux Mode" 
                  tooltip="Which version of Flux to run inference with. 'Dev' is higher quality (slower), 'Schnell' is faster (lower quality)." 
                />
                <Select 
                  value={model} 
                  onValueChange={(val: string) => {
                    setModel(val)
                    if (val === "schnell") {
                      setNumInferenceSteps(4)
                    } else {
                      setNumInferenceSteps(28)
                    }
                  }}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev">Dev</SelectItem>
                    <SelectItem value="schnell">Schnell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="num_outputs" 
                  label="Num Outputs" 
                  tooltip="Number of outputs to generate" 
                />
                <Input 
                  id="num_outputs" 
                  type="number" 
                  min={1} 
                  max={4} 
                  value={numOutputs}
                  onChange={(e) => setNumOutputs(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-xs font-bold text-center text-muted-foreground">DO NOT TOUCH SETTINGS UNLESS YOU KNOW WHAT YOU ARE DOING</p>
          </CardFooter>
        </Card>

        {/* Card 2: Dimensions & Quality */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardHeader>
            <CardTitle>Dimensions & Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="aspect_ratio" 
                  label="Aspect Ratio" 
                  tooltip="Aspect ratio for the generated image. If custom is selected, uses height and width below & will run in bf16 mode" 
                />
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect_ratio">
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="21:9">21:9</SelectItem>
                    <SelectItem value="3:2">3:2</SelectItem>
                    <SelectItem value="2:3">2:3</SelectItem>
                    <SelectItem value="4:5">4:5</SelectItem>
                    <SelectItem value="5:4">5:4</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="9:21">9:21</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="output_format" 
                  label="Format" 
                  tooltip="Format of the output images" 
                />
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger id="output_format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="width" 
                  label="Width" 
                  tooltip="Width of generated image. Only works if `aspect_ratio` is set to custom. Will be rounded to nearest multiple of 16. Incompatible with fast generation" 
                />
                <Input 
                  id="width" 
                  type="number" 
                  placeholder="1024" 
                  min={256} 
                  max={1440} 
                  step={16} 
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
                />
              </div>
              <div className="space-y-2">
                <LabelWithTooltip 
                  id="height" 
                  label="Height" 
                  tooltip="Height of generated image. Only works if `aspect_ratio` is set to custom. Will be rounded to nearest multiple of 16. Incompatible with fast generation" 
                />
                <Input 
                  id="height" 
                  type="number" 
                  placeholder="1024" 
                  min={256} 
                  max={1440} 
                  step={16} 
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                id="megapixels" 
                label="Megapixels" 
                tooltip="Approximate number of megapixels for generated image" 
              />
              <Select value={megapixels} onValueChange={setMegapixels}>
                <SelectTrigger id="megapixels">
                  <SelectValue placeholder="Select megapixels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 MP</SelectItem>
                  <SelectItem value="0.25">0.25 MP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Output Quality (${outputQuality})`}
                tooltip="Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs" 
              />
              <Slider 
                value={[outputQuality]} 
                onValueChange={(vals: number[]) => setOutputQuality(vals[0])} 
                max={100} 
                step={1} 
              />
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-xs font-bold text-center text-muted-foreground">DO NOT TOUCH SETTINGS UNLESS YOU KNOW WHAT YOU ARE DOING</p>
          </CardFooter>
        </Card>

        {/* Card 3: Advanced Generation */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardHeader>
            <CardTitle>Advanced Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <LabelWithTooltip  
                label={`Guidance Scale (${guidanceScale})`}
                tooltip="Guidance scale for the diffusion process. Lower values can give more realistic images. Good values to try are 2, 2.5, 3 and 3.5. Ignored for Schnell model." 
              />
              <Slider 
                value={[guidanceScale]} 
                onValueChange={(vals: number[]) => setGuidanceScale(vals[0])} 
                max={10} 
                step={0.1} 
                disabled={model === "schnell"}
                className={model === "schnell" ? "opacity-50 cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Inference Steps (${numInferenceSteps})`}
                tooltip="Number of denoising steps. More steps can give more detailed images, but take longer." 
              />
              <Slider 
                value={[numInferenceSteps]} 
                onValueChange={(vals: number[]) => setNumInferenceSteps(vals[0])} 
                max={model === "schnell" ? 4 : 50} 
                step={1} 
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                id="seed" 
                label="Seed" 
                tooltip="Random seed. Set for reproducible generation" 
              />
              <Input 
                id="seed" 
                type="number" 
                placeholder="Random" 
                value={seed || ""}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div className="flex items-center justify-between">
              <LabelWithTooltip 
                id="go_fast" 
                label="Go Fast Mode" 
                tooltip="Run faster predictions with model optimized for speed (currently fp8 quantized); disable to run in original bf16" 
              />
              <Switch 
                id="go_fast" 
                checked={goFast}
                onCheckedChange={setGoFast}
              />
            </div>

            <div className="flex items-center justify-between">
              <LabelWithTooltip 
                id="disable_safety" 
                label="Disable Safety Checker" 
                tooltip="Disable safety checker for generated images." 
              />
              <Switch 
                id="disable_safety" 
                checked={disableSafetyChecker}
                onCheckedChange={setDisableSafetyChecker}
              />
            </div>

            <Separator className="my-2" />
            
            <div className="space-y-2">
              <LabelWithTooltip 
                id="extra_lora" 
                label="Extra LoRA" 
                tooltip="Load LoRA weights. Supports Replicate models in the format <owner>/<username> or <owner>/<username>/<version>, HuggingFace URLs in the format huggingface.co/<owner>/<model-name>, CivitAI URLs in the format civitai.com/models/<id>[/<model-name>], or arbitrary .safetensors URLs from the Internet. For example, 'fofr/flux-pixar-cars'" 
              />
              <Input 
                id="extra_lora" 
                placeholder="owner/model" 
                value={extraLora}
                onChange={(e) => setExtraLora(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  label={`LoRA Scale (${loraScale})`}
                  tooltip="Determines how strongly the main LoRA should be applied. Sane results between 0 and 1 for base inference. For go_fast we apply a 1.5x multiplier to this value; we've generally seen good performance when scaling the base value by that amount. You may still need to experiment to find the best value for your particular lora." 
                />
                <Slider 
                  value={[loraScale]} 
                  onValueChange={(vals: number[]) => setLoraScale(vals[0])} 
                  min={-1} 
                  max={3} 
                  step={0.1} 
                />
              </div>
              <div className="space-y-2">
                <LabelWithTooltip 
                  label={`Extra LoRA Scale (${extraLoraScale})`}
                  tooltip="Determines how strongly the extra LoRA should be applied." 
                />
                <Slider 
                  value={[extraLoraScale]} 
                  onValueChange={(vals: number[]) => setExtraLoraScale(vals[0])} 
                  min={-1} 
                  max={3} 
                  step={0.1} 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-xs font-bold text-center text-muted-foreground">DO NOT TOUCH SETTINGS UNLESS YOU KNOW WHAT YOU ARE DOING</p>
          </CardFooter>
        </Card>

        {/* Card 4: Image Uploads */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardHeader>
            <CardTitle>Image Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <ImageUploadInput 
              id="image_url"  
              label="Image (Img2Img)" 
              tooltip="Input image for image to image or inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored." 
              value={image}
              onChange={(val, name) => {
                setImage(val)
                if (name) setImageFileName(name)
              }}
            />

            <ImageUploadInput 
              id="mask_url" 
              label="Mask (Inpainting)" 
              tooltip="Image mask for image inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored." 
              value={mask}
              onChange={(val, name) => {
                setMask(val)
                if (name) setMaskFileName(name)
              }}
            />

            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Prompt Strength (${promptStrength})`}
                tooltip="Prompt strength when using img2img. 1.0 corresponds to full destruction of information in image" 
              />
              <Slider 
                value={[promptStrength]} 
                onValueChange={(vals: number[]) => setPromptStrength(vals[0])} 
                max={1} 
                step={0.05} 
              />
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-xs font-bold text-center text-muted-foreground">DO NOT TOUCH SETTINGS UNLESS YOU KNOW WHAT YOU ARE DOING</p>
          </CardFooter>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className={cn(
            "w-full max-w-md text-2xl py-6 h-auto shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] transition-transform active:scale-95",
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

      <Separator />
      
      <div className="flex flex-col items-center pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Creating your masterpiece...</p>
          </div>
        ) : (
          <>
            {generatedImages.length > 1 && (
              <Button onClick={handleDownloadAll} variant="secondary" className="mb-8">
                <Download className="mr-2 h-4 w-4" />
                Download All ({generatedImages.length})
              </Button>
            )}
            <div className="flex flex-wrap justify-center items-center gap-8">
              {generatedImages.map((src, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div 
                    className="relative rounded-lg flex items-center justify-center w-full max-w-md shadow-sm cursor-pointer transition-colors"
                    style={getAspectRatioStyle(aspectRatio)}
                    onClick={() => {
                      setLightboxIndex(i)
                      setLightboxOpen(true)
                    }}
                  >
                    <img 
                      src={src} 
                      alt={`Generated image ${i + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2 w-full max-w-md">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(src, i)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleShare(src, i)}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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