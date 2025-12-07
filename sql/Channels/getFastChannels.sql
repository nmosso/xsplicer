select getFastChannels();


create or replace function getFastChannels() returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _channels jsonb;
    _playmode jsonb;
    _result jsonb;
    _aux text;
BEGIN
    select json_agg(t) into _channels from (select path id from channels  where length(localpath) > 1 and status = 'enabled') as t;
    select json_agg(jsonb_build_object( 'id', path,'playmode', playmode,'lastplayed',lastplayed)) into _playmode
       from channels as t where  length(localpath) > 1 and status = 'enabled';
    raise notice '%',_channels;
    raise notice '%',_playmode;
    if (_channels is null) then
        _channels = '[]';
    end if;
    if (_playmode is null) then
        _playmode = '[]';
    end if;
    return ('{"channels":'|| _channels::text ||',"playmode":'|| _playmode::text ||'}')::jsonb;
END;
$$;


select getFastChannelCounter();

create or replace function getFastChannelCounter() returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _playmode jsonb;
    _result jsonb;
    _aux text;
BEGIN

    select json_agg(jsonb_build_object(path,lastplayed,'playmode',playmode)) into _playmode from channels as t;
    raise notice '%',_playmode;
    if (_playmode is null) then
        _playmode = '[]';
    end if;
    --_aux = replace(replace(_playmode::text,'[','{'),']','}');
    --raise notice '% ',_aux::jsonb;
    --return ('{"playmode":'|| replace(replace(_playmode::text,'[','{'),']','}') ||'}')::jsonb;
    --return ('{"channels":'|| _channels::text ||',"playmode":'|| replace(replace(_playmode::text,'[','{'),']','}') ||'}')::jsonb;
    return ('{"assetcounter":'|| _playmode::text ||'}')::jsonb;
END;
$$;

--return ('{"channels":'|| _channels::text ||',"playmode":'|| replace(replace(_playmode::text,'[','{'),']','}') ||'}')::jsonb;



create or replace function getNextFastChannel(_vodrequest jsonb, _url varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _id numeric;
    _len numeric;
    indice_aleatorio INTEGER;
    _path text;
    _result jsonb;
    _response jsonb;
BEGIN
    _path = jgk(_vodrequest,'sessionId');

    select json_agg(id) into _result from (
      select v.id from videos v inner join channelvideos c on v.id = c.id
        inner join channels c2 on c2.channelid = c.channelid
      where path = _path and v.id <> c2.lastplayed) as t;
    _len = jsonb_array_length(_result);
    indice_aleatorio := floor(random() * _len) ;
    _id = _result->indice_aleatorio;

    select json_agg(t) into _response from (
      select v.id, v.name title ,_url || path ||'/' || filename ||'/master.m3u8' uri
      from videos v inner join channelvideos c3 on v.id = c3.id
      inner join channels c4 on c4.channelid = c3.channelid where v.id = _id
    ) as t;
    update channels set lastplayed = _id where channelid = _id;
    raise notice '% => % => % [%}',_path,_len,indice_aleatorio,_id;
    return '{"'||_path||'":'||_response||'}';
END;
$$;



create or replace function getnextfastchannelvideos(_url varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    _path text;
    _vodrequest jsonb;
    _result jsonb;
    _response jsonb;
BEGIN
    _response = '{}';
    for _path in select path from channels loop
        _vodrequest = ('{"sessionId": "'|| _path||'"}')::jsonb;
        select getNextFastChannel(_vodrequest,_url) into _result;
        _response = _response || _result;
    end loop;
    return _response;
END;
$$;


select * from  videos v inner join channelvideos c3 on v.id = c3.id
    inner join channels c4 on c4.channelid = c3.channelid
where path = 'seriales_salud';

select path from channels;

select getNextFastChannel('{"sessionId":"infantiles_garfield","playlistId":"infantiles_garfield"}','http://192.168.100.170/channelshls/');
select getNextFastChannel('{"sessionId":"infantiles_garfield","playlistId":"infantiles_garfield"}','http://series101.xysrv.xyz/channelshls/');
select getnextfastchannelvideos('http://series101.xysrv.xyz/channelshls/');
select getallfastchannelvideos('ss');


http://192.168.100.170/channelshls/musica_bachata/infantiles_garfield.mp4/master.m3u8

/*
                     id: "assta6aa-8096-4ee5-a899-9cdabb9371b4",
                    title: "stswe22-webrtc-ssa",
                    uri: "http://192.168.100.170/channelshls/musica_bachata/Romeo_Santos__The_Making_of_Propuesta_Indecente.mp4/master.m3u8",
 */