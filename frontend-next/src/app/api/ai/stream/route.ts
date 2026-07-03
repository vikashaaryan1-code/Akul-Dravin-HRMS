import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
 try {
 const { message, agentMode, context, history } = await req.json();

 const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
 const authHeader = req.headers.get('Authorization');

 /* Call backend */ const response = await fetch(`${backendUrl}/api/v1/ai/chat`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(authHeader ? { Authorization: authHeader } : {}),
 },
 body: JSON.stringify({
 messages: [...(history || []), { role: 'user', content: message }],
 agentMode,
 context,
 }),
 });

 if (!response.ok) {
 return NextResponse.json({ error: 'Backend error' }, { status: response.status });
 }

 const data = await response.json();
 const reply = data.reply || data.content || "I couldn't process your request.";
 const citations = data.citations || [];
 const action = data.action || null;

 /* Simulate SSE Stream */ const stream = new ReadableStream({
 async start(controller) {
 const words = reply.split(' ');
 
 for (let i = 0; i < words.length; i++) {
 const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
 const payload = JSON.stringify({ delta: chunk });
 controller.enqueue(`data: ${payload}\n\n`);
 // simulate network delay for typing effect (20-50ms per word)
 await new Promise((resolve) => setTimeout(resolve, Math.random() * 30 + 20));
 }

 /* Send metadata (citations and actions) at the end */ if (citations.length > 0 || action) {
 const metaPayload = JSON.stringify({ citations, action });
 controller.enqueue(`data: ${metaPayload}\n\n`);
 }

 controller.enqueue('data: [DONE]\n\n');
 controller.close();
 },
 });

 return new NextResponse(stream, {
 headers: {
 'Content-Type': 'text/event-stream',
 'Cache-Control': 'no-cache',
 'Connection': 'keep-alive',
 },
 });
 } catch (error: any) {
 console.error('SSE Proxy Error:', error);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}
