import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import MapStateToProps from '../../store/mapStateToProps';

class Footer extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <Grid fluid className="background-dark">
        <div className="max-container">
          <div className="footer">
            <p><Translate value="footer.socialMedias" /></p>
            <div className="social-medias">
              <a href="http://www.facebook.com" target="_blank" rel="noopener noreferrer">
                <img src="/static2/img/social/Facebook.svg" alt="Facebook" />
              </a>
              <a href="http://www.twitter.com" target="_blank" rel="noopener noreferrer">
                <img src="/static2/img/social/Twitter.svg" alt="Twitter" />
              </a>
              <a href="http://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                <img src="/static2/img/social/Linkedin.svg" alt="Linkedin" />
              </a>
            </div>
            <div className="terms">
              <Link to={`${rootPath}${debateData.slug}/terms`}><Translate value="footer.terms" /></Link>
            </div>
            <div className="copyright">© Bluenove-Assembl 2017</div>
          </div>
        </div>
      </Grid>
    );
  }
}

export default connect(MapStateToProps)(Footer);