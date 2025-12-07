select getchannelsinfo('{}','{}','{}');

create or replace function getchannelsinfo(
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
    _channelid numeric;
    _datefrom numeric default round(extract(epoch from current_timestamp));
    _dateto numeric default round(extract(epoch from current_timestamp +  interval '7 day'));

    _page numeric = 1;
    _offset numeric := 0;
    _limit numeric := 200;
    _trecords numeric;

    _status varchar;
_direct_source numeric;
BEGIN
    select checkroleop('leagueslist',_operator) into permission;

    _channelid := jgk(_params,'channelid');
    _limit := jgkn(_data,'pagesize',_limit);
    _page := jgkn(_data,'pagenumber',_page);
    _datefrom = jgkn(_params,'datefrom',_datefrom);
    _dateto = jgkn(_params,'dateto',_dateto);
    _offset := (_page-1)*_limit;
    _status := jgk(_data,'status','enabled');
    _direct_source := jgkn(_data,'direct_source',1);
    select count(*) into _trecords
    from channels;

    select jsonb_agg(t) into _result from (
      select c.channelid, getchannelscategory(categoryid) categoryid, c.name,
             '/videos/'|| c.channelid sources,
             'https://assets.xisrv.xyz/images/'||icon icon, c.status,path,
             round(sum(case when ((meta->>'format')::jsonb->>'size') is null then 0 else ((meta->>'format')::jsonb->>'size')::numeric end)/1000/1000,0) size,
             TO_CHAR((INTERVAL '1 second' * round(sum(case when ((meta->>'format')::jsonb->>'duration') is null then 0 else ((meta->>'format')::jsonb->>'duration')::numeric end),0)), 'HH24:MI:SS') duration,
             count(*) totalvideos, originvideos
      from channels c left join channelvideos c2 on c.channelid = c2.channelid
                      left join public.videos v on v.id = c2.id
      where case when (_channelid is null) then true else c.channelid = _channelid::numeric end
        and case when (_status is null)  then true else c.status = _status end
      --and direct_source = _direct_source
      group by c.channelid, categoryid, c.name, sources, icon, c.status,path
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
                 '"channels":'|| _result ||'}';

    return _response;
END;
$$;


select getchannelscategory('[50]');

create or replace function getchannelscategory(cat jsonb)
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
    select category_name into _response from  categories where category_id = mycat and category_type = 'live';
    return _response;
END;
$$;


rollback;
select *
from videos v inner join channelvideos c on v.id = c.id inner join channels c2 on c2.channelid = c.channelid
where path = 'infantiles_bod_esponja';

select sum(case when ((meta->>'format')::jsonb->>'size') is null then 0 else ((meta->>'format')::jsonb->>'size')::numeric end) size
from xserverdb.public.videos ;

select c.channelid, categoryid, c.name, sources, icon, c.status,path,
       round(sum(case when ((meta->>'format')::jsonb->>'size') is null then 0 else ((meta->>'format')::jsonb->>'size')::numeric end)/1000/1000,0) size,
       round(sum(case when ((meta->>'format')::jsonb->>'duration') is null then 0 else ((meta->>'format')::jsonb->>'duration')::numeric end)/3600,0) duration,
       count(*)-1 totalvideos
from channels c left join channelvideos c2 on c.channelid = c2.channelid
                left join public.videos v on v.id = c2.id
group by c.channelid, categoryid, c.name, sources, icon, c.status,path