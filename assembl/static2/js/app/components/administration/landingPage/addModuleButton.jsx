// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { displayModal, closeModal } from '../../../utils/utilityManager';

type Props = {
  createModule: Function,
  numberOfDuplicatesModules: number,
  numberOfEnabledModules: number,
  buttonTitleTranslationKey: string
};

const AddModuleButton = ({
  createModule,
  numberOfDuplicatesModules,
  numberOfEnabledModules,
  buttonTitleTranslationKey
}: Props) => {
  const displayConfirmationModal = () => {
    const body = <Translate value="administration.landingPage.manageModules.confirmationModal" />;
    const footer = [
      <Button key="cancel" id="cancel-deleting-button" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="cancel" />
      </Button>,
      <Button
        key="add"
        id="confirm-add-tm-button"
        onClick={() => {
          createModule(numberOfEnabledModules - 2, numberOfDuplicatesModules + 1);
          closeModal();
        }}
        className="button-submit button-dark"
      >
        <Translate value="validate" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(null, body, includeFooter, footer);
  };
  return (
    <Button className="button-submit button-dark" onClick={displayConfirmationModal} disabled={false}>
      <Translate value={`administration.landingPage.manageModules.${buttonTitleTranslationKey}`} />
    </Button>
  );
};

export default AddModuleButton;