import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';

import { get } from '../../utils/routeMap';

import TermsAndLegalNotice from '../../graphql/TermsAndLegalNotice.graphql';

class Footer extends React.Component {
  render() {
    const { assemblVersion, debateData, legalNotice, termsAndConditions } = this.props;
    const { socialMedias } = debateData;
    const slug = { slug: debateData.slug };
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
            <div className="footer-links">
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
              <div className="terms">
                {termsAndConditions && (
                  <div className="terms-of-use">
                    <Link to={`${get('terms', slug)}`}>
                      <Translate value="footer.terms" />
                    </Link>
                  </div>
                )}
                {termsAndConditions && legalNotice && <span className="small-hyphen-padding"> &mdash; </span>}
                {legalNotice && (
                  <div className="legal-notice">
                    <Link to={`${get('legalNotice', slug)}`}>
                      <Translate value="footer.legalNotice" />
                    </Link>
                  </div>
                )}
              </div>
              {assemblVersion && <div className="assembl-version">v{assemblVersion}</div>}
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

const withData = graphql(TermsAndLegalNotice, {
  props: ({ data }) => {
    if (data.loading) {
      return {
        loading: true
      };
    }

    if (data.error) {
      return {
        hasError: true
      };
    }

    return {
      hadError: data.error,
      loading: data.loading,
      legalNotice: data.legalNoticeAndTerms.legalNotice,
      termsAndConditions: data.legalNoticeAndTerms.termsAndConditions
    };
  }
});

export default compose(connect(mapStateToProps), withData)(Footer);