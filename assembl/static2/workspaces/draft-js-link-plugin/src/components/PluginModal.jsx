// @flow
import * as React from 'react';

type Props = {
  children: React.Node,
  close: (SyntheticEvent<HTMLButtonElement>) => void,
  closeLabel: string,
  title: string
};

const PluginModal = ({ children, close, closeLabel, title }: Props) => (
  <div>
    <div className="modal-backdrop fade in" />
    <div className="insertion-box box">
      <div className="modal-header">
        <button title={closeLabel} onClick={close} className="close">
          <span className="assembl-icon-cancel" />
        </button>
        <h4 className="modal-title">{title}</h4>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export default PluginModal;