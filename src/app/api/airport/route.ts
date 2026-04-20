import { FlightRadar24API } from "flightradarapi"
import { type NextRequest, NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const code = searchParams.get("code")
    const details = searchParams.get("details") === "true"

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 })
    }

    const airport = await fr.getAirport(code, details)

    return NextResponse.json(airport)
  } catch (error) {
    console.error("Error fetching airport:", error)
    return NextResponse.json(
      { error: "Failed to fetch airport" },
      { status: 500 },
    )
  }
}
