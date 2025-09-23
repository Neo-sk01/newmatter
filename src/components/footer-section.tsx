import { Logo } from '@/components/logo'
import Link from 'next/link'

const links = [
    {
        title: 'Features',
        href: '#',
    },
    {
        title: 'Solution',
        href: '#',
    },
    {
        title: 'Customers',
        href: '#',
    },
    {
        title: 'Pricing',
        href: '#',
    },
    {
        title: 'Help',
        href: '#',
    },
    {
        title: 'About',
        href: '#',
    },
]

export default function FooterSection() {
    return (
        <div className="border-t border-border bg-muted/30">
            <div className="mx-auto flex h-16 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 text-xs md:text-sm">
                <Link href="/" aria-label="go home" className="flex items-center gap-2">
                    <Logo className="h-7" />
                    <span className="text-muted-foreground">© {new Date().getFullYear()} Tailark</span>
                </Link>
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-muted-foreground">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="hover:text-primary transition-colors"
                        >
                            {link.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
