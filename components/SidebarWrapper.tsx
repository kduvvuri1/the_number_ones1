'use client'

import React, { ReactNode, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { cn } from '@/lib/utils'

const SidebarWrapper = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex transition-all duration-300">
      <Sidebar onToggle={setIsSidebarOpen} />

      <section
        className={cn(
          'flex min-h-screen flex-1 flex-col px-6 pb-6 pt-28 max-md:pb-14 sm:px-14 transition-all duration-300',
          {
            // add left padding when sidebar is closed
            'pl-10': !isSidebarOpen,
            'pl-6': isSidebarOpen
          }
        )}
      >
        <div className="w-full max-w-5xl transition-all duration-300 mx-auto">
          {children}
        </div>
      </section>
    </div>
  )
}

export default SidebarWrapper
