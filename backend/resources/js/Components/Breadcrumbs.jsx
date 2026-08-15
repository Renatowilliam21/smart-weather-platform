import { Link } from '@inertiajs/react';

export default function Breadcrumbs({ items = [] }) {
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
            <Link href={route('dashboard')} className="hover:text-gray-700">
                Início
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
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
