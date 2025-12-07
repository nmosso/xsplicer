
drop table crossurls cascade;

create table crossurls (
   url                  varchar(250)         not null,
   func                 varchar(250)         not null,
   typeurl              varchar(10)          not null default 'debug',
   ordernumber          numeric(10)          not null default 10
      constraint ckc_ordernumber_crossurl check (ordernumber >= 0),
   bydefault            bool                 not null default false,
   internal             bool                 not null default false,
   createdat            timestamp with time zone not null default current_timestamp,
   createdby            jsonb                not null default '{}',
   modifiedat           timestamp with time zone null default current_timestamp,
   modifiedby           jsonb                null default '{}',
   constraint pk_crossurls primary key (url)
);
create or replace  function getcrossurls(
    _data jsonb,
    _params jsonb,
    _operator jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    _result text := '';
    _func text;
    _url text;
    _debugurl text;
BEGIN
    _result = '[';
    for _func in select distinct func from crossurls
        loop
            select to_jsonb(array_agg(url)) into _url from crossurls
            where typeurl = 'production' and func = _func;
            select to_jsonb(array_agg(url)) into _debugurl from crossurls
            where typeurl = 'debug' and func = _func;
            if (_url is null) then
                _url := '[]';
            end if;
            if (_debugurl is null) then
                _debugurl := '[]';
            end if;
            _result := _result || '{"url":'|| _url||',"urldebug":'|| _debugurl||',"func":"'||_func||'","protocol":"https"},';
            raise notice 'params % % %',_url, _debugurl, _result;
        end loop;
    _result := substring(_result,1,length(_result)-1) || ']';
    raise notice '%',_result;
    if (_result is null) then
        return ('{"status":"success","urls":[]}')::jsonb;
    end if;
    return ('{"status":"success","urls":'|| _result||'}')::jsonb;
END;
$$;

select getcrossurls('{}','{}','{}');

LISTEN registry;

CREATE or replace FUNCTION crossurl_after_all_notice() RETURNS TRIGGER AS $$
BEGIN
   NOTIFY registry, 'update:crossurls';
   raise notice 'update:crossurls';
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--drop trigger getcrossurl_trigger on crossurls;

create trigger getcrossurl_trigger after insert or update or delete
on crossurls FOR EACH ROW EXECUTE PROCEDURE crossurl_after_all_notice();


----------

CREATE or replace FUNCTION paths_after_all_notice() RETURNS TRIGGER AS $$
BEGIN
   NOTIFY registry, 'update:paths';
   raise notice 'update:paths';
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;


create trigger getpaths_trigger after insert or update or delete
on crossurls FOR EACH ROW EXECUTE PROCEDURE paths_after_all_notice();

