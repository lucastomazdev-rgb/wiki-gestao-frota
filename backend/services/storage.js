import crypto from 'node:crypto';

const DOCUMENT_TYPES = {
  'application/pdf': { extension: 'pdf', signature: Buffer.from('%PDF-') },
  'image/jpeg': { extension: 'jpg', signature: Buffer.from([0xff, 0xd8, 0xff]) },
  'image/png': { extension: 'png', signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }
};

const getConfig = () => {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    const error = new Error('Storage privado não configurado no servidor.');
    error.statusCode = 503;
    throw error;
  }

  return { baseUrl, serviceKey };
};

const storageRequest = async (path, options = {}) => {
  const { baseUrl, serviceKey } = getConfig();
  const response = await fetch(`${baseUrl}/storage/v1${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('Falha no storage privado:', response.status, details.slice(0, 300));
    const error = new Error('Não foi possível processar o arquivo no storage.');
    error.statusCode = 502;
    throw error;
  }

  return response;
};

export const validateIdentityDocument = (file) => {
  const type = DOCUMENT_TYPES[file?.mimetype];
  if (!file?.buffer || !type || !file.buffer.subarray(0, type.signature.length).equals(type.signature)) {
    const error = new Error('Documento inválido. Envie apenas PDF, JPG ou PNG legítimo.');
    error.statusCode = 400;
    throw error;
  }
  return type.extension;
};

export const validateTutorialFile = (file) => {
  const extension = String(file?.originalname || '').split('.').pop()?.toLowerCase();
  const allowedExtensions = new Set(['xvm', 'profile', 'dbc', 'bin', 'txt', 'json', 'zip', 'csv']);
  if (!file?.buffer?.length || !extension || !allowedExtensions.has(extension)) {
    const error = new Error('Tipo de arquivo não permitido. Use XVM, PROFILE, DBC, BIN, TXT, JSON, ZIP ou CSV.');
    error.statusCode = 400;
    throw error;
  }

  if (extension === 'zip' && !file.buffer.subarray(0, 2).equals(Buffer.from('PK'))) {
    const error = new Error('O arquivo ZIP enviado é inválido.');
    error.statusCode = 400;
    throw error;
  }
  return extension;
};

export const uploadPrivateFile = async ({ bucket, file, prefix, validate = validateIdentityDocument }) => {
  const extension = validate(file);
  const objectPath = `${prefix}/${crypto.randomUUID()}.${extension}`;

  await storageRequest(`/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.mimetype,
      'x-upsert': 'false'
    },
    body: file.buffer
  });

  return { path: objectPath, nome: file.originalname };
};

export const createPrivateDownloadUrl = async ({ bucket, objectPath, downloadName, expiresIn = 60 }) => {
  const response = await storageRequest(
    `/object/sign/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn, download: downloadName || true })
    }
  );
  const data = await response.json();
  const { baseUrl } = getConfig();
  const signedPath = data.signedURL || data.signedUrl;
  if (!signedPath) throw new Error('Storage não retornou uma URL assinada.');
  return signedPath.startsWith('http') ? signedPath : `${baseUrl}/storage/v1${signedPath}`;
};

export const deletePrivateFile = async ({ bucket, objectPath }) => {
  if (!objectPath) return;
  await storageRequest(`/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'DELETE'
  });
};

export const extractObjectPath = (storedValue, bucket) => {
  if (!storedValue) return null;
  if (!/^https?:\/\//i.test(storedValue)) return storedValue;

  const marker = `/${bucket}/`;
  const index = storedValue.indexOf(marker);
  return index >= 0 ? decodeURIComponent(storedValue.slice(index + marker.length).split('?')[0]) : null;
};
