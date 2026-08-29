import type { AiTool, ToolContext } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'
const MAX_TOOL_ROUNDS = 4

type TextBlock = { type: 'text'; text: string }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string }
type ContentBlock = TextBlock | ToolUseBlock

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string | ContentBlock[] | ToolResultBlock[]
}

function buildSystemPrompt(businessName: string, agentInstructions: string | null): string {
  return `Eres el asistente de atención al cliente de "${businessName}".

Tu trabajo es responder preguntas de clientes y ayudarles con lo que necesiten, usando ÚNICAMENTE las herramientas disponibles para obtener información real — nunca inventes horarios, precios, ni disponibilidad.

Sé breve y cordial, como lo sería un buen mesero o recepcionista por WhatsApp. No uses formato markdown (esto se envía como mensaje de texto plano de WhatsApp).

Si te falta información para usar una herramienta (por ejemplo, la hora de una reserva), pregúntala antes de intentar usar la herramienta.

${agentInstructions ?? ''}`.trim()
}

export async function runAiEngine(
  context: ToolContext,
  businessName: string,
  agentInstructions: string | null,
  tools: AiTool[],
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Falta ANTHROPIC_API_KEY en las variables de entorno')
  }

  const toolDefinitions = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }))

  const messages: ConversationMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(businessName, agentInstructions),
        tools: toolDefinitions,
        messages,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Error llamando a la API de Anthropic: ${errorBody}`)
    }

    const data: { content: ContentBlock[] } = await res.json()
    const toolUseBlocks = data.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUseBlocks.length === 0) {
      const textBlock = data.content.find((b): b is TextBlock => b.type === 'text')
      return textBlock?.text ?? 'Disculpa, no pude procesar tu mensaje.'
    }

    messages.push({ role: 'assistant', content: data.content })

    const toolResults: ToolResultBlock[] = []
    for (const block of toolUseBlocks) {
      const tool = tools.find((t) => t.name === block.name)
      let result: Record<string, unknown>
      try {
        result = tool
          ? await tool.handler(context, block.input)
          : { error: 'Herramienta no disponible' }
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Error ejecutando la herramienta' }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  return 'Disculpa, tuve un problema procesando tu solicitud. En breve te atenderá alguien del equipo.'
}