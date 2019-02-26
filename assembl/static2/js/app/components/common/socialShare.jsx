// @flow
import * as React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ShareButtons, generateShareIcon } from 'react-share';
import { I18n } from 'react-redux-i18n';
import classNames from 'classnames';

import MailIcon from '../common/icons/mailIcon/mailIcon';
import LinkIcon from '../common/icons/linkIcon/linkIcon';
import ThickIcon from '../common/icons/tickIcon/tickIcon';

const {
  FacebookShareButton,
  GooglePlusShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton
} = ShareButtons;

type Props = {
  url: string,
  onClose: () => void,
  social: boolean
};

type State = {
  copied: boolean
};

type SuperShareButtonProps = {
  Component: React.ComponentType<{ url: string, onShareWindowClose: () => void }>,
  Icon: React.ComponentType<{ size: number, round: boolean }>,
  url: string,
  onClose: () => void
};

const SuperShareButton = ({ Component, Icon, url, onClose, ...props }: SuperShareButtonProps) => {
  const data = { url: url, onShareWindowClose: onClose };
  return (
    <div className="social-share-button">
      <Component {...data} {...props}>
        <Icon size={32} round />
      </Component>
    </div>
  );
};

type EmailButtonProps = {
  url: string
};

const EmailButton = ({ url }: EmailButtonProps) => {
  const onClick = () => {
    window.location.href = `mailto:?body=${url}`;
  };
  return (
    <button className="btn btn-default btn-share btn-mail" onClick={() => onClick()}>
      <MailIcon />
      {I18n.t('debate.shareMail')}
    </button>
  );
};

export default class SocialShare extends React.Component<Props, State> {
  state = {
    copied: false
  };

  render() {
    const { url, onClose, social } = this.props;
    const { copied } = this.state;
    const SocialNetworks = [
      { Component: FacebookShareButton, iconName: 'facebook' },
      { Component: GooglePlusShareButton, iconName: 'google' },
      { Component: LinkedinShareButton, iconName: 'linkedin' },
      { Component: TwitterShareButton, iconName: 'twitter' },
      { Component: WhatsappShareButton, iconName: 'whatsapp' },
      {
        Component: TelegramShareButton,
        iconName: 'telegram'
      }
    ].map(({ Component, iconName }, index) => (
      <SuperShareButton Component={Component} Icon={generateShareIcon(iconName)} url={url} onClose={onClose} key={index} />
    ));

    const contentCopied = (
      <React.Fragment>
        <ThickIcon />
        {I18n.t('debate.linkCopied')}
      </React.Fragment>
    );

    const contentCopy = (
      <React.Fragment>
        <LinkIcon />
        {I18n.t('debate.copyLink')}
      </React.Fragment>
    );

    return (
      <div className="share-buttons-container center">
        <CopyToClipboard text={url} onCopy={() => this.setState({ copied: true })}>
          <button className={classNames('btn btn-default btn-share', copied ? 'btn-copied' : 'btn-copy')}>
            {copied ? contentCopied : contentCopy}
          </button>
        </CopyToClipboard>
        {social ? <div className="social-share-buttons-container">{SocialNetworks}</div> : <EmailButton url={url} />}
      </div>
    );
  }
}