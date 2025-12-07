select xuigetlivestreams('');

create or replace function xuigetlivestreams(_pack varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
BEGIN
    _response = '[]';
    select json_agg(t) into _response from (
           select row_number() OVER (order by channelid) as num,
                  name,
                  case when (direct_source = 1) then 'created_live'  else 'live' end stream_type,
                  channelid stream_id,
                  'http://assets.xisrv.xyz/images/'||icon stream_icon,
                null epg_channel_id,
                '' added,
                '' custom_sid,
                0 tv_archive,
                  case when (direct_source = 1) then
                'http://streamer.xisrv.xyz/channels/'||path||'/index.m3u8'
                  else
                      url_source::text
                  end direct_source,
                0 tv_archive_duration,
                categoryid->0 category_id,
                  categoryid::text category_ids,
                '' thumbnail
           from channels where status = 'enabled' and publish is true
           order by orden
       ) as t;

    return _response;
END;
$$;
