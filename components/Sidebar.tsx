'use client'

import React, { useState } from 'react'
import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const Sidebar = ({ onToggle }: { onToggle: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle(newState)
  }

  return (
    <section
      className={cn(
        'relative flex h-screen flex-col justify-between bg-[#1E1E1E]/40 backdrop-blur-md p-6 pt-28 text-white max-sm:hidden ease-in-out border-white hover:border-cyan-400/30 transition-all duration-300 shadow-[0_0_45px_-3px_rgba(34,211,238,0.3)] hover:shadow-[0_0_45px_-3px_rgba(34,211,238,0.5)]',
        {
          'w-[264px]': isOpen,
          'w-[120px]': !isOpen
        }
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute bottom-6 p-2 rounded-full bg-[#1E1E1E]/80 hover:bg-[#1E1E1E] text-white shadow-md transition-all ring-2 ring-white",
          {
            "-right-4": isOpen,
            "-right-1": !isOpen,
          }
        )}
        aria-label="Toggle Sidebar"
      >
        <Image
          src="/icons/close.png"
          width={20}
          height={20}
          alt="Toggle Sidebar"
          className={cn(
            'transition-transform duration-300 origin-center',
            { 'rotate-180': !isOpen }
          )}
        />
      </button>

      {/* Links */}
      <div className="flex flex-col gap-6 relative z-10">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.route || pathname.startsWith(`${link.route}/`)
          return (
            <Link
              href={link.route}
              key={link.label}
              className={cn(
                'flex items-center p-4 rounded-lg transition-all duration-300 min-w-[48px]',
                {
                  'bg-[#F8F8F8]': isActive,
                  'gap-4': isOpen,
                  'justify-center': !isOpen
                }
              )}
            >
              <Image
                src={link.imgUrl}
                alt={link.label}
                width={24}
                height={24}
                className={cn(
                  'transition-all duration-300',
                  { 'invert-[.35] brightness-0': isActive }
                )}
              />
              {isOpen && (
                <p
                  className={cn(
                    'text-lg font-semibold transition-all duration-300',
                    {
                      'text-cyan-600': isActive,
                      'text-white': !isActive
                    }
                  )}
                >
                  {link.label}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default Sidebar