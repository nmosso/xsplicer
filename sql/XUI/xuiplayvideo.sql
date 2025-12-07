select xuiplayvideo(18757);
select xuiplaymovie(18757);
select xuiplayserie(24710);

create or replace function xuiplayvideo(_id numeric) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _info text;
    _movie_data text;
    _imgurl varchar;
    _streamserver varchar;
    _streamport numeric;
    _url varchar;

    aux numeric;
BEGIN
    select value into _streamserver from params where paramid = 'streamserver';
    select value::numeric into _streamport from params where paramid = 'streamport';
    _url = 'http://'||trim(_streamserver) ;-- || ':' || _streamport;

    if (aux = 0) then
        raise exception using detail = 'Movie not found' , errcode = '11002';
    end if;
    select json_agg(t)->0 into _info from (
        select _url || '/' || videos.localpath || '/' || videos.filename|| '/master.m3u8' url
       from videos  where id = _id
   ) as t;

    return _info;
END;
$$;

create or replace function xuiplaymovie(_id numeric) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _info text;
    _movie_data text;
    _imgurl varchar;
    _streamserver varchar;
    _streamport numeric;
    _url varchar;
--18757
    aux numeric;
BEGIN
    select value into _streamserver from params where paramid = 'streamserver';
    select value::numeric into _streamport from params where paramid = 'streamport';
    _url = 'http://'||trim(_streamserver) ;-- || ':' || _streamport;

    if (aux = 0) then
        raise exception using detail = 'Movie not found' , errcode = '11002';
    end if;
    select json_agg(t)->0 into _info from (
          --select _url || '/' || videos.localpath || '/' || videos.filename|| '/master.m3u8' url
          select _url || '/movies/' || videos.filename  url
          from videos  where id = _id
      ) as t;

    return _info;
END;
$$;

create or replace function xuiplayserie(_id numeric) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _info text;
    _movie_data text;
    _imgurl varchar;
    _streamserver varchar;
    _streamport numeric;
    _url varchar;
--24710
    aux numeric;
BEGIN
    select value into _streamserver from params where paramid = 'streamserver';
    select value::numeric into _streamport from params where paramid = 'streamport';
    _url = 'http://'||trim(_streamserver) ;-- || ':' || _streamport;

    if (aux = 0) then
        raise exception using detail = 'Movie not found' , errcode = '11002';
    end if;
    select json_agg(t)->0 into _info from (
          --select _url || '/' || videos.localpath || '/' || videos.filename|| '/master.m3u8' url
          select _url || '/' || videos.localpath || '/' || videos.filename  url
          from videos  where id = _id
      ) as t;

    return _info;
END;
$$;

select * from videos where id = 18757;
select * from videos where id = 24710;

--select _streams || '/m/' || videos.filename url