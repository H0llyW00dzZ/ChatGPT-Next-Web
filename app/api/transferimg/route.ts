import { NextRequest, NextResponse } from "next/server";

// Define an interface for the expected payload structure
interface Payload {
  imageUrl: string;
}

// Utility function to validate URLs
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Ensure the URL uses http or https protocol
    return ['http:', 'https:'].includes(url.protocol);
    // Optionally, restrict to specific domains
    // return url.hostname === 'go.dev';
  } catch (e) {
    return false;
  }
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  let payload: Payload;

  try {
    // Assuming req.body is a JSON string
    payload = (await req.json()) as Payload;
  } catch {
    return new NextResponse(JSON.stringify({ error: "invalid JSON" }), { status: 400, headers: { 'Content-Type': 'application/json' } }); 
  }

  const imageUrl = payload.imageUrl;

  if (!imageUrl || !isValidUrl(imageUrl)) {
    return new NextResponse(JSON.stringify({ error: 'No valid URL provided' }), {
      status: 400, // 400 Bad Request
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Fetching image failed with status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Convert binary data to base64 string
    const binaryString = new Uint8Array(arrayBuffer).reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const base64 = Buffer.from(binaryString, 'binary').toString('base64');

    const nextResponse = new NextResponse(JSON.stringify({ newImageUrl: `data:image/jpeg;base64,${base64}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

    return nextResponse;
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Unable to process image' }), {
      status: 500, // Stupid Server error
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
