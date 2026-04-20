import { FlightRadar24API } from "flightradarapi"
import { NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET() {
  try {
    const airlines = await fr.getAirlines()
    return NextResponse.json(airlines)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch airlines" },
      { status: 500 },
    )
  }
}
