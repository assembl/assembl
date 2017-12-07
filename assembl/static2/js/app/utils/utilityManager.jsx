import React from 'react';
import { I18n } from 'react-redux-i18n';
import { getCurrentView, getContextual, getFullPath } from '../utils/routeMap';
import { getConnectedUserId, getDiscussionSlug } from '../utils/globalFunctions';
import SocialShare from '../components/common/socialShare';
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

export const displayModal = (title, body, footer, footerTxt, button = null, showModal = true, bsSize = null) => {
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
    showModal: showModal,
    bsSize: bsSize,
    content: undefined
  });
};

export const displayCustomModal = (content, showModal = true) => {
  /* display a modal with given content. You have to handle Modal.* components in your content */
  document.activeElement.blur();
  modalManager.component.setState({
    content: content,
    showModal: showModal
  });
};

export const closeModal = () => {
  modalManager.component.setState({ showModal: false });
};

export const openShareModal = (options) => {
  const { title, routerParams, elementId, social, isFooter, footer } = options;
  const { slug, phase, themeId } = routerParams;
  const url = getFullPath('post', { slug: slug, phase: phase, themeId: themeId, element: elementId });
  const modalBody = <SocialShare url={url} onClose={closeModal} social={social} />;
  return displayModal(title, modalBody, isFooter, footer);
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

/* if user is not connected, ask for login, else, execute given action */
export const promptForLoginOr = action => () => {
  const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
  if (!isUserConnected) {
    inviteUserToLogin();
  } else {
    action();
  }
};