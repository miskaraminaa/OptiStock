import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle, showNotification } from '../../features/common/headerSlice';
import WelcomeHeader from './components/WelcomeHeader';
import WelcomeFeatures from './components/WelcomeFeatures';
import WelcomeFooter from './components/WelcomeFooter';

function Welcome() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Welcome' }));
  }, [dispatch]);

  const handleStartNow = () => {
    dispatch(
      showNotification({
        message: 'Navigating to Dashboard',
        status: 1,
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-base-100 flex flex-col">
      <WelcomeHeader onStartNow={handleStartNow} />
      <WelcomeFeatures />
      <WelcomeFooter />
    </div>
  );
}

export default Welcome;