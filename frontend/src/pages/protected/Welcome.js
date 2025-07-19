import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle, showNotification } from '../../features/common/headerSlice';
import WelcomeHeader from './components/WelcomeHeader';
import WelcomeFeatures from './components/WelcomeFeatures';
import WelcomeFooter from './components/WelcomeFooter';

function Welcome() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Bienvenue' }));
  }, [dispatch]);

  const handleStartNow = () => {
    dispatch(
      showNotification({
        message: 'Navigation vers Téléversement Fichiers',
        status: 1,
      })
    );
    
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-grow">
        <WelcomeHeader onStartNow={handleStartNow} />
        <WelcomeFeatures />
      </div>
      <WelcomeFooter />
    </div>
  );
}

export default Welcome;
