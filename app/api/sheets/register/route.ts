import { NextRequest, NextResponse } from "next/server";
import { appendUserRow } from "@/lib/google-sheets";
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
    const { uid, firstName, lastName, email, school, dob } = body;

    if (!uid || !firstName || !lastName || !email || !school || !dob) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    await appendUserRow({ uid, firstName, lastName, email, school, dob });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets register error:", error);
    return NextResponse.json(
      { error: "Errore nella sincronizzazione con Google Sheets" },
      { status: 500 }
    );
  }
}
