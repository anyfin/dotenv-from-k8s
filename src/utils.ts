export function base64DecodeObjectValues(obj: Record<string, string>): Record<string, string> {
  const decodedObject: Record<string, string> = {};
  Object.entries(obj).forEach(([key, value]) => {
    decodedObject[key] = Buffer.from(value, 'base64').toString('utf8');
  });
  return decodedObject;
}

export function convertJsonToPropertiesFile(obj: Record<string, string>): string {
  let propertiesFile = '';
  Object.entries(obj).forEach(([key, value]) => {
    let formattedValue = value;
    if (value.includes(' ') || value.includes('=')) {
      formattedValue = `'${value}'`;
    }
    propertiesFile += `${key}=${formattedValue}\n`;
  });
  return propertiesFile;
}
