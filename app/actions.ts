"use server"

import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function generateImage(formData: FormData) {
  const replicateModelId = formData.get("replicate_model_id") as string
  const prompt = formData.get("prompt") as string
  const model = formData.get("model") as string
  const aspectRatio = formData.get("aspect_ratio") as string
  const outputFormat = formData.get("output_format") as string
  const numOutputs = parseInt(formData.get("num_outputs") as string)
  const width = parseInt(formData.get("width") as string)
  const height = parseInt(formData.get("height") as string)
  const megapixels = formData.get("megapixels") as string
  const outputQuality = parseInt(formData.get("output_quality") as string)
  const guidanceScale = parseFloat(formData.get("guidance_scale") as string)
  const numInferenceSteps = parseInt(formData.get("num_inference_steps") as string)
  const seed = formData.get("seed") ? parseInt(formData.get("seed") as string) : undefined
  const goFast = formData.get("go_fast") === "on"
  const disableSafetyChecker = formData.get("disable_safety_checker") === "on"
  const image = formData.get("image") as string
  const mask = formData.get("mask") as string
  const promptStrength = parseFloat(formData.get("prompt_strength") as string)
  const extraLora = formData.get("extra_lora") as string
  const loraScale = parseFloat(formData.get("lora_scale") as string)
  const extraLoraScale = parseFloat(formData.get("extra_lora_scale") as string)

  const input: any = {
    prompt,
    model,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    num_outputs: numOutputs,
    megapixels,
    output_quality: outputQuality,
    guidance_scale: guidanceScale,
    num_inference_steps: numInferenceSteps,
    go_fast: goFast,
    disable_safety_checker: disableSafetyChecker,
    prompt_strength: promptStrength,
    lora_scale: loraScale,
    extra_lora_scale: extraLoraScale,
  }

  if (aspectRatio === "custom") {
    input.width = width
    input.height = height
  }

  if (seed) input.seed = seed
  if (image) input.image = image
  if (mask) input.mask = mask
  if (extraLora) input.extra_lora = extraLora

  try {
    const output = await replicate.run(
      replicateModelId as any,
      { input }
    )
    
    // Convert FileOutput objects to URL strings
    const serializedOutput = Array.isArray(output) 
      ? output.map((item: any) => item.url().toString())
      : (output as any).url().toString()

    return { success: true, output: serializedOutput }
  } catch (error) {
    console.error("Error generating image:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
