select gettvshowsinfo('{}','{}','{}');

create or replace function gettvshowsinfo(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE
    permission jsonb;
    _response jsonb = '{"status":"sucess"}';
    _result jsonb;
    _tvshowid numeric;
    _datefrom numeric default round(extract(epoch from current_timestamp));
    _dateto numeric default round(extract(epoch from current_timestamp +  interval '7 day'));

    _page numeric = 1;
    _offset numeric := 0;
    _limit numeric := 200;
    _trecords numeric;

    _status varchar;

BEGIN
    select checkroleop('leagueslist',_operator) into permission;

    _tvshowid := jgk(_params,'tvshowid');
    _limit := jgkn(_data,'pagesize',_limit);
    _page := jgkn(_data,'pagenumber',_page);
    _datefrom = jgkn(_params,'datefrom',_datefrom);
    _dateto = jgkn(_params,'dateto',_dateto);
    _offset := (_page-1)*_limit;
    _status := jgk(_data,'status','check');

    select count(*) into _trecords
    from tvshows;

    select jsonb_agg(t) into _result from (
          select t.tvshowid, gettvshowscategory(categoryid) categoryid, t.name, t.tmdb_id,
                 '/tvshows/'|| t.tvshowid sources,
                 'https://assets.xisrv.xyz/images/'||icon icon, t.status,path,
                 round(sum(case when ((v.meta->>'format')::jsonb->>'size') is null then 0 else ((v.meta->>'format')::jsonb->>'size')::numeric end)/1000/1000,0) size,
                 TO_CHAR((INTERVAL '1 second' * round(sum(case when ((v.meta->>'format')::jsonb->>'duration') is null then 0 else ((v.meta->>'format')::jsonb->>'duration')::numeric end),0)), 'HH24:MI:SS') duration,
                 count(distinct season) seasons,
                 count(*) totalvideos, originvideos
          from tvshows t left join videos v on t.tvshowid = v.tvshowid
          where case when (_tvshowid is null) then true else t.tvshowid = _tvshowid::numeric end
            and case when (_status is null)  then true else t.status = _status end
            and t.status in ('check')
          group by t.tvshowid, categoryid, t.name,t.tmdb_id, icon, t.status,path
          order by totalvideos
          limit _limit offset _offset
      ) as t;
    if (_result is null) then
        _result = '[]';
        _trecords = 0;
    end if;
    _response := '{"status":"success",' ||
                 '"pagenumber":'|| _page ||',' ||
                 '"pagesize":'|| _limit ||',' ||
                 '"records":'|| jsonb_array_length(_result) ||',' ||
                 '"totalrecords":'|| _trecords ||',' ||
                 '"tvshows":'|| _result ||'}';

    return _response;
END;
$$;



create or replace function gettvshowscategory(cat jsonb)
    returns text
    language plpgsql
as
$$
DECLARE
    permission jsonb;
    _response text;
    mycat numeric;
begin
    select cat->>0 into mycat;
    raise notice 'valid cat %',mycat;
    select category_name into _response from  categories where category_id = mycat and category_type = 'series';
    return _response;
END;
$$;

