"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBase64ToLocalMount = saveBase64ToLocalMount;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Guarda un archivo a partir de un objeto base64 dentro de LocalMount.
 * @param input {SaveFileInput} datos del archivo
 * @param localMount {string} directorio base donde se guardará (p.ej. process.env.LocalMount)
 */
function saveBase64ToLocalMount(input, localMount) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!localMount)
            throw new Error('localMount path is required');
        // Validaciones básicas
        if (!input || typeof input.base64 !== 'string' || input.base64.trim() === '') {
            throw new Error('Invalid input: base64 data required');
        }
        // Asegurar extensión normalizada
        const normalizeExt = (e) => {
            if (!e)
                return '';
            let ext = String(e).trim();
            if (ext === '')
                return '';
            if (!ext.startsWith('.'))
                ext = '.' + ext;
            // eliminar caracteres extraños
            ext = ext.replace(/[^a-zA-Z0-9._-]/g, '');
            return ext.toLowerCase();
        };
        const ext = normalizeExt(input.ext);
        // Función para sanear el filename y evitar path traversal
        const sanitizeFilename = (name, extFallback = '') => {
            if (!name || String(name).trim() === '') {
                // generar nombre aleatorio
                const rnd = crypto_1.default.randomBytes(6).toString('hex');
                return `file-${Date.now().toString(36)}-${rnd}${extFallback}`;
            }
            // quitar ruta y caracteres peligrosos
            let base = path_1.default.basename(String(name));
            // eliminar caracteres no permitidos (dejamos alfanumérico, guión, guion bajo y punto)
            base = base.replace(/[^a-zA-Z0-9._-]/g, '-');
            // si no tiene extensión y extFallback disponible, añadirlo
            if (!path_1.default.extname(base) && extFallback)
                base = base + extFallback;
            return base;
        };
        // Si no tenemos ext, intentar inferir de mime si llega (opcional, mínimo soporte)
        let finalExt = ext;
        if (!finalExt && input.mime) {
            const m = String(input.mime).toLowerCase();
            // patrón simple de inferencia (no depende de librería externa)
            if (m.includes('png'))
                finalExt = '.png';
            else if (m.includes('jpeg') || m.includes('jpg'))
                finalExt = '.jpg';
            else if (m.includes('gif'))
                finalExt = '.gif';
            else if (m.includes('svg'))
                finalExt = '.svg';
            else if (m.includes('webp'))
                finalExt = '.webp';
            else if (m.includes('mp4'))
                finalExt = '.mp4';
            // si no se infiere, lo dejamos vacío
        }
        const filenameSafe = sanitizeFilename(input.filename, finalExt);
        // Construir ruta final y asegurar directorio
        const targetDir = path_1.default.resolve(localMount);
        const targetPath = path_1.default.join(targetDir, filenameSafe);
        // Crear directorio si no existe
        yield promises_1.default.mkdir(targetDir, { recursive: true });
        // Decodificar base64 (soporte tanto con prefijo como sin él)
        const base64Str = input.base64.includes('base64,')
            ? input.base64.split('base64,')[1]
            : input.base64;
        let buffer;
        try {
            buffer = Buffer.from(base64Str, 'base64');
        }
        catch (err) {
            throw new Error('Invalid base64 data');
        }
        // Si existe el archivo, evitar sobrescribir: añadir sufijo aleatorio
        let finalPath = targetPath;
        try {
            // comprobar si existe
            yield promises_1.default.access(finalPath);
            // existe -> renombrar con sufijo
            const nameOnly = path_1.default.basename(filenameSafe, path_1.default.extname(filenameSafe));
            const suffix = '-' + crypto_1.default.randomBytes(3).toString('hex');
            const newName = `${nameOnly}${suffix}${path_1.default.extname(filenameSafe)}`;
            finalPath = path_1.default.join(targetDir, newName);
        }
        catch (e) {
            // no existe -> OK
        }
        // Escribir archivo (casteo seguro para evitar error de TS)
        yield promises_1.default.writeFile(finalPath, buffer);
        // Obtener tamaño
        const stat = yield promises_1.default.stat(finalPath);
        return {
            filepath: finalPath,
            filename: path_1.default.basename(finalPath),
            size: stat.size,
            mime: input.mime,
            ext: finalExt || path_1.default.extname(finalPath),
        };
    });
}
