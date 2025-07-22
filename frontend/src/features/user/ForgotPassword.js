import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingIntro from './LandingIntro';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import axios from 'axios';

function ForgotPassword() {
    const INITIAL_USER_OBJ = {
        emailId: '',
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [linkSent, setLinkSent] = useState(false);
    const [userObj, setUserObj] = useState(INITIAL_USER_OBJ);

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        console.log('Envoi de l\'email:', userObj.emailId);

        if (userObj.emailId.trim() === '') {
            return setErrorMessage('L\'email est requis !');
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
                email: userObj.emailId,
            });
            console.log('Réponse mot de passe oublié:', response.data);
            setLoading(false);
            setLinkSent(true);
        } catch (error) {
            console.error('Erreur mot de passe oublié:', error.response?.data || error.message);
            setLoading(false);
            setErrorMessage(error.response?.data?.message || 'Échec de l\'envoi du lien de réinitialisation');
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setUserObj({ ...userObj, [updateType]: value });
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="card mx-auto w-full max-w-5xl shadow-xl">
                <div className="grid md:grid-cols-2 grid-cols-1 bg-base-100 rounded-xl">
                    <div>
                        <LandingIntro />
                    </div>
                    <div className="py-24 px-10">
                        <h2 className="text-2xl font-semibold mb-2 text-center">Mot de passe oublié</h2>

                        {linkSent && (
                            <>
                                <div className="text-center mt-8">
                                    <CheckCircleIcon className="inline-block w-32 text-success" />
                                </div>
                                <p className="my-4 text-xl font-bold text-center">Lien envoyé</p>
                                <p className="mt-4 mb-8 font-semibold text-center">
                                    Vérifiez votre boîte de réception pour réinitialiser votre mot de passe
                                </p>
                                <div className="text-center mt-4">
                                    <Link to="/connexion">
                                        <button className="btn btn-block btn-primary">Connexion</button>
                                    </Link>
                                </div>
                            </>
                        )}

                        {!linkSent && (
                            <>
                                <p className="my-8 font-semibold text-center">
                                    Nous vous enverrons un lien de réinitialisation de mot de passe par email
                                </p>
                                <form onSubmit={submitForm}>
                                    <div className="mb-4">
                                        <InputText
                                            type="email"
                                            defaultValue={userObj.emailId}
                                            updateType="emailId"
                                            containerStyle="mt-4"
                                            labelTitle="Email"
                                            updateFormValue={updateFormValue}
                                        />
                                    </div>

                                    <ErrorText styleClass="mt-12">{errorMessage}</ErrorText>
                                    <button
                                        type="submit"
                                        className={'btn mt-2 w-full btn-primary' + (loading ? ' loading' : '')}
                                        disabled={loading}
                                    >
                                        Envoyer le lien de réinitialisation
                                    </button>

                                    <div className="text-center mt-4">
                                        Vous n'avez pas encore de compte ?{' '}
                                        <Link to="/inscription">
                                            <button className="inline-block hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
                                                S'inscrire
                                            </button>
                                        </Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;