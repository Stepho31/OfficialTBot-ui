"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Education",
    href: "/education",
    icon: GraduationCap,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: '256px',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      padding: '24px',
      minHeight: '100vh'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                textDecoration: 'none',
                ...(isActive
                  ? {
                      background: 'linear-gradient(180deg, #6ea0ff, #4c78ff)',
                      color: 'white',
                    }
                  : {
                      color: 'var(--muted)',
                      background: 'transparent',
                    }),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--muted)'
                }
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

