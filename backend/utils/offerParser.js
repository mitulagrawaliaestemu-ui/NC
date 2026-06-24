import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Helper to convert date format DD-MMM-YYYY to YYYY-MM-DD
export function parseDateString(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const month = months[parts[1].toLowerCase()];
  if (!month) return null;
  return `${parts[2]}-${month}-${parts[0].padStart(2, '0')}`;
}

// Regex fallback parser for IAESTE Offer sheets
export function regexParseOffer(text) {
  const result = {};
  
  // Extract offer code
  const codeMatch = text.match(/INTERNSHIP OFFER\s+([A-Z]{2}-\d{4}-\d{4}-\d{1,2})/i);
  result.offerCode = codeMatch ? codeMatch[1] : "UNKNOWN-CODE";
  
  // Extract country
  const countryMatch = text.match(/On Behalf of Receiving Country\s*-\s*IAESTE\s+([A-Za-z\s]+)/i) || 
                       text.match(/IAESTE\s+[A-Za-z]+,\s+([A-Za-z]+)/i);
  result.country = countryMatch ? countryMatch[1].trim() : "Germany";
  
  // Extract company
  const companyMatch = text.match(/Name of Company\s+(.*?)\s+Website/i);
  const companyName = companyMatch ? companyMatch[1].trim() : "Unknown Company";
  
  // Extract disciplines
  const disciplineMatch = text.match(/General Discipline\s+(.*?)\s+Field of Study/i);
  const disciplines = disciplineMatch ? disciplineMatch[1].trim() : "Architecture";
  
  result.title = `${disciplines} Intern at ${companyName}`;
  
  // Extract description
  const descMatch = text.match(/Working Hours \/ Week:\s*[\d\.]+\s+(.*?)\s+(?:ADDITIONAL INFORMATION|Deadline)/i) ||
                    text.match(/Working Environment:.*?\s+(.*?)\s+Deadline/i) ||
                    text.match(/The interns will work closely.*?\./i);
  result.description = descMatch ? descMatch[0].trim() : "No description provided.";
  if (result.description.startsWith("Working Hours")) {
    result.description = result.description.replace(/^Working Hours \/ Week:\s*[\d\.]+\s+/, "");
  }
  
  // Extract requirements
  const reqMatch = text.match(/Required Qualifications and Skills\s+(.*?)\s+Student Status/i);
  const qual = reqMatch ? reqMatch[1].trim() : "";
  const langMatch = text.match(/Language Required\s+(.*?)\s+Required Qualifications/i);
  const lang = langMatch ? langMatch[1].trim() : "";
  const studyMatch = text.match(/Completed Years of Study\s+(\d+)/i);
  const study = studyMatch ? `Completed Years of Study: ${studyMatch[1]}` : "";
  result.requirements = [qual, lang, study].filter(Boolean).join(". ");
  
  // Extract duration
  const durationMatch = text.match(/(\d+-\d+\s+weeks)/i);
  result.duration = durationMatch ? durationMatch[1] : "12-12 weeks";
  
  // Extract payment
  let payment = "992 EUR per Month";
  const eurPerMatch = text.match(/(\d+)\s+EUR\s+per\s+(?:\d+\s+EUR\s+per\s+)?Month/i);
  if (eurPerMatch) {
    payment = `${eurPerMatch[1]} EUR per Month`;
  } else {
    const fallbackMatch = text.match(/(\d+)\s+EUR\s*(?:\/|\s+per\s+)(?:Month|week)/i);
    if (fallbackMatch) {
      payment = `${fallbackMatch[1]} EUR per Month`;
    }
  }
  result.payment = payment;
  
  // Extract workType
  const workTypeMatch = text.match(/(ON-SITE|REMOTE|HYBRID)/i);
  result.workType = workTypeMatch ? workTypeMatch[1].toUpperCase() : "ON-SITE";
  
  // Extract deadline
  const deadlineMatch = text.match(/Deadline for Nomination\s*-\s*(\d{2}-[A-Za-z]{3}-\d{4})/i);
  if (deadlineMatch) {
    result.deadline = parseDateString(deadlineMatch[1]) || "2026-07-02";
  } else {
    result.deadline = "2026-07-02";
  }
  
  return result;
}

// Call Gemini API to extract structured fields if API key is present
export async function aiParseOffer(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found in .env. Using regex-based fallback parser.");
    return regexParseOffer(text);
  }
  
  console.log("Using Gemini API for structured field extraction...");
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                offerCode: { type: 'STRING' },
                description: { type: 'STRING' },
                requirements: { type: 'STRING' },
                country: { type: 'STRING' },
                duration: { type: 'STRING' },
                payment: { type: 'STRING' },
                workType: { type: 'STRING', enum: ['ON-SITE', 'REMOTE', 'HYBRID'] },
                deadline: { type: 'STRING' }
              },
              required: ['title', 'offerCode', 'description', 'requirements', 'country', 'duration', 'payment', 'workType', 'deadline']
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText.trim());
  } catch (err) {
    console.warn("Gemini API call failed, falling back to regex parser:", err.message);
    return regexParseOffer(text);
  }
}
