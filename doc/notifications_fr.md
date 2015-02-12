discussion default = les notifications auxquelles ça nous abonne quand on clique sur s'abonner

états possibles d'une notification pour un user :
- 1. abonné car l'utilisateur l'a demandé explicitement (USER_REQUESTED && ACTIVE)
- 2. abonné de manière implicite (DISCUSSION_DEFAULT && ACTIVE)
- 3. pas abonné (désabonné) de manière implicite (DISCUSSION_DEFAULT && INACTIVE_DFT)
- 4. pas abonné car l'utilisateur l'a demandé explicitement (USER_REQUESTED && UNSUBSCRIBED)
- 5. n'a jamais été abonné (quelle combinaison ?). C'est l'état utilisé lorsque l'utilisateur ne s'est jamais abonné ni désabonné à cette notification. Ça produit le même effet que "pas abonné de manière implicite"

Si un administrateur modifie les abonnements par défaut de la discussion en ajoutant des abonnements, les abonnements de tous les utilisateurs seront parcourus et les abonnements ajoutés passeront à l'état 2 s'ils étaient à l'état 3.

Si un administrateur modifie les abonnements par défaut de la discussion en supprimant des abonnements, les abonnements de tous les utilisateurs seront parcourus et les abonnements ajoutés passeront à l'état 3 s'ils étaient à l'état 2.

Si un utilisateur active manuellement une notification désactivée dans ses paramètres, elle passe à l'état 1. Elle ne pourra ensuite que repasser à l'état 4.

Si un utilisateur déactive manuellement une notification activée dans ses paramètres, elle passe à l'état 4. Elle ne pourra ensuite que repasser à l'état 1.

Exemple de cas d'utilisation 1 :
- les abonnements par défaut de la discussion sont synthèse et réponses directes
- un utilisateur s'inscrit
- toutes ses notifications sont dans l'état 5
- l'utilisateur clique sur s'abonner
- les notifications synthèse et réponses de l'utilisateur passent à l'état 2.
- l'administrateur supprime la notification par défaut de synthèse
- la notification synthèse de l'utilisateur passe à l'état 3.
- l'utilisateur modifie ses paramètres de notifications et active les synthèses
- la notification synthèse de l'utilisateur passe à l'état 1.


Exemple de cas d'utilisation 2 :
- les abonnements par défaut de la discussion sont synthèse et réponses directes, et la discussion auto-abonne à l'inscription
- un utilisateur s'inscrit
- toutes ses notifications sont dans l'état 5
- il confirme son inscription en cliquant sur le lien présent dans l'adresse email
- ses notifications de synthèse et de réponses directes passent à l'état 2.
