drop table fastplaylog;

/*==============================================================*/
/* Table: fastplaylog                                           */
/*==============================================================*/
create table fastplaylog (
                             id                   bigserial            not null,
                             channelid            text                 null,
                             videoid              numeric(10)          null,
                             title                text                 null,
                             status               text                 null,
                             errmsg               text                 null,
                             url                  text                 null,
                             created_at           timestamp with time zone not null default current_timestamp,
                             constraint pk_fastplaylog primary key (id)
);


alter table channels add publish bool not null default true;

alter table channels add orden numeric(10) not null default 1000;

alter table clients add substatus            varchar(20)          not null default 'Active';


drop table plans cascade;
drop table clients cascade ;
/*==============================================================*/
/* Table: plans                                                 */
/*==============================================================*/
create table plans (
                       plan                 varchar(60)          not null,
                       "desc"               varchar(250)         null,
                       obs                  text                 null,
                       created_at           timestamp with time zone not null default current_timestamp,
                       created_by           jsonb                not null default '{"identityid":"System"}',
                       modified_at          timestamp with time zone null default current_timestamp,
                       modified_by          jsonb                null default '{"identityid":"System"}',
                       constraint pk_plans primary key (plan)
);

insert into plans (plan) values ('Basico');

/*==============================================================*/
/* Table: clients                                               */
/*==============================================================*/
create table clients (
                         clientid               serial               not null,
                         tenantid             varchar(250)         not null default 'Local',
                         plan                 varchar(60)          not null default 'Basico',
                         username             varchar(250)         not null,
                         password             varchar(250)         not null,
                         account              varchar(250)         null,
                         name                 varchar(250)         null,
                         lastname             varchar(250)         null,
                         email                varchar(100)         null,
                         phone                varchar(50)          null,
                         location             varchar(250)         null,
                         info                 jsonb                not null default '{}',
                         maxdevices           numeric(3)           not null default 1
                             constraint ckc_maxdevices_clients check (maxdevices >= 1),
                         obs                  text                 null,
                         status               varchar(64)          not null default 'enabled',
                         istrial              bool                 not null default false,
                         expiration           timestamp with time zone not null default current_timestamp,
                         created_at           timestamp with time zone not null default current_timestamp,
                         created_by           jsonb                not null default '{"identityid":"System"}',
                         modified_at          timestamp with time zone null default current_timestamp,
                         modified_by          jsonb                null default '{"identityid":"System"}',
                         constraint pk_clients primary key (clientid)
);

/*==============================================================*/
/* Index: idx_username                                          */
/*==============================================================*/
create unique index idx_username on clients (
                                             tenantid,
                                             username
    );
/*==============================================================*/
/* Table: clientlocations                                       */
/*==============================================================*/
create table clientlocations (
                                 locationid           serial               not null,
                                 userid               int4                 not null,
                                 inet                 varchar(250)         null,
                                 status               varchar(20)          not null default 'allowed',
                                 constraint pk_clientlocations primary key (locationid)
);

alter table clientlocations
    add constraint fk_clientlo_reference_clients foreign key (userid)
        references clients (clientid)
        on delete cascade on update cascade;


alter table clients
    add constraint fk_clients_reference_plans foreign key (plan)
        references plans (plan)
        on delete cascade on update cascade;



alter table videos add info jsonb not null default '{}';

drop index idx_path;

drop table tvshows cascade;

/*==============================================================*/
/* Table: tvshows                                               */
/*==============================================================*/
create table tvshows (
                         tvshowid             numeric(6)           not null,
                         categoryid           jsonb                not null default '[]',
                         name                 varchar(250)         null,
                         status               varchar(25)          not null default 'enabled',
                         publishstatus        varchar(25)          not null default 'unpublished',
                         meta                 jsonb                not null default '{}',
                         icon                 varchar(250)         null,
                         tmdb_id              numeric(10)          null,
                         tmdb                 jsonb                not null default '{}',
                         seasons              jsonb                not null default '[]',
                         numseasons           numeric(2)           not null default 1
                             constraint ckc_numseasons_tvshows check (numseasons >= 1),
                         prepath              varchar(250)         not null default 'tvshows',
                         path                 varchar(250)         null,
                         localpath            varchar(250)         null,
                         urlpath              varchar(100)         null,
                         sourcetype           varchar(20)          null default 'fast',
                         orden                numeric(10)          not null default 9999,
                         playmode             varchar(50)          not null default 'random',
                         direct_source        numeric(2)           not null default 1,
                         url_source           jsonb                not null default '[]',
                         originvideos         numeric(2)           not null default 0,
                         created_at           timestamp with time zone not null default current_timestamp,
                         created_by           jsonb                not null default '{"identityid":"System"}',
                         modified_at          timestamp with time zone null default current_timestamp,
                         modified_by          jsonb                null default '{"identityid":"System"}',
                         constraint pk_tvshows primary key (tvshowid)
);

/*==============================================================*/
/* Index: idx_path                                              */
/*==============================================================*/
create unique index idx_path on tvshows (
                                         path
    );


alter table videos
    add constraint fk_videos_reference_tvshows foreign key (tvshowid)
        references tvshows (tvshowid)
        on delete set null on update cascade;



drop table params;

/*==============================================================*/
/* Table: params                                                */
/*==============================================================*/
create table params (
    paramid              varchar(64)          not null,
    mode                 varchar(64)          not null default 'debug',
    value                varchar(255)         null,
    constraint pk_params primary key (paramid, mode)
);

insert into params (paramid, mode, value) values ('images','production','http://client10.xisrv.xyz');



alter table videos add httpcode numeric(10) not null default 0;
alter table videos add issues jsonb not null default '[]';

alter table videos add tvshowid             numeric(10);

alter table videos add categories jsonb not null default '[]';


alter table channels add stream_type varchar not null default 'created_live';

alter table channels add direct_source          numeric(2) not null default  1;
alter table channels add url_source          jsonb not null default  '[]';
alter table channels add localpath varchar(100) not null default '';

rollback;
alter table identities
    alter column telegram type jsonb using telegram::jsonb;

alter table identities
    alter column telegram set not null;

alter table identities
    alter column telegram set default '{}';
update identities set telegram = '{}';




alter table  transactions add trcode               varchar(10)          null;
alter table transactions
    add constraint fk_transact_reference_pendingt foreign key (trcode)
        references pendingtransactions (trcode)
        on delete set null on update cascade;

alter table assets add lcoproductid         varchar(100)         null;
alter table assets
    add constraint fk_assets_reference_lcoprodu foreign key (lcoproductid)
        references lcoproducts (lcoproductid)
        on delete set null on update cascade;

create table namesof (
                         key                  varchar(100)         not null,
                         lang                 varchar(2)           not null default 'es',
                         value                jsonb                null,
                         constraint pk_namesof primary key (key)
);


drop table lcoproducts;

/*==============================================================*/
/* Table: lcoproducts                                           */
/*==============================================================*/
create table lcoproducts (
                             lcoproductid         varchar(100)         not null,
                             lcoid                varchar(100)         not null,
                             assettype            varchar(100)         not null,
                             name                 varchar(100)         null,
                             icon                 varchar(100)         null,
                             giftcard             varchar(100)         null,
                             version              varchar(100)         null,
                             obs                  text                 null,
                             status               varchar(10)          not null default 'active',
                             expires              timestamp with time zone null,
                             created_at           timestamp with time zone not null default current_timestamp,
                             created_by           jsonb                not null default '{"identityid":"System"}',
                             modified_at          timestamp with time zone null default current_timestamp,
                             modified_by          jsonb                null default '{"identityid":"System"}',
                             constraint pk_lcoproducts primary key (lcoproductid)
);


/*==============================================================*/
/* Table: walletorders                                          */
/*==============================================================*/
create table walletorders (
                              orderid              varchar(100)         not null,
                              lcoproductid         varchar(100)         not null,
                              walletidsource       varchar(100)         not null,
                              walletid             varchar(100)         not null,
                              transactionassetid   numeric(10)          null,
                              quantity             varchar(100)         not null default '1'
                                  constraint ckc_quantity_walletor check (quantity >= '1'),
                              obs                  text                 null,
                              status               varchar(10)          not null default 'active',
                              expires              timestamp with time zone null,
                              created_at           timestamp with time zone not null default current_timestamp,
                              created_by           jsonb                not null default '{"identityid":"System"}',
                              modified_at          timestamp with time zone null default current_timestamp,
                              modified_by          jsonb                null default '{"identityid":"System"}',
                              constraint pk_walletorders primary key (orderid)
);

alter table walletorders
    add constraint fk_walletor_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete cascade on update cascade;

alter table walletorders
    add constraint fk_walletor_reference_lcoprodu foreign key (lcoproductid)
        references lcoproducts (lcoproductid)
        on delete cascade on update cascade;

alter table walletorders
    add constraint fk_walletor_reference_wallets foreign key (walletidsource)
        references wallets (walletid)
        on delete cascade on update cascade;

alter table walletorders
    add constraint fk_walletor_reference_transact foreign key (transactionassetid)
        references transactions (transactionassetid)
        on delete set null on update cascade;

alter table lcoproducts
    add constraint fk_lcoprodu_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete cascade on update cascade;

alter table lcoproducts
    add constraint fk_lcoprodu_reference_assettyp foreign key (assettype)
        references assettypes (assettype)
        on delete cascade on update cascade;
alter table walletorders
    add constraint fk_walletor_reference_wallets2 foreign key (walletidsource)
        references wallets (walletid)
        on delete cascade on update cascade;


alter table assets add statushistoric       jsonb                not null default '[]';

/*==============================================================*/
/* Table: pendingconfirmations                                  */
/*==============================================================*/
create table pendingconfirmations (
                                      id                   serial               not null,
                                      trcode               varchar(10)          not null,
                                      type                 varchar(100)         not null default 'email',
                                      code                 varchar(100)         null,
                                      link                 varchar(100)         null,
                                      status               varchar(100)         not null default 'pending',
                                      expires              timestamp with time zone not null default current_timestamp,
                                      created_at           timestamp with time zone not null default current_timestamp,
                                      created_by           jsonb                not null default '{"identityid":"System"}',
                                      constraint pk_pendingconfirmations primary key (id)
);

alter table pendingconfirmations
    add constraint fk_pendingc_reference_pendingt foreign key (trcode)
        references pendingtransactions (trcode)
        on delete cascade on update cascade;


/*==============================================================*/
/* Table: pendingtransactions                                   */
/*==============================================================*/
create table pendingtransactions (
                                     trcode               varchar(10)          not null,
                                     walletid             varchar(100)         not null,
                                     transacion           varchar(100)         null,
                                     typecode             varchar(100)         not null default 'telegram',
                                     status               varchar(100)         not null default 'pending',
                                     data                 jsonb                not null default '{}',
                                     params               jsonb                not null default '{}',
                                     operator             jsonb                not null default '{}',
                                     expires              timestamp with time zone null,
                                     created_at           timestamp with time zone not null default current_timestamp,
                                     created_by           jsonb                not null default '{"identityid":"System"}',
                                     modified_at          timestamp with time zone null default current_timestamp,
                                     modified_by          jsonb                null default '{"identityid":"System"}',
                                     constraint pk_pendingtransactions primary key (trcode)
);

alter table pendingtransactions
    add constraint fk_pendingt_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete cascade on update cascade;


drop table identityverifications;

/*==============================================================*/
/* Table: identityverifications                                 */
/*==============================================================*/
create table identityverifications (
                                       id                   serial               not null,
                                       identityid           varchar(100)         not null,
                                       type                 varchar(100)         not null default 'email',
                                       code                 varchar(100)         null,
                                       link                 varchar(100)         null,
                                       status               varchar(100)         not null default 'pending',
                                       expires              timestamp with time zone not null default current_timestamp,
                                       created_at           timestamp with time zone not null default current_timestamp,
                                       created_by           jsonb                not null default '{"identityid":"System"}',
                                       constraint pk_identityverifications primary key (id)
);

alter table identityverifications
    add constraint fk_identity_reference_identiti foreign key (identityid)
        references identities (identityid)
        on delete cascade on update cascade;




alter table walletaccess
    drop constraint pk_walletaccess;

alter table walletaccess
    add constraint pk_walletaccess
        primary key (identityid, walletid);


/*==============================================================*/
/* Table: pendingtransactions                                   */
/*==============================================================*/
create table pendingtransactions (
                                     trcode               varchar(10)          not null,
                                     walletid             varchar(100)         not null,
                                     transacion           varchar(100)         null,
                                     typecode             varchar(100)         not null default 'telegram',
                                     status               varchar(100)         not null default 'pending',
                                     data                 jsonb                not null default '{}',
                                     params               jsonb                not null default '{}',
                                     operator             jsonb                not null default '{}',
                                     expires              timestamp with time zone null,
                                     created_at           timestamp with time zone not null default current_timestamp,
                                     created_by           jsonb                not null default '{"identityid":"System"}',
                                     modified_at          timestamp with time zone null default current_timestamp,
                                     modified_by          jsonb                null default '{"identityid":"System"}',
                                     constraint pk_pendingtransactions primary key (trcode)
);

alter table pendingtransactions
    add constraint fk_pendingt_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete cascade on update cascade;

create sequence  s_pendingtransactions;

alter table walletaccess
    drop constraint fk_walletac_reference_identiti;
alter table walletaccess
    add constraint fk_walletac_reference_identiti foreign key (identityid)
        references identities (identityid)
        on delete cascade on update cascade;


alter table domains add urlemailverificator  varchar(100);

/*==============================================================*/
/* Table: identityverifications                                 */
/*==============================================================*/
create table identityverifications (
                                       id                   serial               not null,
                                       identityid           varchar(100)         not null,
                                       type                 varchar(100)         not null default 'email',
                                       code                 varchar(100)         null,
                                       link                 varchar(100)         null,
                                       status               varchar(100)         not null default 'pending',
                                       duration             numeric(10)          not null default 3600,
                                       created_at           timestamp with time zone not null default current_timestamp,
                                       created_by           jsonb                not null default '{"identityid":"System"}',
                                       constraint pk_identityverifications primary key (id)
);
alter table identityverifications
    add constraint fk_identity_reference_identiti foreign key (identityid)
        references identities (identityid)
        on delete cascade on update cascade;


alter table identities add domain               varchar(100)         not null default 'default';
alter table identities add    emailverified        bool                 not null default false;
alter table identities add    telegram             varchar(100)         null;
alter table identities add    telegramverified     bool                 not null default false;
alter table identities add    secondfa             varchar(20)          not null default 'pending';


alter table identities
    add constraint fk_identiti_reference_domains foreign key (domain)
        references domains (domain)
        on delete set default on update cascade;

/*==============================================================*/
/* Table: domains                                               */
/*==============================================================*/
create table domains (
                         domain               varchar(100)         not null,
                         email                varchar(256)         not null,
                         name                 varchar(64)          null,
                         description          text                 null,
                         smallimage           varchar(256)         null,
                         mediumimage          varchar(256)         null,
                         largeimage           varchar(256)         null,
                         obs                  text                 null,
                         orden                numeric(10)          not null default 10
                             constraint ckc_orden_domains check (orden >= 0),
                         pordefecto           bool                 not null default false,
                         interno              bool                 not null default false,
                         created_at           timestamp with time zone not null default current_timestamp,
                         created_by           varchar(100)         not null default 'System',
                         modified_at          timestamp with time zone null default current_timestamp,
                         modified_by          varchar(100)         null default 'System',
                         deleted              bool                 not null default false,
                         deleted_at           timestamp with time zone null default current_timestamp,
                         deleted_by           varchar(100)         null default 'System',
                         constraint pk_domains primary key (domain)
);

/*==============================================================*/
/* Table: params                                                */
/*==============================================================*/
create table params (
                        paramid              varchar(64)          not null,
                        mode                 varchar(64)          not null default 'debug',
                        value                varchar(255)         null,
                        constraint pk_params primary key (paramid, mode)
);

insert into params (paramid, mode, value) values ('imgurl','production','https://imgs.multitenant.pro');
insert into params (paramid, mode, value) values ('imgurl','debug','https://imgs.multitenant.pro');
insert into params (paramid, mode, value) values ('mode','all','debug');


alter table  transactions add confirmation         jsonb                not null default '{}';
alter table  transactions add status               varchar(100)         not null default 'pending';

/*==============================================================*//*==============================================================*//*==============================================================*//*==============================================================*/
/*==============================================================*//*==============================================================*//*==============================================================*//*==============================================================*/
/*==============================================================*//*==============================================================*//*==============================================================*//*==============================================================*/
/*==============================================================*//*==============================================================*//*==============================================================*//*==============================================================*/
drop table lcowallets;
/*==============================================================*/
/*==============================================================*/
/* Table: lcowallets                                            */
/*==============================================================*/
create table lcowallets (
                            walletid             varchar(100)         not null,
                            lcoid                varchar(100)         not null,
                            status               varchar(10)          not null default 'active',
                            created_at           timestamp with time zone not null default current_timestamp,
                            created_by           jsonb                not null default '{"identityid":"System"}',
                            modified_at          timestamp with time zone null default current_timestamp,
                            modified_by          jsonb                null default '{"identityid":"System"}',
                            constraint pk_lcowallets primary key (walletid, lcoid)
);

alter table lcowallets
    add constraint fk_lcowalle_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete cascade on update cascade;

alter table lcowallets
    add constraint fk_lcowalle_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete cascade on update cascade;


alter table lcoplatforms add apikey               varchar(100)         null;
alter table identities add apikey               varchar(100)         null;

alter table subaccounts add devicetype           varchar(100)         not null default 'tvapp';

alter table assets
    add constraint fk_assets_reference_accounts foreign key (lcoid, accountid)
        references accounts (lcoid, accountid)
        on delete set null on update cascade;


alter table  assets add duration             interval             not null default '10 minutes';

alter table subaccounts add expiration           timestamp with time zone not null default current_timestamp;

alter table assets add startdate            timestamp with time zone null;
alter table assets add expiration           timestamp with time zone null;

alter table mintings add assettype            varchar(100)         not null default '1M';

alter table mintings
    add constraint fk_mintings_reference_assettyp foreign key (assettype)
        references assettypes (assettype)
        on delete set default on update cascade;

drop table assettypes cascade;

/*==============================================================*/
/* Table: assettypes                                            */
/*==============================================================*/
create table assettypes (
                            assettype            varchar(100)         not null,
                            duration             interval             not null default '1 month',
                            durationtext         varchar(100)         null,
                            istrial              bool                 not null default false,
                            status               varchar(10)          not null default 'active',
                            created_at           timestamp with time zone not null default current_timestamp,
                            created_by           jsonb                not null default '{"identityid":"System"}',
                            modified_at          timestamp with time zone null default current_timestamp,
                            modified_by          jsonb                null default '{"identityid":"System"}',
                            constraint pk_assettypes primary key (assettype)
);

insert into assettypes (assettype, duration,durationtext) values ('1M','1 month','1 Month');
insert into assettypes (assettype, duration,durationtext) values ('3M','3 months','3 Months');
insert into assettypes (assettype, duration,durationtext) values ('6M','6 months','6 Months');
insert into assettypes (assettype, duration,durationtext) values ('12M','1 year','12 Months');
insert into assettypes (assettype, duration,durationtext) values ('24M','2 years','24 Months');
insert into assettypes (assettype, duration,durationtext,istrial) values ('Trial1','7 days','7 Days',true);
insert into assettypes (assettype, duration,durationtext,istrial) values ('Trial2','10 ,minutes','10 Minutes',true);

alter table assets
    add constraint fk_assets_reference_assettyp foreign key (assettype)
        references assettypes (assettype)
        on delete set default on update cascade;



alter table assets add assettype            varchar(100)         null default '1M';

drop table accounts cascade;

drop table assets cascade;

drop table crossurls cascade;

drop table identities cascade;

drop table lcoapps cascade;

drop table lcoplatforms cascade;

drop table mintings cascade;

drop table roles cascade;

drop table subaccounts cascade;

drop table subaccountsessions cascade;

drop table transactionassets cascade;

drop table transactions cascade;

drop table walletaccess cascade;

drop table wallets cascade;

drop sequence s_assets;

drop sequence s_mintings;

drop sequence s_transactions;

create sequence s_assets;

create sequence s_mintings;

create sequence s_transactions;


/*==============================================================*/
/* Table: accounts                                              */
/*==============================================================*/
create table accounts (
                          lcoid                varchar(100)         not null,
                          accountid            varchar(100)         not null,
                          name                 varchar(100)         null,
                          email                varchar(100)         null,
                          username             varchar(100)         null,
                          password             varchar(100)         null,
                          info                 jsonb                null,
                          status               varchar(64)          not null default 'enabled',
                          created_at           timestamp with time zone not null default current_timestamp,
                          created_by           jsonb                not null default '{"identityid":"System"}',
                          modified_at          timestamp with time zone null default current_timestamp,
                          modified_by          jsonb                null default '{"identityid":"System"}',
                          constraint pk_accounts primary key (lcoid, accountid)
);

/*==============================================================*/
/* Table: assets                                                */
/*==============================================================*/
create table assets (
                        assetsid             varchar(100)         not null,
                        walletid             varchar(100)         not null,
                        creator              varchar(100)         null,
                        owner                varchar(100)         null,
                        mintingid            varchar(100)         not null,
                        lcoid                varchar(100)         not null,
                        subaccountid         varchar(100)         null,
                        accountid            varchar(100)         null,
                        assetcode            varchar(100)         not null default '{}',
                        assetencripted       varchar(100)         not null,
                        assetping            varchar(100)         null,
                        pinned               bool                 not null default false,
                        duration             numeric(3)           not null,
                        trial                varchar(100)         null default '7days',
                        trialexpires         timestamp with time zone not null default CURRENT_TIMESTAMP + 7 * INTERVAL '1 day',
                        status               varchar(20)          not null default 'unused',
                        dateredeem           timestamp with time zone null,
                        inforedeem           jsonb                not null default '{}',
                        statusredeem         varchar(100)         not null default 'unredeem',
                        currency             varchar(4)           not null default 'USD',
                        obs                  text                 null,
                        created_at           timestamp with time zone not null default current_timestamp,
                        created_by           jsonb                not null default '{"identityid":"System"}',
                        modified_at          timestamp with time zone null default current_timestamp,
                        modified_by          jsonb                null default '{"identityid":"System"}',
                        constraint pk_assets primary key (assetsid)
);

comment on column assets.lcoid is
    'free
    registrationserver
    signed
    ';

comment on column assets.status is
    'Unused
    Used
    Blocked
    ';

/*==============================================================*/
/* Table: crossurls                                             */
/*==============================================================*/
create table crossurls (
                           url                  varchar(250)         not null,
                           func                 varchar(250)         not null,
                           typeurl              varchar(10)          not null,
                           ordernumber          numeric(10)          not null default 10,
                           bydefault            bool                 not null default false,
                           internal             bool                 not null default false,
                           created_at           timestamp with time zone not null default current_timestamp,
                           created_by           jsonb                not null default '{"identityid":"System"}',
                           modified_at          timestamp with time zone null default current_timestamp,
                           modified_by          jsonb                null default '{"identityid":"System"}',
                           constraint pk_crossurls primary key (url, func, typeurl)
);

/*==============================================================*/
/* Table: identities                                            */
/*==============================================================*/
create table identities (
                            identityid           varchar(100)         not null,
                            roleid               varchar(100)         not null default 'tenant',
                            email                varchar(100)         not null,
                            username             varchar(100)         null,
                            password             varchar(100)         not null,
                            identitysignature    varchar(200)         null,
                            identity             jsonb                null,
                            status               varchar(64)          not null default 'enabled',
                            prelabel             varchar(100)         null,
                            created_at           timestamp with time zone not null default current_timestamp,
                            created_by           jsonb                not null default '{"identityid":"System"}',
                            modified_at          timestamp with time zone null default current_timestamp,
                            modified_by          jsonb                null default '{"identityid":"System"}',
                            constraint pk_identities primary key (identityid)
);

/*==============================================================*/
/* Table: lcoapps                                               */
/*==============================================================*/
create table lcoapps (
                         lcoid                varchar(100)         not null,
                         modelid              varchar(100)         not null,
                         name                 varchar(100)         null,
                         version              varchar(100)         null,
                         apikey               varchar(100)         null,
                         params               jsonb                not null default '[]',
                         obs                  text                 null,
                         created_at           timestamp with time zone not null default current_timestamp,
                         created_by           jsonb                not null default '{"identityid":"System"}',
                         modified_at          timestamp with time zone null default current_timestamp,
                         constraint pk_lcoapps primary key (modelid, lcoid)
);

/*==============================================================*/
/* Table: lcoplatforms                                          */
/*==============================================================*/
create table lcoplatforms (
                              lcoid                varchar(100)         not null,
                              walletid             varchar(100)         null,
                              authmethod           varchar(100)         null,
                              publickey            text                 null,
                              privatekey           text                 null,
                              ipvalidation         bool                 not null default true,
                              expires              numeric(10)          not null default 0,
                              status               varchar(64)          not null default 'enabled',
                              obs                  text                 null,
                              created_at           timestamp with time zone not null default current_timestamp,
                              created_by           jsonb                not null default '{"identityid":"System"}',
                              modified_at          timestamp with time zone null default current_timestamp,
                              modified_by          jsonb                null default '{"identityid":"System"}',
                              constraint pk_lcoplatforms primary key (lcoid)
);

/*==============================================================*/
/* Table: mintings                                              */
/*==============================================================*/
create table mintings (
                          mintingid            varchar(100)         not null,
                          walletid             varchar(100)         null,
                          lcoid                varchar(100)         null,
                          quantity             numeric(4)           not null default 1
                              constraint ckc_quantity_mintings check (quantity >= 1),
                          obs                  text                 null,
                          created_at           timestamp with time zone not null default current_timestamp,
                          created_by           jsonb                not null default '{"identityid":"System"}',
                          modified_at          timestamp with time zone null default current_timestamp,
                          modified_by          jsonb                null default '{"identityid":"System"}',
                          constraint pk_mintings primary key (mintingid)
);

/*==============================================================*/
/* Table: roles                                                 */
/*==============================================================*/
create table roles (
                       roleid               varchar(100)         not null,
                       rolename             varchar(100)         null,
                       constraint pk_roles primary key (roleid)
);

/*==============================================================*/
/* Table: subaccounts                                           */
/*==============================================================*/
create table subaccounts (
                             lcoid                varchar(100)         not null,
                             subaccountid         varchar(100)         not null,
                             accountid            varchar(100)         null,
                             uuid                 varchar(100)         null,
                             arsuid               varchar(100)         null,
                             ip                   varchar(100)         null,
                             useragent            varchar(100)         null,
                             macadd               varchar(100)         null,
                             serialnum            varchar(100)         null,
                             androiduid           varchar(100)         null,
                             name                 varchar(100)         null,
                             email                varchar(100)         null,
                             info                 jsonb                null,
                             status               varchar(64)          not null default 'enabled',
                             obs                  text                 null,
                             accregisterstatus    varchar(100)         not null default 'unregistered',
                             accregisterdate      timestamp with time zone null,
                             created_at           timestamp with time zone not null default current_timestamp,
                             created_by           jsonb                not null default '{"identityid":"System"}',
                             modified_at          timestamp with time zone null default current_timestamp,
                             modified_by          jsonb                null default '{"identityid":"System"}',
                             constraint pk_subaccounts primary key (subaccountid, lcoid)
);

comment on table subaccounts is
    'Esto es una cuenta, luego el parent puede ser el mismo.';

comment on column subaccounts.lcoid is
    'free
    registrationserver
    signed
    ';

/*==============================================================*/
/* Table: subaccountsessions                                    */
/*==============================================================*/
create table subaccountsessions (
                                    devicesession        bigserial            not null,
                                    subaccountid         varchar(100)         null,
                                    lcoid                varchar(100)         null,
                                    status               varchar(10)          not null default 'active',
                                    jwt                  text                 null,
                                    info                 jsonb                null,
                                    expires              timestamp with time zone null,
                                    created_at           timestamp with time zone not null default current_timestamp,
                                    created_by           jsonb                not null default '{"identityid":"System"}',
                                    modified_at          timestamp with time zone null default current_timestamp,
                                    modified_by          jsonb                null default '{"identityid":"System"}',
                                    constraint pk_subaccountsessions primary key (devicesession)
);

comment on column subaccountsessions.lcoid is
    'free
    registrationserver
    signed
    ';

/*==============================================================*/
/* Table: transactionassets                                     */
/*==============================================================*/
create table transactionassets (
                                   assetsid             varchar(100)         not null,
                                   transactionassetid   numeric(10)          not null,
                                   constraint pk_transactionassets primary key (assetsid, transactionassetid)
);

/*==============================================================*/
/* Table: transactions                                          */
/*==============================================================*/
create table transactions (
                              transactionassetid   numeric(10)          not null,
                              operation            varchar(100)         not null,
                              quantity             numeric(6)           not null default 1
                                  constraint ckc_quantity_transact check (quantity >= 1),
                              walletid             varchar(100)         not null,
                              watlletiddest        varchar(100)         null,
                              info                 json                 not null default '{}',
                              obs                  text                 null,
                              created_at           timestamp with time zone not null default current_timestamp,
                              created_by           jsonb                not null default '{"identityid":"System"}',
                              modified_at          timestamp with time zone null default current_timestamp,
                              modified_by          jsonb                null default '{"identityid":"System"}',
                              constraint pk_transactions primary key (transactionassetid)
);

comment on column transactions.operation is
    'Interchange
    Void
    Pin
    ';

/*==============================================================*/
/* Table: walletaccess                                          */
/*==============================================================*/
create table walletaccess (
                              identityid           varchar(100)         not null,
                              walletid             varchar(100)         null,
                              obs                  text                 null,
                              owner                bool                 not null default false,
                              status               varchar(64)          not null default 'enabled',
                              created_at           timestamp with time zone not null default current_timestamp,
                              created_by           jsonb                not null default '{"identityid":"System"}',
                              modified_at          timestamp with time zone null default current_timestamp,
                              modified_by          jsonb                null default '{"identityid":"System"}',
                              constraint pk_walletaccess primary key (identityid)
);

/*==============================================================*/
/* Table: wallets                                               */
/*==============================================================*/
create table wallets (
                         walletid             varchar(100)         not null,
                         identityid           varchar(100)         null,
                         resellerid           varchar(100)         not null,
                         walletclientid       varchar(100)         null,
                         apikey               varchar(100)         null,
                         password             varchar(100)         null,
                         created_at           timestamp with time zone not null default current_timestamp,
                         created_by           jsonb                not null default '{"identityid":"System"}',
                         modified_at          timestamp with time zone null default current_timestamp,
                         modified_by          jsonb                null default '{"identityid":"System"}',
                         deleted              bool                 not null default false,
                         deleted_by           jsonb                null,
                         deleted_at           timestamp with time zone null,
                         constraint pk_wallets primary key (walletid)
);

alter table accounts
    add constraint fk_accounts_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete cascade on update cascade;

alter table assets
    add constraint fk_assets_reference_wallets2 foreign key (walletid)
        references wallets (walletid)
        on delete restrict on update restrict;

alter table assets
    add constraint fk_assets_reference_subaccou foreign key (subaccountid, lcoid)
        references subaccounts (subaccountid, lcoid)
        on delete set null on update cascade;

alter table assets
    add constraint fk_assets_reference_mintings foreign key (mintingid)
        references mintings (mintingid)
        on delete restrict on update restrict;

alter table assets
    add constraint fk_assets_reference_wallets3 foreign key (creator)
        references wallets (walletid)
        on delete set null on update cascade;

alter table assets
    add constraint fk_assets_reference_wallets foreign key (owner)
        references wallets (walletid)
        on delete set null on update cascade;

alter table assets
    add constraint fk_assets_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete restrict on update cascade;

alter table assets
    add constraint fk_assets_reference_accounts foreign key (lcoid, accountid)
        references accounts (lcoid, accountid)
        on delete set null on update cascade;

alter table identities
    add constraint fk_identiti_reference_roles foreign key (roleid)
        references roles (roleid)
        on delete restrict on update cascade;

alter table lcoapps
    add constraint fk_lcoapps_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete cascade on update cascade;

alter table lcoplatforms
    add constraint fk_lcoplatf_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete set null on update cascade;

alter table mintings
    add constraint fk_mintings_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete restrict on update restrict;

alter table mintings
    add constraint fk_mintings_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete restrict on update restrict;

alter table subaccounts
    add constraint fk_subaccou_reference_subaccou foreign key (accountid, lcoid)
        references subaccounts (subaccountid, lcoid)
        on delete set null on update cascade;

alter table subaccounts
    add constraint fk_subaccou_reference_lcoplatf foreign key (lcoid)
        references lcoplatforms (lcoid)
        on delete cascade on update cascade;

alter table subaccounts
    add constraint fk_subaccou_reference_accounts foreign key (lcoid, accountid)
        references accounts (lcoid, accountid)
        on delete set null on update cascade;

alter table subaccountsessions
    add constraint fk_subaccou_reference_subaccou foreign key (subaccountid, lcoid)
        references subaccounts (subaccountid, lcoid)
        on delete cascade on update cascade;

alter table transactionassets
    add constraint fk_transact_reference_assets foreign key (assetsid)
        references assets (assetsid)
        on delete restrict on update cascade;

alter table transactionassets
    add constraint fk_transact_reference_transact foreign key (transactionassetid)
        references transactions (transactionassetid)
        on delete restrict on update cascade;

alter table transactions
    add constraint fk_transact_reference_wallets2 foreign key (walletid)
        references wallets (walletid)
        on delete restrict on update cascade;

alter table transactions
    add constraint fk_transact_reference_wallets foreign key (watlletiddest)
        references wallets (walletid)
        on delete set null on update cascade;

alter table walletaccess
    add constraint fk_walletac_reference_identiti foreign key (identityid)
        references identities (identityid)
        on delete restrict on update cascade;

alter table walletaccess
    add constraint fk_walletac_reference_wallets foreign key (walletid)
        references wallets (walletid)
        on delete cascade on update cascade;

alter table wallets
    add constraint fk_wallets_reference_identiti foreign key (identityid)
        references identities (identityid)
        on delete restrict on update cascade;
