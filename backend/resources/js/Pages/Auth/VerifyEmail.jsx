import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verificação de e-mail" />

            <div className="mb-4 text-sm text-gray-600">
                Obrigado por se cadastrar! Antes de começar, você pode
                verificar seu e-mail clicando no link que acabamos de
                enviar? Se você não recebeu o e-mail, teremos prazer em
                enviar outro.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    Um novo link de verificação foi enviado para o e-mail
                    informado no cadastro.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Reenviar e-mail de verificação
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                        Sair
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
