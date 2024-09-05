const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 1000,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};