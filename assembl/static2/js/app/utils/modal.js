/*
  A module that manages the modal system in Assembl
*/
// Singleton object that will contain the ModalManager, which will be used to show/hide/manipulate the modal system
class ModalManagerClass {
  setComponent(comp) {
    this.modalComponent = comp;
  }
  displayModal(title, body, footer, footerTxt, button, showModal) {
    this.modalComponent.setState({
      title: title,
      body: body,
      footer: footer,
      footerTxt: footerTxt,
      button: button,
      showModal: showModal
    });
  }
}

const manager = new ModalManagerClass();

export default manager;