import React from 'react';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { connect } from 'react-redux';
import lodashGet from 'lodash/get';

class DumbChatFrame extends React.Component {
  static Modal = ({ src }) => {
    return (
      <div className="chatframe-modal">
        <div className="chatframe-modal-header">
          <span className="chatframe-icon chatframe-modal-icon assembl-icon-robot" />
          <Translate value="chatframe.title" />
        </div>
        <iframe className="chatframe-modal-iframe" title="chatframe" src={src} />
      </div>
    );
  };
  static Button = ({ isOpen, toggle }) => {
    return isOpen ? (
      <div onClick={toggle} className="chatframe-icon chatframe-button assembl-icon-cancel" />
    ) : (
      <OverlayTrigger
        placement="left"
        overlay={
          <Tooltip id="chatframe-tooltip">
            <Translate value="chatframe.tooltip" />
          </Tooltip>
        }
      >
        <div onClick={toggle} className="chatframe-icon chatframe-button assembl-icon-robot" />
      </OverlayTrigger>
    );
  };
  toggle = () => {
    return this.setState(({ isOpen }) => {
      return { isOpen: !isOpen };
    });
  };
  render = () => {
    const { src } = this.props;
    if (!src) return null;
    const isOpen = lodashGet(this, 'state.isOpen');
    const { Modal, Button } = DumbChatFrame;
    return (
      <div className="chatframe">
        {isOpen && <Modal src={src} />}
        <Button isOpen={isOpen} toggle={this.toggle} />
      </div>
    );
  };
}

const ChatFrame = connect((state) => {
  return {
    src: lodashGet(state, 'debate.debateData.chatframe.src')
  };
})(DumbChatFrame);

export default ChatFrame;