import { spawn, execSync } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// Base directory for downloads
const BASE_DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'Mytube');

// Specific directories for video and audio separation
const VIDEO_DIR = path.join(BASE_DOWNLOAD_DIR, 'video');
const AUDIO_DIR = path.join(BASE_DOWNLOAD_DIR, 'audio');

// Ensure all download directories exist before attempting a download
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const ensureYtDlp = (event) => {
  try {
    execSync('which yt-dlp', { stdio: 'ignore' });
  } catch (error) {
    try {
      execSync('python3 -m pip install yt-dlp --break-system-packages -q', { stdio: 'ignore' });
    } catch (installError) {
      const msg = 'yt-dlp is not installed and auto-install failed. Please install it manually: "pip3 install yt-dlp" or via your package manager.';
      if (event) event.sender.send('ytdlp-error', msg);
      console.error(msg);
    }
  }
};

export const registerDownloaderHandlers = (ipcMain) => {
  ipcMain.handle('api:info', async (event, url) => {
    ensureYtDlp(event);
    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve({ error: stderr || 'Request failed. Check the URL.' });
          return;
        }
        try {
          const data = JSON.parse(stdout);
          
          const combined = [
            { id: "best", label: "Best Quality (auto)" },
            { id: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", label: "Best MP4" },
            { id: "bestvideo[height<=1080]+bestaudio/best[height<=1080]", label: "1080p max" },
            { id: "bestvideo[height<=720]+bestaudio/best[height<=720]", label: "720p max" },
            { id: "bestvideo[height<=480]+bestaudio/best[height<=480]", label: "480p max" },
            { id: "bestaudio[ext=m4a]/bestaudio", label: "Audio only (M4A)" },
            { id: "bestaudio", label: "Audio only (best)" },
          ];

          resolve({
            title: data.title || 'Unknown',
            uploader: data.uploader || data.channel || 'Unknown',
            duration: data.duration_string || data.duration || '?',
            thumbnail: data.thumbnail || '',
            formats: combined,
            webpage_url: data.webpage_url || url,
          });
        } catch (e) {
          resolve({ error: 'Failed to parse video info.' });
        }
      });
    });
  });

  ipcMain.handle('api:download', (event, { url, format, jobId }) => {
    ensureYtDlp(event);
    
    // Determine if the selected format is audio only by checking the format string
    // If it contains "bestaudio" but not "bestvideo" (or is explicitly "bestaudio"), it's an audio download
    const isAudio = format.includes('bestaudio') && !format.includes('bestvideo') || format === 'bestaudio';
    
    // Choose the output directory based on whether it's audio or video
    const targetDir = isAudio ? AUDIO_DIR : VIDEO_DIR;
    
    // Define the output template string for yt-dlp to save the file
    const outputTemplate = path.join(targetDir, '%(title)s.%(ext)s');
    
    const proc = spawn('yt-dlp', [
      '-f', format,
      '--no-playlist',
      '--merge-output-format', 'mp4',
      '--newline',
      '-o', outputTemplate,
      url
    ]);

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        let progress = null;
        let filename = null;

        const progMatch = line.match(/(\d+\.?\d*)%/);
        if (progMatch && line.includes('[download]')) {
          progress = parseFloat(progMatch[1]);
        }

        const fileMatch = line.match(/Destination:\s*(.+)/);
        if (fileMatch) {
          filename = path.basename(fileMatch[1].trim());
        }

        event.sender.send('download-progress', {
          jobId,
          status: 'downloading',
          progress,
          filename,
          log: line.trim()
        });
      }
    });

    proc.stderr.on('data', (data) => {
      event.sender.send('download-progress', {
        jobId,
        status: 'downloading',
        log: data.toString().trim()
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        event.sender.send('download-progress', { jobId, status: 'done', progress: 100, log: 'Download complete.' });
      } else {
        event.sender.send('download-progress', { jobId, status: 'error', error: 'Download failed. Check URL or format.', log: `Exited with code ${code}` });
      }
    });
    
    return { jobId, status: 'started' };
  });
};
