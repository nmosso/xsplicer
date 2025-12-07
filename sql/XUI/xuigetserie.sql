
select  xuigetserie('',303);

create or replace function xuigetserie(_pack varchar,_tvshowid numeric ) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _imgurl varchar;
    _streams varchar;
    _seasons jsonb;
    _info jsonb;
    _aux jsonb;
    _seasonepisodes jsonb;
    _episodes jsonb;
    S numeric;
BEGIN
    _response = '[]';
    select value into _imgurl from params where paramid = 'imgurl';
    select value into _streams from params where paramid = 'streams';

    select seasons into _seasons from tvshows where tvshowid = _tvshowid;
    select xuigetseries(_pack,_tvshowid)  into _info;
    _episodes = ('{}')::jsonb;
    for S in select distinct season from videos where tvshowid = _tvshowid and season >0 order by season loop
        select json_agg(info) into _aux from videos where tvshowid = _tvshowid and season = S ;
        _seasonepisodes= (replace((_aux::text),'"movie_image": "','"movie_image": "'||_imgurl||'/tvshows/ep'))::jsonb;
        raise notice '%',_seasonepisodes;
        _episodes =_episodes || ('{"'|| S ||'":'|| (_seasonepisodes)::jsonb ||'}')::jsonb;
    end loop;
    raise notice '%',_seasons;
    raise notice '%',_info;
    raise notice '%',_episodes;
    _response  =  ('{"seasons":'|| _seasons::text ||',"info":'|| ((_info::jsonb->0))::text ||',"episodes":'|| _episodes::text ||'}')::jsonb;

    return _response;
END;
$$;

select distinct season from videos where tvshowid = 354 and season >0 order by season ;