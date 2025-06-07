import { useEffect } from 'react';

function SplashScreen({ onComplete }) {
  console.log('SplashScreen rendering');

  useEffect(() => {
    console.log('Setting up splash screen timer');
    const timer = setTimeout(() => {
      console.log('Splash screen timer completed');
      onComplete();
    }, 3000);

    return () => {
      console.log('Cleaning up splash screen timer');
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
}

export default SplashScreen;
