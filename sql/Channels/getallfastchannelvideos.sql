
select getallfastchannelvideos('http://streamer.xisrv.xyz');

create or replace function getallfastchannelvideos(_url varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _path text;
    _vodrequest jsonb;
    _videos jsonb;
    _result jsonb;
    _response jsonb;
BEGIN
    _response = '{}';
    for _path in select path from channels loop
        --_vodrequest = ('{"sessionId": "'|| _path||'"}')::jsonb;
        select json_agg(t) into _videos from (
         select v.id, v.name title ,_url ||'/'|| c4.localpath|| '/'|| c4.path ||'/' || filename ||'/master.m3u8' uri --, playmode
         from videos v inner join channelvideos c3 on v.id = c3.id
                       inner join channels c4 on c4.channelid = c3.channelid
         where path = _path and   length(c4.localpath) > 1
         and c4.status = 'enabled' and v.status= 'loaded'
     ) as t;
    if (not _videos is null) then
        _response = _response || ('{"'|| _path||'":'||_videos||'}')::jsonb;
    else
        _videos = '[{"id": 0, "uri":"' || trim(_url || '/live1/no_channel.mp4/master.m3u8') || '", "title": "No Channel"}]';
        _response = _response || ('{"'|| _path||'":'||_videos||'}')::jsonb;
    end if;
    raise notice '% => {%}',_path,_videos;
    end loop;

    return _response;
END;
$$;


