--For each LCO platform a new default wallet must be created
insert into  roles (roleid, rolename) VALUES ('user','User');
insert into  roles (roleid, rolename) VALUES ('admin','Admin');
insert into  roles (roleid, rolename) VALUES ('superadmin','SuperAdmin');
insert into identities (identityid,roleid, email, username, password, identitysignature, identity, prelabel) VALUES
    ('System','superadmin','system@admin.main','System','100010010010101','','{}','');

insert into identities (identityid,roleid, email, username, password, identitysignature, identity, prelabel) VALUES
    ('10020304','admin','admin@site.com','admin','100010010010101','','{}','');


select lcoadd('{"lcoid":"multitenant"}','{}','{"identityid":"System"}');

/**/

select walletadd('{"walletid":"demo-main","resellerid":"demo","lcoid":"multitenant"}','{}','{"identityid":"10020304"}');
select walletadd('{"walletid":"demo-second","resellerid":"demo-second","lcoid":"multitenant"}','{}','{"identityid":"10020304"}');


select createassets('{
  "lcoid":"multitenant",
  "walletid":"multitenant","type":"1M",
  "quantity":5,"product":"multitenant-1M"
}','{}','{"identityid":"01020304"}');

rollback;
begin transaction;
select revealAssets('{
  "assets":["demo-main-000030-00000000090","demo-main-000030-00000000091","demo-main-000030-00000000092"]
}','{}','{"identityid":"01020304","walletid":"demo-main"}');

select * from assets;

/*Register*/

select * from subaccounts;
select * from accounts;
select * from assets;
select * from assets where assetpin = '4025387338368906';
select * from assets where assetcode = '55ap85jtf6twtuuu';

rollback;

begin transaction;
select subaccountregister('{
  "subaccountid":"01020304-050607",
  "lcoid":"multitenant",
  "uuid":"010203041",  "arsuid":"05060708",  "ip":"192.168.0.1",  "useragent":"UA",  "macadd": "01:02:03:04:05:06",  "serialnum":"1234567890",  "androiduid":"Android-001",  "name":"",  "email":""
}','{}','{"identityid":"01020304"}');

select SessioningIn('{
  "subaccountid":"01020304-050607",
  "mmt":"ky4exr21exjhn8op",
  "lcoid":"multitenant",
  "uuid":"010203041",  "arsuid":"05060708",  "ip":"192.168.0.1"
}','{}','{"identityid":"01020304"}');

select redeempinasset('{
  "subaccountid":"01020304-050607",
  "mmtpin":"4025387338368906",
  "lcoid":"multitenant",
  "uuid":"010203041",
  "arsuid":"05060708",
  "ip":"192.168.0.1"
}','{}','{"identityid":"01020304"}');

select SessioningIn('{
  "subaccountid":"01020304-050607",
  "mmt":"ox7ecoc6ptafmoc8",
  "lcoid":"multitenant",
  "uuid":"010203041",
  "arsuid":"05060708",
  "ip":"192.168.0.1"
}','{}','{"identityid":"01020304"}');

select redeempinasset('{
  "subaccountid":"01020304-050607",
  "mmtpin":"5715143186977256",
  "lcoid":"multitenant",
  "uuid":"010203041",
  "arsuid":"05060708",
  "ip":"192.168.0.1"
}','{}','{"identityid":"01020304"}');

