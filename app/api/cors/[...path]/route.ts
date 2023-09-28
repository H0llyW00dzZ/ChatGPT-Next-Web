import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CORS_HOST } from "@/app/constant";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (req.method === "OPTIONS") {
    // Set CORS headers for preflight requests
    return NextResponse.json(
      { body: "OK" },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": `${DEFAULT_CORS_HOST}`, // Replace * with the appropriate origin(s)
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Add other allowed methods if needed
          "Access-Control-Allow-Headers": "*", // Replace * with the appropriate headers
          "Access-Control-Max-Age": "86400", // Adjust the max age value if needed
        },
      },
    );
  }

  const [protocol, ...subpath] = params.path;
  const targetUrl = `${protocol}://${subpath.join("/")}`;

  const method = req.headers.get("method") ?? undefined;
  const shouldNotHaveBody = ["get", "head"].includes(
    method?.toLowerCase() ?? "",
  );

  const fetchOptions: RequestInit = {
    headers: {
      authorization: req.headers.get("authorization") ?? "",
    },
    body: shouldNotHaveBody ? null : req.body,
    method,
    // @ts-ignore
    duplex: "half",
  };

  const origin = req.headers.get("Origin");
  const referrer = req.headers.get("Referer");
  if (origin !== DEFAULT_CORS_HOST || (referrer && !referrer.includes(DEFAULT_CORS_HOST))) {
    return NextResponse.json(
      {
        error: true,
        msg: "Access Forbidden",
      },
      {
        status: 403,
      },
    );
  }

  const fetchResult = await fetch(targetUrl, fetchOptions);

  console.log("[Cloud Sync]", targetUrl, {
    status: fetchResult.status,
    statusText: fetchResult.statusText,
  });

  return fetchResult;
}

export const POST = handle;
export const GET = handle;
export const OPTIONS = handle;

export const runtime = "edge";
