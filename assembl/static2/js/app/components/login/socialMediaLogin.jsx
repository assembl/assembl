import React from 'react';
import { form } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';

const convertNameToCssClass = (name) => {
  return name
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .join("_");
  };

export class SocialMedia extends React.Component {
  render() {
    const { slug } = this.props;
    const next = this.props.next ?
      this.props.next
      : (
        slug ?
          get('home', { slug: this.props.slug })
          :
          null
      );
    return (
      <div className="social-media">
        <h4 className="dark-title-4">
          <Translate value="login.loginWithSocialMedia" />
        </h4>
        <ul>
          {this.props.providers.map((provider) => {
            const providerName = convertNameToCssClass(provider.name);
            return (<li key={provider.name}>
              <form id={provider.name} method="get" action={provider.login} >
                { next ?
                  <input type="hidden" name="next" value={`${next}`} />
                  : null }
                {provider.extra && Object.keys(provider.extra).map((k) => {
                  return (<input key={provider.name + k} type="hidden" name={k} value={provider.extra[k]} />);
                })
                }
                <button className={`btn btn-block btn-social btn-${providerName}`} type="submit">
                  <i className={`assembl-icon-${providerName}`} />
                  {provider.name}
                </button>
              </form>
            </li>
            );
          })
          }
        </ul>
      </div>
    );
  }
}