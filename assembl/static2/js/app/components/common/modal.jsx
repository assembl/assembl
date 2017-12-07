import React from 'react';
import { Link } from 'react-router';
import { Modal, Button } from 'react-bootstrap';

class AssemblModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: null,
      showModal: false
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.goToUrl = this.goToUrl.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      showModal: nextProps.showModal
    });
  }

  close() {
    this.setState({
      showModal: false
    });
  }

  open() {
    this.setState({
      showModal: true
    });
  }

  goToUrl(url) {
    this.url = url;
    window.location = this.url;
  }

  render() {
    const { content, title, body, footer, footerTxt, button, bsSize } = this.state;
    if (content) {
      return (
        <Modal show={this.state.showModal} onHide={this.close}>
          {content}
        </Modal>
      );
    }

    return (
      <Modal bsSize={bsSize || null} show={this.state.showModal} onHide={this.close}>
        <Modal.Header closeButton>{title && <Modal.Title>{title}</Modal.Title>}</Modal.Header>
        {body && (
          <Modal.Body>
            <div>{body}</div>
          </Modal.Body>
        )}
        {footer && (
          <Modal.Footer>
            {footerTxt && <div>{footerTxt}</div>}
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