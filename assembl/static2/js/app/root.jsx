import React from 'react';
import Alert from './components/common/alert';
import AlertManager from './utils/alert';
import Modal from './components/common/modal';
import ModalManager from './utils/modal';
/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
export default ({ children }) => {
  return (
    <div>
      <Modal ref={(modalComponent) => { ModalManager.setComponent(modalComponent); }} />
      <Alert isBase ref={(alertComponent) => { AlertManager.setComponent(alertComponent); }} />
      <div className="root-child">{children}</div>
    </div>
  );
};