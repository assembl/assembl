import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';

class Footer extends React.Component {
  render() {
    const { assemblVersion, debateData } = this.props;
    const { socialMedias, termsOfUseUrl, legalNoticesUrl } = debateData;
    return (
      <Grid fluid className="background-dark relative" id="footer">
        <div className="max-container">
          <div className={socialMedias ? 'footer' : 'footer margin-xl'}>
            {socialMedias && (
              <div>
                <p>
                  <Translate value="footer.socialMedias" />
                </p>
                <div className="social-medias">
                  {socialMedias.map((sMedia, index) => {
                    return (
                      <Link to={sMedia.url} target="_blank" key={index}>
                        <i className={`assembl-icon-${sMedia.name}-circle`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="lower-footer-elements">
              <div className="copyright">
                ©{' '}
                <Link to="http://assembl.bluenove.com/" target="_blank">
                  Assembl
                </Link>{' '}
                powered by{' '}
                <Link to="http://bluenove.com/" target="_blank">
                  bluenove
                </Link>
              </div>
              {termsOfUseUrl && (
                <div className="terms">
                  <Link to={termsOfUseUrl} target="_blank">
                    <Translate value="footer.terms" />
                  </Link>
                </div>
              )}
              {legalNoticesUrl && (
                <div className="terms">
                  <Link to={legalNoticesUrl} target="_blank">
                    <Translate value="footer.legalNotices" />
                  </Link>
                </div>
              )}
              {assemblVersion ? <div className="assembl-version">v{assemblVersion}</div> : null}
            </div>
          </div>
        </div>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    assemblVersion: state.context.assemblVersion,
    debateData: state.debate.debateData
  };
};

export default connect(mapStateToProps)(Footer);