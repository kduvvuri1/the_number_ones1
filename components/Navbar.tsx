import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from './MobileNav'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import '../app/globals.css';

const Navbar = () => {
  return (
    <nav className='flex items-center fixed z-50 w-full bg-[#1E1E1E]/40 backdrop-blur-md px-6 py-4 lg:px-10 border-b border-white hover:border-cyan-400/30 transition-all duration-300 shadow-[0_0_45px_-3px_rgba(34,211,238,0.3)] hover:shadow-[0_0_45px_-3px_rgba(34,211,238,0.5)] rounded-b-lg'>
      {/* Centered Logo - absolute positioning */}
      <div className='absolute left-1/2 transform -translate-x-1/2'>
        <Link href='/' className='flex items-center gap-1 group'>
          <Image
            src='/icons/newlogo.png'
            width={70}
            height={70}
            alt='brAInstorm logo'
            className='max-sm:size-10 transition-transform duration-200 group-hover:scale-110'
          />
          <p className='text-[26px] font-extrabold font-sans text-white max-sm:hidden transition-transform duration-200 group-hover:scale-105'>
            <span>br</span>
            <span className='text-cyan-400'>.AI.</span>
            <span>nstorm</span>
          </p>
        </Link>
      </div>
      
      {/* Right-aligned controls - pushed completely to the right */}
      <div className='ml-auto flex items-center gap-5'>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <MobileNav />
      </div>
    </nav>
  )
}

export default Navbar