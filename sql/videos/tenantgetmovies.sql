
select tenantgetmoviesinfo('{}','{}','{}');

create or replace function tenantgetmoviesinfo(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE

    _result jsonb;
    _channelid numeric;
    _response jsonb = '{"status":"success"}';
    _page numeric = 1;
    _offset numeric := 0;
    _limit numeric := 10000;
    _trecords numeric;
BEGIN
    -- _tenantid = jgk(_operator,'tenantid');
    _limit := jgkn(_data,'pagesize',_limit);
    _page := jgkn(_data,'pagenumber',_page);
    _offset := (_page-1)*_limit;

    select count(*) into _trecords
    from videos where type = 'movie' and status in ('enabled','disabled');

    select json_agg(t) into _result from (
         select v.id,'movies' channel,  type,  filename,  v.localpath, v.cloudpath,-- meta,
                v.status,  downloadstatus, originalname,  1 channelid,
                (tenantgetvideosinfo(meta)->>'audio')  audio,
                (tenantgetvideosinfo(meta)->>'video')  video,
                round(((meta->>'format')::jsonb->>'size')::numeric/1000/1000,2) size,
                TO_CHAR((INTERVAL '1 second' * ((meta->>'format')::jsonb->>'duration')::numeric), 'HH24:MI:SS') duration
         from videos v where type = 'movie' and status in ('enabled','disabled')
         order by filename
         limit _limit offset  _offset
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
                 '"movies":'|| _result ||'}';

    return _response;
END;
$$;

