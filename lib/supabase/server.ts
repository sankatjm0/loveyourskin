// lib/supabase/server.ts (ĐÃ SỬA)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { GetServerSidePropsContext } from 'next' // Import type từ next

// Bạn cần truyền context (req, res) vào hàm này
export function createClient(context: GetServerSidePropsContext) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Đọc cookie từ request (req)
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          // Ghi cookie vào response (res)
          context.res.setHeader('Set-Cookie', [
            (context.res.getHeader('Set-Cookie') as string) ?? '',
            `${name}=${value}; Path=/; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`,
          ])
        },
        remove(name: string, options: CookieOptions) {
          // Xóa cookie bằng cách thiết lập Max-Age=0
          context.res.setHeader('Set-Cookie', [
            (context.res.getHeader('Set-Cookie') as string) ?? '',
            `${name}=; Max-Age=0; Path=/; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`,
          ])
        },
      },
    }
  )
}