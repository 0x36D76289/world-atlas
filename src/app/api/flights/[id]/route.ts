import { Flight, FlightRadar24API } from "flightradarapi"
import { type NextRequest, NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing flight id" }, { status: 400 })
    }

    const flight = new Flight(id, {})
    const details = await fr.getFlightDetails(flight)

    return NextResponse.json(details)
  } catch (error) {
    console.error("Error fetching flight details:", error)
    return NextResponse.json(
      { error: "Failed to fetch flight details" },
      { status: 500 },
    )
  }
}
