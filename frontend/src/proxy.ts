import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

const JWT_SECRET = new TextEncoder().encode(getEnvVar("JWT_SECRET"));
const JWT_ISSUER = getEnvVar("JWT_ISSUER");
const JWT_AUDIENCE = getEnvVar("JWT_AUDIENCE");

const LOGIN_URL = "/admin/login";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === LOGIN_URL) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_URL, request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    const response = NextResponse.redirect(new URL(LOGIN_URL, request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path+"],
};
