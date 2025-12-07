create or replace function is_valid_jsonb(p_json text)
    returns boolean
as
$$
begin
    return (p_json::jsonb is not null);
exception
    when others then
        return false;
end;
$$
    language plpgsql
    immutable;