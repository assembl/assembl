import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { getFullPath } from '../utils/routeMap';
import { getConnectedUserId } from '../utils/globalFunctions';
import SocialShare from '../components/common/socialShare';
import LoginButton from '../components/common/loginButton';

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
    time => the duration of the alert. If time === -1, it is persistent
  */
  alertManager.component.setState(
    // ensure that we hide the old alert if it was persistent
    {
      showAlert: false
    },
    () => {
      alertManager.component.setState({
        base: false,
        alertStyle: style,
        alertMsg: msg,
        showAlert: true,
        topPosition: topPosition
      });
    }
  );

  if (time !== -1) {
    setTimeout(() => {
      alertManager.component.setState({
        showAlert: false
      });
    }, time);
  }
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
  if (document.activeElement) {
    document.activeElement.blur();
  }
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

export const displayCustomModal = (content, showModal = true, modalClass = null) => {
  /* display a modal with given content. You have to handle Modal.* components in your content */
  if (document.activeElement) {
    document.activeElement.blur();
  }
  modalManager.component.setState({
    content: content,
    showModal: showModal,
    modalClass: modalClass
  });
};

export const closeModal = () => {
  modalManager.component.setState({ showModal: false });
};

const getPathForModal = (type, params, postId) => {
  switch (type) {
  case 'post':
    return { url: getFullPath('post', { ...params, postId: postId }) };
  case 'questionPost':
    return { url: getFullPath('questionPost', { ...params, postId: postId }).replace('#', '/#') };
  case 'idea':
    return { url: getFullPath('idea', params) };
  case 'voteSession':
    return { url: getFullPath('voteSession', params) };
  case 'resourcesCenter':
    return { url: getFullPath('resourcesCenter', params) };
  case 'synthesis':
    return { url: getFullPath('synthesis', params) };
  case 'brightMirrorFiction':
    return { url: getFullPath('brightMirrorFiction', { ...params }) };
  default:
    return { url: getFullPath('post', { ...params, postId: postId }) };
  }
};

export const openShareModal = (options) => {
  const { footer, isFooter, postId, routerParams, social, title, type } = options;
  const pathForModal = getPathForModal(type, routerParams, postId);
  const modalBody = <SocialShare url={pathForModal.url} onClose={closeModal} social={social} />;
  return displayModal(title, modalBody, isFooter, footer);
};

export const inviteUserToLogin = () => {
  const body = (
    <div>
      <p>
        <Translate value="login.loginModalBody" />
      </p>
      <br />
      <LoginButton label={I18n.t('login.loginModalFooter')} />
    </div>
  );
  displayModal(null, body, true, null, null, true);
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

export const defaultAnchorAttributes = {
  rel: 'noopener no-referrer',
  target: '_blank'
};

/*
  An HOC that can be used when unclear whether to use Link or a tag (internal react-router
  or external url)
  @params AnchorComponent   Component : The component within the link
  @params urlData           Object : An object that has 'url' and 'local', describing whether link is internal or not
  @params anchorAttributes  Object: All attributes desired to be passed to the Link or a tag
  @params props             Object: All props desired to be passed to the AnchorComponent
*/
export const localAwareLink = AnchorComponent => ({ urlData, anchorAttributes, props }) => {
  const attrs = anchorAttributes || null;
  const componentProps = props || null;
  if (!urlData.local) {
    return (
      <a href={urlData.url} {...attrs}>
        <AnchorComponent {...componentProps} />
      </a>
    );
  }
  return (
    <Link to={urlData.url} {...attrs}>
      <AnchorComponent {...componentProps} />
    </Link>
  );
};