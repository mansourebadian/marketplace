import { NextRequest, NextResponse } from "next/server";

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim() || null;
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const isPublicIp =
      clientIp &&
      !/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fe80:)/.test(
        clientIp
      );
    const lookupIp = isPublicIp ? clientIp : "";
    const endpoint = lookupIp
      ? `https://ipwho.is/${lookupIp}`
      : "https://ipwho.is/";

    // گرفتن Location بر اساس IP کاربر
    const locationResponse = await fetch(endpoint, {
      cache: "no-store",
    });

    const data = await locationResponse.json();

    if (!data.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات موقعیت برای IP پیدا نشد",
          ip: data.ip ?? clientIp,
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
        callingCode: data.calling_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.connection?.isp,
        flag: data.flag?.img ?? null,
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
