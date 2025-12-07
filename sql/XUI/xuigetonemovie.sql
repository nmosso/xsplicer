select xuigetonemovie(24025);


create or replace function xuigetonemovie(_movieid numeric) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _info text;
    _movie_data text;
    _imgurl varchar;
    --_streams varchar;
    aux numeric;
    _clientserver varchar;
    _clientport numeric;
    _url varchar;
BEGIN

    _response = '[]';
    select value into _imgurl from params where paramid = 'imgurl';
    --select value into _streams from params where paramid = 'streams';

    select value into _clientserver from params where paramid = 'clientserver';
    select value::numeric into _clientport from params where paramid = 'clientport';
    _url = 'http://'||trim(_clientserver) ;-- || ':' || _streamport;

    select count(*) into aux from videos where id = _movieid;
    if (aux = 0) then
        raise exception using detail = 'Movie not found' , errcode = '11002';
    end if;
    select json_agg(t)->0 into _info from (
    select
        '' age,
        (tmdb->>'cast')::text "cast",
        name,
        (tmdb->>'description')::text plot,
        (tmdb->>'genre')::text genre,
        (tmdb->>'cast')::text "actors",
        name o_name,
        round((tmdb->>'rating')::numeric,1) rating,
        0 bitrate,
        (tmdb->>'country')::text country,
        '' runtime,
        tmdb_id,
        (tmdb->>'director')::text director,
        '' duration,
        _imgurl ||'/' ||  (tmdb->>'cover_big')::text cover_big,
        (tmdb->>'description')::text description,
        _imgurl||'/' || (tmdb->>'cover_big')::text movie_image,
        '' mpaa_rating,
        ('["' || _imgurl|| '/' ||  (tmdb->>'backdrop_path')::text ||'"]')::jsonb backdrop_path,
        0 duration_secs,
        (tmdb->>'kinopoisk_url')::text kinopoisk_url,
        (tmdb->>'youtube_trailer')::text youtube_trailer,
        0 rating_count_kinopoisk,
        0 episode_run_time,
        (tmdb->>'release_date')::text release_date,
        '[]' subtitles
       from videos where id = _movieid
    ) as t;

    select json_agg(t)->0 into _movie_data from (
       select id stream_id,
              name,
              name title,   (tmdb->>'year')::text "year",
            round(EXTRACT('EPOCH' FROM created_at),0) added,
            (categories::jsonb->0)::text category_id,
            categories::text   category_ids,
            ext container_extension,
            '' custom_sid,
            '' direct_source -- _url || '\/movie\/qwerty\/1234\/'|| id || '.m3u8' direct_source
             -- _streams || '/m/' || videos.filename direct_source
       from videos  where id = _movieid
       order by created_at desc
   ) as t;
    raise notice '{"info":%,"movie_data":%}',_info,_movie_data;

    _response = '{"info":'|| _info ||',"movie_data":'||_movie_data ||'}';

    return _response;
END;
$$;


_streams || '/' || videos.localpath || '/' || videos.filename|| '/index.m3u8' direct_source

select round(EXTRACT('EPOCH' FROM current_timestamp),0),'1714706543'