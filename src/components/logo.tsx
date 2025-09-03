import Image from 'next/image'

export function Logo() {
    return (
        <div className="flex items-center">
            <Image
                src="/salesMattertm (1).png"
                alt="SalesMatter Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
            />
        </div>
    )
}
