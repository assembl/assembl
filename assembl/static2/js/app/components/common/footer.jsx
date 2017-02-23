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
          <div className={debateData.config.footer.socialMedias.length > 0 ? 'footer' : 'footer margin-xl'}>
            {debateData.config.footer.socialMedias.length > 0 &&
              <div>
                <p><Translate value="footer.socialMedias" /></p>
                <div className="social-medias">
                  {debateData.config.footer.socialMedias.map((sMedia) => {
                    return (
                      <a href={sMedia.url} target="_blank" rel="noopener noreferrer" key={sMedia.title}>
                        <img src={`/static2/img/social/${sMedia.title}.svg`} alt={sMedia.title} />
                      </a>
                    );
                  })}
                </div>
              </div>
            }
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