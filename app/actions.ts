"use server"

export async function generateImage(formData: FormData) {
  const prompt = formData.get("prompt") as string
  const version = formData.get("version") as string
  const sourceId = formData.get("source_id") as string
  const numOutputs = parseInt(formData.get("num_outputs") as string)
  const aspectRatio = formData.get("aspect_ratio") as string
  const customerId = formData.get("customer_id") as string
  const artistUploads = formData.get("artist_uploads") as string | null

  if (prompt.trim().length < 10) {
    return { success: false, error: "Prompt must be at least 10 characters" }
  }

  const mcpRes = await fetch(process.env.MCP_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "trash",
        arguments: {
          prompt,
          version,
          source_id: sourceId,
          numOutputs,
          artist_uploads: artistUploads || "",
          aspectRatio,
          customer_id: customerId,
        },
      },
    }),
  })

  const mcpData = await mcpRes.json()
  const result = JSON.parse(mcpData.result.content[0].text)

  if (result.body) {
    return { success: true, output: JSON.parse(result.body).urls }
  }

  return { success: false, error: result }
}
