import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generatePayrollInsights(
  report: any[],
  startDate: Date,
  endDate: Date
): Promise<string | null> {
  if (!genAI) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this payroll report and provide:
1. A brief summary of the payroll period
2. Any anomalies (missing clock-outs, unusually long shifts, duplicate punches)
3. Key insights

Payroll Report:
Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
Workers: ${report.length}
${report.map(r => `- ${r.worker}: ${r.totalHours.toFixed(2)} hours, $${r.grossPay?.toFixed(2) || 'N/A'}`).join('\n')}

Provide a concise, professional analysis.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}
