import { FlightRadar24API } from "flightradarapi"
import { NextResponse } from "next/server"

const fr = new FlightRadar24API()

export async function GET() {
  try {
    const zones = await fr.getZones()

    return NextResponse.json(zones)
  } catch (error) {
    console.error("Error fetching zones:", error)
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 },
    )
  }
}
