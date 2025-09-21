import Image from 'next/image'

import { cn } from '@/lib/utils'

type LogoProps = {
    className?: string
    priority?: boolean
}

export function Logo({ className, priority = false }: LogoProps) {
    return (
        <div className="flex items-center">
            <Image
                src="/salesMattertm (NoBG).svg"
                alt="SalesMatter Logo"
                width={200}
                height={60}
                priority={priority}
                className={cn('h-10 w-auto', className)}
            />
        </div>
    )
}
