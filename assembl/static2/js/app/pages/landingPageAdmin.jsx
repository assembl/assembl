import React from 'react';

import ManageModules from '../components/administration/landingPage/manageModules';
import Navbar from '../components/administration/navbar';

const LandingPageAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="landing-page-admin">
      {props.section === '1' && <ManageModules {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="landingPage" />}
    </div>
  );
};

export default LandingPageAdmin;