import React from 'react';
import { ShareButtons, generateShareIcon } from 'react-share';
import { OverlayTrigger } from 'react-bootstrap';
import { shareFacebookTooltip } from './tooltips';

const {
  FacebookShareButton,
  GooglePlusShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  EmailShareButton,
  WhatsappShareButton,
  TelegramShareButton
} = ShareButtons;
const FacebookIcon = generateShareIcon('facebook');
const GooglePlusIcon = generateShareIcon('google');
const LinkedinIcon = generateShareIcon('linkedin');
const TwitterIcon = generateShareIcon('twitter');
const EmailIcon = generateShareIcon('email');
const WhatsappIcon = generateShareIcon('whatsapp');
const TelegramIcon = generateShareIcon('telegram');

export default class SocialShare extends React.Component {
  render() {
    const { url, onClose, social } = this.props;
    return (
      <div className="share-container">
        <div className="share-link-container">
          <input value={url} style={{ width: 300 }} />
        </div>
        <div className="social-share-buttons-container" style={{ paddingTop: 20 }}>
          {social &&
            <div>
              <OverlayTrigger placement="right" overlay={shareFacebookTooltip}>
                <FacebookShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                  <FacebookIcon size={32} round />
                </FacebookShareButton>
              </OverlayTrigger>
              <GooglePlusShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                <GooglePlusIcon size={32} round />
              </GooglePlusShareButton>
              <LinkedinShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
              <TwitterShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <WhatsappShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
              <TelegramShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
                <TelegramIcon size={32} round />
              </TelegramShareButton>
            </div>}
          <EmailShareButton url={url} onShareWindowClose={onClose} className="social-share-button">
            <EmailIcon size={32} round />
          </EmailShareButton>
        </div>
      </div>
    );
  }
}