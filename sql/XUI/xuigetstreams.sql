select xuigetlivestreams('');

create or replace function xuigetlivestreams(_pack varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _streamserver varchar;
    _streamport numeric;
    _clientserver varchar;
    _clientport numeric;
    _url varchar;

BEGIN
    _response = '[]';
    select value into _streamserver from params where paramid = 'streamserver';
    select value::numeric into _streamport from params where paramid = 'streamport';

    select value into _clientserver from params where paramid = 'clientserver';
    select value::numeric into _clientport from params where paramid = 'clientport';

    _url = 'http://'||trim(_clientserver) || ':' || _clientport;

select json_agg(t) into _response from (
   select row_number() OVER (order by channelid) as num,
          name,
          'live' stream_type, --case when (direct_source = 1) then 'created_live'  else 'live' end stream_type,
          channelid stream_id,
          'http://assets.xisrv.xyz/images/'||icon stream_icon,
          null epg_channel_id,
          '' added,
          '' custom_sid,
          0 tv_archive,
          case when (direct_source = 1) then
                ''--trim(_url || '/live/qwerty/1234/'||channelid||'.m3u8')
                  --regexp_replace(_url || '/live/qwerty/1234/'||channelid||'.m3u8', '/', '\\/', 'g')
                    --, _url || '/channels/'||path||'/master.m3u8'
               else
                  ''
              end direct_source,
          0 tv_archive_duration,
          (categoryid->0)::text category_id,
          categoryid::jsonb  category_ids,
          '' thumbnail
   from channels where status = 'enabled'
   order by channelid
) as t;

    return _response;
END;
$$;
