// @flow
import React from 'react';
import { Link } from 'react-router';
import { Modal, Button } from 'react-bootstrap';

type Props = {
  showModal?: boolean
};

type ButtonProps = {
  label: string,
  link: string,
  internalLink: ?string
};

type State = {
  content: ?string,
  showModal: boolean,
  title: ?string,
  body: ?string,
  footer: ?string,
  footerTxt: ?string,
  button: ?ButtonProps,
  bsSize: ?string,
  modalClass: ?string,
  withClosingCross: boolean,
  backdrop: boolean | string
};

class AssemblModal extends React.Component<Props, State> {
  state = {
    content: null,
    showModal: false,
    title: null,
    body: null,
    footer: null,
    footerTxt: null,
    button: null,
    bsSize: null,
    modalClass: null,
    withClosingCross: true,
    backdrop: true
  };

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      showModal: nextProps.showModal
    });
  }

  url: string = '';

  close = () => {
    this.setState({
      showModal: false
    });
  };

  open = () => {
    this.setState({
      showModal: true
    });
  };

  goToUrl = (url: string) => {
    this.url = url;
    window.location = this.url;
  };

  render() {
    const { content, title, body, footer, footerTxt, button, bsSize, modalClass, withClosingCross, backdrop } = this.state;
    if (content) {
      return (
        <Modal show={this.state.showModal} onHide={this.close} className={modalClass}>
          {content}
        </Modal>
      );
    }

    return (
      <Modal bsSize={bsSize || null} show={this.state.showModal} backdrop={backdrop} onHide={this.close}>
        <Modal.Header closeButton={withClosingCross}>{title && <Modal.Title>{title}</Modal.Title>}</Modal.Header>
        {body && (
          <Modal.Body>
            <div>{body}</div>
          </Modal.Body>
        )}
        {footer && (
          <Modal.Footer>
            {footerTxt && footerTxt}
            {button && (
              <div>
                {button.internalLink ? (
                  <Link to={button.link} className="button-link button-dark">
                    {button.label}
                  </Link>
                ) : (
                  <Button
                    onClick={() => {
                      this.goToUrl(button.link);
                    }}
                    className="button-submit button-dark"
                  >
                    {button.label}
                  </Button>
                )}
              </div>
            )}
          </Modal.Footer>
        )}
      </Modal>
    );
  }
}

export default AssemblModal;