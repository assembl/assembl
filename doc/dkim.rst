DKIM procedure
Mostly following

https://help.ubuntu.com/community/Postfix/DKIM

sudo apt-get install opendkim opendkim-tools

sudo mkdir -p /etc/opendkim/keys    # if necessary
sudo chown opendkim:opendkim /etc/opendkim /etc/opendkim/keys
cd !$
sudo -u opendkim opendkim-genkey -t -s mail -d <domain name>
# They should be in -rw------- mode.

sudo cat mail.txt

You'll see something like
mail._domainkey IN  TXT ( "v=DKIM1; k=rsa; t=y; "
      "p=MIGfMA0GCS......" )  ; ----- DKIM key mail for <domain name>

The quoted value (make sure to collapse quotes) needs to be a TXT record in the DNS for
mail._domainkey.<domain name>

While you're there, there should be another TXT record for
`_dmarc.<domain name>` containing `v=DMARC1; p=reject; rua=postmaster@myorganization.com`

(Use a postmaster address that exists; it can be on the same domain on your organization's domain)

sudo mv mail.private <domain name>.private
sudo mv mail.txt <domain name>.txt

# IF THERE IS A SINGLE ASSEMBL SERVER ON YOUR MACHINE

Edit /etc/opendkim.conf to add or set

    AutoRestart             Yes
    AutoRestartRate         10/1h
    Domain          <domain name>
    KeyFile     /etc/opendkim/keys/<domain name>.private
    Selector        mail
    Canonicalization    relaxed/simple
    Socket        inet:12345@localhost

# ELSE, IF THERE ARE MULTIPLE ASSEMBL SERVERS ON YOUR MACHINE

Edit /etc/opendkim.conf to add or set

    AutoRestart             Yes
    AutoRestartRate         10/1h
    Selector        mail
    Canonicalization    relaxed/simple
    Socket        inet:12345@localhost
    ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
    InternalHosts           refile:/etc/opendkim/TrustedHosts
    KeyTable                refile:/etc/opendkim/KeyTable
    SigningTable            refile:/etc/opendkim/SigningTable

Edit /etc/opendkim/TrustedHosts:
    localhost
    127.0.0.1
    <domain name 1>
    <domain name 2>
    ...

Edit /etc/opendkim/KeyTable:
    mail._domainkey.<domain name 1> <domain name 1>:mail:/etc/opendkim/keys/<domain name 1>.private
    mail._domainkey.<domain name 2> <domain name 2>:mail:/etc/opendkim/keys/<domain name 2>.private
    ...

Edit /etc/opendkim/SigningTable:
    *@<domain name 1> mail._domainkey.<domain name 1>
    *@<domain name 2> mail._domainkey.<domain name 2>
    ...


# ENDIF

Edit /etc/default/opendkim
Uncomment
    SOCKET="inet:12345@localhost"
And comment out (if necessary)
    SOCKET="local:/var/run/opendkim/opendkim.sock"

sudo /etc/init.d/opendkim start
If it fails, try removing the Socket line from /etc/opendkim.conf , it works on some servers and not others.
tail /var/log/mail.log
and make sure you see
OpenDKIM Filter v2.10.3 starting (args: -x /etc/opendkim.conf -u opendkim -P /var/run/opendkim/opendkim.pid -p inet:12345@localhost)
vs
OpenDKIM Filter v2.10.3 starting (args: -x /etc/opendkim.conf -u opendkim -P /var/run/opendkim/opendkim.pid -p local:/var/run/opendkim/opendkim.sock)


When DNS is propagated, edit /etc/postfix/main.cfg
and append
    # DKIM
    milter_default_action = accept
    milter_protocol = 2
    smtpd_milters = inet:localhost:12345
    non_smtpd_milters = inet:localhost:12345

sudo /etc/init.d/postfix restart

