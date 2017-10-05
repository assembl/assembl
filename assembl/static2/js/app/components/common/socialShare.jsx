import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ShareButtons, generateShareIcon } from 'react-share';
import { I18n } from 'react-redux-i18n';

const {
  FacebookShareButton,
  GooglePlusShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  EmailShareButton,
  WhatsappShareButton,
  TelegramShareButton
} = ShareButtons;

const icons = {};

['facebook', 'google', 'linkedin', 'twitter', 'email', 'whatsapp', 'telegram'].forEach((service) => {
  icons[service] = generateShareIcon(service);
});

const FacebookIcon = icons.facebook;
const GooglePlusIcon = icons.google;
const LinkedinIcon = icons.linkedin;
const TwitterIcon = icons.twitter;
const EmailIcon = icons.email;
const WhatsappIcon = icons.whatsapp;
const TelegramIcon = icons.telegram;

const SuperShareButton = ({ Component, Icon, url, onClose, ...props }) => {
  const data = { url: url, onShareWindowClose: onClose };
  return (
    <div className="social-share-button">
      <Component {...data} {...props}>
        <Icon size={32} round />
      </Component>
    </div>
  );
};

export default class SocialShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      copied: false
    };
  }
  render() {
    const { url, onClose, social } = this.props;
    const SocialNetworks = [
      { Component: EmailShareButton, Icon: EmailIcon },
      { Component: FacebookShareButton, Icon: FacebookIcon },
      { Component: GooglePlusShareButton, Icon: GooglePlusIcon },
      { Component: LinkedinShareButton, Icon: LinkedinIcon },
      { Component: TwitterShareButton, Icon: TwitterIcon },
      { Component: WhatsappShareButton, Icon: WhatsappIcon },
      {
        Component: TelegramShareButton,
        Icon: TelegramIcon
      }
    ].map(({ Component, Icon }, index) => {
      return <SuperShareButton Component={Component} Icon={Icon} url={url} onClose={onClose} key={index} />;
    });

    return (
      <div className="share-buttons-container">
        {social
          ? <div className="social-share-buttons-container">
            {SocialNetworks}
          </div>
          : <div className="social-share-buttons-container">
            <div className="social-share-button">
              <SuperShareButton Component={EmailShareButton} Icon={EmailIcon} url={url} onClose={onClose} />
            </div>
          </div>}
        <CopyToClipboard
          text={url}
          onCopy={() => {
            return this.setState({ copied: true });
          }}
        >
          <button className="btn btn-default btn-copy">
            {this.state.copied ? I18n.t('debate.linkCopied') : I18n.t('debate.copyLink')}
          </button>
        </CopyToClipboard>
      </div>
    );
  }
}