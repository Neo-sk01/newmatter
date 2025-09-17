import Image from 'next/image'

export function Logo() {
    return (
        <div className="flex items-center">
            <Image
                src="/salesMattertm noBG, SVG.svg"
                alt="Sales Matter Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
            />
        </div>
    )
}
