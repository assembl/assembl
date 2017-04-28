/*
  Singleton object that will contain the AlertManager, ModalManager which will be used to show/hide/manipulate the alert/modal system
*/
class UtilityManager {
  setComponent(comp) {
    this.component = comp;
  }
};

export const modalManager = new UtilityManager();

export const alertManager = new UtilityManager();

export const displayAlert = (style, msg, topPosition = false, time = 6000) => {
  alertManager.component.setState({
    base: false,
    alertStyle: style,
    alertMsg: msg,
    showAlert: true,
    topPosition: topPosition
  });
  setTimeout(() => {
    this.alertComponent.setState({
      showAlert: false
    });
  }, time);
};
export const displayModal = (title, body, footer, footerTxt, button, showModal) => {
  modalManager.component.setState({
    title: title,
    body: body,
    footer: footer,
    footerTxt: footerTxt,
    button: button,
    showModal: showModal
  });
};