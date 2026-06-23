import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Paths, File, Directory } from 'expo-file-system';

let attachmentsDir: Directory | null = null;

async function getAttachmentsDir(): Promise<Directory> {
  if (attachmentsDir) return attachmentsDir;
  const dir = new Directory(Paths.document, 'attachments');
  if (!dir.exists) {
    dir.create();
  }
  attachmentsDir = dir;
  return dir;
}

export async function pickPhoto(): Promise<{ uri: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const dir = await getAttachmentsDir();
  const filename = `photo_${Date.now()}_${asset.fileName ?? 'photo.jpg'}`;
  const sourceFile = new File(asset.uri);
  const destFile = new File(dir, filename);
  await sourceFile.copy(destFile);

  return { uri: destFile.uri };
}

export async function takePhoto(): Promise<{ uri: string } | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const dir = await getAttachmentsDir();
  const filename = `photo_${Date.now()}.jpg`;
  const sourceFile = new File(asset.uri);
  const destFile = new File(dir, filename);
  await sourceFile.copy(destFile);

  return { uri: destFile.uri };
}

export async function pickFile(): Promise<{ uri: string; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const dir = await getAttachmentsDir();
  const filename = `file_${Date.now()}_${asset.name}`;
  const sourceFile = new File(asset.uri);
  const destFile = new File(dir, filename);
  await sourceFile.copy(destFile);

  return { uri: destFile.uri, name: asset.name };
}
