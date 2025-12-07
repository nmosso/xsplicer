select xuiplaylive(149);
select xuiplaylive(150);

create or replace function xuiplaylive(_id numeric) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _info text;
    _streams varchar;
    aux numeric;
    R channels%rowtype;
    _route varchar = '/channels/';
BEGIN
    select value into _streams from params where paramid = 'streams';
    if (aux = 0) then
        raise exception using detail = 'Stream not found' , errcode = '11002';
    end if;
    select * into R from channels where channelid = _id;
    raise notice '% % %',R.path,R.channelid,R.name;
    if (R.sourcetype = 'live') then
        _route   = '/local/';
    end if;
    _info = ('{"url":"'|| _streams || _route || R.path  ||'/master.m3u8"}')::jsonb;

    return _info;
END;
$$;

select '' || '/channels/' || path || '/master.m3u8' url
from channels  where channelid = 150

--select _streams || '/m/' || videos.filename url

/*   if (R.stream_type = 'fast' ) then
        select json_agg(t)->0 into _info from (
            select _streams || '/channels/' || path || '/master.m3u8' url
           from channels  where channelid = _id
       ) as t;
    elsif  (R.stream_type = 'tvshow' ) then
        select json_agg(t)->0 into _info from (
          select _streams || '/channels/' || path || '/index.m3u8' url
          from channels  where channelid = _id
      ) as t;
    elsif  (R.stream_type ='live' ) then
        select json_agg(t)->0 into _info from (
              select _streams || '/local/' || path || '/index.m3u8' url
              from channels  where channelid = _id
          ) as t;
    end if;
