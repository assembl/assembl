import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import TopIdea from './themes/topIdea'
import IllustratedIdea from './themes/illustratedIdea'

class Themes extends React.Component {
  render() {
    const ideas = {
      themes: [
        {
          imgUrl: 'http://www.yannarthusbertrand.org/img/2012/03/vu-du-ciel-9_p11_l.jpg',
          title: 'habitat',
          nbUsers: 57,
          nbPosts: 532
        },
        {
          imgUrl: 'https://mir-s3-cdn-cf.behance.net/project_modules/disp/ed1d798517615.560becf461b61.jpg',
          title: 'egalité',
          nbUsers: 132,
          nbPosts: 237
        },
        {
          imgUrl: 'http://cdn.pcwallart.com/images/empire-state-building-at-night-wallpaper-1.jpg',
          title: 'sécurité',
          nbUsers: 87,
          nbPosts: 98
        },
        {
          imgUrl: 'http://www.visitasilomar.com/media/322487/asilomar-family-on-the-beach_208817447_1000x667.jpg',
          title: 'intégration',
          nbUsers: 24,
          nbPosts: 435
        }
      ],
      controversial: [
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Laïcité et éducation',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      longerThread: [
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Laïcité et éducation',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      topContributor: [
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Laïcité et éducation',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      recentDiscussion: [
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Laïcité et éducation',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 239,
          nbPosts: 643
        }
      ]
    };    
    return(
      <Grid fluid className="background-grey themes">
        <div className="max-container">
          <Row>
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.themesTitle" />
              </h1>
              <h5 className="dark-title-5 subtitle">
                <Translate value="home.themesSubtitle" />
              </h5>
            </div>
          </Row>
          <Row className="margin-xl">
            <Col xs={12} sm={6} md={3} className="theme1 no-padding">
              <TopIdea theme={ideas.controversial} keyTitle="home.controversial" />
              <IllustratedIdea theme={ideas.themes[0]} />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme2 no-padding">
              <IllustratedIdea theme={ideas.themes[1]} />
              <TopIdea theme={ideas.longerThread} keyTitle="home.longerThread" />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme3 no-padding">
              <TopIdea theme={ideas.topContributor} keyTitle="home.topContributor" />
              <IllustratedIdea theme={ideas.themes[2]} />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme4 no-padding">
              <IllustratedIdea theme={ideas.themes[3]} />
              <TopIdea theme={ideas.recentDiscussion} keyTitle="home.recentDiscussion" />
            </Col>
          </Row>
        </div>
      </Grid>
    );
  }
}

export default Themes;