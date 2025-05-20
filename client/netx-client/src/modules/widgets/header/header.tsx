import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-background">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
    <div className="flex flex-1 items-center justify-start">
        <Link href="/" className="flex items-center text-neutral-700">
        <svg className="fill-current" width="200" height="29" viewBox="0 0 219 31" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.0948 30.4029H12.2304V3.012H0.84933V0.676339H27.4758V3.012H16.0948V30.4029ZM35.1195 0.676339H38.9839V30.4029H35.1195V0.676339ZM53.7679 0.676339L67.3996 26.1987H67.5695L81.3287 0.676339H84.2589V30.4029H80.3944V6.32438H80.2245L66.8051 30.9125H66.0407L52.9186 6.15452H52.7487V30.4029H50.8802V0.676339H53.7679ZM94.4664 0.676339H113.661V3.012H98.3309V13.6711H111.495V15.6245H98.3309V28.0672H113.661V30.4029H94.4664V0.676339ZM120.013 30.4029V0.676339H123.877V28.0672H139.208V30.4029H120.013ZM147.258 0.676339H151.122V30.4029H147.258V0.676339ZM186.969 0.676339H188.923V30.9125H188.711L165.142 7.68331H164.972V30.4029H163.018V0.166742H163.231L186.8 23.3959H186.969V0.676339ZM199.098 0.676339H218.293V3.012H202.963V13.6711H216.127V15.6245H202.963V28.0672H218.293V30.4029H199.098V0.676339Z"/>
        </svg>
        </Link>
      </div>  
      <div>
        <Link href="/auth/login" className={buttonVariants({variant: "outline", size: "default"})}>Войти</Link>
      </div>
    </div>
    </header>
  );
}