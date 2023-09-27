import { NextResponse } from "next/server";

async function handle() {
  // @ts-ignore
  let model_list = process.env.MODEL_LIST.split(",").map((v) => {
    return {
      name: v,
      available: true,
    };
  });
  return NextResponse.json({ model_list });
}

export const GET = handle;
