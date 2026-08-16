import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // گرفتن Public IP سیستم
    const ipResponse = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });

    const { ip } = await ipResponse.json();

    console.log("Public IP:", ip);

    // گرفتن Location بر اساس Public IP
    const locationResponse = await fetch(`https://ipwho.is/${ip}`, {
      cache: "no-store",
    });

    const data = await locationResponse.json();

    if (!data.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات موقعیت برای IP پیدا نشد",
          ip,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ip: data.ip,
        country: data.country,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.connection?.isp,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "خطای داخلی سرور",
      },
      { status: 500 }
    );
  }
}