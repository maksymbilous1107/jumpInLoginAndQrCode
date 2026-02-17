import { NextRequest, NextResponse } from "next/server";
import { updateCheckinTimestamp } from "@/lib/google-sheets";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { uid, timestamp } = body;

    if (!uid || !timestamp) {
      return NextResponse.json(
        { error: "UID e timestamp sono obbligatori" },
        { status: 400 }
      );
    }

    await updateCheckinTimestamp(uid, timestamp);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets check-in error:", error);
    return NextResponse.json(
      { error: "Errore nella sincronizzazione del check-in" },
      { status: 500 }
    );
  }
}
