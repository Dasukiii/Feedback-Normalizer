import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedFeedback {
  category: string;
  priority: "high" | "medium" | "low";
  description: string;
  tags: string[];
  suggestedOwner: string | null;
  extractedText?: string;
}

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const buffer = new Uint8Array(arrayBuffer);
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length < 10) {
      throw new Error("No text content found in PDF");
    }

    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the PDF contains text and is not scanned images.");
  }
}

async function analyzeWithVision(fileBase64: string, mimeType: string): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a document analyzer. Extract all text and feedback content from the provided document or image.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract and transcribe all text content from this document/image. This appears to be employee feedback or a related document. Extract everything you can read.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${fileBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI vision error:", error);
    throw new Error("Failed to analyze document");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeFeedback(feedbackText: string): Promise<ExtractedFeedback> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
Analyze this employee feedback and extract structured information:

Feedback: "${feedbackText}"

Extract:
1. Category (choose one): Policy Question, Complaint, Suggestion, Information Request, Escalation, Benefits Question, General
2. Priority (High/Medium/Low based on urgency and sentiment)
3. Clean description (1-2 sentence summary)
4. Suggested tags (2-4 relevant keywords)
5. Suggested owner role (HR/Manager/IT/Finance/None if unclear)

Return ONLY valid JSON:
{
  "category": "...",
  "priority": "high/medium/low",
  "description": "...",
  "tags": ["tag1", "tag2"],
  "suggestedOwner": "role or null"
}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an HR feedback analyzer. Extract structured data from employee feedback.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze feedback");
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  if (!content) {
    throw new Error("No content in response");
  }

  return JSON.parse(content);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    let feedbackText = "";
    let extractedText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const arrayBuffer = await file.arrayBuffer();

      if (file.type === "application/pdf") {
        console.log("Processing PDF file...");
        extractedText = await extractTextFromPDF(arrayBuffer);
      } else if (file.type.startsWith("image/")) {
        console.log("Processing image file...");
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        extractedText = await analyzeWithVision(base64, file.type);
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        console.log("Processing text file...");
        const decoder = new TextDecoder("utf-8");
        extractedText = decoder.decode(arrayBuffer);
      } else {
        console.log("Processing file with vision API...");
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        extractedText = await analyzeWithVision(base64, file.type);
      }

      feedbackText = extractedText;
    } else {
      const body = await req.json();
      feedbackText = body.feedbackText;
    }

    if (!feedbackText || feedbackText.length < 10) {
      return new Response(
        JSON.stringify({ error: "Feedback text is required and must be at least 10 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const extracted = await analyzeFeedback(feedbackText);
    
    if (extractedText) {
      extracted.extractedText = extractedText;
    }

    return new Response(
      JSON.stringify(extracted),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in extract-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});