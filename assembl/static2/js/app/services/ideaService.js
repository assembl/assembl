class IdeaService {
  static fetchIdeas(debateId) {
    return {
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
          title: 'Intensifier l\'agriculture classique',
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
          title: 'L\'étranger, une menace ou une chance ?',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Peut-on se moquer des croyances ?',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'La liberté d\'expression peut-elle être limitée ?',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      topContributor: [
        {
          title: 'L\'idéologie écologiste est-elle une réponse adaptée ?',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Entraide scolaire et méthode',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'L\'évasion fiscale',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      recentDiscussion: [
        {
          title: 'En faveur du vote blanc',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Un sujet polémique',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Un thème anthropologique et polémique',
          nbUsers: 239,
          nbPosts: 643
        }
      ]
    };
  }
}

export default IdeaService;