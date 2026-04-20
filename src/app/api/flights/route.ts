import { FlightRadar24API } from "flightradarapi"
import { type NextRequest, NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const airline = searchParams.get("airline")
    const bounds = searchParams.get("bounds")
    const registration = searchParams.get("registration")
    const aircraftType = searchParams.get("aircraftType")
    const details = searchParams.get("details") === "true"

    const flights = await fr.getFlights(
      airline,
      bounds,
      registration,
      aircraftType,
      details,
    )

    return NextResponse.json(flights)
  } catch (error) {
    console.error("Error fetching flights:", error)
    return NextResponse.json(
      { error: "Failed to fetch flights" },
      { status: 500 },
    )
  }
}
