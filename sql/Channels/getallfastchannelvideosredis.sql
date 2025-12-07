
select getallfastchannelvideosredis();

create or replace function getallfastchannelvideosredis(_channelid numeric default 0) returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _path text;
    _vodrequest jsonb;
    _videos jsonb;
    _url varchar;
    _response jsonb;
BEGIN
    _response = '[]';
    select value into _url from params where paramid = 'internalstreamer';

    for _path in select path from channels where status = 'enabled'
        and case when _channelid =0 then true else channelid = _channelid end
        loop
            --_vodrequest = ('{"sessionId": "'|| _path||'"}')::jsonb;
            select json_agg(t) into _videos from (
                 select v.id, v.name title ,_url ||'/'|| v.localpath||'/' || filename ||'/master.m3u8' uri, path

                 from videos v inner join channelvideos c3 on v.id = c3.id
                               inner join channels c4 on c4.channelid = c3.channelid
                 where path = _path and   length(c4.localpath) > 1 -- and c3.status = 'present'
                   and c4.status = 'enabled' and v.status in ('loaded','enabled')
                   and v.httpcode = 200 and c4.localpath <> 'tvshows'
                   and sourcetype = 'fast'
                   and case when _channelid > 0 then c3.channelid =  _channelid else true end
                 union
                 select v.id, v.name title ,_url ||'/'|| replace(v.localpath,'tvshows','series') ||'/' || filename ||'/master.m3u8' uri,path --, playmode
                 from videos v inner join channelvideos c3 on v.id = c3.id
                               inner join channels c4 on c4.channelid = c3.channelid
                 where path = _path and   length(c4.localpath) > 1 -- and c3.status = 'present'
                   and c4.status = 'enabled' and v.status in ('loaded','enabled')
                   and v.httpcode = 200  and c4.localpath = 'tvshows'
                   and sourcetype = 'fast'
                   and case when _channelid > 0 then c3.channelid =  _channelid else true end
                 union
                 select v.id, v.name title ,_url ||'/'|| replace(v.localpath,'tvshows','series') ||'/' || filename ||'/master.m3u8' uri,path --, playmode
                 from videos v  inner join channels c4 on c4.tvshowid = v.tvshowid
                 where path = _path and   length(c4.localpath) > 1 -- and c3.status = 'present'
                   and c4.status = 'enabled' and v.status in ('loaded','enabled','readed')
                   and v.httpcode = 200  and c4.localpath = 'tvshows'
                   and sourcetype = 'tvshow'
                   and case when _channelid > 0 then c4.channelid =  _channelid else true end
             ) as t;
            if (not _videos is null) then
                _response = _response || ('{"assetid":"'|| _path||'","data":'||_videos||'}')::jsonb;
            else
                _videos = '[{"id": 0, "uri":"' || trim(_url || '/live1/no_channel.mp4/master.m3u8') || '", "title": "No Channel"}]';
                _response = _response || ('{"assetid":"'|| _path||'","data":'||_videos||'}')::jsonb;
            end if;
            raise notice '% => {%}',_path,_videos;
        end loop;

    return _response;
END;
$$;


select v.id, v.name title ,'_url' ||'/'|| replace(v.localpath,'tvshows','series') ||'/' || filename ||'/master.m3u8' uri,path, c4.status,v.status--, playmode
from videos v  inner join channels c4 on c4.tvshowid = v.tvshowid
where path = 'friends' and   length(c4.localpath) > 1 -- and c3.status = 'present'
  and c4.status = 'enabled' and v.status in ('loaded','enabled','readed')
  and v.httpcode = 200  and c4.localpath = 'tvshows'
  and sourcetype = 'tvshow'
  and case when 150 > 0 then c4.channelid =  150 else true end;


-----
select c4.status, v.status, v.id, v.name title ,'_url' ||'/'|| v.localpath||'/' || filename ||'/master.m3u8' uri --, playmode
from videos v inner join channelvideos c3 on v.id = c3.id
              inner join channels c4 on c4.channelid = c3.channelid
where path = 'seriales_cocina_de_ariel' and   length(c4.localpath) > 1 -- and c3.status = 'present'
  and c4.status = 'enabled' and v.status = 'loaded'


--------
select v.id, v.name title ,'_url' ||'/'|| replace(v.localpath,'tvshows','series') ||'/' || filename ||'/master.m3u8' uri,path --, playmode
from videos v inner join channelvideos c3 on v.id = c3.id
              inner join channels c4 on c4.channelid = c3.channelid
where path = '_path' and   length(c4.localpath) > 1 -- and c3.status = 'present'
  and c4.status = 'enabled' and v.status in ('loaded','enabled')
  and v.httpcode = 200  and c4.localpath = 'tvshows'
  and case when channelid > 0 then c3.channelid =  _channelid else true end