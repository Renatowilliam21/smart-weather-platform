import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PasswordInput from '@/Components/PasswordInput';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Excluir Conta
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Depois que sua conta for excluída, todos os seus recursos e dados
                    serão permanentemente apagados. Antes de excluir sua conta,
                    baixe qualquer dado ou informação que você deseje
                    manter.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Excluir Conta
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Tem certeza de que deseja excluir sua conta?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Depois que sua conta for excluída, todos os seus recursos e
                        dados serão permanentemente apagados. Digite sua
                        senha para confirmar que deseja excluir permanentemente
                        sua conta.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Senha"
                            className="sr-only"
                        />

                        <PasswordInput
                            id="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            wrapperClassName="mt-1 w-3/4"
                            className="block w-full"
                            isFocused
                            placeholder="Senha"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Excluir Conta
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
