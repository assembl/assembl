import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';

import { get } from '../../utils/routeMap';
import withoutLoadingIndicator from '../../components/common/withoutLoadingIndicator';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';

class Footer extends React.Component {
  render() {
    const { assemblVersion, debateData, hasLegalNotice, hasTermsAndConditions } = this.props;
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
                  {socialMedias.map((sMedia, index) => (
                    <Link to={sMedia.url} target="_blank" key={index}>
                      <i className={`assembl-icon-${sMedia.name}-circle`} />
                    </Link>
                  ))}
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
                {hasTermsAndConditions && (
                  <div className="terms-of-use">
                    <Link to={`${get('terms', slug)}`}>
                      <Translate value="footer.terms" />
                    </Link>
                  </div>
                )}
                {hasTermsAndConditions && hasLegalNotice && <span className="small-hyphen-padding"> &mdash; </span>}
                {hasLegalNotice && (
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

const mapStateToProps = state => ({
  assemblVersion: state.context.assemblVersion,
  debateData: state.debate.debateData,
  lang: state.i18n.locale
});

const withData = graphql(TabsConditionQuery, {
  props: ({ data }) => ({
    ...data
  })
});

export default compose(connect(mapStateToProps), withData, withoutLoadingIndicator())(Footer);