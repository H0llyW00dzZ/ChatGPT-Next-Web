import { NextResponse } from "next/server";
import { DEFAULT_MODELS } from "@/app/constant";

async function handle() {
  // @ts-ignore
  let model_list = process.env.MODEL_LIST.split(",").map((v) => {
    return {
      name: DEFAULT_MODELS,
      available: true,
    };
  });
  return NextResponse.json({ model_list });
}

export const GET = handle;
