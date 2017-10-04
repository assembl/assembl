import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ShareButtons, generateShareIcon } from 'react-share';
// import { OverlayTrigger } from 'react-bootstrap';
// import { shareFacebookTooltip } from './tooltips';

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
  constructor(props) {
    super(props);
    this.state = {
      copied: false
    };
  }
  render() {
    const { url, onClose, social } = this.props;
    return (
      <div className="share-buttons-container">
        {social
          ? <div className="social-share-buttons-container">
            <div className="social-share-button">
              <EmailShareButton url={url} onShareWindowClose={onClose}>
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
            <div className="social-share-button">
              <FacebookShareButton url={url} onShareWindowClose={onClose}>
                <FacebookIcon size={32} round />
              </FacebookShareButton>
            </div>
            <div className="social-share-button">
              <GooglePlusShareButton url={url} onShareWindowClose={onClose}>
                <GooglePlusIcon size={32} round />
              </GooglePlusShareButton>
            </div>

            <div className="social-share-button">
              <LinkedinShareButton url={url} onShareWindowClose={onClose}>
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
            </div>

            <div className="social-share-button">
              <TwitterShareButton url={url} onShareWindowClose={onClose}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
            </div>

            <div className="social-share-button">
              <WhatsappShareButton url={url} onShareWindowClose={onClose}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
            </div>
            <div className="social-share-button">
              <TelegramShareButton url={url} onShareWindowClose={onClose}>
                <TelegramIcon size={32} round />
              </TelegramShareButton>
            </div>
          </div>
          : <div className="social-share-buttons-container">
            <div className="social-share-button">
              <EmailShareButton url={url} onShareWindowClose={onClose}>
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
          </div>}
        <CopyToClipboard
          text={url}
          onCopy={() => {
            return this.setState({ copied: true });
          }}
        >
          <button className="btn btn-default btn-copy">
            {this.state.copied ? 'Link copied' : 'Copy link to Clipboard'}
          </button>
        </CopyToClipboard>
      </div>
    );
  }
}