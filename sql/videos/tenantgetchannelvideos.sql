select tenantgetchannelvideos('{}','{"channelid":22}','{"tenantid":"origin"}');


create or replace function tenantgetchannelvideos(
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
    _response jsonb = '{"status":"sucess"}';
    _page numeric = 1;
    _offset numeric := 0;
    _limit numeric := 1000;
    _trecords numeric;
BEGIN
    -- _tenantid = jgk(_operator,'tenantid');
    _channelid := jgkn(_params,'channelid');

    _limit := jgkn(_data,'pagesize',_limit);
    _page := jgkn(_data,'pagenumber',_page);
    _offset := (_page-1)*_limit;

    select count(*) into _trecords
    from videos where case when _channelid is null then true else id in (select id from channelvideos where channelid = _channelid) end;

    raise notice 'channelid [%]',_channelid;
    select json_agg(t) into _result from (
         select v.id,c2.name channel,  type,  filename,  c2.localpath, c2.path,-- meta,
                c.status,  downloadstatus, originalname,  c.channelid,
                (tenantgetvideosinfo(meta)->>'audio')  audio,
                (tenantgetvideosinfo(meta)->>'video')  video,
                round(((meta->>'format')::jsonb->>'size')::numeric/1000/1000,2) size,
                TO_CHAR((INTERVAL '1 second' * ((meta->>'format')::jsonb->>'duration')::numeric), 'HH24:MI:SS') duration
         from videos v inner join channelvideos c on v.id = c.id
                       inner join channels c2 on c2.channelid = c.channelid
         where  case when _channelid is null then true else c.channelid = _channelid end
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
                 '"videos":'|| _result ||'}';

    return _response;
END;
$$;

