// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';

type Props = {
  close: (SyntheticEvent<HTMLButtonElement>) => void,
  store: any
};

class Modal extends React.Component<Props> {
  componentWillMount() {
    this.props.store.subscribeToItem('content', () => this.forceUpdate());
  }

  componentWillUnmount() {
    this.props.store.unsubscribeFromItem('content', () => this.forceUpdate());
  }

  render() {
    const { close, store } = this.props;
    const content = store.getItem('content');
    if (content) {
      const { body, title } = content;
      return (
        <div>
          <div className="modal-backdrop fade in" />
          <div className="insertion-box box">
            <div className="modal-header">
              <button title={I18n.t('common.editor.closeModal')} onClick={close} className="close">
                <span className="assembl-icon-cancel" />
              </button>
              <h4 className="modal-title">{title}</h4>
            </div>
            <div className="modal-body">{body}</div>
          </div>
        </div>
      );
    }

    return null;
  }
}

export default Modal;