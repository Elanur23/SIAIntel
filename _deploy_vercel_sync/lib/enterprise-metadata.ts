export function generateEnterpriseMetadata(page: string, description?: string) {
  return {
    title: `${page} - SIA Terminal`,
    description: description ?? 'Sovereign Intelligence Architecture - Investor Intelligence Terminal',
  };
}

export const EnterpriseMetadataPresets = {
  privacy: generateEnterpriseMetadata('Privacy Policy'),
  terms: generateEnterpriseMetadata('Terms of Service'),
  /** Preset for legal/compliance pages with custom title and description */
  legalCompliance: (title: string, description: string) =>
    generateEnterpriseMetadata(title, description),
};
