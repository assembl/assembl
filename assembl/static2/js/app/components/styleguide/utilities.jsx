import React from 'react';
import { Button } from 'react-bootstrap';
import { displayModal, displayAlert } from '../../utils/utilityManager';

export default class Utilities extends React.Component {
  constructor(props) {
    super(props);
    this.showAlert = this.showAlert.bind(this);
    this.showModal = this.showModal.bind(this);
  }
  showAlert() {
    displayAlert('success', `Une alerte pour dire que tout s'est bien passé !`, true);
  }
  showModal() {
    const title = 'Le titre de la modal est un paramètre';
    const body = 'Le contenu de la modale est en paramètre aussi';
    const footer = true;
    const footerTxt = 'Je peux mettre un footer';
    const button = { internalLink: true, label: 'Link', link:'/styleguide', true };
    displayModal(title, body, footer, footerTxt, button, true);
  }
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="utilities" style={{ borderBottom: "1px solid #ccc"}}>UTILITIES</h2>
        <section>
          <Button onClick={this.showAlert} className="button-submit button-dark">Show Alert</Button>
          <br />
          <br />
          <Button onClick={this.showModal} className="button-submit button-dark">Show Modal</Button>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            import &#123; displayModal, displayAlert &#125; from '../../utils/utilityManager';
          </pre>
          <pre>
            displayAlert('success', `Message de l'alerte`, true);
          </pre>
          <pre>
            const title = 'Le titre de la modal';<br />
            const body = 'Le contenu de la modale';<br />
            const footer = true;<br />
            const footerTxt = 'Le texte du footer';<br />
            const button = &#123; internalLink: true, label: 'Link', link:'/whatever', true &#125;;<br />
            displayModal(title, body, footer, footerTxt, button, true);<br />
          </pre>
        </section>
      </div>
    );
  }
}