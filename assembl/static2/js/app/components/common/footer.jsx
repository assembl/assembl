// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';

import { get } from '../../utils/routeMap';
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';

type Props = {
  assemblVersion: string,
  slug: string,
  hasLegalNotice: boolean,
  hasTermsAndConditions: boolean,
  hasCookiesPolicy: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  lang: string,
  socialMedias: Array<SocialMedia>,
  footerLinks: Array<Object>
};

const Footer = ({
  assemblVersion,
  slug,
  socialMedias,
  footerLinks,
  hasLegalNotice,
  hasTermsAndConditions,
  hasCookiesPolicy,
  hasPrivacyPolicy,
  hasUserGuidelines,
  lang
}: Props) => {
  const debateSlug = { slug: slug };
  return (
    <Grid fluid className="background-dark relative" id="footer">
      <div className="max-container">
        <div className={socialMedias ? 'footer' : 'footer margin-l'}>
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
          {footerLinks && (
            <div className="custom-links">
              {footerLinks.map((footerLink, index) => (
                <div className="inline margin-m" key={`fl-${index}`}>
                  <Link to={footerLink.url} target="_blank">
                    {footerLink.titleEntries[lang]}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="footer-links">
            <div className="copyright">
              ©{' '}
              <Link to="https://bluenove.com/offres/assembl/" target="_blank">
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
                  <Link to={`${get('terms', debateSlug)}`}>
                    <Translate value="footer.terms" />
                  </Link>
                </div>
              )}
              {hasLegalNotice && (
                <div className="legal-notice">
                  {hasTermsAndConditions ? <span className="small-hyphen-padding"> &mdash; </span> : null}
                  <Link to={`${get('legalNotice', debateSlug)}`}>
                    <Translate value="footer.legalNotice" />
                  </Link>
                </div>
              )}
            </div>
            <div className="terms">
              {hasCookiesPolicy && (
                <div className="cookie-policy">
                  <Link to={`${get('cookiesPolicy', debateSlug)}`}>
                    <Translate value="footer.cookiePolicy" />
                  </Link>
                </div>
              )}
              {hasPrivacyPolicy && (
                <div className="privacy-policy">
                  {hasCookiesPolicy ? <span className="small-hyphen-padding"> &mdash; </span> : null}
                  <Link to={`${get('privacyPolicy', debateSlug)}`}>
                    <Translate value="footer.privacyPolicy" />
                  </Link>
                </div>
              )}
              {hasUserGuidelines && (
                <div className="user-guidelines">
                  {hasPrivacyPolicy || hasCookiesPolicy ? <span className="small-hyphen-padding"> &mdash; </span> : null}
                  <Link to={`${get('userGuidelines', debateSlug)}`}>
                    <Translate value="footer.userGuidelines" />
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
};

const mapStateToProps = state => ({
  assemblVersion: state.context.assemblVersion,
  socialMedias: state.debate.debateData.socialMedias,
  footerLinks: state.debate.debateData.footerLinks,
  slug: state.debate.debateData.slug,
  lang: state.i18n.locale
});
const withData = graphql(TabsConditionQuery, {
  props: ({ data: { hasPrivacyPolicy, hasLegalNotice, hasCookiesPolicy, hasTermsAndConditions, hasUserGuidelines } }) => ({
    hasPrivacyPolicy: hasPrivacyPolicy,
    hasLegalNotice: hasLegalNotice,
    hasCookiesPolicy: hasCookiesPolicy,
    hasTermsAndConditions: hasTermsAndConditions,
    hasUserGuidelines: hasUserGuidelines
  })
});

export default compose(connect(mapStateToProps), withData, manageErrorAndLoading({ displayLoader: false }))(Footer);