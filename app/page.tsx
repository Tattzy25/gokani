"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ImageIcon, Loader2 } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { generateImage } from "./actions"

function LabelWithTooltip({ id, label, tooltip }: { id?: string, label: string, tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
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

  // Form State
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
  const [mask, setMask] = useState("")
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
    setIsLoading(true)
    setIsGenerated(false)
    setGeneratedImages([])

    const formData = new FormData()
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
      // Handle error (maybe show a toast)
    }
    setIsLoading(false)
  }

  const { w, h } = getDimensions()
  const slides = generatedImages.map((src) => ({
    src,
    width: w,
    height: h,
  }))

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-center">GoKAnI</h1>
        <Separator className="my-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prompt & Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt & Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LabelWithTooltip 
                id="prompt" 
                label="Prompt" 
                tooltip="Prompt for generated image. If you include the `trigger_word` used in the training process you are more likely to activate the trained object, style, or concept in the resulting image." 
              />
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
                  label="Model" 
                  tooltip="Which model to run inference with. The dev model performs best with around 28 inference steps but the schnell model only needs 4 steps." 
                />
                <Select value={model} onValueChange={setModel}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
        </Card>

        {/* Card 2: Dimensions & Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensions & Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                onValueChange={(vals) => setOutputQuality(vals[0])} 
                max={100} 
                step={1} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Advanced Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Guidance Scale (${guidanceScale})`}
                tooltip="Guidance scale for the diffusion process. Lower values can give more realistic images. Good values to try are 2, 2.5, 3 and 3.5" 
              />
              <Slider 
                value={[guidanceScale]} 
                onValueChange={(vals) => setGuidanceScale(vals[0])} 
                max={10} 
                step={0.1} 
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Inference Steps (${numInferenceSteps})`}
                tooltip="Number of denoising steps. More steps can give more detailed images, but take longer." 
              />
              <Slider 
                value={[numInferenceSteps]} 
                onValueChange={(vals) => setNumInferenceSteps(vals[0])} 
                max={50} 
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
          </CardContent>
        </Card>

        {/* Card 4: Image & LoRA */}
        <Card>
          <CardHeader>
            <CardTitle>Image & LoRA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LabelWithTooltip 
                id="image_url" 
                label="Image URL (Img2Img)" 
                tooltip="Input image for image to image or inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored." 
              />
              <Input 
                id="image_url" 
                placeholder="https://..." 
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                id="mask_url" 
                label="Mask URL (Inpainting)" 
                tooltip="Image mask for image inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored." 
              />
              <Input 
                id="mask_url" 
                placeholder="https://..." 
                value={mask}
                onChange={(e) => setMask(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                label={`Prompt Strength (${promptStrength})`}
                tooltip="Prompt strength when using img2img. 1.0 corresponds to full destruction of information in image" 
              />
              <Slider 
                value={[promptStrength]} 
                onValueChange={(vals) => setPromptStrength(vals[0])} 
                max={1} 
                step={0.05} 
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
                  onValueChange={(vals) => setLoraScale(vals[0])} 
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
                  onValueChange={(vals) => setExtraLoraScale(vals[0])} 
                  min={-1} 
                  max={3} 
                  step={0.1} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="w-full max-w-md text-lg" 
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              GENERATING...
            </>
          ) : (
            "GENERATE"
          )}
        </Button>
      </div>

      <Separator />
      
      <div className="flex flex-wrap justify-center items-center gap-8 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Creating your masterpiece...</p>
          </div>
        ) : (
          generatedImages.map((src, i) => (
            <div 
              key={i} 
              className="relative bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 w-full max-w-md shadow-sm cursor-pointer hover:bg-muted/80 transition-colors"
              style={getAspectRatioStyle(aspectRatio)}
              onClick={() => {
                setLightboxIndex(i)
                setLightboxOpen(true)
              }}
            >
              <img 
                src={src} 
                alt={`Generated image ${i + 1}`} 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          ))
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />
    </div>
  )
}