/* eslint max-len: "off", quotes: ["error", "double"] */
const Translations = {
  fr: {
    globalError: "Il y a eu une erreur, merci de réessayer plus tard.",
    here: "ici",
    yes: "oui",
    no: "non",
    and: " et ",
    accept: "Accepter",
    refuse: "Refuser",
    cancel: "Annuler",
    validate: "Valider",
    delete: "Supprimer",
    deleteConfirmation: {
      confirmDeletionTitle: "Supprimer un élément",
      confirmDeletionBody: "Êtes-vous certain de vouloir supprimer cet élément ?"
    },
    accountDeleted: "Votre compte a été supprimé avec succès",
    deletedUser: "Compte utilisateur supprimé",
    chatframe: {
      title: "Fenêtre de discussion instantanée",
      tooltip: "Assemb'Bot"
    },
    cookiesBar: {
      cookiesNotice:
        "Assembl utilise les cookies afin de vous offrir la meilleure expérience possible. Pour utiliser Assembl, vous devez accepter la politique d'utilisation des cookies du débat.",
      accept: "J'accepte",
      seeCookiesPolicy: "En savoir plus"
    },
    introduction: "Introduction",
    conclusion: "Conclusion",
    harvesting: {
      harvestedExtractNumbers: "%{extractNumber} extraits attrapés sur ce message",
      harvestedExtractNumbers_0: "%{extractNumber} extrait attrapé sur ce message",
      harvestedExtractNumbers_1: "%{extractNumber} extrait attrapé sur ce message",
      enableHarvestingMode: "Activer le mode attrapage",
      disableHarvestingMode: "Désactiver le mode attrapage",
      harvesting: "Attrapage",
      inProgress: "Attrapage en cours",
      validated: "Attrapage validé",
      confirm: "Confirmer",
      reject: "Rejeter",
      submit: "Valider",
      now: "Maintenant",
      harvestingSuccess: "L'extrait a été mis à jour avec succès.",
      harvestingDeleted: "L'extrait a été supprimé avec succès.",
      harvestingConfirmed: "L'extrait a été confirmé avec succès.",
      harvestingValidated: "L'extrait a été validé avec succès.",
      harvestingSubmitted: "L'extrait est en attente de validation.",
      deleteExtract: "Supprimer l'extrait attrapé",
      confirmDeleteExtract: "Êtes-vous certain de vouloir supprimer cet extrait ?",
      validateExtract: "Extrait validé",
      editExtract: "Modifier l'extrait attrapé",
      nuggetExtract: "Pépiter l'extrait attrapé",
      qualifyExtract: "Qualifier l'extrait attrapé",
      move: "Déplacer",
      qualifyNature: "Qualifier par nature",
      qualifyAction: "Qualifier par action",
      tags: {
        label: "Tags",
        cancel: "Annuler",
        validate: "Valider",
        edit: "Cliquez pour editer le tag \"%{tag}\"",
        deleteConfirmation: {
          confirmDeletionTitle: "Supprimer le tag \"%{tag}\"",
          confirmDeletionBody: "Êtes-vous certain de vouloir supprimer ce tag ?"
        },
        select: {
          placeholder: "Sélectionner des tags",
          noOptions: "Aucun tag trouvé",
          newOption: "Ajouter ce tag '%{option}'"
        },
        addTagSuccessMsg: "Le tag \"%{tag}\" a été ajouté avec succès.",
        removeTagSuccessMsg: "Le tag \"%{tag}\" a été retiré avec succès."
      }
    },
    cookies: {
      userSession: "Session utilisateur",
      locale: "Langue",
      matomo: "Matomo",
      privacyPolicy: "Politique de confidentialité",
      userGuideline: "Charte de participation",
      cgu: "Conditions générales d'utilisation",
      matomoSettings: "Pour modifier les paramètres de ce cookie, veuillez cliquer ici",
      userSessionHelper: "Ce cookie est nécessaire pour vous maintenir connecté sur Assembl.",
      localeHelper:
        "Ce cookie est nécessaire afin d'afficher les textes dans la langue de votre navigateur ou bien celle que vous avez sélectionné dans la barre de navigation.",
      privacyPolicyHelper:
        "Ce cookie permet d'enregistrer que vous avez accepté la politique de confidentialité de la consultation.",
      userGuidelineHelper: "Ce cookie permet d'enregistrer que vous avez accepté la charte de participation de la consultation.",
      cguHelper: "Ce cookie permet d'enregistrer que vous avez accepté les conditions générales d'utilisation.",
      matomoHelper: "Ce cookie est utilisé à des fins statistiques concernant les participants à la consultation.",
      required: "Ce cookie est requis"
    },
    search: {
      reset: {
        clear_all: "Effacer tous les filtres"
      },
      facets: {
        view_more: "Voir plus",
        view_less: "Voir moins",
        view_all: "Voir tout"
      },
      NoHits: {
        NoResultsFound: "Aucun résultat trouvé pour {query}.",
        DidYouMean: "Rechercher pour {suggestion}.",
        SearchWithoutFilters: "Rechercher {query} sans filtres",
        NoResultsFoundDidYouMean: "Aucun résultat trouvé pour {query}. Vous vouliez peut-être {suggestion} ?"
      },
      hitstats: {
        results_found: "{hitCount} résultats trouvés"
      },
      pagination: {
        previous: "Précédent",
        next: "Suivant"
      },
      searchbox: {
        placeholder: "Rechercher"
      },
      datefilter: {
        from: "Du",
        to: "Au"
      },
      published_on: "Publié le",
      harvested_on: "Attrapé le",
      member_since: "Membre depuis le",
      by: "par",
      search_come_from_what_you_need_to_know: "Recherche effectuée dans la section \"à retenir\" de cette discussion",
      search_come_from_announcement: "Recherche effectuée dans la section \"consigne\" de cette discussion",
      collapse_search: "Fermer la recherche",
      Categories: "Catégories",
      All: "Tout",
      extract: "Attrapages",
      post: "Messages",
      idea: "Idées",
      user: "Participants",
      synthesis: "Synthèses",
      Extracts: "Attrapages",
      Messages: "Messages",
      Participants: "Participants",
      like: "D'accord",
      agree: "D'accord",
      disagree: "Pas d'accord",
      dont_understand: "Pas tout compris",
      more_info: "SVP + d'infos",
      Nature: "Nature",
      taxonomy_nature: {
        issue: "Problématique",
        actionable_solution: "Solution actionnable",
        knowledge: "Connaissance",
        example: "Exemple",
        concept: "Concept",
        argument: "Argument",
        cognitive_bias: "Biais cognitif"
      },
      Action: "Action",
      taxonomy_action: {
        classify: "Ranger",
        make_generic: "Rendre plus générique",
        argument: "Argumenter",
        give_examples: "Donner des exemples",
        more_specific: "Rendre plus opérationnel",
        mix_match: "Croiser avec un autre extrait",
        display_multi_column: "Activer le multi-colonne",
        display_thread: "Activer le thread",
        display_tokens: "Activer le vote",
        display_open_questions: "Activer les questions ouvertes",
        display_bright_mirror: "Activer le Design Fiction"
      },
      State: "État",
      taxonomy_state: {
        SUBMITTED: "À valider",
        PUBLISHED: "Publié"
      },
      Sort: "Trier",
      number_of_contributions: "Nombre de messages",
      number_of_users: "Nombre de contributeurs",
      "By relevance": "Par pertinence",
      "Most recent first": "Du plus récent au plus ancien",
      "Oldest first": "Du plus ancien au plus récent",
      "Most popular messages": "Messages les plus populaires",
      "Less popular messages": "Messages les moins populaires",
      "Most controversial messages": "Messages les plus polémiques",
      "Most consensus messages": "Messages les plus consensuels",
      "Messages judged unclear": "Messages jugés peu clairs",
      "Participants having the most posted messages": "Participants ayant le plus grand nombre de messages",
      "Participants having the less posted messages": "Participants ayant le moins grand nombre de messages",
      "Participants pleased by their peers": "Participants plébiscités par leurs pairs",
      "Filter by date": "Filtrer par période",
      "My messages": "Mes messages",
      "Messages in response to my contributions": "Messages en réponse à mes contributions",
      "Creative participants": "Participants créatifs",
      "Reactive participants": "Participants réactifs",
      "Learning participants": "Participants apprenants"
    },
    resourcesCenter: {
      defaultHeaderTitle: "Centre de ressources en ligne",
      download: "Télécharger le document"
    },
    navbar: {
      home: "accueil",
      debate: "débat",
      resourcesCenter: "Ressources",
      community: "communauté",
      connection: "Connexion",
      logout: "Se déconnecter",
      administration: "Administration",
      syntheses: "Synthèses"
    },
    footer: {
      terms: "Conditions générales d'utilisation",
      legalNotice: "Mentions légales",
      cookiesPolicy: "Information sur les cookies",
      privacyPolicy: "Politique de protection des données personnelles",
      socialMedias: "Suivez-nous sur",
      userGuidelines: "Charte de participation"
    },
    login: {
      loginModalBody: "Vous devez être connecté pour participer.",
      loginModalFooter: "Connectez-vous",
      alreadyAccount: "Vous avez déjà un compte&nbsp;?",
      loginWithSocialMedia: "Vous utilisez un réseau social ?",
      password: "Mot de passe",
      email: "Email",
      login: "Se connecter",
      forgotPwd: "Réinitialiser votre mot de passe",
      noAccount: "Vous n’avez pas encore de compte&nbsp;?",
      signUp: "Créer un compte",
      username: "Email ou nom d'utilisateur",
      fullName: "Nom complet",
      password2: "Répéter le mot de passe",
      passwordRequirement:
        "Votre mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un nombre et un caractère spécial.",
      createAccount: "Créer un compte",
      send: "Envoyer",
      sendPwdConfirm: "Changement de mot de passe demandé",
      accountCreated: "Votre compte vient d'être créé",
      sendPwdMsg:
        "Nous vous avons envoyé un email avec un lien de connexion temporaire. Cliquez sur ce lien pour vous connecter et changer votre mot de passe. Si l'email n'est pas arrivé dans votre boîte de réception, veuillez vérifier dans vos spams.",
      resend: "Renvoyer l'email",
      accountCreatedMsg:
        "Un email de confirmation vient de vous être envoyé et devrait être dans votre boîte de réception dans quelques minutes. Il contient un lien de confirmation, veuillez cliquer dessus afin de confirmer votre adresse email. Si l'email n'est pas arrivé dans votre boîte de réception, veuillez vérifier dans vos spams.",
      changePassword: "Changez votre mot de passe",
      incorrectPassword: "Les mots de passe que vous avez écrits ne correspondent pas",
      somethingWentWrong: "Nous sommes desolés ! Quelque chose s'est mal passé. Veuillez ré-essayer",
      userName: "Nom d'utilisateur (optionnel)",
      passwordChangeRequestSuccess: "Super ! Un e-mail vous a été envoyé. Assurez-vous de vérifier également votre dossier spam",
      passwordChangeRequestError: "Oh oh ! Il semble y avoir un problème de notre côté. Veuillez réessayer plus tard",
      invalidEmail: "L’e-mail que vous avez renseigné est invalide",
      existingUsername: "Le nom d’utilisateur que vous avez renseigné existe déjà",
      existingEmail: "L’e-mail que vous avez renseigné existe déjà",
      emailNotFound: "L’e-mail que vous avez renseigné n’a pas été trouvé. Veuillez réessayer.",
      incorrectPasswordLogin:
        "Le mot de passe que vous avez entré ne correspond pas avec l’utilisateur saisi. Veuillez réessayer.",
      newPassword: "Nouveau mot de passe",
      newPassword2: "Ré-entrez le nouveau mot de passe",
      oldPasswordWarning: "Une remarque : le nouveau mot de passe doit être différent des 5 derniers mots de passe."
    },
    changePassword: {
      panelTitle: "Bienvenue dans la page changement de mot de passe d'Assembl"
    },
    home: {
      accessButton: "Je participe",
      sentiments_0: "vote",
      sentiments_1: "vote",
      sentiments: "votes",
      contribution_0: "contribution",
      contribution_1: "contribution",
      contribution: "contributions",
      messages_0: "message",
      messages_1: "message",
      messages: "messages",
      participant_0: "participant",
      participant_1: "participant",
      participant: "participants",
      participations_0: "participation",
      participations_1: "participation",
      participations: "participations",
      visit: "visites",
      pageViews: "pages vues",
      sumVisitsLength: "temps passé global",
      partners: "Partenaires",
      themesTitle: "Les thématiques en cours",
      themesSubtitle: "Retrouvez vos discussions à la unes, des plus polémiques au plus plébiscitées",
      controversial: "Discussions polémiques",
      longerThread: "Thread le plus long",
      topContributor: "Top contributeur",
      recentDiscussion: "Discussion récente",
      objectivesTitle: "Pourquoi un tel débat ?",
      timelineTitle: "Les %{count} étapes de la concertation",
      video: "La vidéo du débat",
      twitterTitle: "Tweet",
      contact: "Besoin d'échanger au sujet de la plateforme ?",
      contactUs: "Contactez-nous",
      from_start_to_end: "du %{start} au %{end}",
      chatbot: "Chat avec %{chatbotName}",
      assemblNotConfigured: "La configuration d'Assembl n'est pas terminée"
    },
    multiColumns: {
      synthesis: {
        noSynthesisYet: "La synthèse est en cours de rédaction",
        title: "Synthèse : %{colName}"
      }
    },
    synthesis: {
      title: "synthèse",
      seeConversation: "Voir la conversation",
      noSynthesisYet: "Il n'y a pas encore de synthèse disponible.",
      tableOfContents: "Sommaire"
    },
    common: {
      attachments: {
        download: "Télécharger"
      },
      editor: {
        attachment: "Joindre un fichier",
        bold: "Gras",
        italic: "Italique",
        bulletList: "Liste de puces",
        closeModal: "Fermer",
        attachmentPlugin: {
          title: "Insérer une pièce jointe"
        },
        linkPlugin: {
          openInNewTab: "Ouvrir le lien dans un nouvel onglet",
          text: "Texte du lien",
          title: "Insérer un lien",
          url: "Adresse web",
          editLinkForm: {
            title: "Modifier le lien"
          }
        }
      },
      icons: {
        error: "Icone d'erreur",
        tooltip: "Icone du tooltip"
      },
      loader: {
        error: "Il y a une erreur de chargement de l’analyse",
        loading: "Chargement en cours...",
        "no-data": "Il n'y a pas assez de contenu à analyser"
      },
      wordCountInformation: {
        msg: "Le résultat de l'analyse sémantique ci-dessous provient de l'analyse de %{words} dans la thématique.",
        words: "<span class='words-watson'>%{wordCount} mots</span>"
      },
      uploadButton: "Choisissez un fichier",
      goUp: "Remonter"
    },
    community: {
      panelTitle: "Bienvenue dans la communauté d'Assembl"
    },
    debate: {
      postAwaitingModeration: "Proposition en attente de modération",
      validateMessage: "Accepter ce message",
      shareThematic: "Partagez cette thématique",
      votes: "Votes",
      vote: "Vote",
      answer: "Je réponds :",
      toAnswer: "Répondre",
      share: "Partager",
      sharePost: "Partager ce message",
      shareSynthesis: "Partager cette synthèse",
      shareMail: "Partager par mail",
      copyLink: "Copier le lien dans le presse-papier",
      linkCopied: "Lien copié",
      subject: "Ecrivez le titre",
      insert: "Ecrivez votre message",
      post: "Poster",
      like: "J'aime",
      agree: "D'accord",
      agreeCount: "%{count} d'accord",
      disagree: "Pas d'accord",
      disagreeCount: "%{count} pas d'accord",
      dontUnderstand: "Pas tout compris",
      moreInfo: "SVP + d'infos",
      remaining_x_characters: "Il vous reste %{nbCharacters} caractères",
      deleteMessage: "Supprimer ce message",
      deniedMessage: "Refuser ce message",
      editMessage: "Modifier ce message",
      confirmDeletionTitle: "Confirmation de suppression",
      confirmDeletionBody: "Êtes-vous sûr de vouloir supprimer ce message ?",
      confirmRefusalBody: "Êtes-vous sûr de vouloir rejeter ce message ?",
      confirmRefusalButton: "Refuser",
      confirmDeletionButtonDelete: "Supprimer",
      confirmDeletionButtonCancel: "Annuler",
      syntheses: "Synthèses",
      back: "Retour",
      validateSuccess: "La contribution a bien été validée. Elle est désormais visible par l'ensemble des participants.",
      survey: {
        loadRecentPosts: "Afficher les propositions récentes",
        themesTitle: "Choisissez une thématique !",
        txtAreaPh: "Ecrivez votre proposition",
        question_x_on_total: "Question %{current} sur %{total}",
        proposalsTitle: "Êtes-vous d'accord avec les propositions exprimées ?",
        moderateProposalsTitle: "Modérer les propositions exprimées par les participants.",
        thematicNumerotation: "thématique %{count}",
        reactions_0: "Réaction",
        reactions_1: "Réaction",
        reactions: "Réactions",
        react: "Réagissez :",
        moreProposals: "Voir plus de propositions",
        allProposals: "Voir toutes les propositions",
        pendingProposals: "Voir les propositions en attente de modération",
        noProposals: "Il n'y a pas de propositions. Soyez le premier à contribuer !",
        submit: "Envoyer",
        postSuccess: "Merci pour votre participation. Votre proposition a bien été envoyée !",
        postToBeValidated:
          "Votre contribution a bien été prise en compte. Pour assurer la qualité des échanges, elle sera visible par l'ensemble des participants dès qu'elle aura été revue par l'équipe en charge de l'animation.",
        endPhase: "La phase \"%{closedPhaseName}\" est terminée."
      },
      question: {
        backToQuestions: "Retour aux questions"
      },
      thread: {
        messageTranslatedFrom: "Ce message a été traduit du texte %{language}.",
        messageOriginallyIn: "Ce message a été rédigé en %{language}.",
        translateAllMessagesIn: "Je souhaite traduire tous les messages rédigés en %{language}.",
        translateOnlyThisMessage: "Je souhaite traduire ce message.",
        untranslateOnlyThisMessage: "Je souhaite afficher uniquement ce message dans sa langue originale",
        untranslateAllMessagesIn: "Je souhaite afficher tous les messages rédigés en %{language} dans leur langue originale.",
        chooseLanguagePh: "Veuillez choisir la langue",
        postDeletedByAdmin: "Ce message a été supprimé par l'administrateur.",
        postDeletedByUser: "Ce message a été supprimé par son auteur.",
        postEdited: "modifié",
        postSuccess: "Merci pour votre participation. Votre message a bien été envoyé !",
        postToBeValidated:
          "Votre contribution a bien été prise en compte. Pour assurer la qualité des échanges, elle sera visible par l'ensemble des participants dès qu'elle aura été revue par l'équipe en charge de l'animation.",
        fillSubject: "Veuillez écrire un titre",
        fillBody: "Veuillez écrire un message",
        linkIdea: "Ce post est en lien avec les thématiques suivantes :",
        foldedPostLink: "Voir les %{count} réponses",
        foldedPostLink_1: "Voir la réponse",
        noPostsInThread: "Soyez le premier à contribuer, démarrez une discussion !",
        numberOfResponses: "%{count} réponses à ce post",
        numberOfResponses_0: "Aucune réponse à ce post",
        numberOfResponses_1: "%{count} réponse à ce post",
        numberOfReactions: "%{count} réactions",
        numberOfReactions_1: "%{count} réaction",
        showOriginal: "Afficher dans sa langue originale",
        startDiscussion: "Je démarre une discussion",
        translate: "Traduire",
        goToIdea: "Voir tous les messages",
        voteForProposals: "Votez pour les propositions",
        seeSubIdeas: "Voir les %{count} sous-thèmes",
        seeSubIdeas_1: "Voir le sous-thème",
        announcement: "Consigne",
        guidelines: "Consigne",
        summary: "À retenir"
      },
      semanticAnalysis: {
        long: "Sémantique",
        short: "Analyse",
        occurence: "Occurence",
        occurenceDefinition:
          "nombre de fois où le mot clé apparaît dans le débat ou dans les discussions relatives à la thématique en question",
        relevance: "Pertinence",
        relevanceDefinition:
          "qualifie l'importance du mot clé pour comprendre le sens général du texte analysé. Le score varie de 0 à 1, de faible à fort.",
        keywordCloud: "Nuage de mots-clés",
        keywordCloudDefinition:
          "Le nuage de mots-clés ci-dessous est une représentation visuelle des mots-clefs les plus utilisés dans le débat (ou \"dans les échanges liés à la thématique en question\" lorsque le texte fait référence à une thématique particulière). Les mots s'affichent dans des tailles de caractères d'autant plus visibles qu'ils sont utilisés ou populaires.",
        informationKeyword: "Informations mots clés",
        numberKeyword: "Nombre de mots clés",
        noKeywordSelected: "Pas de mot sélectionné",
        sentimentAnalysis: "Analyse du sentiment",
        sentimentAnalysisDefinition:
          "L'analyse du sentiment caractérise la tonalité positive ou négative des échanges du débat (ou \"des échanges relatifs à la thématique en question\")."
      },
      tagOnPost: {
        suggestionContainerTitle: "Suggestions de mots-clés :",
        tagContainerAdminTitle: "Ajoutez des mots-clés relatifs à ce post :",
        tagContainerTitle: "Mots-clés relatifs à ce post :",
        alreadyAddedWarningMessage: "Déja ajouté"
      },
      brightMirror: {
        deleteFiction: "Supprimez votre texte",
        deleteFictionModalBody: "Êtes-vous sûr de vouloir supprimer ce texte ?",
        deleteFictionSuccessMsg: "Votre texte a été supprimé",
        draftEmptyTitle: "Sans titre",
        draftLabel: "Brouillon",
        draftSuccessMsg: "Votre texte a bien été enregistré.",
        editFiction: "Editez votre texte",
        fiction: "Fiction",
        fillBodyLabel: "Ecrivez votre texte",
        noTitleSpecified: "Titre non défini",
        noContentSpecified: "Contenu non défini",
        fillEitherTitleContent: "Veuillez remplir le titre et/ou le texte",
        noAuthorSpecified: "Auteur non défini",
        numberOfFictions: "Liste de scénarios",
        numberOfFictions_0: "Aucun scénario publié",
        numberOfResponses: "%{count} réponses",
        numberOfResponses_0: "Aucune réponse",
        numberOfResponses_1: "%{count} réponse",
        postSuccessMsg: "Merci pour votre participation. Votre texte a bien été publiée !",
        saveDraft: "Sauvegarder",
        shareFiction: "Partager ce texte",
        startFictionLabel: "Je rédige mon texte",
        commentFiction: {
          cancel: "Annuler",
          commentHelper: "Commenter",
          deleteComment: "Supprimer ce message",
          deleteCommentBodyMessage: "Êtes-vous sûr de vouloir supprimer ce message ?",
          editComment: "Modifier ce message",
          imageAlt: "Illustration prenez la parole",
          label: "Commentaires",
          modal: {
            title: "Commenter",
            instructionList: "Vous pouvez commenter et enrichir le texte :",
            instructionListOne: "Surlignez un extrait du texte",
            instructionListTwo: "Cliquez sur “Suggérer” pour ouvrir une boîte de commentaire à droite du texte",
            instructionListThree: "Rédigez votre commentaire écrit, image ou vidéo et validez"
          },
          numberOfComments: "%{count} messages",
          numberOfComments_0: "Aucun message pour le moment",
          numberOfComments_1: "%{count} message",
          placeholder: "Rejoins le débat...",
          strongTitle: "Prenez la parole !",
          submit: "Commenter",
          title: "Commentez ou démarrez un débat sur le texte ci-dessus"
        },
        sideComment: {
          commenterSingleParticipation: "1 participant a commenté un extrait.",
          commentersParticipation: "%{count} participants ont commenté des extraits.",
          commentersParticipation_1: "%{count} participant a commenté des extraits.",
          commentLabel: "Votre commentaire",
          submitSuccessMsg: "Votre commentaire a été publié avec succès !",
          editSuccessMsg: "Votre commentaire a été édité avec succès !",
          deleteSuccessMsg: "Votre commentaire a été supprimé avec succès !",
          confirmDeleteMsg: "Êtes vous sûr de vouloir supprimer ce commentaire ?",
          editTooltip: "Modifier",
          deleteTooltip: "Supprimer"
        },
        sentiment: {
          like: "Ça m'inspire !",
          dislike: "Ça me refroidit !",
          dontUnderstand: "Renforcer l'histoire",
          moreInfo: "Enrichir le style"
        },
        suggest: "Suggérer"
      },
      themes: "Thèmes",
      notStarted: "La phase \"%{phaseName}\" n'a pas encore commencé. Merci de revenir à partir du ",
      isCompleted: "Cette phase est terminée. Vous ne pouvez plus voter.",
      noAnswer: "Cette phase est terminée. Vous ne pouvez plus répondre.",
      edit: {
        title: "Je modifie mon message",
        subject: "Titre",
        body: "Message"
      },
      voteSession: {
        currentTokenDistribution: "Répartition actuelle des jetons",
        tokenDistribution: "Répartition des votes",
        estimate: "Estimation moyenne",
        isCompleted: "La phase de vote est désormais terminée. Nous vous remercions d'avoir participé !",
        voteResultsPlusTitle: "Résultats des votes : %{title}",
        postSuccess:
          "Merci pour votre participation ! Votre vote a bien été pris en compte. Vous pouvez le modifier à tout moment jusqu’à la fermeture de la session de vote.",
        remainingTokens: "%{count} jetons disponibles",
        resetTokens: "Supprimer mon vote",
        submit: "Soumettre le vote",
        showVotesInProgress: "Ouvrir les votes de la communauté",
        showLess: "Fermer les votes de la communauté",
        participantsCount: "%{count} participants se sont exprimés !",
        participantsCount_0: "Aucun participant ne s'est encore exprimé",
        participantsCount_1: "%{count} participant s'est exprimé",
        tokenTooltip: "%{count} jetons %{name}",
        notEnoughTokens: "Vous n'avez plus assez de jetons",
        exclusiveTokens: "Vous avez déjà voté pour une autre catégorie pour cette proposition",
        totalVotes: "%{count} votes",
        valueWithUnit: "%{num} %{unit}"
      }
    },
    profile: {
      panelTitle: "Mon compte",
      personalInfos: "Informations personnelles",
      userName: "Nom d'utilisateur",
      fullname: "Nom complet",
      email: "Email",
      oldPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      newPassword2: "Retaper le mot de passe",
      memberSince: "Membre depuis le %{date}",
      save: "Enregistrer",
      password: "Mot de passe",
      cookies: "Paramétrage des cookies",
      changePassword: "Modifier mon mot de passe",
      passwordModifiedSuccess: "Votre mot de passe a été modifié avec succès",
      saveSuccess: "Votre profil a été mis à jour avec succès",
      usernameInformations:
        "Si vous avez configuré un pseudonyme, ce dernier est utilisé lorsque vous postez un message ou votez. Si vous n'avez pas configuré un pseudonyme, le nom et prénom que vous avez configuré ci-dessus sont utilisés lorsque vous postez un message ou votez.",
      deleteMyAccount: "Supprimer mon compte",
      deleteMyAccountConfirmation: "Supprimer mon compte et l'ensemble de mes données",
      deleteMyAccountText:
        "En supprimant votre compte, vous supprimez définitivement l'ensemble de vos données personnelles ainsi que votre compte. Vous ne pourrez plus contribuer à la consultation sans compte.",
      deleteMyAccountModal:
        "Êtes-vous certain de vouloir supprimer définitivement votre compte ainsi que l'ensemble de vos données personnelles ? En validant, vous ne pourrez plus contribuer à la consultation.",
      updateUser: {
        errorMessage: {
          "1": "Nous avons déjà un utilisateur ayant ce nom d'utilisateur.",
          "2": "Le mot de passe renseigné ne correspond pas à votre mot de passe actuel.",
          "3": "Vous avez entré deux mots de passe différents.",
          "4": "Le nouveau mot de passe doit être différent du mot de passe actuel.",
          "5": "Le nouveau mot de passe doit être différent des 5 derniers mots de passe que vous avez utilisés."
        }
      }
    },
    loading: {
      wait: "Veuillez patienter"
    },
    error: {
      reason: "Désolé, une erreur s'est produite :",
      required: "Ce champ est obligatoire.",
      loading: "Une erreur est survenue, veuillez recharger la page"
    },
    notFound: {
      panelTitle: "Désolé, cette page n'existe pas"
    },
    termsAndConditions: {
      headerTitle: "Conditions générales d'utilisation",
      iAccept: "J'ai lu et j'accepte ",
      link: "les conditions générales d'utilisation",
      accept: "J'accepte"
    },
    legalNotice: {
      headerTitle: "Mentions légales"
    },
    cookiesPolicy: {
      headerTitle: "Cookies",
      sectionTitle: "Information sur les cookies",
      essential: "Essentiel",
      analytics: "Analytique et personnalisation",
      other: "Autre",
      instructions: "Sélectionnez les cookies que vous souhaitez refuser ci-dessous",
      success: "Votre configuration des cookies a bien été sauvegardée"
    },
    privacyPolicy: {
      headerTitle: "Politique de protection des données personnelles",
      iAccept: "J'ai lu et j'accepte ",
      link: "la politique de protection des données personnelles"
    },
    userGuidelines: {
      headerTitle: "Charte de participation",
      iAccept: "J'ai lu et j'accepte ",
      link: "la charte de participation"
    },
    legalContentsModal: {
      title: "Accepter les contenus juridiques",
      iAccept: "Je confirme avoir lu et accepté ",
      ofThePlatform: " de la plateforme. "
    },
    administration: {
      confirmTextFieldDeletionTitle: "Supprimer le champ",
      confirmTextFieldDeletion: "Êtes-vous certain de vouloir supprimer ce champ ?",
      confirmSelectFieldOptionDeletionTitle: "Supprimer cet item",
      confirmSelectFieldOptionDeletion: "Êtes-vous certain de vouloir supprimer cet item ?",
      addThematic: "Ajouter une thématique de niveau %{level}",
      addQuestion: "Ajouter une question",
      anErrorOccured:
        "Il y a eu une erreur lors de la sauvegarde, veuillez vérifier que vous avez bien renseigné tous les champs requis.",
      deleteThematic: "Supprimer la thématique",
      deleteSubThematicDisabled: "Vous ne pouvez pas supprimer une thématique ayant des sous-thématiques.",
      confirmDeleteThematicTitle: "Confirmer la suppression",
      confirmDeleteThematic: "Êtes-vous sûr de vouloir supprimer cette thématique ?",
      confirmUnsavedChanges: "Vous avez des changements non sauvegardés. Êtes-vous sûr de vouloir quitter cette page ?",
      deleteQuestion: "Supprimer la question",
      changeLanguage: "Renseigner une autre langue",
      question_label: "Question",
      announcementModule: "Option module consigne",
      thematic: "Thématique",
      deleteAssociatedFile: "Supprimer le fichier associé",
      deleteThematicImage: "Supprimer l'image associée à cette thématique",
      edition: "Éditer la discussion",
      landingpage: "Page d'accueil",
      up: "Remonter",
      down: "Descendre",
      nextStep: "Étape suivante",
      previousStep: "Étape précédente",
      nameOfTheDebate: "Nom de la discussion",
      discussionSlug: "Slug de la discussion",
      slugWarning:
        "Cette modification entraine un changement de l'adresse de la consultation. Intégrez ce changement dans vos prochaines communications. Pour assurer la continuité du service, la précédente adresse sera toujours opérationnelle.",
      invalidSlug: "Les caractères spéciaux ne sont pas autorisés",
      menu: {
        phase: "Phase %{count} - %{description}",
        preferences: "Préférences de la discussion",
        sections: "Éditer les rubriques du débat",
        legalContents: "Éditer les contenus juridiques",
        timeline: "Éditer les phases",
        exportTaxonomies: "Exporter les taxonomies",
        manageProfileOptions: "Options d'inscription",
        personalizeInterface: "Personnaliser l'interface",
        configureThematic: "Configurer la thématique %{index}",
        exportDebateData: "Exporter les données"
      },
      discussionPreferences: {
        debateLogoLabel: "Logo du débat"
      },
      timelineAdmin: {
        phase: "Phase %{count}",
        annotation: "Module à renseigner obligatoirement. Les champs * sont requis.",
        phaseLabel: "Titre de la phase",
        descriptionPhaseLabel: "Description de la phase",
        addPhase: "Ajouter une phase",
        deletePhase: "Supprimer la phase",
        instruction1: "Choisissez le nombre de phases qui jalonneront votre débat",
        instruction2: "Renseignez les champs requis pour chaque phase en sélectionnant chaque onglet",
        instruction3: "Choisissez la date de début et de fin de votre phase",
        instruction4: "Télécharger l'image de couverture de votre phase présente sur la page d'accueil",
        instruction5: "Renseignez la description de votre phase.",
        successSave: "La ligne de temps a été sauvegardée avec succès",
        selectStart: "Date de démarrage de la phase %{count}",
        selectEnd: "Date de fin de la phase %{count}",
        warningLabel: "La période de cette phase chevauche la période de la phase précédente ou de la phase suivante."
      },
      modules: {
        noModule: "Aucun module",
        survey: "Module Questions",
        thread: "Module Threads",
        messageColumns: "Module Multi-colonnes",
        voteSession: "Module de vote",
        brightMirror: "Module Bright Mirror"
      },
      noTimeline: "Aucune timeline n'a été configurée pour ce débat.",
      survey: {
        createTable: "Créer la table des thématiques",
        exportData: "Exporter les données",
        configThematic: "Configurer la thématique",
        configThematics: "Configurer les thématiques",
        configThematicsHelperTitle: "Vous avez choisi de configurer une table de thématiques.",
        configThematicsHelperDescription: "Pour modifier votre choix, retourner au paramétrage générale du débat."
      },
      voteSession: {
        configureVoteSession: "Configuration de la session de vote associée à la thématique",
        "0": "Configuration de la page session de vote",
        "1": "Configurer le ou les modules de vote",
        "2": "Configurer les propositions de vote",
        "3": "Exporter les données"
      },
      imageRequirements:
        "L'image doit avoir une hauteur de 300 px et une largeur de 1280 px. Le poids ne doit pas dépasser 300 ko.",
      voteWithTokens: "Vote par jetons",
      voteWithGauges: "Vote par jauge(s)",
      gauge: "Jauge %{number}",
      token: "Jeton de type %{number}",
      tokenVoteCheckbox:
        "Le vote par jetons permet de sélectionner des propositions à la proportionnelle. Chaque participant dispose d'une certaine quantité de jetons et devra les répartir sur les propositions.",
      gaugeVoteCheckbox: "Vous pouvez choisir d'avoir une ou plusieurs jauges",
      tokenCategoryNumber: "Nombre de types de jetons",
      tokenNumber: "Nombre de jetons par personne",
      tokenTitle: "Intitulé du jeton",
      tokenColor: "Couleur du jeton",
      headerTitle: "Configuration du bandeau de haut de page",
      ProposalsSectionTitle: "Configuration du titre de la section Propositions",
      instructions: "Configuration de la section Consigne",
      summary: "Configuration de la section 'À retenir'",
      voteSessionSuccess: "La session de vote a été enregistrée avec succès.",
      exclusive: "Exclusif",
      tokenVoteInstructions: "Consigne du vote par jetons",
      proposalsSectionTitle: "Configuration du titre de la section Propositions",
      notExclusive: "Non exclusif",
      voteProposals: {
        sectionTitle: "Configurer les propositions associées aux modules de vote",
        defineProposal: "Définir proposition %{number}",
        addProposal: "Ajouter une proposition",
        deleteProposal: "Supprimer la proposition",
        deleteModalTitle: "Confirmation de suppression",
        deleteModalBody: "Êtes-vous sûr de vouloir supprimer cette proposition ?",
        title: "Titre de la proposition",
        description: "Description",
        tokenVote: "Vote par jetons",
        gauge: "Jauge %{number}",
        customGauge: "Jauge %{number} (modifiée pour cette proposition)",
        gaugeSettings: "Modifier le paramétrage",
        edit: "Modifier",
        cancelCustomization: "Annuler le paramétrage",
        validationErrors: {
          atLeastOneModule: "Vous devez sélectionner au moins un module."
        }
      },
      gaugeModal: {
        title: "Modification des paramètres de jauge",
        subTitle:
          "Vous vous apprêtez à modifier les paramètres sur cette jauge uniquement. Si vous souhaitez répercuter ces paramètres à l'ensemble des jauges, veuillez cocher la case en bas de formulaire.",
        applyToAllProposalsCheckboxLabel: "Appliquer ces changements à l'ensemble des propositions"
      },
      gaugeVoteInstructions: "Consigne du vote par jauge",
      proposalSectionTitle: "Configuration du titre de la section",
      gaugeNumber: "Nombre de jauges",
      defineGaugeNumer: "Définissez le nombre de jauges",
      minValue: "Valeur minimale",
      maxValue: "Valeur maximale",
      unit: "Unité",
      saveFirstStep: "Veuillez d'abord revenir à l'étape 1 et sauvegarder la configuration de la page.",
      saveSecondStep: "Veuillez d'abord revenir à l'étape 2 et configurez puis sauvegardez les modules de vote.",
      configureVoteSessionButton: "Configurer un module de vote",
      goBackToThematic: "Retour à la thématique",
      saveBeforeConfigureVoteSession: "Veuillez sauvegarder avant de pouvoir accéder à la configuration d'un module de vote",
      postsExistsWarning:
        "Cette thématique contient des messages. Si vous changez de module, vous supprimerez définitivement tous les messages associés à cette thématique lors de la sauvegarde.",
      configureVoteSession: "Vous devez configurer une session de vote.",
      configureVoteModules: "Vous devez avoir configuré au moins un module de vote.",
      backToPreviousStep: "Revenir à l'étape %{number}",
      nbTicksHelper: "Définissez le nombre de crans pour la jauge",
      nbTicks: "Nombre de crans",
      textValue: "Valeur textuelle",
      numberValue: "Valeur numéraire",
      valueTitle: "Intitulé de la valeur",
      seeCurrentVotes: "Voulez-vous que les participants puissent voir l'évolution des votes en cours ?",
      resultsVisible: "Oui, avant même d'avoir voté.",
      resultsNotVisible: "Non, n'afficher le résultat qu'une fois le vote clos.",
      sections: {
        addSection: "Ajouter une rubrique",
        deleteSection: "Supprimer la rubrique",
        homepage: "Accueil",
        custom: "Rubrique supplémentaire",
        externalPage: "Utiliser une page externe",
        titlePh: "Titre",
        urlPh: "URL",
        successSave: "Les rubriques ont été modifiées avec succès",
        sectionsTitle: "Renseigner les rubriques"
      },
      helpers: {
        surveyQuestion:
          "Le module de questions est composé d'une question et d'un champ de réponse dédié au participant. Vous pouvez ajouter des questions en cliquant sur l'icône + ci-dessous.",
        timelinePhases: "Choisissez une description et une image pour chaque phase du débat visible dans la page d'accueil",
        timelineTitle: "Configurez le titre et le sous-titre de la section timeline visible dans la page d'accueil",
        voteSessionProposalSection:
          "La partie qui comporte les diverses propositions est introduite par un titre. À vous de définir le titre selon qu'il s'agisse de propositions, d'idées, de projets ou autre...",
        tokenCategoryNumber: "Sélectionnez le nombre de types de jetons différents souhaité pour ce vote",
        exclusive:
          "Vous pouvez décider si le participant peut distributer un seul type de jetons (exclusif) ou plusieurs types de jetons par proposition (non exclusif).",
        tokenVoteInstructions: "En fonction de l'objectif du module de jetons, incitez les participants à passer à l'action.",
        gaugeVoteInstructions: "En fonction de l'objectif du module jauge, incitez les participants à passer à l'action.",
        landingPage: {
          header:
            "Bandeau image en haut de la page. Il contient le titre de la consultation, et un sous-titre informatif, ainsi qu'un bouton d'accès à la consultation.",
          timeline:
            "La section timeline met en avant les différentes phases de la consultation ainsi que le niveau de progression dans le temps. Elle contient un titre, un sous-titre, et pour chaque phase, un descriptif et des images associées. Pour la configuration du débat en phases, revenir au menu Éditer la discussion.",
          tweets:
            "La section Tweets met en avant les tweets relatifs à la consulation. Vous devez renseigner le titre de la section tweet, le #tag de recherche, et une image pour le fond de la section.",
          chatbot:
            "Il s'agit d'un bandeau de redirection vers un module chatbot messenger dédié à la consultation. Vous devez renseigner le titre, l'url du chatbot messenger et l'intitulé du bouton de redirection.",
          news:
            "Permet de mettre en avant une ou plusieurs actualités en rapport avec la consultation (publication d'une nouvelle synthèse, création d'une nouvelle thématique, …) avec des liens de redirection.",
          introduction: " ",
          data: " ",
          footer: " ",
          video: " ",
          contact: " ",
          top_thematics: " ",
          partners: " "
        }
      },
      videoHelp:
        "*Liens vidéo autorisés : \"https://www.youtube.com/embed/[videoId]\" ou \"https://player.vimeo.com/video/[videoId]?\"",
      annotation: "Les champs * sont requis.",
      discussion: {
        "0": "Préférences de la discussion",
        "3": "Options d'inscription",
        "4": "Contenus juridiques",
        "5": "Édition des phases",
        "6": "Personnaliser l'interface"
      },
      languageChoice: "Sélection des langues du débat",
      moderation: "Modération a priori",
      activateModeration: "Activer la modération",
      translation: "Option de traduction pour les utilisateurs",
      activateTranslation: "Activer l'option pour les utilisateurs de traduire les messages",
      ph: {
        propositionSectionTitle: "Titre de la section",
        propositionSectionSubtitle: "Sous-titre de la section",
        descriptionPhase: "Description de la phase"
      },
      tableOfThematics: {
        quote: "Citation",
        bannerHeader:
          "Le bandeau de haut de page comporte le titre de la thématique que vous avez défini en amont, ainsi qu’une image de fond et éventuellement un sous-titre.",
        thematicTitle: "Titre de la Thématique",
        bannerSubtitleLabel: "Sous-titre dans le bandeau du haut de page",
        bannerImagePickerLabel: "Choisir l'image de fond du bandeau",
        moduleTypeLabel: "Configuration du module de participation",
        instructionHeader:
          "La section Consigne comporte un titre et une consigne et un média (vidéo, slideshare ou image ) qui permettent de guider les participants dans leur contribution.",
        instructionLabel: "Consigne",
        summaryHeader:
          "La section 'À retenir' comporte une résumé succinct de la thématique et elle peut être enrichie de différents média.",
        summaryLabel: "À retenir",
        sectionTitleLabel: "Titre de la section",
        questionsHeader: "Questions",
        confirmDeletionTitle: "Supprimer la thématique %{title}",
        confirmDeletionBody: "Êtes-vous certain de vouloir supprimer cette thématique ?",
        multiColumnsFormName1: "2 colonnes",
        multiColumnsFormName2: "3 colonnes",
        columnsConfiguration: "Configuration des colonnes",
        columnTitle: "Titre de la colonne",
        columnName: "Nom de la colonne",
        columnColor: "Couleur de la colonne",
        columnSynthesisSubject: "Titre de la synthèse de la colonne",
        columnSynthesisBody: "Synthèse de la colonne"
      },
      resourcesCenter: {
        createResource: "Ajouter un média",
        menuTitle: "Éditer le centre de ressources",
        title: "Centre de ressources",
        editResourceFormTitle: "Média %{count}",
        textLabel: "Texte",
        titleLabel: "Titre",
        embedCodeLabel: "Vidéo/Slides",
        deleteResource: "Supprimer la ressource",
        documentLabel: "Document",
        imageLabel: "Image",
        successSave: "Les ressources ont été enregistrées avec succès !",
        pageTitleLabel: "Titre de la page",
        headerImageLabel: "Image de fond du bandeau"
      },
      export: {
        defaultAnnotation: "Vous pouvez exporter l'ensemble des données en cliquant sur le bouton exporter",
        taxonomyAnnotation: "Vous pouvez exporter l'ensemble des taxonomies en cliquant sur le bouton exporter",
        link: "Exporter",
        noExportLanguage: "Conserver les messages dans leurs langues d'origine",
        title: "Exporter les données du débat",
        defaultSectionTitle: "Exporter les données",
        taxonomySectionTitle: "Exporter les taxonomies",
        translateTheMessagesIn: "Traduire l'ensemble des messages en :",
        anonymity: "Anonymat",
        translation: "Traduction des données",
        anonymous: "Rendre les données anonymes",
        contributions: "Les contributions des participants",
        exportDate: "Date de l'export",
        startDate: "Début",
        endDate: "Fin",
        presets: {
          today: "Aujourd'hui",
          lastWeek: "Semaine dernière",
          lastMonth: "Mois dernier",
          phase: "Phase %{count}",
          fullDebate: "Intégralité du débat",
          placeHolder: "Presets"
        },
        vote: {
          voteResultsCsv: "Exporter les données générales du module de vote",
          extractCsvVoters: "Exporter les détails de vote de chaque utilisateur"
        }
      },
      step_x_total: "Section %{num} sur %{total}",
      saveThemes: "Sauvegarder",
      successThemeCreation: "Les thématiques ont été enregistrées avec succès !",
      successDiscussionPreference: "Les préférences de la discussion ont été enregistrées avec succès !",
      legalContents: {
        legalNoticeLabel: "Mentions légales",
        termsAndConditionsLabel: "Conditions générales d'utilisation",
        cookiesPolicyLabel: "Information sur les cookies",
        privacyPolicyLabel: "Politique de protection des données personnelles",
        userGuidelinesLabel: "Charte de participation",
        successSave: "Les contenus juridiques ont été enregistrés avec succès !",
        mandatoryLegalContentsValidation:
          "Activer la modale obligeant les utilisateurs à accepter les contenus légaux à la première visite",
        legalContentsValidation: "Acceptation des textes légaux pour une authentification via SSO"
      },
      landingPage: {
        manageModules: {
          title: "Administrer les modules",
          helper: "Choisissez les modules que vous souhaitez voir apparaître dans la page d'accueil et leurs emplacements.",
          textAndMultimedia: "Texte & Multi-média",
          textAndMultimediaBtn: "Ajouter un module Texte & Multi-média",
          confirmationModal: "Voulez-vous ajouter un module Texte & Multi-média supplémentaire à la page d'accueil ?"
        },
        header: {
          successSave: "Le contenu du header a été mis à jour avec succès !",
          title: "Header",
          helper: "Personnalisez l'apparence du header de la page d'accueil.",
          logoHelper: "Choisir le logo à mettre dans le bandeau",
          titleLabel: "Titre du débat",
          subtitleLabel: "Sous-titre du débat",
          buttonLabel: "Nom du bouton de renvoi vers le débat",
          headerImage: "Choisir l'image de font du bandeau",
          logoImage: "Choisir le logo du débat",
          headerDescription:
            "L'image doit avoir une hauteur de 450px de haut et une largeur de 1280px. Le poids ne doit pas dépasser 1Mo.",
          logoDescription:
            "Le logo doit avoir une hauteur maximale de 78px et une largeur maximale de 200px. Le poids ne doit pas dépasser 1Mo. Le fond doit être transparent.",
          startDate: "Du",
          endDate: "Au",
          timePlaceholder: "Optionnel : Entrez les dates du débat",
          dateDescription:
            "Pour configurer les dates du debat. Si vous n'avez pas sélectionné de dates, les dates sont déduites des timelines.",
          startDateError: "La date de début ne peut pas être postérieure à la date de fin",
          endDateError: "La date de fin ne peut pas être antérieure à la date de début"
        },
        timeline: {
          title: "Timeline de la page d'accueil",
          image: "Choisir l'image pour cette phase",
          imageDescription: "L'image doit avoir une hauteur de 500px et une largeur de 400px.",
          sectionTitle: "Configurer le titre et sous-titre de la section"
        },
        successSave: "Les modules ont été enregistrés avec succès !",
        headerSuccessSave: "Le bandeau de la page d'accueil a été sauvegardé avec succès !"
      },
      profileOptions: {
        addTextField: "Ajouter un champ",
        createNewFieldModalBody: "Choisissez le type de champ que vous souhaitez afficher dans le formulaire d'inscription :",
        choiceTextField: "Champ texte",
        choiceSelectField: "Menu déroulant",
        addSelectFieldOption: "Ajouter un nouvel item",
        deleteTextField: "Supprimer le champ",
        deleteSelectFieldOption: "Supprimer l'item",
        toggleLegalContentIntro:
          "Activer ou non la validation obligatoire des contenus juridiques après l'inscription sur la plateforme par SSO.",
        LegalContentButton: "Activer la validation obligatoire du contenu juridique",
        introText:
          "Configurez les champs que vous souhaitez afficher dans le formulaire d'inscription. Renseignez les noms ainsi que la mention obligatoire/non obligatoire.",
        textFieldToggleOptional: "Rendre ce champ optionnel",
        textFieldToggleRequired: "Rendre ce champ obligatoire",
        successSave: "Les options de profils ont été enregistrées avec succès !",
        hideTextField: "Cacher ce champs pour l'utilisateur"
      },
      personalizeInterface: {
        success: "La personnalisation de l'interface a été enregistées avec succès !",
        titleFormTitle: "Personnaliser l'intitulé de la page",
        title: "Titre de la page web (visuel 1)",
        favicon: "Favicon (visuel 2)",
        faviconInstruction: "La favicon doit être au format .ico et avoir une hauteur maximum de 110px.",
        logoInstruction:
          "L'image du logo doit avoir une hauteur d'au plus 110px, et une largeur d'au plus 215px. Le fond doit être transparent.",
        icoRequired: "Le favicon doit être un fichier .ico uniquement"
      }
    },
    unauthorizedAdministration: {
      unauthorizedMessage: "Vous n'êtes pas autorisé à accéder à l'administration. Veuillez contacter l'administrateur du site.",
      returnButton: "Retour à l'accueil"
    },
    date: {
      format: "D MMMM YYYY",
      format2: "DD-MM-YYYY",
      format3: "DD/MM/YYYY"
    },
    duration: {
      format: "h [h]"
    },
    form: {
      select: {
        placeholder: "Sélectionner...",
        noOptions: "Aucune option n'est disponible",
        newOption: "Ajouter l'option '%{option}'"
      }
    }
  },
  en: {
    globalError: "Something went wrong. Please try again later.",
    here: "here",
    yes: "yes",
    no: "no",
    and: " and ",
    cancel: "Cancel",
    accept: "Accept",
    refuse: "Refuse",
    validate: "Validate",
    introduction: "Introduction",
    conclusion: "Conclusion",
    delete: "Delete",
    deleteConfirmation: {
      confirmDeletionTitle: "Delete an item",
      confirmDeletionBody: "Are you sure that you wish to delete this item?"
    },
    accountDeleted: "Your account has been successfully deleted",
    deletedUser: "Deleted user account",
    chatframe: {
      title: "Instant discussion window",
      tooltip: "Assemb'Bot"
    },
    cookiesBar: {
      cookiesNotice:
        "Assembl uses cookies to offer you the best possible experience. To use Assembl, you have to agree to the cookies policy of the debate.",
      accept: "I agree",
      seeCookiesPolicy: "See more"
    },
    harvesting: {
      harvestedExtractNumbers: "%{extractNumber} extracts harvested on this message",
      harvestedExtractNumbers_0: "%{extractNumber} extract harvested on this message",
      harvestedExtractNumbers_1: "%{extractNumber} extract harvested on this message",
      enableHarvestingMode: "Enable harvesting mode",
      disableHarvestingMode: "Disable harvesting mode",
      inProgress: "Harvesting in progress",
      validated: "Harvesting validated",
      confirm: "Confirm",
      reject: "Reject",
      submit: "Submit",
      now: "Now",
      harvesting: "Harvesting",
      harvestingSuccess: "The extract was updated successfully.",
      harvestingDeleted: "The extract was deleted successfully.",
      harvestingConfirmed: "The extract was confirmed successfully.",
      harvestingValidated: "The extract was validated successfully.",
      harvestingSubmitted: "The extract is waiting for validation.",
      deleteExtract: "Delete the extract",
      confirmDeleteExtract: "Are you sure that you wish to delete this extract?",
      validateExtract: "Extract validated",
      editExtract: "Edit the extract",
      nuggetExtract: "Mark as nugget",
      qualifyExtract: "Qualify the extract",
      move: "Move",
      qualifyNature: "Qualify by nature",
      qualifyAction: "Qualify by action",
      tags: {
        label: "Tags",
        cancel: "Cancel",
        validate: "Validate",
        edit: "Click to edit the tag \"%{tag}\"",
        deleteConfirmation: {
          confirmDeletionTitle: "Delete the tag \"%{tag}\"",
          confirmDeletionBody: "Are you sure that you wish to delete this tag?"
        },
        select: {
          placeholder: "Select tags",
          noOptions: "No tags",
          newOption: "Create this tag '%{option}'"
        },
        addTagSuccessMsg: "Tag \"%{tag}\" has been successfully added.",
        removeTagSuccessMsg: "Tag \"%{tag}\" has been successfully removed."
      }
    },
    cookies: {
      userSession: "User Session",
      locale: "Language",
      matomo: "Matomo",
      cgu: "Terms and conditions",
      privacyPolicy: "Privacy policy",
      userGuideline: "User Guidelines",
      matomoSettings: "To modify this cookie's setting please click here",
      userSessionHelper: "This cookie is necessary to maintain the user connected on Assembl.",
      localeHelper:
        "This cookie is necessary to display the texts in the language of your browser or the one you selected in the navigation bar.",
      privacyPolicyHelper: "This cookie registers that you have accepted the privacy policy of the consultation.",
      userGuidelineHelper: "This cookie registers that you have accepted the user guidelines of the consultation.",
      cguHelper: "This cookie registers that you have accepted the terms and conditions of the consultation.",
      matomoHelper: "This cookie is used for stasticial purposes regarding the participants of the consultation.",
      required: "This cookie is required"
    },
    search: {
      reset: {
        clear_all: "Clear All Filters"
      },
      facets: {
        view_more: "View more",
        view_less: "View less",
        view_all: "View all"
      },
      NoHits: {
        NoResultsFound: "No results found for {query}.",
        DidYouMean: "Search for {suggestion}.",
        SearchWithoutFilters: "Search for {query} without filters",
        NoResultsFoundDidYouMean: "No results found for {query}. Did you mean {suggestion}?"
      },
      hitstats: {
        results_found: "{hitCount} results found"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      searchbox: {
        placeholder: "Search"
      },
      datefilter: {
        from: "From",
        to: "To"
      },
      search_come_from_what_you_need_to_know: "Search done in the \"What you need to know\" section of this discussion",
      search_come_from_announcement: "Search done in the \"announcement\" section of this discussion",
      published_on: "Published on",
      harvested_on: "Harvested on",
      member_since: "Member since",
      by: "by",
      collapse_search: "Close search",
      Categories: "Categories",
      All: "All",
      extract: "Extracts",
      post: "Messages",
      idea: "Ideas",
      user: "Participants",
      synthesis: "Syntheses",
      Extracts: "Extracts",
      Messages: "Messages",
      Participants: "Participants",
      like: "Agree",
      agree: "Agree",
      disagree: "Disagree",
      dont_understand: "Did not get it",
      more_info: "More info please?",
      Nature: "Nature",
      taxonomy_nature: {
        issue: "Issue",
        actionable_solution: "Actionable solution",
        knowledge: "Knowledge",
        example: "Example",
        concept: "Concept",
        argument: "Argument",
        cognitive_bias: "Cognitive bias"
      },
      Action: "Action",
      taxonomy_action: {
        classify: "Classify",
        make_generic: "Make generic",
        argument: "Argument",
        give_examples: "Give examples",
        more_specific: "Be more specific",
        mix_match: "Mix & match",
        display_multi_column: "Display Multi-column",
        display_thread: "Display Thread",
        display_tokens: "Display tokens",
        display_open_questions: "Display Open questions",
        display_bright_mirror: "Display Design Fiction"
      },
      State: "State",
      taxonomy_state: {
        SUBMITTED: "To validate",
        PUBLISHED: "Published"
      },
      Sort: "Sort",
      number_of_contributions: "Number of contributions",
      number_of_users: "Number of users",
      "By relevance": "By relevance",
      "Most recent first": "More recent first",
      "Oldest first": "Oldest first",
      "Most popular messages": "Most popular messages",
      "Less popular messages": "Less popular messages",
      "Most controversial messages": "Most controversial messages",
      "Most consensus messages": "Most consensus messages",
      "Messages judged unclear": "Messages judged unclear",
      "Participants having the most posted messages": "Participants having the most posted messages",
      "Participants having the less posted messages": "Participants having the less posted messages",
      "Participants pleased by their peers": "Participants pleased by their peers",
      "Filter by date": "Filter by date",
      "My messages": "My messages",
      "Messages in response to my contributions": "Messages in response to my contributions",
      "Creative participants": "Creative participants",
      "Reactive participants": "Reactive participants",
      "Learning participants": "Learning participants"
    },
    resourcesCenter: {
      defaultHeaderTitle: "Online resources center",
      download: "Download the document"
    },
    navbar: {
      home: "home",
      debate: "debate",
      community: "community",
      resourcesCenter: "Resources",
      connection: "Login",
      logout: "Logout",
      administration: "Administration",
      syntheses: "Syntheses"
    },
    footer: {
      terms: "Terms & Conditions",
      legalNotice: "Legal Notice",
      cookiesPolicy: "Cookies",
      privacyPolicy: "Privacy Policy",
      socialMedias: "Follow us",
      userGuidelines: "User guidelines"
    },
    login: {
      loginModalBody: "You have to be connected to participate.",
      loginModalFooter: "Please connect",
      alreadyAccount: "Do you already have an account?",
      loginWithSocialMedia: "Care to use social media?",
      password: "Password",
      email: "Email",
      login: "Log in",
      forgotPwd: "Reset your password",
      noAccount: "No account yet?",
      signUp: "Sign up",
      username: "Email or user name",
      fullName: "Full name",
      password2: "Repeat password",
      passwordRequirement:
        "Your password must contain at least a lowercase and a uppercase character, a number and a special character.",
      createAccount: "Create an account",
      send: "Send",
      sendPwdConfirm: "Password change requested",
      accountCreated: "Your account has been created",
      sendPwdMsg:
        "We have sent you an email with a temporary connection link. Please use that link to log in and change your password. Make sure to check your spam folder if an email is not in your inbox",
      resend: "Resend the email",
      accountCreatedMsg:
        "A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. It contains a confirmation link, please click on it in order to confirm your e-mail address. Check your spam folder if you did not receive a confirmation e-mail.",
      changePassword: "Change Password",
      incorrectPassword: "The passwords that you have entered do not match",
      somethingWentWrong: "We are sorry! Something went terribly wrong. Please try again",
      userName: "Username (optional)",
      passwordChangeRequestSuccess: "Great! An email has been sent to your account. Make sure to check your spam folder as well",
      passwordChangeRequestError: "Oh oh! There seems to be a problem on our end. Please try again later.",
      invalidEmail: "The email you have entered is invalid",
      existingUsername: "The username you have entered already exists",
      existingEmail: "The email you have entered already exists",
      emailNotFound: "The email you have entered was not found. Please try again.",
      incorrectPasswordLogin: "The password you have entered does not match with the entered user. Please try again.",
      newPassword: "New password",
      newPassword2: "Re-enter new password",
      oldPasswordWarning: "Note: The new password must be different than the last 5 passwords."
    },
    changePassword: {
      panelTitle: "Welcome to Assembl forgot password page"
    },
    home: {
      accessButton: "I want to participate",
      sentiments_0: "vote",
      sentiments_1: "vote",
      sentiments: "votes",
      contribution_0: "contribution",
      contribution_1: "contribution",
      contribution: "contributions",
      messages_0: "message",
      messages_1: "message",
      messages: "messages",
      participant_0: "participant",
      participant_1: "participant",
      participant: "participants",
      participations_0: "participation",
      participations_1: "participation",
      participations: "participations",
      visit: "visits",
      pageViews: "page views",
      sumVisitsLength: "global time spent",
      partners: "Partners",
      themesTitle: "Ongoing themes",
      themesSubtitle: "Find your most controversial and highly acclaimed discussions on the front page",
      controversial: "Controversial discussions",
      longerThread: "Longer thread",
      topContributor: "Top contributor",
      recentDiscussion: "Recent discussion",
      objectivesTitle: "What is the objective?",
      timelineTitle: "The timeline in %{count} phases",
      video: "Video of the debate",
      twitterTitle: "Tweet",
      contact: "Do you wish to know more about this platform?",
      contactUs: "Contact us",
      from_start_to_end: "from %{start} to %{end}",
      chatbot: "Chat with %{chatbotName}",
      assemblNotConfigured: "Assembl has not been fully configured yet"
    },
    community: {
      panelTitle: "Welcome to Assembl community page"
    },
    common: {
      attachments: {
        download: "Download"
      },
      editor: {
        attachment: "Add a file",
        bold: "Bold",
        italic: "Italic",
        bulletList: "Bullet list",
        closeModal: "Close",
        attachmentPlugin: {
          title: "Add an attachment"
        },
        linkPlugin: {
          openInNewTab: "Open link in new tab",
          text: "Link text",
          title: "Insert a link",
          url: "URL",
          editLinkForm: {
            title: "Edit the link"
          }
        }
      },
      icons: {
        error: "Error icon",
        tooltip: "Tooltip icon"
      },
      loader: {
        error: "There is an error loading the analysis",
        loading: "Loading...",
        "no-data": "Not enough data to analyse"
      },
      wordCountInformation: {
        msg: "TO BE DEFINED %{words}",
        words: "<span class='words-watson'>%{wordCount} words</span>"
      },
      uploadButton: "Choose a file to upload",
      goUp: "Back to top"
    },
    multiColumns: {
      synthesis: {
        noSynthesisYet: "The synthesis is currently being written",
        title: "Synthesis: %{colName}"
      }
    },
    synthesis: {
      title: "synthesis",
      seeConversation: "See the conversation",
      noSynthesisYet: "There is no synthesis available yet.",
      tableOfContents: "Table of contents"
    },
    debate: {
      postAwaitingModeration: "Proposal awaiting moderation",
      validateMessage: "Accept this message",
      shareThematic: "Share this thematic",
      votes: "Votes",
      vote: "Vote",
      answer: "I answer:",
      toAnswer: "Answer",
      share: "Share",
      sharePost: "Share this message",
      shareSynthesis: "Share this synthesis",
      copyLink: "Copy the link to the clipboard",
      shareMail: "Share the link via email",
      linkCopied: "Link copied",
      subject: "Write the title",
      insert: "Post a comment",
      post: "Post",
      like: "Like",
      agree: "Agree",
      agreeCount: "%{count} agree",
      disagree: "Disagree",
      disagreeCount: "%{count} disagree",
      dontUnderstand: "Did not get it",
      moreInfo: "More info please",
      remaining_x_characters: "You have %{nbCharacters} characters left",
      deniedMessage: "Refuse this message",
      deleteMessage: "Delete this message",
      editMessage: "Edit this message",
      confirmDeletionTitle: "Confirm deletion",
      confirmDeletionBody: "Are you sure you want to delete this message?",
      confirmRefusalBody: "Are you sure you want to refuse this message?",
      confirmRefusalButton: "Refuse",
      confirmDeletionButtonDelete: "Delete",
      confirmDeletionButtonCancel: "Cancel",
      syntheses: "Syntheses",
      back: "Back",
      validateSuccess: "The contribution has been validated. It is now visible by all participants.",
      survey: {
        loadRecentPosts: "Load recent proposals",
        themesTitle: "Choose a theme!",
        txtAreaPh: "Write your point of view",
        question_x_on_total: "Question %{current} on %{total}",
        proposalsTitle: "Do you agree with these points of view?",
        moderateProposalsTitle: "Moderate these points of view",
        thematicNumerotation: "Thematic %{count}",
        reactions_0: "Reaction",
        reactions_1: "Reaction",
        reactions: "Reactions",
        react: "React:",
        moreProposals: "More points of view",
        allProposals: "See all points of view",
        pendingProposals: "See all pending points of view",
        noProposals: "There is no point of view for the moment. Be the first to contribute!",
        submit: "Submit",
        postSuccess: "Thanks for your participation. Your proposal has been sent!",
        postToBeValidated:
          "Your contribution has been saved. To insure the quality of the debate, it will be visible to all participants once it has been reviewed by the animation team.",
        endPhase: "The \"%{closedPhaseName}\" phase is closed."
      },
      question: {
        backToQuestions: "Back to questions"
      },
      thread: {
        messageTranslatedFrom: "This message has been translated from %{language}.",
        messageOriginallyIn: "This message has been written in %{language}",
        translateAllMessagesIn: "Translate all messages posted in %{language}.",
        untranslateAllMessagesIn: "I don't want to translate all messages in %{language}.",
        translateOnlyThisMessage: "Translate only this message.",
        untranslateOnlyThisMessage: "I don't want to translate only this message",
        chooseLanguagePh: "Please choose the language",
        postDeletedByAdmin: "This message has been deleted by the community manager.",
        postDeletedByUser: "This message has been deleted by the author.",
        postEdited: "edited",
        postSuccess: "Thanks for your participation. Your comment has been sent!",
        postToBeValidated:
          "Your contribution has been saved. To insure the quality of the debate, it will be visible to all participants once it has been reviewed by the animators.",
        fillSubject: "Please, write a title",
        fillBody: "Please, write a comment",
        linkIdea: "This post is related to the following themes:",
        foldedPostLink: "Show %{count} responses",
        foldedPostLink_1: "Show 1 response",
        noPostsInThread: "Be the first to contribute, start a discussion!",
        numberOfResponses: "%{count} responses to this post",
        numberOfResponses_0: "No response to this post",
        numberOfResponses_1: "%{count} response to this post",
        numberOfReactions: "%{count} reactions",
        numberOfReactions_1: "%{count} reaction",
        showOriginal: "Show original",
        startDiscussion: "Start a new thread",
        translate: "Translate",
        goToIdea: "View all messages",
        voteForProposals: "Vote for the proposals",
        seeSubIdeas: "See %{count} sub-thematics",
        seeSubIdeas_1: "See sub-thematic",
        announcement: "Announcement",
        guidelines: "Guidelines",
        summary: "Summary"
      },
      semanticAnalysis: {
        long: "Analysis",
        short: "Semantic",
        occurence: "Occurence",
        occurenceDefinition:
          "frequency of keywords throughout the debate or throughout the discussions related to the theme being addressed.",
        relevance: "Relevance",
        relevanceDefinition:
          "measures how important the keyword is in order to understand the general meaning of the text. The score varies from 0 to 1, from weak to strong.",
        keywordCloud: "Keyword cloud",
        keywordCloudDefinition:
          "The following keyword cloud is a visual representation of the most frequently used keywords in the debate (or \"in the conversations related to the theme being addressed\" pour le texte à mettre en thématique). The importance of each keyword is shown with font size.",
        informationKeyword: "Information on keywords",
        numberKeyword: "Number of keywords",
        noKeywordSelected: "Select your keyword",
        sentimentAnalysis: "Sentiment analysis",
        sentimentAnalysisDefinition:
          "The sentiment analysis score qualifies the positive or negative tonality of the discussions in the debate (or in the discussions related to the theme being addressed)."
      },
      tagOnPost: {
        suggestionContainerTitle: "Suggested keywords:",
        tagContainerAdminTitle: "Add post-related keywords:",
        tagContainerTitle: "Keywords in post:",
        alreadyAddedWarningMessage: "Already added"
      },
      brightMirror: {
        deleteFiction: "Delete your text",
        deleteFictionModalBody: "Are you sure you want to delete this text?",
        deleteFictionSuccessMsg: "Your text was deleted",
        draftEmptyTitle: "Untitled",
        draftLabel: "Draft",
        draftSuccessMsg: "Your text has been saved successfully.",
        editFiction: "Edit your text",
        fiction: "text",
        fillBodyLabel: "Write your text",
        noTitleSpecified: "No title specified",
        noContentSpecified: "No content specified",
        fillEitherTitleContent: "Please, write a title or a text",
        noAuthorSpecified: "No author specified",
        numberOfFictions: "List of scenarios",
        numberOfFictions_0: "No published scenarios",
        numberOfResponses: "%{count} responses",
        numberOfResponses_0: "No response",
        numberOfResponses_1: "%{count} response",
        postSuccessMsg: "Thanks for your participation. Your text has been published successfully!",
        saveDraft: "Save",
        shareFiction: "Share a short story",
        startFictionLabel: "Write my text",
        commentFiction: {
          cancel: "Cancel",
          commentHelper: "Comment",
          deleteComment: "Delete this message",
          deleteCommentBodyMessage: "Are you sure you want to delete this message?",
          editComment: "Edit this message",
          imageAlt: "Let's talk illustration",
          label: "Comments",
          modal: {
            title: "Comment",
            instructionList: "You can comment the text:",
            instructionListOne: "Underligne a quote",
            instructionListTwo: "Click “Suggest” to open an input box",
            instructionListThree: "Write your comment, add an image or video and validate"
          },
          numberOfComments: "%{count} messages",
          numberOfComments_0: "No message at the moment",
          numberOfComments_1: "%{count} message",
          placeholder: "Join the debate...",
          strongTitle: "Let's talk!",
          submit: "Comment",
          title: "Comment or debate on the text above"
        },
        sideComment: {
          commenterSingleParticipation: "1 participant commented a quote.",
          commentersParticipation: "%{count} participants commented quotes.",
          commentersParticipation_1: "%{count} participant commented quotes.",
          commentLabel: "Your comment",
          submitSuccessMsg: "Your comment has been published successfully!",
          editSuccessMsg: "Your comment has been edited successfully!",
          deleteSuccessMsg: "Your comment has been deleted successfully!",
          confirmDeleteMsg: "Are you sure you would like to delete this comment?",
          editTooltip: "Edit",
          deleteTooltip: "Delete"
        },
        sentiment: {
          like: "Inspiring!",
          dislike: "Scary",
          dontUnderstand: "Strengthen the plot",
          moreInfo: "Enrich the style"
        },
        suggest: "Suggest"
      },
      themes: "Themes",
      notStarted: "The \"%{phaseName}\" phase has not started. Please come back from ",
      isCompleted: "This phase is closed. You can no longer vote.",
      noAnswer: "This phase is closed. You can no longer answer.",
      edit: {
        title: "I edit my message",
        subject: "Subject",
        body: "Comment"
      },
      voteSession: {
        currentTokenDistribution: "Current distribution of tokens",
        tokenDistribution: "Distribution of votes",
        estimate: "Average estimate",
        isCompleted: "This vote phase is closed. Thank you for your participation!",
        voteResultsPlusTitle: "Vote results: %{title}",
        postSuccess:
          "Thank you for your participation! Your vote has been set. You can modify this vote during the entire duration of the vote session.",
        remainingTokens: "%{count} tokens remaining",
        resetTokens: "Reset my vote",
        submit: "Submit vote",
        showVotesInProgress: "Show votes of the community",
        showLess: "Close votes of the community",
        participantsCount: "%{count} participants have expressed themselves!",
        participantsCount_0: "No participants have expressed themselves yet",
        participantsCount_1: "%{count} participant has expressed himself/herself",
        tokenTooltip: "%{count} %{name} tokens",
        notEnoughTokens: "You don't have enough tokens",
        exclusiveTokens: "You already voted for another category for this proposal",
        totalVotes: "%{count} votes",
        valueWithUnit: "%{unit}%{num}"
      }
    },
    profile: {
      panelTitle: "My account",
      personalInfos: "Personal information",
      userName: "User name",
      fullname: "Full name",
      email: "Email",
      oldPassword: "Current password",
      newPassword: "New password",
      newPassword2: "Retype password",
      memberSince: "Member since %{date}",
      save: "Save",
      password: "Password",
      cookies: "Cookies configuration",
      changePassword: "Change my password",
      usernameInformations:
        "If you configured a username, it will be used when you post a message or vote. If you haven't configured one, the full name that you configured will be used instead.",
      passwordModifiedSuccess: "Your password has been changed with success",
      saveSuccess: "Your profile is updated",
      deleteMyAccount: "Delete my account",
      deleteMyAccountConfirmation: "Delete my account and my data",
      deleteMyAccountText:
        "By deleting your account, you permanently delete all of your personal data and your account. You will no longer be able to contribute to the debate without an account.",
      deleteMyAccountModal:
        "Are you sure you want to permanently delete your account and all of your personal data? By validating, you will no longer be able to contribute to the consultation.",
      updateUser: {
        errorMessage: {
          "1": "We already have a user with this username.",
          "2": "The entered password doesn't match your current password.",
          "3": "You entered two different passwords.",
          "4": "The new password has to be different than the current password.",
          "5": "The new password has to be different than the last 5 passwords you set."
        }
      }
    },
    loading: {
      wait: "Please wait..."
    },
    error: {
      reason: "Sorry, an error occurred:",
      required: "This field is required.",
      loading: "An error occurred, please reload the page"
    },
    notFound: {
      panelTitle: "Sorry, this page doesn't exist"
    },
    termsAndConditions: {
      headerTitle: "Terms & Conditions",
      link: "the Terms & Conditions",
      iAccept: "I have read and I accept the ",
      accept: "I accept"
    },
    legalNotice: {
      headerTitle: "Legal Notice"
    },
    cookiesPolicy: {
      headerTitle: "Cookies",
      sectionTitle: "Cookies policy",
      essential: "Essential",
      analytics: "Analytics and customization",
      other: "Other",
      instructions: "Select the cookies you wish to refuse below",
      success: "Your cookies configuration has been saved"
    },
    privacyPolicy: {
      headerTitle: "Privacy policy",
      iAccept: "I have read and I accept the ",
      link: "the Privacy Policy"
    },
    userGuidelines: {
      headerTitle: "User guidelines",
      iAccept: "I have read and I accept the ",
      link: "the user guidelines"
    },
    legalContentsModal: {
      title: "Accept the legal contents",
      iAccept: "I have read and accepted ",
      ofThePlatform: " of the platform."
    },
    administration: {
      confirmTextFieldDeletionTitle: "Delete the field",
      confirmTextFieldDeletion: "Are you sure that you want to delete this field?",
      confirmSelectFieldOptionDeletionTitle: "Delete this item",
      confirmSelectFieldOptionDeletion: "Are you sure that you want to delete this item?",
      addThematic: "Add a level %{level} theme",
      addQuestion: "Add a question",
      anErrorOccured: "An error occured during save. Please check that you filled all the required fields.",
      deleteThematic: "Delete the theme",
      deleteSubThematicDisabled: "You cannot delete a theme with sub-thematics.",
      confirmDeleteThematicTitle: "Confirm deletion",
      confirmDeleteThematic: "Are you sure you want to delete this theme?",
      confirmUnsavedChanges: "You have unsaved changes. Are you sure you want to leave this page?",
      deleteQuestion: "Delete the question",
      changeLanguage: "Set another language",
      question_label: "Question",
      announcementModule: "Announcement module",
      thematic: "Theme",
      deleteAssociatedFile: "Delete the associated file",
      deleteThematicImage: "Delete the image associated to this thematic",
      edition: "Edit the discussion",
      landingpage: "Landing page",
      up: "Up",
      down: "Down",
      nextStep: "Next step",
      previousStep: "Previous step",
      nameOfTheDebate: "Name of the debate",
      discussionSlug: "Slug of the debate",
      slugWarning:
        "This modification causes a change in the address of the debate. Please take this change into account in further communications. To insure the continuity of the service, the previous address will still be operating.",
      invalidSlug: "Special characters are not allowed",
      menu: {
        phase: "Phase %{count} - %{description}",
        preferences: "Discussion preferences",
        sections: "Edit debate sections",
        legalContents: "Edit legal content",
        timeline: "Edit the phases",
        exportTaxonomies: "Export taxonomies",
        manageProfileOptions: "Registration options",
        personalizeInterface: "Personalize the interface",
        configureThematic: "Configure the theme %{index}",
        exportDebateData: "Export the data"
      },
      discussionPreferences: {
        debateLogoLabel: "Debate logo"
      },
      timelineAdmin: {
        phase: "Phase %{count}",
        annotation: "This module has to be filled. * Fields are required",
        phaseLabel: "Phase title",
        descriptionPhaseLabel: "Phase description",
        addPhase: "Add a phase",
        deletePhase: "Delete the phase",
        instruction1: "Choose the number of phases for your debate",
        instruction2: "Fill in the required fields for each phase by selecting each tab",
        instruction3: "Choose the start and the end of your phase.",
        instruction4: "Choose the phase image for the timeline in the landing page.",
        instruction5: "Write the phase description.",
        successSave: "The timeline has been sucessfully saved",
        selectStart: "Phase %{count}'s start date",
        selectEnd: "Phase %{count}'s end date",
        warningLabel: "The dates you have set for this phase are overlapping the previous phase or the next phase"
      },
      modules: {
        noModule: "No module",
        survey: "Survey module",
        thread: "Thread module",
        messageColumns: "Multi-columns module",
        voteSession: "Vote module",
        brightMirror: "Bright Mirror module"
      },
      noTimeline: "No timeline has been configured yet",
      survey: {
        createTable: "Create the themes table",
        exportData: "Export data",
        configThematic: "Configure the theme",
        configThematics: "Configure the themes",
        configThematicsHelperTitle: "You have chosen to configure a themes table.",
        configThematicsHelperDescription: "To change your choice, return to the general setting of the debate."
      },
      voteSession: {
        configureVoteSession: "Configure vote session associated to the theme",
        "0": "Vote session page configuration",
        "1": "Configure the voting modules",
        "2": "Configure the voting proposals",
        "3": "Export data"
      },
      imageRequirements: "The image must have a height of 300 px and a width of 1280 px. Its size has to be under 300 kB.",
      voteWithTokens: "Tokens vote",
      voteWithGauges: "Gauge(s) vote",
      gauge: "Gauge %{number}",
      token: "Token %{number}",
      tokenVoteCheckbox:
        "The token vote module allows you to select propositions proportionnaly. Each participant has a certain amount of tokens et will have to spread them on the different propositions",
      gaugeVoteCheckbox: "You can choose to have one or several gages",
      headerTitle: "Top page Header configuration",
      propositionSectionTitle: "Proposals section title configuration",
      instructions: "Instructions section configuration",
      summary: "Summary section configuration",
      voteSessionSuccess: "The vote session is saved with success.",
      exclusive: "Exclusive",
      tokenVoteInstructions: "Instructions for the token vote",
      gaugeVoteInstructions: "Instructions for the gauge vote",
      proposalSectionTitle: "Proposal section title configuration",
      gaugeNumber: "Gauge number",
      defineGaugeNumer: "Define gauges number",
      minValue: "Minimum value",
      maxValue: "Maximum value",
      unit: "Unit",
      configureVoteSessionButton: "Configure a vote session",
      goBackToThematic: "Go back to thematic",
      saveBeforeConfigureVoteSession: "Please save before you can access to the vote session configuration",
      postsExistsWarning:
        "This thematic contains posts. If you change the module, you'll delete all messages associated to this thematic when you'll save.",
      configureVoteSession: "You need to configure a vote session.",
      configureVoteModules: "You need to configure at least one vote module.",
      saveFirstStep: "Please return to step 1 and save the instructions first.",
      saveSecondStep: "Please return to step 2 and configure and save the vote modules.",
      backToPreviousStep: "Return to step %{number}",
      nbTicksHelper: "Define ticks number for the gauge",
      nbTicks: "Ticks number",
      textValue: "Textual value",
      valueTitle: "Value title",
      numberValue: "Number value",
      tokenCategoryNumber: "Number of token types",
      tokenNumber: "Number of tokens per participant",
      tokenTitle: "Token title",
      tokenColor: "Color of the token",
      notExclusive: "Not exclusive",
      voteProposals: {
        sectionTitle: "Configure the proposals associated to the vote modules",
        gauge: "Gauge %{number}",
        customGauge: "Gauge %{number} (customized for this proposal)",
        defineProposal: "Define proposal %{number}",
        addProposal: "Add a proposal",
        deleteProposal: "Delete this proposal",
        deleteModalTitle: "Confirm deletion",
        deleteModalBody: "Are you sure you want to delete this proposal?",
        title: "Title of the proposal",
        description: "Description",
        tokenVote: "Token vote",
        edit: "Modify",
        gaugeSettings: "Edit settings",
        cancelCustomization: "Cancel settings",
        validationErrors: {
          atLeastOneModule: "You should select at least one module."
        }
      },
      gaugeModal: {
        title: "Modification of the gauge's settings",
        subTitle:
          "You are about to modify the settings on this gauge only. If you wish to modify all of the gauges, please check the box at the end of the form.",
        applyToAllProposalsCheckboxLabel: "Apply these changes to all of the proposals"
      },
      seeCurrentVotes: "Do you want participants to see the evolution of the votes in progress?",
      resultsVisible: "Yes, even before having voted.",
      resultsNotVisible: "No, only show the results once the vote is closed.",
      sections: {
        addSection: "Add a section",
        deleteSection: "Delete the section",
        resources_center: "Resources center",
        custom: "Added section",
        externalPage: "Use external page",
        titlePh: "Title",
        urlPh: "URL",
        successSave: "Sections are modified with success",
        sectionsTitle: "Set sections"
      },
      helpers: {
        surveyQuestion:
          "The survey module is composed of one question and a response field dedicated to the participant. You can add questions by clicking on the + icon below.",
        timelinePhases: "Choose a description and an image for each phase of the debate displayed in the landing page",
        timelineTitle: "Configure the title and the sub-title of the timeline section displayed in the landing page",
        voteSessionProposalSection:
          "The proposals section is introduced by a title. You define the title based on the proposal content.",
        tokenCategoryNumber: "Select the number of different token types for this vote",
        exclusive:
          "You can decide wether the participant can distribute a single type of token (exclusive) or several types of token per proposal.",
        tokenVoteInstructions: "Depending on the objective of the token module, incite the participants to take action.",
        gaugeVoteInstructions: "Depending on the objective of the gauge module, incite the participants to take action.",
        landingPage: {
          header:
            "Top page header. It contains the consultation's title and subtitle and a button to access to the consultation.",
          timeline: " ",
          tweets: " ",
          chatbot: " ",
          news: " ",
          introduction: " ",
          data: " ",
          footer: " ",
          video: " ",
          contact: " ",
          top_thematics: " ",
          partners: " "
        }
      },
      videoHelp:
        "*Authorized video links: \"https://www.youtube.com/embed/[videoId]\" or \"https://player.vimeo.com/video/[videoId]?\"",
      annotation: "* Fields are required.",
      discussion: {
        "0": "Discussion preferences",
        "3": "Registration options",
        "4": "Legal contents",
        "5": "Edition of the phases",
        "6": "Personalize the interface"
      },
      languageChoice: "Select desired languages below",
      moderation: "Post pending for moderation",
      activateModeration: "Activate the moderation",
      translation: "Option to translate messages",
      activateTranslation: "Activate the option for users to translate the messages",
      ph: {
        propositionSectionTitle: "Section title",
        propositionSectionSubtitle: "Section subtitle",
        descriptionPhase: "Description phase"
      },
      tableOfThematics: {
        quote: "Quote",
        bannerHeader:
          "Top banner must include the thematic title defined previously, a background image and eventually a subtitle.",
        thematicTitle: "Thematic title",
        bannerSubtitleLabel: "Top banner subtitle",
        bannerImagePickerLabel: "Banner image",
        moduleTypeLabel: "Participation module configuration",
        instructionHeader:
          "Instruction section include a title, an instruction and a media (video, slideshare or image) which guides users in their contribution.",
        instructionLabel: "Instructions",
        summaryHeader: "The 'Summary' section contains a brief abstract of the thematic and can be enriched with various medias.",
        summaryLabel: "Summary",
        sectionTitleLabel: "Section title",
        questionsHeader: "Questions",
        confirmDeletionTitle: "Delete %{title} theme",
        confirmDeletionBody: "Are you sure that you wish to delete this theme?",
        multiColumnsFormName1: "2 columns",
        multiColumnsFormName2: "3 columns",
        columnsConfiguration: "Columns configuration",
        columnTitle: "Column title",
        columnName: "Column name",
        columnColor: "Column color",
        columnSynthesisSubject: "Column synthesis title",
        columnSynthesisBody: "Column synthesis"
      },
      resourcesCenter: {
        createResource: "Add a media",
        menuTitle: "Edit the resources center",
        title: "Resources center",
        editResourceFormTitle: "Edit resource number %{count}",
        textLabel: "Text",
        titleLabel: "Title",
        embedCodeLabel: "Video/Slides",
        deleteResource: "Delete the resource",
        documentLabel: "Document",
        imageLabel: "Image",
        successSave: "Resources have been saved with success!",
        pageTitleLabel: "Page title",
        headerImageLabel: "Header image"
      },
      export: {
        defaultAnnotation: "You can export all of the data by clicking on the export button",
        taxonomyAnnotation: "You can export all of the taxonomies by clicking on the export button",
        link: "Export",
        noExportLanguage: "Keep the messages in their original languages",
        title: "Export the debate data",
        defaultSectionTitle: "Export data",
        taxonomySectionTitle: "Export taxonomy",
        translateTheMessagesIn: "Translate the messages in:",
        anonymity: "Anonymity",
        translation: "Translation of the data",
        anonymous: "Make the data anonymous",
        contributions: "Contributions of the participants",
        exportDate: "Export date",
        startDate: "Start date",
        endDate: "End date",
        presets: {
          today: "Today",
          lastWeek: "Last week",
          lastMonth: "Last month",
          phase: "Phase %{count}",
          fullDebate: "All of the debate",
          placeHolder: "Presets"
        },
        vote: {
          voteResultsCsv: "Export general data for the vote module",
          extractCsvVoters: "Export vote details for each user"
        }
      },
      step_x_total: "Section %{num} on %{total}",
      saveThemes: "Save",
      successThemeCreation: "Themes have been saved with success!",
      successDiscussionPreference: "Discussion preferences have been saved with success!",
      legalContents: {
        legalNoticeLabel: "Legal notice",
        termsAndConditionsLabel: "Terms and conditions",
        cookiesPolicyLabel: "Information on cookies",
        privacyPolicyLabel: "Privacy policy",
        userGuidelinesLabel: "User guidelines",
        successSave: "The legal contents have been saved with success!",
        mandatoryLegalContentsValidation: "Activate the modal to accept legal contents at the first visit.",
        legalContentsValidation: "Acceptation of the legal contents for users identified via SSO"
      },
      landingPage: {
        manageModules: {
          title: "Manage the modules",
          helper: "Choose the modules you want to see in the landing page and their position.",
          textAndMultimedia: "Text & Multimedia",
          textAndMultimediaBtn: "Add a Text & Multimedia module",
          confirmationModal: "Are you sure you want to add a Text & Multimedia module to the landing page?"
        },
        header: {
          successSave: "The header has been updated successfully!",
          title: "Header",
          helper: "Customize appearance of the header.",
          logoHelper: "Choose the logo inside of the header",
          titleLabel: "Debate title",
          subtitleLabel: "Debate subtitle",
          buttonLabel: "Name of the referral button to the debate",
          headerImage: "Choose the header image",
          logoImage: "Choose the header logo",
          headerDescription: "The image must have a height of 450px and a width of 1280px. The weight must not exceed 1 MB.",
          logoDescription:
            "The logo must have a maximum height of 78px and a maximum width of 200px. The weight must not exceed 1 MB. The background must be transparent.",
          startDate: "From",
          endDate: "To",
          timePlaceholder: "Optional: Enter the dates of the debate",
          dateDescription:
            "Please enter the debate's date range. If no dates are selected, the dates are inferred from the timelines created.",
          startDateError: "The start date cannot be after the end date",
          endDateError: "The end date cannot be after the start date"
        },
        timeline: {
          title: "Timeline on the landing page",
          image: "Choose the image for this phase",
          sectionTitle: "Configure the title and the subtitle of the section",
          imageDescription: "The image must have a height of 500px and a width of 400px."
        },
        successSave: "The modules have been saved with success!",
        headerSuccessSave: "The home page header have been saved with success!"
      },
      profileOptions: {
        addTextField: "Add a field",
        createNewFieldModalBody: "Select the field type you want to add to the register page:",
        choiceTextField: "Text field",
        choiceSelectField: "Dropdown field",
        addSelectFieldOption: "Add a new item",
        deleteTextField: "Delete the field",
        deleteSelectFieldOption: "Delete this item",
        toggleLegalContentIntro: "Make the legal validation mandatory or not for a user after signing up in the platform by SSO.",
        LegalContentButton: "Activate the mandatory validation of the legal contents",
        introText:
          "Configure the fields that you want to display in the registration form. Fill in the names and whether the fields are required or optional.",
        textFieldToggleOptional: "Make this field optional",
        textFieldToggleRequired: "Make this field required",
        successSave: "The profile options has been saved with success!",
        hideTextField: "Hide this field for the user"
      },
      personalizeInterface: {
        success: "The interface personalization has been saved with success!",
        titleFormTitle: "Personalize the title of the page",
        title: "Web page Title (visual 1)",
        favicon: "Favicon (visual 2)",
        faviconInstruction: "Favicon should have a maximum height of 110px. Its extension should be .ico",
        logoInstruction:
          "Logo should have a maximum height of 110px and a maximum width of 215px. The background must be transparent.",
        icoRequired: "The favicon must be an .ico file only"
      }
    },
    unauthorizedAdministration: {
      unauthorizedMessage:
        "You are not authorized to access the administration section. Please contact the administrator of the website.",
      returnButton: "Back to home"
    },
    date: {
      format: "MMMM Do, YYYY",
      format2: "YYYY-MM-DD",
      format3: "MM/DD/YYYY"
    },
    duration: {
      format: "h [h]"
    },
    form: {
      select: {
        placeholder: "Select...",
        noOptions: "No options",
        newOption: "Create '%{option}'"
      }
    }
  }
};

module.exports = Translations; // keep commonJS syntax for the node i18n:export script to work