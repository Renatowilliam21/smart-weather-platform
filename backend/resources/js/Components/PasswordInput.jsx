import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default forwardRef(function PasswordInput(
    { className = '', wrapperClassName = '', isFocused = false, ...props },
    ref,
) {
    const [visivel, setVisivel] = useState(false);
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <div className={`relative ${wrapperClassName}`}>
            <input
                {...props}
                type={visivel ? 'text' : 'password'}
                className={
                    'rounded-md border-gray-300 pe-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                    className
                }
                ref={localRef}
            />
            <button
                type="button"
                onClick={() => setVisivel((atual) => !atual)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
                aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
                title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            >
                {visivel ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                )}
            </button>
        </div>
    );
});
