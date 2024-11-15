import Image from "next/image";
import { SignIn } from '@clerk/nextjs'
import logo from '../../../../assets/logo_white.png'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 relative text-white">
                <aside className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-500 to-blue-700">
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <Image
            src={logo}
            alt="logo"
            width={100}
            height={100}
          />
          <h1 className="text-4xl font-bold">Welcome to CoMed</h1>
          <p className="text-lg text-center">Making Brain MRI observations easier, faster, and cheaper</p>
        </div>
      </aside>
      <aside className="absolute top-0 right-0 w-1/2 h-full">
      <div className="flex flex-col items-center justify-center h-full space-y-8">
        <SignIn />
        </div>
    </aside>
    </div>
  )
}