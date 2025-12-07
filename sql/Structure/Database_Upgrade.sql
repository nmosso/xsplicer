


alter table channels add tvshowid             numeric(6)           null;
alter table channels add fromastra            bool           not null default  false;

alter table channels
    add constraint fk_channels_reference_tvshows foreign key (tvshowid)
        references tvshows (tvshowid)
        on delete set null on update cascade;

update:tenantsetchannels;

select * from videos where filename like 'friends_S%';
delete from videos where filename like 'friends_S%';

update: getallfastchannelvideosredis;


alter table channels add multicastenable bool not null default  false;
alter table channels add multicastautoaddress bool not null default  true;
alter table channels add multicastaddress varchar(100) not null default '';