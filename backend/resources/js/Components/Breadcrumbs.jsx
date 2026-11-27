import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2 flex-wrap" aria-label="Breadcrumb">
            <Link href={route('dashboard')} className="hover:text-gray-700">
                Início
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-gray-700">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-700 font-medium">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
