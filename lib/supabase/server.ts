// lib/supabase/server.ts (Sửa thêm kiểm tra an toàn)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { GetServerSidePropsContext } from 'next'

export function createClient(context: GetServerSidePropsContext) {
  // Lấy req và res từ context, có thể là undefined trong quá trình build
  const req = context.req;
  const res = context.res;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Kiểm tra xem req có tồn tại không trước khi đọc cookies
          if (req && req.cookies) {
             return req.cookies[name];
          }
          return undefined; // Trả về undefined nếu không có request (trong lúc build)
        },
        set(name: string, value: string, options: CookieOptions) {
          // Kiểm tra xem res có tồn tại không
          if (res) {
            // Logic set cookie của bạn
            res.setHeader('Set-Cookie', [
              (res.getHeader('Set-Cookie') as string) ?? '',
              `${name}=${value}; Path=/; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`,
            ]);
          }
        },
        remove(name: string, options: CookieOptions) {
          // Kiểm tra xem res có tồn tại không
          if (res) {
            // Logic remove cookie của bạn
            res.setHeader('Set-Cookie', [
              (res.getHeader('Set-Cookie') as string) ?? '',
              `${name}=; Max-Age=0; Path=/; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`,
            ]);
          }
        },
      },
    }
  );
}