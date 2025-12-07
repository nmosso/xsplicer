select xuigetseries('');
select * from videos where name = 'Zombieland: Double Tap';

create or replace function xuigetseries(_pack character varying, _tvshowid numeric DEFAULT NULL::numeric) returns jsonb
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
           select row_number() OVER (order by tvshowid) as num,
                  name,
                  name title,
                  (meta->>'year')::numeric "year",
                  'series' stream_type,
                  tvshowid series_id,
                  _imgurl || '/tvshows/' || (meta->>'cover_big')::text cover,
                  (meta->>'plot')::text plot,
                  (meta->>'rating')::numeric rating,
                  (meta->>'cast')::text "cast",
                  (meta->>'director')::text director,
                  (meta->>'genre')::text genre,
                  (meta->>'release_date')::text release_date,
                  (meta->>'release_date')::text releaseDate,
                  round(EXTRACT('EPOCH' FROM modified_at),0) lastmodified,
                  (meta->>'rating')::text rating,
                  (meta->>'rating_5based')::numeric rating_5based,
                  _imgurl || '/tvshows/' || (meta->>'backdrop_path')::text backdrop_path,
                  (meta->>'youtube_trailer')::text releaseDate,
                  null episode_run_time,
                  (categoryid::jsonb->0)::text category_id,
                  categoryid::text   category_ids
           from tvshows where  not tmdb_id is null and status = 'check'
            and case when _tvshowid is null then true else tvshowid = _tvshowid end
           order by created_at desc
       ) as t;

    return _response;
END;
$$;

/*
create or replace function xuigetseries(_pack varchar) returns jsonb
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
        select row_number() OVER (order by tvshowid) as num,
        name,
        name title,
       (meta->>'year')::numeric "year",
       'series' stream_type,
       tvshowid stream_id,
      _imgurl || '/tvshows/' || (meta->>'cover_big')::text cover,
      (meta->>'plot')::text plot,
      (meta->>'rating')::numeric rating,
      (meta->>'cast')::text "cast",
      (meta->>'director')::text director,
      (meta->>'genre')::text genre,
      (meta->>'release_date')::text release_date,
      (meta->>'release_date')::text releaseDate,
      round(EXTRACT('EPOCH' FROM modified_at),0) lastmodified,
       (meta->>'rating')::text rating,
       (meta->>'rating_5based')::numeric rating_5based,
       _imgurl || '/tvshows/' || (meta->>'backdrop_path')::text backdrop_path,
       (meta->>'youtube_trailer')::text releaseDate,
       null episode_run_time,
      (categoryid::jsonb->0)::text category_id,
      categoryid::text   category_ids
       from tvshows where  not tmdb_id is null --status = 'enabled' and
       order by created_at desc
    ) as t;

    return _response;
END;
$$;

select * from  tvshows where  not tmdb_id is null --status = 'enabled' and
order by created_at desc