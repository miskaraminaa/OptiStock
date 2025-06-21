import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingIntro from './LandingIntro';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import axios from 'axios';

function Register() {
    const INITIAL_REGISTER_OBJ = {
        name: '',
        password: '',
        emailId: ''
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (registerObj.name.trim() === '') return setErrorMessage('Le nom est requis !');
        if (registerObj.emailId.trim() === '') return setErrorMessage('L\'identifiant email est requis !');
        if (registerObj.password.trim() === '') return setErrorMessage('Le mot de passe est requis !');

        setLoading(true);
        try {
            await axios.post('http://localhost:5000/auth/register', {
                name: registerObj.name,
                email: registerObj.emailId,
                password: registerObj.password
            });
            setLoading(false);
            window.location.href = '/login';
        } catch (error) {
            setLoading(false);
            setErrorMessage(error.response?.data?.message || 'Échec de l\'inscription ! Veuillez réessayer.');
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setRegisterObj({ ...registerObj, [updateType]: value });
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="card mx-auto w-full max-w-5xl shadow-xl">
                <div className="grid md:grid-cols-2 grid-cols-1 bg-base-100 rounded-xl">
                    <div>
                        <LandingIntro />
                    </div>
                    <div className='py-24 px-10'>
                        <h2 className='text-2xl font-semibold mb-2 text-center'>Inscription</h2>
                        <form onSubmit={submitForm}>
                            <div className="mb-4">
                                <InputText
                                    defaultValue={registerObj.name}
                                    updateType="name"
                                    containerStyle="mt-4"
                                    labelTitle="Nom"
                                    updateFormValue={updateFormValue}
                                />
                                <InputText
                                    type="email"
                                    defaultValue={registerObj.emailId}
                                    updateType="emailId"
                                    containerStyle="mt-4"
                                    labelTitle="Adresse Email"
                                    updateFormValue={updateFormValue}
                                />
                                <InputText
                                    defaultValue={registerObj.password}
                                    type="password"
                                    updateType="password"
                                    containerStyle="mt-4"
                                    labelTitle="Mot de Passe"
                                    updateFormValue={updateFormValue}
                                />
                            </div>
                            <ErrorText styleClass="mt-8">{errorMessage}</ErrorText>
                            <button
                                type="submit"
                                className={'btn mt-2 w-full btn-primary' + (loading ? ' loading' : '')}
                            >
                                S'inscrire
                            </button>
                            <div className='text-center mt-4'>
                                Vous avez déjà un compte ?{' '}
                                <Link to="/login">
                                    <span className="inline-block hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
                                        Connexion
                                    </span>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;