import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-secondary ring-1 ring-primary/20">
        <SearchX className="size-8 text-primary" />
      </div>
      <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Business Not Found
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground">
        This booking link may be incorrect or the business is no longer available.
      </p>
      <Link
        href="/"
        className={`${buttonVariants({ size: "lg" })} mt-8 h-12 rounded-xl px-8 text-base font-semibold`}
      >
        Back to Home
      </Link>
    </div>
  )
}
