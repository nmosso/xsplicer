select xuigetmovies('');
select * from videos where name = 'Zombieland: Double Tap';

create or replace function xuigetmovies(_pack varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _imgurl varchar;
    _streams varchar;
BEGIN
    _response = '[]';
    select value into _imgurl from params where paramid = 'imgurl';
    select value into _streams from params where paramid = 'streams';

    select json_agg(t) into _response from (
    select row_number() OVER (order by id) as num,
        name, name title,
        'movie' stream_type, id stream_id,
       _imgurl || '/' ||  (tmdb->>'cover_big')::text stream_icon,
        round((tmdb->>'rating')::numeric,1) rating,
        (tmdb->>'year')::numeric "year",
        (tmdb->>'rating_5based')::numeric rating_5based,
        round(EXTRACT('EPOCH' FROM created_at),0) added,
        (tmdb->>'description')::text plot,
        (tmdb->>'cast')::text "cast",
        (tmdb->>'director')::text director,
        (tmdb->>'genre')::text genre,
        (tmdb->>'release_date')::text release_date,
        (tmdb->>'youtube_trailer')::text youtube_trailer,
        null episode_run_time,
       (categories::jsonb->0)::text category_id,
       categories::text   category_ids,
       ext container_extension,
       '' custom_sid,
       '' direct_source
       -- _streams || '/' || videos.localpath || '/' || videos.filename|| '/index.m3u8' direct_source
       from videos where type = 'movie' and status = 'enabled' and not tmdb_id is null
       order by created_at desc
    ) as t;

    return _response;
END;
$$;

select round(EXTRACT('EPOCH' FROM current_timestamp),0),'1714706543'