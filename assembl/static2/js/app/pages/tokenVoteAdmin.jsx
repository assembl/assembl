// @flow
import React from 'react';
import { connect } from 'react-redux';
import PageForm from '../components/administration/tokenVote/pageForm';
import ModulesSection from '../components/administration/tokenVote/modulesSection';
import ProposalsSection from '../components/administration/tokenVote/proposalsSection';
import Navbar from '../components/administration/navbar';

type TokenVoteAdminProps = {
  section: string,
  selectedLocale: string
};

const TokenVoteAdmin = (props: TokenVoteAdminProps) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="token-vote-admin">
      {props.section === '1' && <PageForm selectedLocale={props.selectedLocale} />}
      {props.section === '2' && <ModulesSection />}
      {props.section === '3' && <ProposalsSection />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="tokenVote" />}
    </div>
  );
};

const mapStateToProps = state => ({
  selectedLocale: state.admin.selectedLocale
});

export default connect(mapStateToProps)(TokenVoteAdmin);