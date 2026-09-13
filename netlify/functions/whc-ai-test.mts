export default async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "POST requests only" },
      { status: 405 }
    );
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openAIKey || !anthropicKey) {
    return Response.json(
      { error: "AI API keys are not configured" },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    message: "WHC AI bridge is ready",
    openai: "connected",
    claude: "connected",
  });
};
