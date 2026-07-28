/**
 * Syllabus Processing Prompt and Pipeline Constants
 */

export const DEFAULT_PROCESSING_BACKEND_URL =
  process.env.NEXT_PUBLIC_PROCESSING_BACKEND_URL || 'http://172.16.157.5:8080';

export const AI_PROCESSING_PROMPT = `You are an expert academic syllabus parser.

Your task is to convert university syllabus documents into clean structured JSON.

The input may contain:
• OCR mistakes
• Broken formatting
• Tables
• Bullet lists
• Missing spacing
• Page numbers
• Headers
• Footers
• Duplicate text

Ignore irrelevant text.
Extract only syllabus information.

--------------------------------------
Extract:
Course Code
Course Title
Programme
Department
Semester
Credits
Lecture Hours
Tutorial Hours
Practical Hours
Total Hours
Course Objectives
Course Outcomes
Prerequisites
Reference Books
Text Books
Assessment Pattern
Units
Topics
Subtopics
Hours
Experiments (if available)
Lab Exercises
Important Notes

--------------------------------------
For every Unit:
Extract:
Unit Number
Unit Title
Teaching Hours
Topics
Sub Topics
Examples
Numericals
Case Studies
Laboratory Components
if available.

--------------------------------------
Maintain original ordering.
Do not hallucinate.
If data is missing, return null.
Never invent information.
Return ONLY JSON.
No markdown.
No explanation.

JSON schema:
{
  "course": {
      "code":"",
      "title":"",
      "programme":"",
      "department":"",
      "semester":"",
      "credits":"",
      "hours":{
          "lecture":"",
          "tutorial":"",
          "practical":"",
          "total":""
      },
      "prerequisites":"",
      "objectives":[],
      "outcomes":[]
  },
  "units":[
      {
          "unit_number":1,
          "title":"",
          "hours":"",
          "topics":[
              {
                  "name":"",
                  "subtopics":[]
              }
          ]
      }
  ],
  "textbooks":[],
  "reference_books":[],
  "assessment":{},
  "additional_information":{}
}
`;

export const STAGE_2_STATUS_MESSAGES = [
  "Connecting to Processing Server...",
  "Uploading Extracted Content...",
  "Running AI Analysis...",
  "Identifying Course Details...",
  "Extracting Units...",
  "Organizing Topics...",
  "Generating Structured JSON...",
  "Finalizing..."
];
