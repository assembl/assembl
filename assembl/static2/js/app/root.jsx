import React from 'react';
import Modal from './components/common/modal';
import Alert from './components/common/alert';
import { modalManager, alertManager } from './utils/utilityManager';
/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
export default ({ children }) => (
  <div>
    <Modal
      ref={(modalComponent) => {
        modalManager.setComponent(modalComponent);
      }}
    />
    <Alert
      isBase
      ref={(alertComponent) => {
        alertManager.setComponent(alertComponent);
      }}
    />
    <div className="root-child">{children}</div>
  </div>
);