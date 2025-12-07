select tenantsettvshows('{}','{}','{"tenantid":"origin"}');

rollback;
create or replace function tenantsettvshows(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE
    aux numeric;
    --C jsonb;
    V jsonb;
    _tmdb jsonb;
    _meta jsonb;
    _channelid numeric;
    _urlicon varchar = 'https://assets.xisrv.xyz/images/';
    i numeric = 1;
    _id numeric;
BEGIN
    raise notice 'start';
    for V in select jsonb_array_elements((_data->>'tvshows')::jsonb) loop
            _id = (V->>'tvshowid')::numeric;
            select count(*) into aux from tvshows where (tvshowid = _id);
            raise notice 'Video Exists: %', aux;
            if ((V->>'tmdb')::jsonb is null) then
                _tmdb = ('{}')::jsonb;
            else
                _tmdb =(V->>'tmdb')::jsonb;
            end if;
            if ((V->>'meta')::jsonb is null) then
                _meta = ('{}')::jsonb;
            else
                _meta =(V->>'meta')::jsonb;
            end if;

            if (aux = 0) then
                insert into tvshows(tvshowid, categoryid, name, status,icon, tmdb_id,
                        meta,tmdb, seasons,
                        path, localpath, urlpath, sourcetype, orden, playmode,
                        direct_source, url_source, originvideos,
                        created_at, created_by, modified_at, modified_by,
                        prepath, numseasons)
                values (_id, (V->>'categoryid')::jsonb, V->>'name', V->>'status', V->>'icon', (V->>'tmdb_id')::numeric,
                        _meta,_tmdb, (V->>'seasons')::jsonb,
                        V->>'path', V->>'localpath', V->>'urlpath', V->>'sourcetype', (V->>'orden')::numeric, V->>'playmode',
                        (V->>'direct_source')::numeric, (V->>'url_source')::jsonb, (V->>'originvideos')::numeric,
                        (V->>'created_at')::timestamptz, (V->>'created_by')::jsonb, (V->>'modified_at')::timestamptz, (V->>'modified_by')::jsonb,
                        V->>'prepath', (V->>'numseasons')::numeric);
                i = i+1;
            else
                UPDATE tvshows
                SET categoryid = (V->>'categoryid')::jsonb,
                    name = V->>'name',
                    status = V->>'status',
                    icon = V->>'icon',
                    tmdb_id = (V->>'tmdb_id')::numeric,
                    meta = _meta,
                    tmdb = _tmdb,
                    seasons = (V->>'seasons')::jsonb,
                    path = V->>'path',
                    localpath = V->>'localpath',
                    urlpath = V->>'urlpath',
                    sourcetype = V->>'sourcetype',
                    orden = (V->>'orden')::numeric,
                    playmode = V->>'playmode',
                    direct_source = (V->>'direct_source')::numeric,
                    url_source = (V->>'url_source')::jsonb,
                    originvideos = (V->>'originvideos')::numeric,
                    created_at = (V->>'created_at')::timestamptz,
                    created_by = (V->>'created_by')::jsonb,
                    modified_at = (V->>'modified_at')::timestamptz,
                    modified_by = (V->>'modified_by')::jsonb,
                    prepath = V->>'prepath',
                    numseasons = (V->>'numseasons')::numeric
                WHERE tvshowid = _id;

            end if;
        end loop;

    return '{"status":"success"}';
END;
$$;


