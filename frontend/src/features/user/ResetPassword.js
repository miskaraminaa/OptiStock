import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import LandingIntro from './LandingIntro';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import axios from 'axios';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [formObj, setFormObj] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (formObj.newPassword.trim() === '') {
            return setErrorMessage('New password is required!');
        }
        if (formObj.newPassword !== formObj.confirmPassword) {
            return setErrorMessage('Passwords do not match!');
        }

        console.log('Submitting reset:', { email, token, newPassword: formObj.newPassword });
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email,
                token,
                newPassword: formObj.newPassword,
            });
            console.log('Reset response:', response.data);
            setLoading(false);
            setSuccess(true);
        } catch (error) {
            console.error('Reset error:', error.response?.data || error.message);
            setLoading(false);
            setErrorMessage(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setFormObj({ ...formObj, [updateType]: value });
    };

    useEffect(() => {
        console.log('ResetPassword params:', { email, token });
        if (!email || !token) {
            setErrorMessage('Invalid reset link. Redirecting to login in 5 seconds...');
            setTimeout(() => navigate('/login'), 5000); // Increased to 5s for debugging
        }
    }, [email, token, navigate]);

    return (
        <div className="min-h-screen bg-base-200 flex items-center">
            <div className="card mx-auto w-full max-w-5xl shadow-xl">
                <div className="grid md:grid-cols-2 grid-cols-1 bg-base-100 rounded-xl">
                    <div>
                        <LandingIntro />
                    </div>
                    <div className="py-24 px-10">
                        <h2 className="text-2xl font-semibold mb-2 text-center">Reset Password</h2>

                        {success && (
                            <>
                                <div className="text-center mt-8">
                                    <CheckCircleIcon className="inline-block w-32 text-success" />
                                </div>
                                <p className="my-4 text-xl font-bold text-center">Password Reset</p>
                                <p className="mt-4 mb-8 font-semibold text-center">
                                    Your password has been updated
                                </p>
                                <div className="text-center mt  -4">
                                    <Link to="/login">
                                        <button className="btn btn-block btn-primary">Login</button>
                                    </Link>
                                </div>
                            </>
                        )}

                        {!success && (
                            <>
                                <p className="my-8 font-semibold text-center">
                                    Enter your new password
                                </p>
                                <form onSubmit={submitForm}>
                                    <div className="mb-4">
                                        <InputText
                                            type="password"
                                            defaultValue={formObj.newPassword}
                                            updateType="newPassword"
                                            containerStyle="mt-4"
                                            labelTitle="New Password"
                                            updateFormValue={updateFormValue}
                                        />
                                        <InputText
                                            type="password"
                                            defaultValue={formObj.confirmPassword}
                                            updateType="confirmPassword"
                                            containerStyle="mt-4"
                                            labelTitle="Confirm Password"
                                            updateFormValue={updateFormValue}
                                        />
                                    </div>

                                    <ErrorText styleClass="mt-12">{errorMessage}</ErrorText>
                                    <button
                                        type="submit"
                                        className={'btn mt-2 w-full btn-primary' + (loading ? ' loading' : '')}
                                        disabled={!email || !token || loading}
                                    >
                                        Reset Password
                                    </button>

                                    <div className="text-center mt-4">
                                        Back to{' '}
                                        <Link to="/login">
                                            <button className="inline-block hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
                                                Login
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

export default ResetPassword;