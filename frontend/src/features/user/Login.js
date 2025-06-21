import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LandingIntro from './LandingIntro';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';

function Login() {
    const INITIAL_LOGIN_OBJ = {
        password: "",
        emailId: ""
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (loginObj.emailId.trim() === "") return setErrorMessage("L'identifiant email est requis !");
        if (loginObj.password.trim() === "") return setErrorMessage("Le mot de passe est requis !");

        setLoading(true);
        const loginUrl = `${API_URL}/auth/login`;
        console.log('Tentative de connexion à :', loginUrl, 'avec les données :', {
            email: loginObj.emailId,
            password: loginObj.password
        });
        try {
            const response = await axios.post(loginUrl, {
                email: loginObj.emailId,
                password: loginObj.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Réponse de connexion :', response.data);
            const { token } = response.data;
            if (token) {
                localStorage.setItem("token", token);
                console.log('Jeton stocké dans localStorage :', token);
                setLoading(false);
                navigate('/app/welcome');
            } else {
                setErrorMessage("Échec de la connexion : Aucun jeton reçu");
                setLoading(false);
            }
        } catch (error) {
            console.error('Erreur de connexion :', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            const message = error.message.includes('Network Error')
                ? "Erreur CORS : Le backend bloque cette requête. Vérifiez les paramètres CORS du serveur."
                : error.response?.status === 404
                    ? "Point de connexion introuvable. Veuillez vérifier le serveur backend."
                    : error.response?.data?.message || `Échec de la connexion : ${error.message}`;
            setErrorMessage(message);
            setLoading(false);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage("");
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="card mx-auto w-full max-w-5xl shadow-xl">
                <div className="grid md:grid-cols-2 grid-cols-1 bg-base-100 rounded-xl">
                    <div className=''>
                        <LandingIntro />
                    </div>
                    <div className='py-24 px-10'>
                        <h2 className='text-2xl font-semibold mb-2 text-center'>Connexion</h2>
                        <form onSubmit={(e) => submitForm(e)}>
                            <div className="mb-4">
                                <InputText
                                    type="emailId"
                                    defaultValue={loginObj.emailId}
                                    updateType="emailId"
                                    containerStyle="mt-4"
                                    labelTitle="Adresse Email"
                                    updateFormValue={updateFormValue}
                                />
                                <InputText
                                    defaultValue={loginObj.password}
                                    type="password"
                                    updateType="password"
                                    containerStyle="mt-4"
                                    labelTitle="Mot de Passe"
                                    updateFormValue={updateFormValue}
                                />
                            </div>
                            <div className='text-right text-primary'>
                                <Link to="/forgot-password">
                                    <span className="text-sm inline-block hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
                                        Mot de passe oublié ?
                                    </span>
                                </Link>
                            </div>
                            <ErrorText styleClass="mt-8">{errorMessage}</ErrorText>
                            <button
                                type="submit"
                                className={"btn mt-2 w-full btn-primary" + (loading ? " loading" : "")}
                            >
                                Connexion
                            </button>
                            <div className='text-center mt-4'>
                                Vous n'avez pas encore de compte ?{' '}
                                <Link to="/register">
                                    <span className="inline-block hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
                                        S'inscrire
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

export default Login;