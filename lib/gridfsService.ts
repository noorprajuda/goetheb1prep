import { GridFSBucket, ObjectId } from 'mongodb';
import { dbConnect } from './mongodb';
import mongoose from 'mongoose';

export interface GridFSFile {
  _id: ObjectId;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
  metadata?: Record<string, unknown>;
}

export class GridFSService {
  private static bucket: GridFSBucket | null = null;

  private static async getBucket(): Promise<GridFSBucket> {
    if (!this.bucket) {
      await dbConnect();
      if (!mongoose.connection.db) {
        throw new Error('MongoDB database not available');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.bucket = new GridFSBucket(mongoose.connection.db as any, { bucketName: 'audio_files' });
    }
    return this.bucket;
  }

  /**
   * Store an audio file in GridFS
   */
  static async storeAudioFile(
    buffer: Buffer,
    filename: string,
    contentType: string = 'audio/webm',
    metadata?: Record<string, unknown>
  ): Promise<ObjectId> {
    try {
      const bucket = await this.getBucket();
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${filename}`;
      
      const uploadStream = bucket.openUploadStream(uniqueFilename, {
        contentType,
        metadata: {
          originalFilename: filename,
          uploadedAt: new Date(),
          ...metadata
        }
      });

      return new Promise((resolve, reject) => {
        uploadStream.write(buffer);
        uploadStream.end();
        
        uploadStream.on('finish', () => {
          console.log(`✅ Audio file stored in GridFS: ${uniqueFilename}`);
          resolve(uploadStream.id);
        });
        
        uploadStream.on('error', (error) => {
          console.error('❌ Error storing audio file in GridFS:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error in storeAudioFile:', error);
      throw error;
    }
  }

  /**
   * Retrieve an audio file from GridFS
   */
  static async getAudioFile(fileId: ObjectId): Promise<{ stream: NodeJS.ReadableStream; file: GridFSFile }> {
    try {
      const bucket = await this.getBucket();
      
      // Check if file exists
      const files = await bucket.find({ _id: fileId }).toArray();
      if (files.length === 0) {
        throw new Error('Audio file not found');
      }

      const file = files[0] as GridFSFile;
      const downloadStream = bucket.openDownloadStream(fileId);
      
      return { stream: downloadStream, file };
    } catch (error) {
      console.error('Error in getAudioFile:', error);
      throw error;
    }
  }

  /**
   * Get audio file metadata without downloading the file
   */
  static async getAudioFileMetadata(fileId: ObjectId): Promise<GridFSFile | null> {
    try {
      const bucket = await this.getBucket();
      const files = await bucket.find({ _id: fileId }).toArray();
      return files.length > 0 ? (files[0] as GridFSFile) : null;
    } catch (error) {
      console.error('Error in getAudioFileMetadata:', error);
      return null;
    }
  }

  /**
   * Delete an audio file from GridFS
   */
  static async deleteAudioFile(fileId: ObjectId): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      await bucket.delete(fileId);
      console.log(`✅ Audio file deleted from GridFS: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error in deleteAudioFile:', error);
      return false;
    }
  }

  /**
   * List audio files with optional filtering
   */
  static async listAudioFiles(filter: Record<string, unknown> = {}): Promise<GridFSFile[]> {
    try {
      const bucket = await this.getBucket();
      const files = await bucket.find(filter).toArray();
      return files as GridFSFile[];
    } catch (error) {
      console.error('Error in listAudioFiles:', error);
      return [];
    }
  }

  /**
   * Clean up expired audio files
   */
  static async cleanupExpiredFiles(expirationDays: number = 7): Promise<number> {
    try {
      const bucket = await this.getBucket();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - expirationDays);
      
      const expiredFiles = await bucket.find({
        'metadata.uploadedAt': { $lt: expirationDate }
      }).toArray();

      let deletedCount = 0;
      for (const file of expiredFiles) {
        try {
          await bucket.delete(file._id);
          deletedCount++;
          console.log(`🗑️ Deleted expired audio file: ${file.filename}`);
        } catch (error) {
          console.error(`Failed to delete file ${file._id}:`, error);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} expired audio files`);
      return deletedCount;
    } catch (error) {
      console.error('Error in cleanupExpiredFiles:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    try {
      const bucket = await this.getBucket();
      const files = await bucket.find({}).toArray();
      
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + (file.length || 0), 0);
      const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      return {
        totalFiles,
        totalSize,
        averageFileSize
      };
    } catch (error) {
      console.error('Error in getStorageStats:', error);
      return { totalFiles: 0, totalSize: 0, averageFileSize: 0 };
    }
  }
}
