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
    console.log(`\n[IPC] Received 'api:info' request for URL: ${url}`);
    ensureYtDlp(event);
    return new Promise((resolve, reject) => {
      const args = ['-J', '--flat-playlist', url];
      console.log(`[yt-dlp] Spawning: yt-dlp ${args.join(' ')}`);
      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { 
        stdout += data.toString(); 
      });
      proc.stderr.on('data', (data) => { 
        const errStr = data.toString();
        console.error(`[yt-dlp stderr] ${errStr.trim()}`);
        stderr += errStr; 
      });

      proc.on('close', (code) => {
        console.log(`[yt-dlp] Process closed with code: ${code}`);
        if (code !== 0) {
          console.error(`[yt-dlp] Info extraction failed.`);
          resolve({ error: stderr || 'Request failed. Check the URL.' });
          return;
        }
        try {
          const data = JSON.parse(stdout);
          
          if (data._type === 'playlist' || (data.entries && data.entries.length > 0)) {
             const entriesCount = data.entries ? data.entries.length : 0;
             const combined = [
                { id: "bestvideo[height<=1080]+bestaudio/best", label: "1080p max" },
                { id: "bestvideo[height<=720]+bestaudio/best", label: "720p max" },
                { id: "bestaudio[ext=m4a]/bestaudio", label: "Audio only" },
             ];
             resolve({
                isPlaylist: true,
                title: data.title || 'Unknown Playlist',
                uploader: data.uploader || data.channel || 'Unknown',
                entriesCount,
                formats: combined,
                webpage_url: data.webpage_url || url,
             });
             return;
          }
          
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

  ipcMain.handle('api:download', async (event, { url, format, jobId, isPlaylist }) => {
    console.log(`\n[IPC] Received 'api:download' request`);
    console.log(`      Job ID: ${jobId}`);
    console.log(`      URL: ${url}`);
    console.log(`      Format: ${format}`);
    console.log(`      Is Playlist: ${!!isPlaylist}`);
    ensureYtDlp(event);
    
    const isAudio = format.includes('bestaudio') && !format.includes('bestvideo') || format === 'bestaudio';
    const targetDir = isAudio ? AUDIO_DIR : VIDEO_DIR;

    if (!isPlaylist) {
        const outputTemplate = path.join(targetDir, '%(title)s.%(ext)s');
        const args = [
            '-f', format,
            '--no-playlist',
            '--merge-output-format', 'mp4',
            '--embed-metadata',
            '--embed-thumbnail',
            '--newline',
            '-o', outputTemplate,
            url
        ];
        console.log(`[yt-dlp] Spawning: yt-dlp ${args.join(' ')}`);
        const proc = spawn('yt-dlp', args);

        proc.stdout.on('data', (data) => {
            const output = data.toString();
            const lines = output.split('\n');
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
            const errStr = data.toString();
            console.error(`[yt-dlp stderr] ${errStr.trim()}`);
            event.sender.send('download-progress', {
                jobId,
                status: 'downloading',
                log: errStr.trim()
            });
        });

        proc.on('close', (code) => {
            console.log(`[yt-dlp] Process closed with code: ${code}`);
            if (code === 0) {
                event.sender.send('download-progress', { jobId, status: 'done', progress: 100, log: 'Download complete.' });
            } else {
                event.sender.send('download-progress', { jobId, status: 'error', error: 'Download failed.', log: `Exited with code ${code}` });
            }
        });
        
        return { jobId, status: 'started' };
    } else {
        // Playlist handling
        const getEntries = () => new Promise((resolve, reject) => {
            const p = spawn('yt-dlp', ['-J', '--flat-playlist', url]);
            let out = '';
            p.stdout.on('data', d => out += d);
            p.on('close', code => {
                if(code === 0) {
                    try { resolve(JSON.parse(out)); } catch(e) { reject(e); }
                } else reject(new Error('Failed to fetch playlist entries'));
            });
        });
        
        try {
            const playlistData = await getEntries();
            const entries = playlistData.entries || [];
            const playlistTitle = playlistData.title || 'Playlist';
            
            // Subdirectory for playlist
            const outputTemplate = path.join(targetDir, playlistTitle, '%(title)s.%(ext)s');
            
            let concurrency = 3;
            let activeCount = 0;
            let index = 0;
            
            const processNext = () => {
                if (index >= entries.length && activeCount === 0) {
                    event.sender.send('download-progress', { jobId, status: 'done', progress: 100, log: 'Playlist download complete.' });
                    return;
                }
                while (activeCount < concurrency && index < entries.length) {
                    const entry = entries[index++];
                    if (!entry.url) continue;
                    activeCount++;
                    
                    const itemJobId = `${jobId}_${index}`;
                    const args = [
                        '-f', format,
                        '--no-playlist',
                        '--merge-output-format', 'mp4',
                        '--embed-metadata',
                        '--embed-thumbnail',
                        '--newline',
                        '-o', outputTemplate,
                        entry.url
                    ];
                    
                    const proc = spawn('yt-dlp', args);
                    
                    proc.stdout.on('data', (data) => {
                        const lines = data.toString().split('\n');
                        for (const line of lines) {
                            if (!line.trim()) continue;
                            let progress = null;
                            let filename = entry.title || null;
                            
                            const progMatch = line.match(/(\d+\.?\d*)%/);
                            if (progMatch && line.includes('[download]')) {
                                progress = parseFloat(progMatch[1]);
                            }
                            
                            const speedMatch = line.match(/at\s+([0-9.]+)(K|M|G)iB\/s/);
                            if (speedMatch) {
                                const val = parseFloat(speedMatch[1]);
                                const unit = speedMatch[2];
                                // Fallback to 1 concurrent download if speed < 1MB/s
                                if (unit === 'K' || (unit === 'M' && val < 1.0)) {
                                    concurrency = 1;
                                }
                            }
                            
                            const fileMatch = line.match(/Destination:\s*(.+)/);
                            if (fileMatch) {
                                filename = path.basename(fileMatch[1].trim());
                            }
                            
                            event.sender.send('download-progress', {
                                jobId: itemJobId,
                                status: 'downloading',
                                progress,
                                filename,
                                log: line.trim()
                            });
                        }
                    });
                    
                    proc.on('close', (code) => {
                        activeCount--;
                        if (code === 0) {
                             event.sender.send('download-progress', { jobId: itemJobId, status: 'done', progress: 100, log: 'Complete.' });
                        } else {
                             event.sender.send('download-progress', { jobId: itemJobId, status: 'error', error: 'Failed', log: 'Exited with code ' + code });
                        }
                        processNext();
                    });
                }
            };
            
            processNext();
            return { jobId, status: 'started' };
        } catch (e) {
            return { jobId, status: 'error', error: e.message };
        }
    }
  });
};
