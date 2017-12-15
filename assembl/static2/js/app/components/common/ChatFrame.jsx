import React from 'react';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { connect } from 'react-redux';
import lodashGet from 'lodash/get';

const ChatFrameModal = ({ src }) => (
  <div className="chatframe-modal">
    <div className="chatframe-modal-header">
      <span className="chatframe-icon chatframe-modal-icon assembl-icon-robot" />
      <Translate value="chatframe.title" />
    </div>
    <iframe className="chatframe-modal-iframe" title="chatframe" src={src} />
  </div>
);

const ChatFrameButton = ({ isOpen, toggle }) =>
  (isOpen ? (
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
  ));

class DumbChatFrame extends React.Component {
  toggle = () => this.setState(({ isOpen }) => ({ isOpen: !isOpen }));

  render = () => {
    const { src } = this.props;
    if (!src) return null;
    const isOpen = lodashGet(this, 'state.isOpen');
    return (
      <div className={`chatframe ${isOpen ? 'open' : ''}`}>
        {isOpen && <ChatFrameModal src={src} />}
        <ChatFrameButton isOpen={isOpen} toggle={this.toggle} />
      </div>
    );
  };
}

const ChatFrame = connect(state => ({
  src: lodashGet(state, 'debate.debateData.chatframe.src')
}))(DumbChatFrame);

export default ChatFrame;