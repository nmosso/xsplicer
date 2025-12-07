
create or replace function xuigetcategories(_type varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
BEGIN
    _response = '[]';
    select json_agg(t) into _response from (
        select category_id::text, category_name,parent_id
        from categories where category_type  =_type
        order by cat_order
    ) as t;

    return _response;
END;
$$;