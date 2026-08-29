export type ToolContext = {
  businessId: string
  customerId: string
  conversationId: string
}

export type AiTool = {
  name: string
  description: string
  input_schema: Record<string, unknown>
  handler: (
    context: ToolContext,
    input: Record<string, unknown>
  ) => Promise<Record<string, unknown>>
}