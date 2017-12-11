import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Modal } from 'react-bootstrap';

export default class TermsForm extends React.Component {
  render() {
    return (
      <div className="terms-form">
        <Modal.Header closeButton>
          <Modal.Title>
            <Translate value="termsAndConditions.headerTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="terms-box">
            Le bitcoin vaudra 17 310 dollars le 17 janvier 2018, soit 1000 dollars de plus qu’aujourd’hui. C’est ce que prévoyait
            le Chicago Board Options Exchange (CBOE), dimanche 10 décembre, peu avant 21 heures locales, dans la foulée de
            l’inauguration du premier marché à terme sur la célèbre cryptomonnaie. Cette première a été très discrète, sans
            célébration particulière. Il n’empêche, avec 1400 contrats échangés et une nette progression, elle institutionnalise
            une devise inventée en 2009, qui fait l’objet d’une folie spéculative et vaut au total 250 milliards de dollars. Le
            bitcoin, qui cotait moins de 1 000 dollars au début de l’année, a dépassé les 17 000 la semaine dernière. Simple
            épargnant, n’espérez pas passer par la Bourse de Chicago pour spéculer sur le bitcoin. JP Morgan, Bank of America et
            Citigroup ne donneront pas accès à ce marché à leurs clients, tout comme les entreprises de courtage grand public
            comme Schwab. La banque d’affaires Goldman Sachs le fera, mais avec d’extrêmes précautions pour de riches clients
            triés sur le volet. Les banques sont divisées entre la tentation de participer à un marché juteux – plusieurs dizaines
            de fonds spécialisés dans les cryptomonnaies ont été lancés récemment – et le risque juridique qu’elles prennent en
            permettant à leurs clients d’acheter des produits dont la valeur ne repose sur rien : une action est une part
            d’entreprise ; une obligation est un prêt remboursable ; une devise est garantie par une banque centrale et une
            économie, tandis que le bitcoin n’a aucun sous-jacent. Il n’est que le fruit de l’offre et de la demande. La
            reconnaissance du bitcoin n’est pas complète, loin s’en faut : le CBOE ne cote pas des bitcoins mais des contrats en
            dollars indexés sur le cours du bitcoin (la valeur de ce dernier est déterminée par une bourse extérieure, Gemini,
            spécialisée dans l’échange techniquement complexe des cryptomonnaies). Le Chicago Mercantile Exchange (CME), qui
            emboîtera le pas dans une semaine, aura pour référence quatre autres bourses (Bitstamp, GDAX, itBit et Kraken). On le
            voit, à Chicago, on est prudent : nul n’achètera ni ne vendra de vrais bitcoins. Selon ses défenseurs, la cotation
            indirecte du bitcoin à Chicago, qui permet de vendre à terme et donc de spéculer à la baisse, pourrait tempérer la
            folie haussière. Des mesures de précaution ont été prises pour éviter les faillites sur ce marché hautement volatil :
            un dépôt supérieur à 40 % du prix du contrat sera exigé, tandis que les variations de cours supérieures à 10 % et 20 %
            entraîneront l’arrêt momentané des cotations. Sur le papier, il semble possible de manipuler indirectement le marché
            de Chicago en achetant ou vendant de vrais bitcoins sur les cinq bourses partenaires du CME et du CBOE qui ont des
            volumes très faibles. Mais, explique le Wall Street Journal, ces bourses assurent avoir pris des mesures
            anti-blanchiment et avoir renforcé leur régulation. En attendant, l’histoire devra trancher, entre ceux qui dénoncent
            une bulle spéculative voire une escroquerie et ceux qui décèlent une invention géniale, la monnaie de demain. Alan
            Greenspan, l’ancien président de la Réserve fédérale américaine, fait partie des premiers, qui a jugé que le bitcoin
            n’était pas une « monnaie rationnelle ». Il l’a comparé au « Continental », monnaie papier créée par les
            révolutionnaires américains en 1775 et qui finit par s’effondrer en 1782.
          </div>
        </Modal.Body>
      </div>
    );
  }
}