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
  /*
    alertStyle:String => bootstrap class (success, warning, danger or info)
    alertMsg:String => the message displayed in the alert
    showAlert:Boolean => to show/hide the alert
    topPosition:Boolean => if true, the top attribute should be 0
  */
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
  /*
    title:String => the text in the header of the modal
    body:String => the text in the body of the modal
    footer:Boolean => to show/hide the footer of the modal
    footerTxt:String => the text in the footer of the modal,
    button:Object =>
                    button.link:String => url of the button;
                    button.label:String => label of the button;
                    button.internalLink:Boolean => true if a Link from react-router is needed and false if a href is needed
  */
  modalManager.component.setState({
    title: title,
    body: body,
    footer: footer,
    footerTxt: footerTxt,
    button: button,
    showModal: showModal
  });
};