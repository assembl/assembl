import React from 'react';
import { form } from 'react-bootstrap';

export class SocialMedia extends React.Component {
  // TODO: Add proper CSS to each social media item
  render() {
    return (
      <div className='social-media'>
        <ul className='no-bullets'>
          {this.props.providers.map((provider) => {
            return (<li key={provider.name}>
              <form id={provider.name} method="get" action={provider.login} >
                {provider.extra && Object.keys(provider.extra).map((k) => {
                  return (<input key={provider.name + k} type="hidden" name={k} value={provider.extra[k]} />);
                  })
                }
                <button className={`btn btn-block btn-social btn-${provider.name.toLowerCase()}`} type="submit">
                  <i class={`fa fa-${provider.name.toLowerCase()}`}></i>
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