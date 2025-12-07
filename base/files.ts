import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type SaveFileInput = {
    base64: string;   // solo la parte base64 (sin data:...;base64,)
    mime?: string;    // opcional
    ext?: string;     // opcional, con o sin punto, p.ej. "png" o ".png"
    filename?: string; // opcional; si no viene se genera uno
};

export type SaveFileResult = {
    filepath: string;   // ruta absoluta
    filename: string;   // nombre final del archivo
    size: number;       // bytes escritos
    mime?: string;
    ext?: string;
};

/**
 * Guarda un archivo a partir de un objeto base64 dentro de LocalMount.
 * @param input {SaveFileInput} datos del archivo
 * @param localMount {string} directorio base donde se guardará (p.ej. process.env.LocalMount)
 */
export async function saveBase64ToLocalMount(
    input: SaveFileInput,
    localMount: string
): Promise<SaveFileResult> {
    if (!localMount) throw new Error('localMount path is required');

    // Validaciones básicas
    if (!input || typeof input.base64 !== 'string' || input.base64.trim() === '') {
        throw new Error('Invalid input: base64 data required');
    }

    // Asegurar extensión normalizada
    const normalizeExt = (e?: string) => {
        if (!e) return '';
        let ext = String(e).trim();
        if (ext === '') return '';
        if (!ext.startsWith('.')) ext = '.' + ext;
        // eliminar caracteres extraños
        ext = ext.replace(/[^a-zA-Z0-9._-]/g, '');
        return ext.toLowerCase();
    };

    const ext = normalizeExt(input.ext);

    // Función para sanear el filename y evitar path traversal
    const sanitizeFilename = (name?: string, extFallback = '') => {
        if (!name || String(name).trim() === '') {
            // generar nombre aleatorio
            const rnd = crypto.randomBytes(6).toString('hex');
            return `file-${Date.now().toString(36)}-${rnd}${extFallback}`;
        }
        // quitar ruta y caracteres peligrosos
        let base = path.basename(String(name));
        // eliminar caracteres no permitidos (dejamos alfanumérico, guión, guion bajo y punto)
        base = base.replace(/[^a-zA-Z0-9._-]/g, '-');
        // si no tiene extensión y extFallback disponible, añadirlo
        if (!path.extname(base) && extFallback) base = base + extFallback;
        return base;
    };

    // Si no tenemos ext, intentar inferir de mime si llega (opcional, mínimo soporte)
    let finalExt = ext;
    if (!finalExt && input.mime) {
        const m = String(input.mime).toLowerCase();
        // patrón simple de inferencia (no depende de librería externa)
        if (m.includes('png')) finalExt = '.png';
        else if (m.includes('jpeg') || m.includes('jpg')) finalExt = '.jpg';
        else if (m.includes('gif')) finalExt = '.gif';
        else if (m.includes('svg')) finalExt = '.svg';
        else if (m.includes('webp')) finalExt = '.webp';
        else if (m.includes('mp4')) finalExt = '.mp4';
        // si no se infiere, lo dejamos vacío
    }

    const filenameSafe = sanitizeFilename(input.filename, finalExt);

    // Construir ruta final y asegurar directorio
    const targetDir = path.resolve(localMount);
    const targetPath = path.join(targetDir, filenameSafe);

    // Crear directorio si no existe
    await fs.mkdir(targetDir, { recursive: true });

    // Decodificar base64 (soporte tanto con prefijo como sin él)
    const base64Str = input.base64.includes('base64,')
        ? input.base64.split('base64,')[1]
        : input.base64;
    let buffer: Buffer;
    try {
        buffer = Buffer.from(base64Str, 'base64');
    } catch (err) {
        throw new Error('Invalid base64 data');
    }

    // Si existe el archivo, evitar sobrescribir: añadir sufijo aleatorio
    let finalPath = targetPath;
    try {
        // comprobar si existe
        await fs.access(finalPath);
        // existe -> renombrar con sufijo
        const nameOnly = path.basename(filenameSafe, path.extname(filenameSafe));
        const suffix = '-' + crypto.randomBytes(3).toString('hex');
        const newName = `${nameOnly}${suffix}${path.extname(filenameSafe)}`;
        finalPath = path.join(targetDir, newName);
    } catch (e) {
        // no existe -> OK
    }

    // Escribir archivo (casteo seguro para evitar error de TS)
    await fs.writeFile(finalPath, buffer as unknown as Uint8Array);

    // Obtener tamaño
    const stat = await fs.stat(finalPath);

    return {
        filepath: finalPath,
        filename: path.basename(finalPath),
        size: stat.size,
        mime: input.mime,
        ext: finalExt || path.extname(finalPath),
    };
}
