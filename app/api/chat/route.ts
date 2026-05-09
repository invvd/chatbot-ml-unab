import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const filePath = path.join(process.cwd(), "knowledge.txt");

    const context = fs.readFileSync(filePath, "utf-8");

    const prompt = `
Eres un experto en producción musical.

Responde SOLO usando la información entregada.

Si la respuesta no está en el contexto, di:
"No tengo información suficiente."

Responde usando markdown.

Contexto:
${context}

Pregunta:
${body.message}
`;

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1",
        prompt,
        stream: true,
      }),
    });

    return new Response(ollamaResponse.body, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.log(error);
  }
}
