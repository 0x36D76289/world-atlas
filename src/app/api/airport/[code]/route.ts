import { FlightRadar24API } from "flightradarapi"
import { type NextRequest, NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const code = searchParams.get("code")
    const limit = Number(searchParams.get("limit") || 100)
    const page = Number(searchParams.get("page") || 1)

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 })
    }

    const data = await fr.getAirportDetails(code, limit, page)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching airport details:", error)
    return NextResponse.json(
      { error: "Failed to fetch airport details" },
      { status: 500 },
    )
  }
}
