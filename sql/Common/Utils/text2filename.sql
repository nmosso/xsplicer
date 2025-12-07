CREATE OR REPLACE FUNCTION text2filename(texto_original TEXT) RETURNS TEXT AS $$
DECLARE
    texto_limpio TEXT;
BEGIN
    -- Reemplazar espacios por _
    texto_limpio := REGEXP_REPLACE(texto_original, '  +', ' ', 'g');
    texto_limpio := REPLACE(texto_original, ' ', '_');
    texto_limpio := REGEXP_REPLACE(texto_original, '\.\.+', '.', 'g');
    ---texto_limpio := REPLACE(texto_original, ' ', '_');

    -- Reemplazar caracteres especiales y acentos
    texto_limpio := translate(texto_limpio,
                              'áéíóúÁÉÍÓÚüÜñÑ!"#$%&/()=?¿¡*[]{};:,<>+|@`^~',
                              'aeiouAEIOUuUnN---------------------------------');

    -- Eliminar cualquier otro caracter no permitido
    texto_limpio := REGEXP_REPLACE(texto_limpio, '[^a-zA-Z0-9_.-]', '', 'g');

    RETURN texto_limpio;
END;
$$ LANGUAGE plpgsql;

rollback;
select text2filename('AVENTURAS EN SEATTLE ¡Listos para gastar mucho dinero! EL PRECIO DE LA HISTORIA EN LA CARRETERA.mp4');


