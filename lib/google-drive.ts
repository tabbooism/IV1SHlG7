export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

export const listDriveFiles = async (accessToken: string): Promise<DriveFile[]> => {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,modifiedTime,size)', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Drive files');
  }

  const data = await response.json();
  return data.files || [];
};

export const getFileContent = async (accessToken: string, fileId: string): Promise<string> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch file content');
  }

  return await response.text();
};

export const searchDriveFiles = async (accessToken: string, query: string): Promise<DriveFile[]> => {
  const q = encodeURIComponent(`name contains '${query}' or fullText contains '${query}'`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime,size)`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to search Drive files');
  }

  const data = await response.json();
  return data.files || [];
};
