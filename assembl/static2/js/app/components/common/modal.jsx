import React from 'react';
import { Link } from 'react-router';
import { Modal } from 'react-bootstrap';

class AssemblModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
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
  render() {
    const { title, body, footer, link } = this.props;
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          {title &&
            <Modal.Title>{ title }</Modal.Title>
          }
        </Modal.Header>
        {body &&
          <Modal.Body>
            <div>{ body }</div>
          </Modal.Body>
        }
        {footer &&
          <Modal.Footer>
            <Link to={link} className="button-link button-dark">{ footer }</Link>
          </Modal.Footer>
        }
      </Modal>
    );
  }
}

export default AssemblModal;