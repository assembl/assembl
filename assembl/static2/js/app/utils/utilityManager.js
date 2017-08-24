import { I18n } from 'react-redux-i18n';
import { getCurrentView, getContextual } from '../utils/routeMap';
import { getDiscussionSlug } from '../utils/globalFunctions';

/*
  Singleton object that will contain the AlertManager, ModalManager which will
  be used to show/hide/manipulate the alert/modal system
*/
class UtilityManager {
  setComponent(comp) {
    this.component = comp;
  }
}

export const modalManager = new UtilityManager();

export const alertManager = new UtilityManager();

export const displayAlert = (style, msg, topPosition = false, time = 4000) => {
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
    alertManager.component.setState({
      showAlert: false
    });
  }, time);
};
export const displayModal = (title, body, footer, footerTxt, button = null, showModal = true) => {
  /*
    title:String => the text in the header of the modal
    body:String => the text in the body of the modal
    footer:Boolean => to show/hide the footer of the modal
    footerTxt:String => the text in the footer of the modal,
    button:Object => the button in the footer of the modal
                    button.link:String => url of the button;
                    button.label:String => label of the button;
                    button.internalLink:Boolean => true if a Link from react-router is needed and false if a href is needed
  */
  document.activeElement.blur();
  modalManager.component.setState({
    title: title,
    body: body,
    footer: footer,
    footerTxt: footerTxt,
    button: button,
    showModal: showModal
  });
};

export const closeModal = () => {
  modalManager.component.setState({ showModal: false });
};

export const inviteUserToLogin = () => {
  const slug = getDiscussionSlug();
  const next = getCurrentView();
  const modalBody = I18n.t('login.loginModalBody');
  const button = {
    link: `${getContextual('login', slug)}?next=${next}`,
    label: I18n.t('login.loginModalFooter'),
    internalLink: true
  };
  displayModal(null, modalBody, true, null, button, true);
};