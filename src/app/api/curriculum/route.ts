import { NextResponse } from "next/server";

async function generateCurriculum(courseTitle: string, rawSyllabus: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured.");
  }

  const prompt = `
  You are an expert curriculum architect. Analyze the provided syllabus text for "${courseTitle}".
  
  Tasks:
  1. Organize topics in strict pedagogical learning order (what must be taught first before advanced concepts).
  2. Map subtopics nested directly under each main topic.
  3. Provide 2-3 similar or related domain concepts per main topic.
  4. Provide a clear hierarchy ordering reason for why this sequence is chosen.
  5. Include top 3 recommended teaching pedagogies for each main topic.

  Return ONLY valid JSON matching this schema:
  {
    "units": [
      {
        "unitNumber": 1,
        "unitTitle": "String",
        "hours": 9,
        "credits": 1.0,
        "mainTopics": [
          {
            "id": "topic_1_1",
            "title": "Main Topic Name",
            "orderingReason": "Rationale for teaching this concept first...",
            "similarTopics": ["Concept 1", "Concept 2"],
            "subtopics": [
              {
                "title": "Subtopic Name",
                "reason": "Detailed component supporting main topic"
              }
            ],
            "pedagogies": [
              {
                "title": "Interactive Demonstration & EMR Simulation",
                "type": "Experiential Learning",
                "description": "Use visual tools to demonstrate wave theory."
              },
              {
                "title": "Problem-Based Math Worksheets",
                "type": "Practice",
                "description": "Apply Planck's and Wien's displacement laws."
              },
              {
                "title": "Flipped Classroom Discussion",
                "type": "Collaborative",
                "description": "Compare active vs passive radiation sources."
              }
            ]
          }
        ]
      }
    ]
  }

  Syllabus Content:
  ${rawSyllabus || courseTitle}
  `;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseTitle = "Core Course", rawSyllabus = "" } = body;
    const curriculumData = await generateCurriculum(courseTitle, rawSyllabus);
    return NextResponse.json(curriculumData);
  } catch (error: any) {
    console.error("[Curriculum API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate structured curriculum" },
      { status: 500 }
    );
  }
}
